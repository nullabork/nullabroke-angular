import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal, computed, effect } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronDown,
  lucideChevronUp,
  lucideSearch,
  lucideLoader2,
  lucideFile,
  lucidePlus,
  lucideCopy,
  lucideAlertCircle,
  lucidePanelLeft,
  lucideTrash2,
  lucidePencil,
  lucideCheck,
  lucideEllipsisVertical,
  lucideRotateCcw,
  lucideCircleHelp,
} from '@ng-icons/lucide';
import { DatePipe } from '@angular/common';
import { HlmSidebarImports } from '@spartan-ng/helm/sidebar';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { BrnDialogImports } from '@spartan-ng/brain/dialog';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';

import { FilingService } from '../../core/services/filing.service';
import { SavedQueriesService } from '../../core/services/saved-queries.service';
import { Filing } from '../../core/models/filing.model';
import { SavedQuery } from '../../core/models/query-parameter.model';
import { QueryParametersComponent } from '../../components/query-builder';

@Component({
  selector: 'app-filing-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, 
    RouterLink,
    NgIcon, 
    DatePipe,
    HlmSidebarImports,
    HlmSkeletonImports,
    HlmIconImports,
    HlmDropdownMenuImports,
    BrnDialogImports,
    HlmDialogImports,
    HlmButtonImports,
    HlmInputImports,
    QueryParametersComponent,
  ],
  providers: [
    provideIcons({
      lucideChevronDown,
      lucideChevronUp,
      lucideSearch,
      lucideLoader2,
      lucideFile,
      lucidePlus,
      lucideCopy,
      lucideAlertCircle,
      lucidePanelLeft,
      lucideTrash2,
      lucidePencil,
      lucideCheck,
      lucideEllipsisVertical,
      lucideRotateCcw,
      lucideCircleHelp,
    }),
  ],
  templateUrl: './filing-search.component.html',
})
export class FilingSearchComponent {
  private readonly filingService = inject(FilingService);
  private readonly savedQueriesService = inject(SavedQueriesService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
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
  
  // Loading state for queries
  queriesLoading = signal(true);

  // Expose saved queries service state
  savedQueries = this.savedQueriesService.savedQueries;
  currentGuid = this.savedQueriesService.currentGuid;
  hasDeletedBlueprints = this.savedQueriesService.hasDeletedBlueprints;

  /** User-created queries (no blueprintId) - displayed at top */
  userQueryEntries = computed(() =>
    Object.entries(this.savedQueries()).filter(([, q]) => !q.blueprintId)
  );

  /** Blueprint queries (has blueprintId) - displayed at bottom */
  blueprintQueryEntries = computed(() =>
    Object.entries(this.savedQueries()).filter(([, q]) => !!q.blueprintId)
  );

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

  constructor() {
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

    // Auto-select query from ?q= param once saved queries have loaded
    effect(() => {
      const queries = this.savedQueries();
      const qParam = this.route.snapshot.queryParamMap.get('q');
      if (qParam && queries[qParam] && this.currentGuid() !== qParam) {
        this.selectSavedQuery(qParam);
      }
    });
  }

  toggleQuery() {
    this.queryExpanded.update((v) => !v);
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

    this.loading.set(true);
    this.error.set(null);
    this.hasSearched.set(true);

    this.filingService
      .search(compiledQuery)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (filings) => {
          this.results.set(filings ?? []);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Search failed:', err);
          this.error.set(err.message || 'Search failed. Please try again.');
          this.loading.set(false);
        },
      });
  }

  openDocument(filing: Filing) {
    this.router.navigate(['/document', filing.accessionNumber]);
  }

  // Saved Queries Actions
  newQuery() {
    this.savedQueriesService.newQuery();
    this.queryControl.setValue('', { emitEvent: false });
  }

  selectSavedQuery(guid: string) {
    if (this.renamingGuid() === guid) return;
    
    this.savedQueriesService.selectQuery(guid);
    this.queryControl.setValue(this.savedQueriesService.currentQuery());
    // Update URL without triggering navigation
    this.router.navigate([], { queryParams: { q: guid }, queryParamsHandling: 'merge' });
    this.search();
  }

  // Context Menu Actions
  onDuplicateQuery(guid: string) {
    this.savedQueriesService.duplicateQuery(guid);
    // Sync the query control with the newly selected duplicate
    this.queryControl.setValue(this.savedQueriesService.currentQuery(), { emitEvent: false });
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

  isBlueprint(savedQuery: SavedQuery | string): boolean {
    return typeof savedQuery !== 'string' && !!savedQuery.blueprintId;
  }

  getQueryDisplayText(savedQuery: SavedQuery | string): string {
    if (typeof savedQuery === 'string') {
      return savedQuery;
    }
    return this.savedQueriesService.getQueryDisplayName(savedQuery);
  }
}
