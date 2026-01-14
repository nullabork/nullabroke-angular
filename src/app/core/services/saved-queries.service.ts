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
  
  // Track if the current query has unsaved changes
  readonly isDirty = signal(false);

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
   * Start a new query. Clears current state.
   */
  newQuery() {
    this.currentGuid.set(this.generateGuid());
    this.currentQuery.set('');
    this.currentValues.set([]);
    this.isDirty.set(true);
  }

  /**
   * Set the current query text (e.g. from user typing).
   * Updates parameters and initializes values from defaults.
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
    
    this.checkDirty();
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
   * Set a parameter value at a specific index.
   */
  setParameterValue(index: number, value: ParameterValue) {
    this.currentValues.update(values => {
      const newValues = [...values];
      // Ensure array is large enough
      while (newValues.length <= index) {
        newValues.push('');
      }
      newValues[index] = value;
      return newValues;
    });
    this.checkDirty();
  }

  /**
   * Reset a parameter value to its default.
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
   * Reset all parameter values to their defaults.
   */
  resetAllParameterValues() {
    const params = this.currentParameters();
    const defaultValues = params.map(p => 
      p.defaultValue || this.getDefaultForType(p.componentType)
    );
    this.currentValues.set(defaultValues);
    this.checkDirty();
  }

  /**
   * Check if current state is dirty (has unsaved changes).
   */
  private checkDirty() {
    const guid = this.currentGuid();
    if (!guid) {
      this.isDirty.set(true);
      return;
    }
    
    const saved = this.savedQueries()[guid];
    if (!saved) {
      this.isDirty.set(true);
      return;
    }
    
    // Compare query text
    if (saved.query !== this.currentQuery()) {
      this.isDirty.set(true);
      return;
    }
    
    // Compare values
    const currentVals = this.currentValues();
    if (saved.values.length !== currentVals.length) {
      this.isDirty.set(true);
      return;
    }
    
    for (let i = 0; i < currentVals.length; i++) {
      const savedVal = saved.values[i];
      const currentVal = currentVals[i];
      
      // Handle array comparison for tags
      if (Array.isArray(savedVal) && Array.isArray(currentVal)) {
        if (savedVal.length !== currentVal.length || 
            !savedVal.every((v, j) => v === currentVal[j])) {
          this.isDirty.set(true);
          return;
        }
      } else if (savedVal !== currentVal) {
        this.isDirty.set(true);
        return;
      }
    }
    
    this.isDirty.set(false);
  }

  /**
   * Select a saved query from the sidebar.
   */
  selectQuery(guid: string) {
    const queries = this.savedQueries();
    const savedQuery = queries[guid];
    
    if (savedQuery) {
      this.currentGuid.set(guid);
      this.currentQuery.set(savedQuery.query);
      this.currentValues.set([...savedQuery.values]);
      this.isDirty.set(false);
    }
  }

  /**
   * Save the current query.
   */
  save() {
    const guid = this.currentGuid() ?? this.generateGuid();
    this.currentGuid.set(guid);

    // Preserve existing name if any
    const existingQuery = this.savedQueries()[guid];
    
    const savedQuery: SavedQuery = {
      query: this.currentQuery(),
      values: [...this.currentValues()],
      name: existingQuery?.name,
    };
    
    this.savedQueries.update(queries => ({
      ...queries,
      [guid]: savedQuery
    }));
    
    this.isDirty.set(false);
    this.persist();
  }

  /**
   * Duplicate the current query to a new GUID and save immediately.
   */
  duplicate() {
    const newGuid = this.generateGuid();
    const currentGuidVal = this.currentGuid();
    const existingQuery = currentGuidVal ? this.savedQueries()[currentGuidVal] : null;
    
    const savedQuery: SavedQuery = {
      query: this.currentQuery(),
      values: [...this.currentValues()],
      // Copy name with " (copy)" suffix if exists
      name: existingQuery?.name ? `${existingQuery.name} (copy)` : undefined,
    };

    this.savedQueries.update(queries => ({
      ...queries,
      [newGuid]: savedQuery
    }));

    this.currentGuid.set(newGuid);
    this.isDirty.set(false);
    this.persist();
  }

  /**
   * Duplicate a specific query by GUID.
   */
  duplicateQuery(guid: string) {
    const queries = this.savedQueries();
    const existingQuery = queries[guid];
    
    if (!existingQuery) return;

    const newGuid = this.generateGuid();
    
    const savedQuery: SavedQuery = {
      query: existingQuery.query,
      values: [...existingQuery.values],
      name: existingQuery.name ? `${existingQuery.name} (copy)` : undefined,
    };

    this.savedQueries.update(q => ({
      ...q,
      [newGuid]: savedQuery
    }));

    this.persist();
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
      this.isDirty.set(false);
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
