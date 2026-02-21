/**
 * Supported render component types for query parameters.
 * Each type defines how the parameter is rendered and how its value
 * is compiled into the final query string.
 */
export type RenderComponentType = 
  | 'StringInput'    // Free text input, wraps in single quotes
  | 'NumberInput'    // Numeric input, no quotes
  | 'FormTypes'      // Dropdown for SEC form types
  | 'Tags';          // Multi-select for tags

/**
 * Represents a parsed query parameter from the special syntax.
 * Syntax: {Label:RenderComponent:DefaultValue}
 */
export interface QueryParameter {
  /** Display label for the parameter input */
  label: string;
  
  /** The component type to render for this parameter */
  componentType: RenderComponentType;
  
  /** Default value defined in the query syntax */
  defaultValue: string;
  
  /** Index position in the query (for mapping to values array) */
  index: number;
  
  /** Original raw match string from the query */
  rawMatch: string;
  
  /** Start position in the original query string */
  startIndex: number;
  
  /** End position in the original query string */
  endIndex: number;
}

/**
 * Result of parsing a query string for parameters.
 */
export interface ParsedQuery {
  /** Original query string */
  originalQuery: string;
  
  /** Array of extracted parameters in order of appearance */
  parameters: QueryParameter[];
  
  /** Whether the query syntax is valid */
  isValid: boolean;
  
  /** Error messages for invalid syntax */
  errors: QueryParseError[];
}

/**
 * Represents a syntax error in the query.
 */
export interface QueryParseError {
  message: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Saved query data structure (new format with parameter values).
 */
export interface SavedQuery {
  /** The query string with parameter syntax */
  query: string;
  
  /** Array of parameter values, indexed by parameter order in query */
  values: (string | number | string[])[];
  
  /** Optional display name for the query */
  name?: string;

  /** If this query was created from a blueprint, the blueprint's stable ID */
  blueprintId?: string;
}

/**
 * Map of saved queries by GUID.
 */
export type SavedQueriesMap = Record<string, SavedQuery>;

/**
 * Configuration for a render component type.
 * Used by the component registry for extensibility.
 */
export interface RenderComponentConfig {
  /** Unique identifier for this component type */
  type: RenderComponentType;
  
  /** Human-readable name */
  displayName: string;
  
  /** 
   * Function to compile a value into query string format.
   * @param value The current value
   * @returns The compiled string to insert into the query
   */
  compile: (value: string | number | string[]) => string;
  
  /**
   * Function to get the default value when not specified.
   */
  getDefaultValue: () => string | number | string[];
  
  /**
   * Optional function to validate a value.
   * @returns Error message if invalid, null if valid
   */
  validate?: (value: unknown) => string | null;
}

/**
 * Legacy saved queries format for migration support.
 */
export type LegacySavedQueriesMap = Record<string, string>;

/**
 * A blueprint query that gets provisioned for new users.
 * Each has a stable ID so it's only created once per user.
 */
export interface BlueprintQuery {
  /** Stable identifier - used to track whether this blueprint has been provisioned */
  id: string;
  /** Display name for the query */
  name: string;
  /** The query string (may include parameter syntax) */
  query: string;
  /** Default parameter values */
  values: (string | number | string[])[];
}
