import { inject, Injectable, signal, computed } from '@angular/core';
import { StringsService } from './strings.service';
import { QueryParserService } from './query-parser.service';
import { QueryCompilerService } from './query-compiler.service';
import { catchError, forkJoin, of, take } from 'rxjs';
import { 
  SavedQuery, 
  SavedQueriesMap, 
  LegacySavedQueriesMap,
  BlueprintQuery,
} from '../models/query-parameter.model';
import blueprintQueries from '../../components/query-builder/blueprint-queries.json';

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
  private readonly BLUEPRINTS_KEY = 'provisioned_blueprints';

  private autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly AUTO_SAVE_DELAY = 800;

  private readonly blueprints = blueprintQueries as BlueprintQuery[];

  // State
  readonly savedQueries = signal<SavedQueriesMap>({});
  readonly currentGuid = signal<string | null>(null);
  readonly currentQuery = signal<string>('');
  readonly currentValues = signal<ParameterValue[]>([]);
  readonly provisionedIds = signal<string[]>([]);

  /** Whether any provisioned blueprints have been deleted and can be restored */
  readonly hasDeletedBlueprints = computed(() => {
    const queries = this.savedQueries();
    const existing = new Set(
      Object.values(queries).map(q => q.blueprintId).filter(Boolean)
    );
    return this.provisionedIds().some(id => !existing.has(id));
  });
  
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
   * Load saved queries and provision any new blueprint queries.
   * Handles both legacy format (string) and new format (SavedQuery object).
   */
  load() {
    forkJoin({
      queries: this.stringsService.getJson<SavedQueriesMap | LegacySavedQueriesMap>(this.STORAGE_KEY).pipe(
        catchError(() => of(null))
      ),
      provisioned: this.stringsService.getJson<string[]>(this.BLUEPRINTS_KEY).pipe(
        catchError(() => of(null))
      ),
    }).pipe(take(1)).subscribe(({ queries, provisioned }) => {
      let savedQueries: SavedQueriesMap = {};
      if (queries) {
        savedQueries = this.migrateQueries(queries);
      }

      const pIds = provisioned ?? [];
      const newBlueprints = this.blueprints.filter(bp => !pIds.includes(bp.id));

      if (newBlueprints.length > 0) {
        for (const bp of newBlueprints) {
          const guid = this.generateGuid();
          savedQueries[guid] = {
            query: bp.query,
            values: [...bp.values],
            name: bp.name,
            blueprintId: bp.id,
          };
          if (!pIds.includes(bp.id)) {
            pIds.push(bp.id);
          }
        }
      }

      this.provisionedIds.set(pIds);
      this.savedQueries.set(savedQueries);

      if (newBlueprints.length > 0) {
        this.persistProvisionedIds(pIds);
        this.persist();
      }
    });
  }

  /**
   * Migrate legacy query format to new format with values.
   * Also backfills blueprintId on queries that were provisioned before the field existed.
   */
  private migrateQueries(queries: SavedQueriesMap | LegacySavedQueriesMap): SavedQueriesMap {
    const migrated: SavedQueriesMap = {};
    
    for (const [guid, value] of Object.entries(queries)) {
      if (typeof value === 'string') {
        const parsed = this.parserService.parseQuery(value);
        migrated[guid] = {
          query: value,
          values: this.compilerService.getDefaultValues(parsed),
        };
      } else if (typeof value === 'object' && value !== null && 'query' in value) {
        migrated[guid] = value as SavedQuery;
      }
    }

    // Backfill blueprintId for queries created before the field existed.
    // Match by query text against known blueprints.
    const bpByQuery = new Map(this.blueprints.map(bp => [bp.query, bp.id]));
    const bpByName = new Map(this.blueprints.map(bp => [bp.name, bp.id]));

    for (const [guid, sq] of Object.entries(migrated)) {
      if (sq.blueprintId) continue;
      const matchByQuery = bpByQuery.get(sq.query);
      const matchByName = sq.name ? bpByName.get(sq.name) : undefined;
      const matched = matchByQuery ?? matchByName;
      if (matched) {
        migrated[guid] = { ...sq, blueprintId: matched };
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
      blueprintId: existing?.blueprintId,
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

  /**
   * Restore any deleted blueprint queries.
   * Only re-creates blueprints that were provisioned but no longer exist.
   */
  restoreDeletedBlueprints() {
    const queries = this.savedQueries();
    const existingBpIds = new Set(
      Object.values(queries).map(q => q.blueprintId).filter(Boolean)
    );

    const deletedBlueprints = this.blueprints.filter(
      bp => this.provisionedIds().includes(bp.id) && !existingBpIds.has(bp.id)
    );

    if (deletedBlueprints.length === 0) return;

    const updated = { ...queries };
    for (const bp of deletedBlueprints) {
      const guid = this.generateGuid();
      updated[guid] = {
        query: bp.query,
        values: [...bp.values],
        name: bp.name,
        blueprintId: bp.id,
      };
    }

    this.savedQueries.set(updated);
    this.persist();
  }

  /**
   * Reset a blueprint query back to its original state.
   * Only works for queries that have a blueprintId.
   */
  resetToBlueprint(guid: string) {
    const query = this.savedQueries()[guid];
    if (!query?.blueprintId) return;

    const blueprint = this.blueprints.find(bp => bp.id === query.blueprintId);
    if (!blueprint) return;

    const reset: SavedQuery = {
      query: blueprint.query,
      values: [...blueprint.values],
      name: blueprint.name,
      blueprintId: blueprint.id,
    };

    this.savedQueries.update(queries => ({
      ...queries,
      [guid]: reset,
    }));

    // If this is the currently selected query, update live state
    if (this.currentGuid() === guid) {
      this.currentQuery.set(reset.query);
      this.currentValues.set([...reset.values]);
    }

    this.persist();
  }

  /**
   * Delete everything and re-create only the default blueprints.
   */
  resetAllQueries() {
    const freshQueries: SavedQueriesMap = {};
    for (const bp of this.blueprints) {
      const guid = this.generateGuid();
      freshQueries[guid] = {
        query: bp.query,
        values: [...bp.values],
        name: bp.name,
        blueprintId: bp.id,
      };
    }

    const pIds = this.blueprints.map(bp => bp.id);
    this.currentGuid.set(null);
    this.currentQuery.set('');
    this.currentValues.set([]);
    this.provisionedIds.set(pIds);
    this.savedQueries.set(freshQueries);
    this.persistProvisionedIds(pIds);
    this.persist();
  }

  /**
   * Delete all default/blueprint queries, keeping only user-created ones.
   */
  deleteAllDefaults() {
    const queries = this.savedQueries();
    const userOnly: SavedQueriesMap = {};
    for (const [guid, q] of Object.entries(queries)) {
      if (!q.blueprintId) {
        userOnly[guid] = q;
      }
    }

    // If the currently selected query was a blueprint, clear selection
    const currentQ = this.currentGuid();
    if (currentQ && queries[currentQ]?.blueprintId) {
      this.currentGuid.set(null);
      this.currentQuery.set('');
      this.currentValues.set([]);
    }

    this.savedQueries.set(userOnly);
    this.persist();
  }

  private persistProvisionedIds(ids: string[]) {
    this.stringsService.setJson(this.BLUEPRINTS_KEY, ids)
      .pipe(take(1))
      .subscribe({ error: err => console.error('Failed to save provisioned blueprints', err) });
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
