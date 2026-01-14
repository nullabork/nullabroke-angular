import { inject, Injectable } from '@angular/core';
import {
  ParsedQuery,
  QueryParameter,
  RenderComponentType,
} from '../models/query-parameter.model';
import { QueryParserService } from './query-parser.service';

/**
 * Result of compiling a query.
 */
export interface CompileResult {
  /** The compiled query string ready for execution */
  compiledQuery: string;
  
  /** Whether compilation was successful */
  success: boolean;
  
  /** Error messages if compilation failed */
  errors: string[];
}

/**
 * Service responsible for compiling parameterized queries into executable queries.
 * Replaces parameter placeholders with their actual values using type-specific formatting.
 */
@Injectable({
  providedIn: 'root',
})
export class QueryCompilerService {
  private readonly parserService = inject(QueryParserService);

  /**
   * Compile a parameterized query into an executable query string.
   * 
   * @param query The original query with parameter syntax
   * @param values Array of values indexed by parameter order
   * @returns CompileResult with the compiled query or errors
   */
  compileQuery(query: string, values: (string | number | string[])[]): CompileResult {
    const parsed = this.parserService.parseQuery(query);
    
    if (!parsed.isValid) {
      return {
        compiledQuery: query,
        success: false,
        errors: parsed.errors.map(e => e.message),
      };
    }

    // If no parameters, just return the query with escaped braces unescaped
    if (parsed.parameters.length === 0) {
      return {
        compiledQuery: this.parserService.unescapeBraces(query),
        success: true,
        errors: [],
      };
    }

    const errors: string[] = [];
    let compiledQuery = query;
    
    // Process parameters in reverse order to maintain correct indices
    const sortedParams = [...parsed.parameters].sort((a, b) => b.startIndex - a.startIndex);
    
    for (const param of sortedParams) {
      const value = values[param.index];
      
      // Use default value if no value provided
      const effectiveValue = value !== undefined && value !== null && value !== ''
        ? value
        : this.getDefaultValueForType(param);

      // Validate value for type
      const validationError = this.validateValue(param, effectiveValue);
      if (validationError) {
        errors.push(validationError);
        continue;
      }

      // Compile the value based on component type
      const compiledValue = this.compileValue(param.componentType, effectiveValue);
      
      // Replace in query
      compiledQuery = 
        compiledQuery.substring(0, param.startIndex) +
        compiledValue +
        compiledQuery.substring(param.endIndex);
    }

    // Unescape any remaining escaped braces
    compiledQuery = this.parserService.unescapeBraces(compiledQuery);

    return {
      compiledQuery,
      success: errors.length === 0,
      errors,
    };
  }

  /**
   * Compile a value based on its component type.
   */
  private compileValue(componentType: RenderComponentType, value: string | number | string[]): string {
    switch (componentType) {
      case 'StringInput':
        return this.compileStringValue(value as string);
      
      case 'NumberInput':
        return this.compileNumberValue(value as number | string);
      
      case 'FormTypes':
        return this.compileStringValue(value as string);
      
      case 'Tags':
        return this.compileTagsValue(value as string[] | string);
      
      default:
        // Fallback to string compilation
        return this.compileStringValue(String(value));
    }
  }

  /**
   * Compile a string value - wraps in single quotes with proper escaping.
   */
  private compileStringValue(value: string): string {
    if (value === null || value === undefined) {
      return "''";
    }
    // Escape single quotes by doubling them (SQL standard)
    const escaped = String(value).replace(/'/g, "''");
    return `'${escaped}'`;
  }

  /**
   * Compile a number value - no quotes.
   */
  private compileNumberValue(value: number | string): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) {
      return '0';
    }
    return String(num);
  }

  /**
   * Compile tags value - comma-separated quoted strings.
   */
  private compileTagsValue(value: string[] | string): string {
    // Handle both array and comma-separated string
    const tags = Array.isArray(value) 
      ? value 
      : (typeof value === 'string' ? value.split(',').map(t => t.trim()).filter(t => t) : []);
    
    if (tags.length === 0) {
      return "''";
    }
    
    // Quote each tag and join with commas
    return tags.map(tag => this.compileStringValue(tag)).join(',');
  }

  /**
   * Get default value for a parameter type.
   */
  private getDefaultValueForType(param: QueryParameter): string | number | string[] {
    // If parameter has a default value defined, use it
    if (param.defaultValue !== undefined && param.defaultValue !== '') {
      return param.defaultValue;
    }

    // Otherwise use type-specific defaults
    switch (param.componentType) {
      case 'NumberInput':
        return 0;
      case 'Tags':
        return [];
      case 'StringInput':
      case 'FormTypes':
      default:
        return '';
    }
  }

  /**
   * Validate a value for a given parameter type.
   */
  private validateValue(param: QueryParameter, value: unknown): string | null {
    switch (param.componentType) {
      case 'NumberInput':
        const num = typeof value === 'string' ? parseFloat(value) : value;
        if (typeof num !== 'number' || isNaN(num)) {
          return `Parameter "${param.label}" expects a numeric value, got: ${value}`;
        }
        break;
      
      case 'Tags':
        if (!Array.isArray(value) && typeof value !== 'string') {
          return `Parameter "${param.label}" expects an array or comma-separated string of tags`;
        }
        break;
    }
    
    return null;
  }

  /**
   * Get compiled values array from parameters and their current/default values.
   * Useful for initializing values from parsed query defaults.
   */
  getDefaultValues(parsed: ParsedQuery): (string | number | string[])[] {
    return parsed.parameters.map(param => this.getDefaultValueForType(param));
  }
}
