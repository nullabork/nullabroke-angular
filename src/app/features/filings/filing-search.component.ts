import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal, computed, effect } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, takeUntil } from 'rxjs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronDown,
  lucideChevronUp,
  lucideSearch,
  lucidePlus,
  lucidePanelLeft,
  lucideTrash2,
  lucideEllipsisVertical,
  lucideRotateCcw,
} from '@ng-icons/lucide';
import { HlmSidebarImports } from '@spartan-ng/helm/sidebar';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { BrnDialogImports } from '@spartan-ng/brain/dialog';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';

import { AppChromeService } from '../../core/services/app-chrome.service';
import { FilingService } from '../../core/services/filing.service';
import { SavedQueriesService } from '../../core/services/saved-queries.service';
import { StringsService } from '../../core/services/strings.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { TabManagerService } from '../../core/services/tab-manager.service';
import { Filing } from '../../core/models/filing.model';
import { SavedQuery } from '../../core/models/query-parameter.model';
import { AnalyticsService } from '../../core/services/analytics.service';
import { ColumnState } from 'ag-grid-community';
import { QueryParametersComponent } from '../../components/query-builder';
import {
  FilingStatusBarComponent,
  FilingResultsGridComponent,
  FilingQueryEditorComponent,
  FilingQueryItemComponent,
  FilingTabBarComponent,
} from './components';

@Component({
  selector: 'app-filing-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    NgIcon,
    HlmSidebarImports,
    HlmSkeletonImports,
    HlmIconImports,
    HlmDropdownMenuImports,
    BrnDialogImports,
    HlmDialogImports,
    HlmButtonImports,
    QueryParametersComponent,
    FilingStatusBarComponent,
    FilingResultsGridComponent,
    FilingQueryEditorComponent,
    FilingQueryItemComponent,
    FilingTabBarComponent,
  ],
  providers: [
    provideIcons({
      lucideChevronDown,
      lucideChevronUp,
      lucideSearch,
      lucidePlus,
      lucidePanelLeft,
      lucideTrash2,
      lucideEllipsisVertical,
      lucideRotateCcw,
    }),
  ],
  templateUrl: './filing-search.component.html',
})
export class FilingSearchComponent {
  private readonly appChrome = inject(AppChromeService);
  private readonly filingService = inject(FilingService);
  private readonly savedQueriesService = inject(SavedQueriesService);
  private readonly analytics = inject(AnalyticsService);
  readonly favoritesService = inject(FavoritesService);
  readonly tabManager = inject(TabManagerService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly stringsService = inject(StringsService);
  private readonly destroyRef = inject(DestroyRef);

  queryControl = new FormControl<string>(
    '',
    { nonNullable: true }
  );
  
  queryExpanded = signal(true);
  loading = signal(false);
  error = signal<string | null>(null);
  results = signal<Filing[]>([]);
  hasSearched = signal(false);

  // Cancels in-flight queries when switching tabs
  private readonly tabSwitch$ = new Subject<void>();

  // Logo animation state
  animatingLogo = signal(false);
  logoKey = signal(0);

  // Title: show query name if selected, otherwise default
  titleText = computed(() => {
    const guid = this.currentGuid();
    if (guid) {
      const q = this.savedQueries()[guid];
      if (q) return this.savedQueriesService.getQueryDisplayName(q);
    }
    return 'SEC Filing Query';
  });
  
  // Loading state for queries
  queriesLoading = signal(true);

  // Expose saved queries service state
  savedQueries = this.savedQueriesService.savedQueries;
  currentGuid = this.savedQueriesService.currentGuid;
  currentQueryText = this.savedQueriesService.currentQuery;
  hasDeletedBlueprints = this.savedQueriesService.hasDeletedBlueprints;

  /** User-created queries (no blueprintId) - pinned first, then by lastUsed desc */
  userQueryEntries = computed(() =>
    Object.entries(this.savedQueries())
      .filter(([, q]) => !q.blueprintId)
      .sort(this.querySorter)
  );

  /** Blueprint queries (has blueprintId) - pinned first, then by lastUsed desc */
  blueprintQueryEntries = computed(() =>
    Object.entries(this.savedQueries())
      .filter(([, q]) => !!q.blueprintId)
      .sort(this.querySorter)
  );

  private querySorter = (
    [, a]: [string, SavedQuery],
    [, b]: [string, SavedQuery]
  ): number => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    const aTime = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
    const bTime = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
    return bTime - aTime;
  };

