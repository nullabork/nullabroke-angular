import { inject, Injectable, signal, computed } from '@angular/core';
import { StringsService } from './strings.service';
import { QueryParserService } from './query-parser.service';
import { QueryCompilerService } from './query-compiler.service';
import { catchError, of, take, tap } from 'rxjs';
import { 
  SavedQuery, 
  SavedQueriesMap, 
  LegacySavedQueriesMap,
  QueryParameter,
} from '../models/query-parameter.model';

/**
 * Type for parameter values (can be string, number, or array of strings for tags)
 */
export type ParameterValue = string | number | string[];

@Injectable({
  providedIn: 'root',
})
export class SavedQueriesService {
  private readonly stringsService = inject(StringsService);
  private readonly parserService = inject(QueryParserService);
  private readonly compilerService = inject(QueryCompilerService);
  private readonly STORAGE_KEY = 'saved_queries';

  private autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly AUTO_SAVE_DELAY = 800;

  // State
  readonly savedQueries = signal<SavedQueriesMap>({});
  readonly currentGuid = signal<string | null>(null);
  readonly currentQuery = signal<string>('');
  readonly currentValues = signal<ParameterValue[]>([]);
  
  // Parsed parameters for current query
  readonly currentParameters = computed(() => {
    const query = this.currentQuery();
    if (!query) return [];
    const parsed = this.parserService.parseQuery(query);
    return parsed.parameters;
  });

  // Parse errors for current query
  readonly currentParseErrors = computed(() => {
    const query = this.currentQuery();
    if (!query) return [];
    const parsed = this.parserService.parseQuery(query);
    return parsed.errors;
  });

  // Is current query valid?
  readonly isCurrentQueryValid = computed(() => {
    const query = this.currentQuery();
    if (!query) return true;
    const parsed = this.parserService.parseQuery(query);
    return parsed.isValid;
  });

  constructor() {
    this.load();
  }

  /**
   * Load saved queries from the server.
   * Handles both legacy format (string) and new format (SavedQuery object).
   */
  load() {
    this.stringsService.getJson<SavedQueriesMap | LegacySavedQueriesMap>(this.STORAGE_KEY).pipe(
      take(1),
      tap((queries) => {
        if (queries) {
          // Migrate legacy format if needed
          const migrated = this.migrateQueries(queries);
          this.savedQueries.set(migrated);
        }
      }),
      catchError(err => {
        console.error('Failed to load saved queries', err);
        return of({});
      })
    ).subscribe();
  }

  /**
   * Migrate legacy query format to new format with values.
   */
  private migrateQueries(queries: SavedQueriesMap | LegacySavedQueriesMap): SavedQueriesMap {
    const migrated: SavedQueriesMap = {};
    
    for (const [guid, value] of Object.entries(queries)) {
      if (typeof value === 'string') {
        // Legacy format: just a query string
        const parsed = this.parserService.parseQuery(value);
        migrated[guid] = {
          query: value,
          values: this.compilerService.getDefaultValues(parsed),
        };
      } else if (typeof value === 'object' && value !== null && 'query' in value) {
        // New format: SavedQuery object
        migrated[guid] = value as SavedQuery;
      }
    }
    
    return migrated;
  }

  /**
   * Create a new empty query, persist it immediately, and select it.
   */
  newQuery() {
    const guid = this.generateGuid();
    const savedQuery: SavedQuery = {
      query: '',
      values: [],
      name: 'Untitled Query',
    };

    this.savedQueries.update(queries => ({
      ...queries,
      [guid]: savedQuery,
    }));

    this.currentGuid.set(guid);
    this.currentQuery.set('');
    this.currentValues.set([]);
    this.persist();
  }

  /**
   * Set the current query text (e.g. from user typing).
   * Updates parameters, initializes values from defaults, and auto-saves.
   */
  setQueryText(text: string) {
    this.currentQuery.set(text);
    
    // Parse new query and update values with defaults for new parameters
    const parsed = this.parserService.parseQuery(text);
    const currentVals = this.currentValues();
    
    // If parameter count changed, adjust values array
    if (parsed.parameters.length !== currentVals.length) {
      const newValues = parsed.parameters.map((param, idx) => {
        // Keep existing value if index exists, otherwise use default
        if (idx < currentVals.length && currentVals[idx] !== undefined) {
          return currentVals[idx];
        }
        return param.defaultValue || this.getDefaultForType(param.componentType);
      });
      this.currentValues.set(newValues);
    }
    
    this.debouncedAutoSave();
  }

  /**
   * Get default value for a parameter type.
   */
  private getDefaultForType(type: string): ParameterValue {
    switch (type) {
      case 'NumberInput':
        return 0;
      case 'Tags':
        return [];
      default:
        return '';
    }
  }

  /**
   * Set a parameter value at a specific index. Auto-saves.
   */
  setParameterValue(index: number, value: ParameterValue) {
    this.currentValues.update(values => {
      const newValues = [...values];
      while (newValues.length <= index) {
        newValues.push('');
      }
      newValues[index] = value;
      return newValues;
    });
    this.debouncedAutoSave();
  }

