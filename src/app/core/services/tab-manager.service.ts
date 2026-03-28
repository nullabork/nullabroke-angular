import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, of, Subject, debounceTime, switchMap, take } from 'rxjs';
import { StringsService } from './strings.service';
import { Filing } from '../models/filing.model';

const STORAGE_KEY = 'filing-tabs';

export interface TabEntry {
  queryGuid: string;
}

export interface TabRuntimeState {
  results: Filing[];
  loading: boolean;
  hasSearched: boolean;
  error: string | null;
}

interface PersistedTabState {
  tabs: TabEntry[];
  activeIndex: number;
}

function defaultRuntime(): TabRuntimeState {
  return { results: [], loading: false, hasSearched: false, error: null };
}

@Injectable({ providedIn: 'root' })
export class TabManagerService {
  private readonly stringsService = inject(StringsService);
  private readonly saveSubject = new Subject<void>();
  private readonly runtimeMap = new Map<string, TabRuntimeState>();

  readonly tabs = signal<TabEntry[]>([]);
  readonly activeIndex = signal<number>(0); // -1 = favorites tab
  readonly loaded = signal(false);

  readonly activeTab = computed(() => {
    const idx = this.activeIndex();
    if (idx < 0) return null; // favorites
    return this.tabs()[idx] ?? null;
  });

  readonly isFavoritesActive = computed(() => this.activeIndex() === -1);

  constructor() {
    // Debounced persistence
    this.saveSubject.pipe(
      debounceTime(500),
      switchMap(() => {
        const state: PersistedTabState = {
          tabs: this.tabs(),
          activeIndex: this.activeIndex(),
        };
        return this.stringsService.setJson(STORAGE_KEY, state).pipe(
          catchError(err => {
            console.error('Failed to save tab state', err);
            return of(null);
          }),
        );
      }),
    ).subscribe();
  }

  /**
   * Load persisted tab state. Call once after saved queries are loaded.
   * If no persisted state, initializes with the given query GUID (from URL or first query).
   */
  load(fallbackGuid?: string) {
    this.stringsService.getJson<PersistedTabState>(STORAGE_KEY).pipe(
      catchError(() => of(null)),
      take(1),
    ).subscribe(state => {
      if (state?.tabs?.length) {
        this.tabs.set(state.tabs);
        this.activeIndex.set(state.activeIndex ?? 0);
      } else if (fallbackGuid) {
        this.tabs.set([{ queryGuid: fallbackGuid }]);
        this.activeIndex.set(0);
      }
      this.loaded.set(true);
    });
  }

  /**
   * Add a new tab and switch to it.
   */
  openTab(queryGuid: string) {
    this.tabs.update(t => [...t, { queryGuid }]);
    this.activeIndex.set(this.tabs().length - 1);
    this.persist();
  }

  /**
   * Replace the active tab's query. Resets its runtime state so it re-runs.
   */
  openInCurrentTab(queryGuid: string) {
    const idx = this.activeIndex();
    if (idx < 0) {
      // If favorites is active, open a new tab instead
      this.openTab(queryGuid);
      return;
    }
    const currentTab = this.tabs()[idx];
    if (currentTab) {
      // Clean up old runtime
      this.runtimeMap.delete(currentTab.queryGuid);
    }
    this.tabs.update(t => {
      const updated = [...t];
      updated[idx] = { queryGuid };
      return updated;
    });
    this.persist();
  }

  /**
   * Close a tab at the given index. Cannot close index 0 (first query tab).
   */
  closeTab(index: number) {
    if (index <= 0) return; // can't close first tab
    const tab = this.tabs()[index];
    if (tab) {
      this.runtimeMap.delete(tab.queryGuid);
    }
    this.tabs.update(t => t.filter((_, i) => i !== index));
    // Adjust active index
    const active = this.activeIndex();
    if (active >= index) {
      this.activeIndex.set(Math.max(0, active - 1));
    }
    this.persist();
  }

  /**
   * Switch to a tab by index. Use -1 for favorites.
   */
  switchTo(index: number) {
    this.activeIndex.set(index);
    this.persist();
  }

  /**
   * Get the runtime state for a tab (creates default if not exists).
   */
  getRuntime(queryGuid: string): TabRuntimeState {
    let state = this.runtimeMap.get(queryGuid);
    if (!state) {
      state = defaultRuntime();
      this.runtimeMap.set(queryGuid, state);
    }
    return state;
  }

  /**
   * Update partial runtime state for a tab.
   */
  setRuntime(queryGuid: string, partial: Partial<TabRuntimeState>) {
    const current = this.getRuntime(queryGuid);
    Object.assign(current, partial);
  }

  /**
   * Remove tabs for query GUIDs that no longer exist.
   */
  cleanupDeletedQueries(existingGuids: Set<string>) {
    const before = this.tabs();
    const after = before.filter(t => existingGuids.has(t.queryGuid));
    if (after.length !== before.length) {
      // Clean up runtime for removed tabs
      for (const t of before) {
        if (!existingGuids.has(t.queryGuid)) {
          this.runtimeMap.delete(t.queryGuid);
        }
      }
      this.tabs.set(after.length > 0 ? after : []);
      const active = this.activeIndex();
      if (active >= after.length) {
        this.activeIndex.set(Math.max(0, after.length - 1));
      }
      this.persist();
    }
  }

  private persist() {
    this.saveSubject.next();
  }
}