  hasSavedQueries = computed(() =>
    this.userQueryEntries().length > 0 || this.blueprintQueryEntries().length > 0
  );

  // Query parameters state
  hasParameters = computed(() => this.savedQueriesService.currentParameters().length > 0);
  parseErrors = this.savedQueriesService.currentParseErrors;
  isQueryValid = this.savedQueriesService.isCurrentQueryValid;

  // Skeleton items for loading state
  readonly skeletonItems = [1, 2, 3, 4, 5];

  // Rename state
  renamingGuid = signal<string | null>(null);
  renameValue = signal<string>('');

  // Delete confirmation state
  deleteConfirmGuid = signal<string | null>(null);

  // Pre-fetched grid column state (loaded eagerly on page mount)
  gridColumnState = signal<ColumnState[] | null>(null);
  gridStateLoaded = signal(false);

  // Tab-related state
  showQueryEditor = computed(() => !this.tabManager.isFavoritesActive());
  showFavoritesTab = computed(() => this.favoritesService.hasFavorites());
  favoritesResults = signal<Filing[]>([]);
  favoritesLoading = signal(false);

  /** Map of query GUID → display name for the tab bar */
  tabQueryNames = computed(() => {
    const queries = this.savedQueries();
    const names = new Map<string, string>();
    for (const [guid, q] of Object.entries(queries)) {
      names.set(guid, this.savedQueriesService.getQueryDisplayName(q));
    }
    return names;
  });