  /**
   * Reset a parameter value to its default. Auto-saves.
   */
  resetParameterValue(index: number) {
    const params = this.currentParameters();
    if (index >= 0 && index < params.length) {
      const param = params[index];
      const defaultValue = param.defaultValue || this.getDefaultForType(param.componentType);
      this.setParameterValue(index, defaultValue);
    }
  }

  /**
   * Reset all parameter values to their defaults. Auto-saves.
   */
  resetAllParameterValues() {
    const params = this.currentParameters();
    const defaultValues = params.map(p => 
      p.defaultValue || this.getDefaultForType(p.componentType)
    );
    this.currentValues.set(defaultValues);
    this.debouncedAutoSave();
  }

  /**
   * Debounced auto-save: updates the in-memory saved query and persists to server.
   */
  private debouncedAutoSave() {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }
    this.autoSaveTimer = setTimeout(() => {
      this.autoSave();
    }, this.AUTO_SAVE_DELAY);
  }

  /**
   * Immediately save current state to the saved queries map and persist.
   */
  private autoSave() {
    const guid = this.currentGuid();
    if (!guid) return;

    const existing = this.savedQueries()[guid];
    const savedQuery: SavedQuery = {
      query: this.currentQuery(),
      values: [...this.currentValues()],
      name: existing?.name,
    };

    this.savedQueries.update(queries => ({
      ...queries,
      [guid]: savedQuery,
    }));

    this.persist();
  }

  /**
   * Select a saved query from the sidebar.
   */
  selectQuery(guid: string) {
    // Flush any pending auto-save for the previous query
    this.flushAutoSave();

    const queries = this.savedQueries();
    const savedQuery = queries[guid];
    
    if (savedQuery) {
      this.currentGuid.set(guid);
      this.currentQuery.set(savedQuery.query);
      this.currentValues.set([...savedQuery.values]);
    }
  }

  /**
   * Force-save current state immediately (flushes pending debounce).
   */
  flushAutoSave() {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
    this.autoSave();
  }

  /**
   * Duplicate a specific query by GUID. Selects the new copy.
   */
  duplicateQuery(guid: string): string | null {
    const queries = this.savedQueries();
    const existingQuery = queries[guid];
    
    if (!existingQuery) return null;

    const newGuid = this.generateGuid();
    
    const savedQuery: SavedQuery = {
      query: existingQuery.query,
      values: [...existingQuery.values],
      name: existingQuery.name ? `${existingQuery.name} (copy)` : 'Untitled Query (copy)',
    };

    this.savedQueries.update(q => ({
      ...q,
      [newGuid]: savedQuery,
    }));

    this.currentGuid.set(newGuid);
    this.currentQuery.set(savedQuery.query);
    this.currentValues.set([...savedQuery.values]);

    this.persist();
    return newGuid;
  }

  /**
   * Delete a query by GUID.
   */
  deleteQuery(guid: string) {
    this.savedQueries.update(queries => {
      const { [guid]: removed, ...rest } = queries;
      return rest;
    });
    
    // If we deleted the current query, clear selection
    if (this.currentGuid() === guid) {
      this.currentGuid.set(null);
      this.currentQuery.set('');
      this.currentValues.set([]);
    }
    
    this.persist();
  }

  /**
   * Rename a query.
   */
  renameQuery(guid: string, newName: string) {
    this.savedQueries.update(queries => {
      const existing = queries[guid];
      if (!existing) return queries;
      
      return {
        ...queries,
        [guid]: {
          ...existing,
          name: newName.trim() || undefined, // Clear name if empty
        }
      };
    });
    
    this.persist();
  }

  /**
   * Get the display name for a query (name if exists, otherwise query preview).
   */
  getQueryDisplayName(savedQuery: SavedQuery): string {
    return savedQuery.name || savedQuery.query;
  }

  /**
   * Get the short text for the icon box (first 3-4 chars of name or query pattern).
   */
  getQueryIconText(savedQuery: SavedQuery): string {
    if (savedQuery.name) {
      // Use first 3 letters of name
      return savedQuery.name.substring(0, 3).toUpperCase();
    }
    
    // Fall back to original behavior: extract from query
    const match = savedQuery.query.match(/=\s*['"]([^'"]+)['"]/);
    if (match && match[1]) {
      const text = match[1].replace(/[^a-zA-Z0-9]/g, '');
      return text.substring(0, 4);
    }
    
    const paramMatch = savedQuery.query.match(/\{([^:}]+)/);
    if (paramMatch && paramMatch[1]) {
      return paramMatch[1].substring(0, 4);
    }
    
    return '??';
  }

  /**
   * Get the compiled query ready for execution.
   * Replaces all parameter placeholders with their current values.
   */
  getCompiledQuery(): string {
    const result = this.compilerService.compileQuery(
      this.currentQuery(),
      this.currentValues()
    );
    return result.compiledQuery;
  }

  /**
   * Check if compilation would succeed with current values.
   */
  canCompile(): { success: boolean; errors: string[] } {
    const result = this.compilerService.compileQuery(
      this.currentQuery(),
      this.currentValues()
    );
    return { success: result.success, errors: result.errors };
  }

  /**
   * Get display text for sidebar (uses query text).
   */
  getDisplayText(guid: string): string {
    const saved = this.savedQueries()[guid];
    return saved?.query ?? '';
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
