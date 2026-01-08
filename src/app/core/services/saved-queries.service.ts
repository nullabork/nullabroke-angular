import { inject, Injectable, signal } from '@angular/core';
import { StringsService } from './strings.service';
import { catchError, of, take, tap } from 'rxjs';

export type SavedQueriesMap = Record<string, string>;

@Injectable({
  providedIn: 'root',
})
export class SavedQueriesService {
  private readonly stringsService = inject(StringsService);
  private readonly STORAGE_KEY = 'saved_queries';

  // State
  readonly savedQueries = signal<SavedQueriesMap>({});
  readonly currentGuid = signal<string | null>(null);
  readonly currentQuery = signal<string>('');
  
  // Track if the current query has unsaved changes compared to what's in savedQueries[currentGuid]
  readonly isDirty = signal(false);

  constructor() {
    this.load();
  }

  /**
   * Load saved queries from the server
   */
  load() {
    this.stringsService.getJson<SavedQueriesMap>(this.STORAGE_KEY).pipe(
      take(1),
      tap((queries) => {
        if (queries) {
          this.savedQueries.set(queries);
        }
      }),
      catchError(err => {
        console.error('Failed to load saved queries', err);
        return of({});
      })
    ).subscribe();
  }

  /**
   * Start a new query. Clears current GUID and query text.
   */
  newQuery() {
    this.currentGuid.set(this.generateGuid());
    this.currentQuery.set('');
    this.isDirty.set(true); // New query is technically "unsaved" until saved
  }

  /**
   * Set the current query text (e.g. from user typing)
   */
  setQueryText(text: string) {
    this.currentQuery.set(text);
    const guid = this.currentGuid();
    if (guid) {
       // Check if dirty
       const saved = this.savedQueries()[guid];
       this.isDirty.set(saved !== text);
    } else {
      // If no guid, we should probably generate one or treat it as scratchpad
      // The requirement says "new will generate a new guid", so we likely always have a guid if we used "new".
      // If we just loaded the page, maybe we need a default one.
      this.currentGuid.set(this.generateGuid());
      this.isDirty.set(true);
    }
  }

  /**
   * Select a saved query from the sidebar
   */
  selectQuery(guid: string) {
    const queries = this.savedQueries();
    if (guid in queries) {
      this.currentGuid.set(guid);
      this.currentQuery.set(queries[guid]);
      this.isDirty.set(false);
    }
  }

  /**
   * Save the current query.
   * If currentGuid is null, generates a new one.
   * Updates the savedQueries map and persists to server.
   */
  save() {
    const guid = this.currentGuid() ?? this.generateGuid();
    this.currentGuid.set(guid);

    const query = this.currentQuery();
    
    this.savedQueries.update(queries => ({
      ...queries,
      [guid]: query
    }));
    
    this.isDirty.set(false);
    this.persist();
  }

  /**
   * Duplicate the current query to a new GUID and save immediately.
   */
  duplicate() {
    const newGuid = this.generateGuid();
    const query = this.currentQuery();

    this.savedQueries.update(queries => ({
      ...queries,
      [newGuid]: query
    }));

    this.currentGuid.set(newGuid);
    // currentQuery remains the same
    this.isDirty.set(false);
    this.persist();
  }

  private persist() {
    this.stringsService.setJson(this.STORAGE_KEY, this.savedQueries()).pipe(
      take(1)
    ).subscribe({
      error: err => console.error('Failed to save queries', err)
    });
  }

  private generateGuid(): string {
    return crypto.randomUUID();
  }
}