  constructor() {
    this.appChrome.visible.set(true);
    this.destroyRef.onDestroy(() => this.appChrome.visible.set(false));

    // Eagerly fetch grid column state so the grid doesn't shift on first render
    this.stringsService
      .getJson<ColumnState[]>('filing-grid-column-state')
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (state) => {
          this.gridColumnState.set(state ?? null);
          this.gridStateLoaded.set(true);
        },
        error: () => {
          this.gridStateLoaded.set(true);
        },
      });

    // Initialize query control from service state
    const currentQuery = this.savedQueriesService.currentQuery();
    if (currentQuery) {
      this.queryControl.setValue(currentQuery, { emitEvent: false });
    }

    // Sync control changes → service (auto-saves via debounce)
    this.queryControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(val => {
        this.savedQueriesService.setQueryText(val);
      });

    // Simulate initial loading delay then mark as loaded
    setTimeout(() => {
      this.queriesLoading.set(false);
    }, 500);


    // Once saved queries are loaded, initialize tab state
    effect(() => {
      const queries = this.savedQueries();
      if (Object.keys(queries).length === 0) return;
      if (this.tabManager.loaded()) return; // already loaded

      const qParam = this.route.snapshot.queryParamMap.get('q');
      const fallbackGuid = qParam && queries[qParam]
        ? qParam
        : Object.keys(queries)[0];
      this.tabManager.load(fallbackGuid);
    });

    // Once tabs are loaded, select the active tab's query and run it
    effect(() => {
      if (!this.tabManager.loaded()) return;

      // Handle favorites tab on page reload
      if (this.tabManager.isFavoritesActive()) {
        if (this.favoritesService.loaded() && !this.favoritesLoading()) {
          this.loadFavorites();
        }
        return;
      }

      const tab = this.tabManager.activeTab();
      if (tab) {
        const queries = this.savedQueries();
        if (queries[tab.queryGuid] && this.currentGuid() !== tab.queryGuid) {
          this.savedQueriesService.selectQuery(tab.queryGuid);
          this.queryControl.setValue(this.savedQueriesService.currentQuery(), { emitEvent: false });
          // Auto-run if not searched yet
          const runtime = this.tabManager.getRuntime(tab.queryGuid);
          if (!runtime.hasSearched) {
            this.search();
          } else {
            // Restore cached results
            this.results.set(runtime.results);
            this.loading.set(runtime.loading);
            this.error.set(runtime.error);
            this.hasSearched.set(runtime.hasSearched);
          }
          this.router.navigate([], { queryParams: { q: tab.queryGuid }, queryParamsHandling: 'merge' });
        }
      }
    });
  }

  toggleQuery() {
    this.queryExpanded.update((v) => !v);
  }

  private stopLogoAfterAnimation(animStart: number, duration: number) {
    const elapsed = Date.now() - animStart;
    const remaining = Math.max(0, duration - elapsed);
    setTimeout(() => this.animatingLogo.set(false), remaining);
  }

  search() {
    const queryText = this.queryControl.value.trim();
    if (!queryText || this.loading()) return;

    // Check for parse errors
    if (!this.isQueryValid()) {
      this.error.set('Query has syntax errors. Please fix the highlighted issues.');
      return;
    }

    // Get the compiled query with parameter values replaced
    const compiledQuery = this.savedQueriesService.getCompiledQuery();

    // Check compilation result
    const compileResult = this.savedQueriesService.canCompile();
    if (!compileResult.success) {
      this.error.set(`Query compilation failed: ${compileResult.errors.join(', ')}`);
      return;
    }

    // Capture the tab this search belongs to
    const targetGuid = this.tabManager.activeTab()?.queryGuid;

    this.loading.set(true);
    this.error.set(null);
    this.hasSearched.set(true);

    // Start logo animation (fresh SVG instance each time via cache-busting key)
    this.logoKey.set(Date.now());
    this.animatingLogo.set(true);
    const animStart = Date.now();
    const ANIM_DURATION = 3200;

    this.filingService
      .search(compiledQuery)
      .pipe(
        takeUntil(this.tabSwitch$),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (filings) => {
          const data = filings ?? [];
          this.stopLogoAfterAnimation(animStart, ANIM_DURATION);
          this.analytics.trackSearch(this.titleText(), data.length);

          // Always cache in the tab's runtime
          if (targetGuid) {
            this.tabManager.setRuntime(targetGuid, {
              results: data,
              loading: false,
              hasSearched: true,
              error: null,
            });
          }

          // Only update UI if this tab is still active
          if (this.tabManager.activeTab()?.queryGuid === targetGuid) {
            this.results.set(data);
            this.loading.set(false);
          }
        },
        error: () => {
          this.stopLogoAfterAnimation(animStart, ANIM_DURATION);

          if (targetGuid) {
            this.tabManager.setRuntime(targetGuid, {
              results: [],
              loading: false,
              hasSearched: true,
              error: 'Search failed',
            });
          }

          if (this.tabManager.activeTab()?.queryGuid === targetGuid) {
            this.results.set([]);
            this.loading.set(false);
          }
        },
      });
  }

  // Saved Queries Actions
  newQuery() {
    this.savedQueriesService.newQuery();
    this.queryControl.setValue('', { emitEvent: false });
    this.analytics.trackNewQuery();
  }

  selectSavedQuery(guid: string) {
    if (this.renamingGuid() === guid) return;

    // Cancel any in-flight query
    this.tabSwitch$.next();

    // Save current tab's state before switching
    this.saveCurrentTabRuntime();

    this.tabManager.openInCurrentTab(guid);
    this.savedQueriesService.selectQuery(guid);
    this.queryControl.setValue(this.savedQueriesService.currentQuery());
    this.router.navigate([], { queryParams: { q: guid }, queryParamsHandling: 'merge' });
    this.results.set([]);
    this.loading.set(false);
    this.error.set(null);
    this.hasSearched.set(false);
    this.search();
  }

  openQueryInNewTab(guid: string) {
    // Cancel any in-flight query
    this.tabSwitch$.next();

    this.saveCurrentTabRuntime();
    this.tabManager.openTab(guid);
    this.savedQueriesService.selectQuery(guid);
    this.queryControl.setValue(this.savedQueriesService.currentQuery());
    this.router.navigate([], { queryParams: { q: guid }, queryParamsHandling: 'merge' });
    this.results.set([]);
    this.loading.set(false);
    this.error.set(null);
    this.hasSearched.set(false);
    this.search();
  }

  switchTab(index: number) {
    if (index === this.tabManager.activeIndex()) return;

    // Cancel any in-flight query from the previous tab
    this.tabSwitch$.next();

    // Save current tab state
    this.saveCurrentTabRuntime();

    this.tabManager.switchTo(index);

    if (index === -1) {
      // Favorites tab — show cached results immediately, then refresh in background
      const cached = this.favoritesResults();
      if (cached.length > 0) {
        this.results.set(cached);
        this.hasSearched.set(true);
        this.loading.set(false);
        this.error.set(null);
      } else {
        this.results.set([]);
        this.hasSearched.set(false);
        this.loading.set(false);
        this.error.set(null);
      }
      this.loadFavorites();
      return;
    }

    const tab = this.tabManager.tabs()[index];
    if (!tab) return;

    const runtime = this.tabManager.getRuntime(tab.queryGuid);
    this.savedQueriesService.selectQuery(tab.queryGuid);
    this.queryControl.setValue(this.savedQueriesService.currentQuery(), { emitEvent: false });
    this.router.navigate([], { queryParams: { q: tab.queryGuid }, queryParamsHandling: 'merge' });

    if (!runtime.hasSearched) {
      this.results.set([]);
      this.loading.set(false);
      this.error.set(null);
      this.hasSearched.set(false);
      this.search();
    } else {
      this.results.set(runtime.results);
      this.loading.set(runtime.loading);
      this.error.set(runtime.error);
      this.hasSearched.set(runtime.hasSearched);
    }
  }

  closeTab(index: number) {
    this.tabManager.closeTab(index);
    // After closing, switch to the new active tab
    const activeTab = this.tabManager.activeTab();
    if (activeTab) {
      const runtime = this.tabManager.getRuntime(activeTab.queryGuid);
      this.savedQueriesService.selectQuery(activeTab.queryGuid);
      this.queryControl.setValue(this.savedQueriesService.currentQuery(), { emitEvent: false });
      this.results.set(runtime.results);
      this.loading.set(runtime.loading);
      this.error.set(runtime.error);
      this.hasSearched.set(runtime.hasSearched);
      this.router.navigate([], { queryParams: { q: activeTab.queryGuid }, queryParamsHandling: 'merge' });
    }
  }

  newTab() {
    this.saveCurrentTabRuntime();
    this.savedQueriesService.newQuery();
    const newGuid = this.savedQueriesService.currentGuid();
    if (newGuid) {
      this.tabManager.openTab(newGuid);
      this.queryControl.setValue('', { emitEvent: false });
      this.results.set([]);
      this.loading.set(false);
      this.error.set(null);
      this.hasSearched.set(false);
      this.router.navigate([], { queryParams: { q: newGuid }, queryParamsHandling: 'merge' });
    }
  }

  loadFavorites() {
    const ids = this.favoritesService.favoriteIds();
    if (ids.length === 0) {
      this.favoritesResults.set([]);
      if (this.tabManager.isFavoritesActive()) {
        this.results.set([]);
        this.hasSearched.set(true);
        this.loading.set(false);
      }
      return;
    }

    if (!this.favoritesService.loaded()) {
      if (this.tabManager.isFavoritesActive()) {
        this.loading.set(true);
      }
      return;
    }

    if (this.tabManager.isFavoritesActive()) {
      this.loading.set(true);
      this.error.set(null);
    }

    const query = `id in (${ids.join(',')}) limit ${ids.length}`;
    this.filingService.search(query)
      .pipe(
        takeUntil(this.tabSwitch$),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (filings) => {
          const data = filings ?? [];
          // Always cache favorites results
          this.favoritesResults.set(data);
          // Only update UI if still on favorites tab
          if (this.tabManager.isFavoritesActive()) {
            this.results.set(data);
            this.loading.set(false);
            this.hasSearched.set(true);
          }
        },
        error: () => {
          if (this.tabManager.isFavoritesActive()) {
            this.results.set(this.favoritesResults()); // keep cached
            this.loading.set(false);
            this.hasSearched.set(true);
            this.error.set('Failed to load favorites');
          }
        },
      });
  }

  refreshFavorites() {
    this.loadFavorites();
  }

  onAddToFavorites(filingId: number) {
    this.favoritesService.addFavorite(filingId);
  }

  onRemoveFromFavorites(filingId: number) {
    this.favoritesService.removeFavorite(filingId);
    // If on favorites tab, immediately remove from displayed results
    if (this.tabManager.isFavoritesActive()) {
      this.favoritesResults.update(r => r.filter(f => f.id !== filingId));
      this.results.update(r => r.filter(f => f.id !== filingId));
      // If no more favorites, switch to first query tab
      if (this.favoritesService.favoriteIds().length === 0) {
        this.switchTab(0);
      }
    }
  }

  private saveCurrentTabRuntime() {
    if (this.tabManager.isFavoritesActive()) {
      // Cache favorites results separately
      this.favoritesResults.set(this.results());
      return;
    }
    const tab = this.tabManager.activeTab();
    if (tab) {
      this.tabManager.setRuntime(tab.queryGuid, {
        results: this.results(),
        loading: this.loading(),
        hasSearched: this.hasSearched(),
        error: this.error(),
      });
    }
  }

  // Context Menu Actions
  onDuplicateQuery(guid: string) {
    this.savedQueriesService.duplicateQuery(guid);
    // Sync the query control with the newly selected duplicate
    this.queryControl.setValue(this.savedQueriesService.currentQuery(), { emitEvent: false });
  }

  onTogglePin(guid: string) {
    this.savedQueriesService.togglePin(guid);
  }

  onResetBlueprint(guid: string) {
    this.savedQueriesService.resetToBlueprint(guid);
    this.queryControl.setValue(this.savedQueriesService.currentQuery(), { emitEvent: false });
  }

  restoreDefaults() {
    this.savedQueriesService.restoreDeletedBlueprints();
  }

  resetAllQueries() {
    this.savedQueriesService.resetAllQueries();
    this.queryControl.setValue('', { emitEvent: false });
  }

  deleteAllDefaults() {
    this.savedQueriesService.deleteAllDefaults();
    // Sync query control if current was a blueprint
    if (!this.savedQueriesService.currentGuid()) {
      this.queryControl.setValue('', { emitEvent: false });
    }
  }

  onDeleteQuery(guid: string) {
    this.deleteConfirmGuid.set(guid);
  }

  confirmDelete() {
    const guid = this.deleteConfirmGuid();
    if (guid) {
      this.savedQueriesService.deleteQuery(guid);
      this.deleteConfirmGuid.set(null);
      // Clean up any tabs referencing the deleted query
      const existingGuids = new Set(Object.keys(this.savedQueries()));
      this.tabManager.cleanupDeletedQueries(existingGuids);
    }
  }

  cancelDelete() {
    this.deleteConfirmGuid.set(null);
  }

  onRenameQuery(guid: string) {
    const queries = this.savedQueries();
    const query = queries[guid];
    this.renamingGuid.set(guid);
    this.renameValue.set(query?.name || '');
  }

  saveRename() {
    const guid = this.renamingGuid();
    if (guid) {
      this.savedQueriesService.renameQuery(guid, this.renameValue());
      this.renamingGuid.set(null);
      this.renameValue.set('');
    }
  }

  cancelRename() {
    this.renamingGuid.set(null);
    this.renameValue.set('');
  }

  onRenameKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.saveRename();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelRename();
    }
  }

  // Visual Helpers
  getColorForGuid(guid: string): string {
    let hash = 0;
    for (let i = 0; i < guid.length; i++) {
      hash = guid.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
  }

  getTextForSquare(savedQuery: SavedQuery | string): string {
    if (typeof savedQuery === 'string') {
      // Legacy format - extract from query
      return this.extractFromQuery(savedQuery);
    }
    
    // Use service method which handles name vs query
    return this.savedQueriesService.getQueryIconText(savedQuery);
  }

  private extractFromQuery(query: string): string {
    const match = query.match(/=\s*['"]([^'"]+)['"]/);
    if (match && match[1]) {
      const text = match[1].replace(/[^a-zA-Z0-9]/g, '');
      return text.substring(0, 4);
    }
    
    const paramMatch = query.match(/\{([^:}]+)/);
    if (paramMatch && paramMatch[1]) {
      return paramMatch[1].substring(0, 4);
    }
    
    return '??';
  }

  getQueryDisplayText(savedQuery: SavedQuery | string): string {
    if (typeof savedQuery === 'string') {
      return savedQuery;
    }
    return this.savedQueriesService.getQueryDisplayName(savedQuery);
  }

  getRelativeTime(iso: string | undefined): string {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
