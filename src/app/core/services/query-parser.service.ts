import { Injectable } from '@angular/core';
import {
  ParsedQuery,
  QueryParameter,
  QueryParseError,
  RenderComponentType,
} from '../models/query-parameter.model';

/**
 * Service responsible for parsing query strings with parameter syntax.
 * 
 * Supported syntax:
 * - {Label:RenderComponent:DefaultValue} - Full specification
 * - {Label::DefaultValue} - Defaults to StringInput
 * - {Label::} - Defaults to StringInput with empty default
 * - {Label} - Defaults to StringInput with empty default
 * 
 * Escape literal braces with \{ and \}
 */
@Injectable({
  providedIn: 'root',
})
export class QueryParserService {
  // Valid component types
  private readonly validComponentTypes: Set<string> = new Set([
    'StringInput',
    'NumberInput',
    'FormTypes',
    'Tags',
  ]);

  // Regex to match parameter syntax: {Label:RenderComponent:DefaultValue}
  // Handles escaped braces and captures the groups
  private readonly parameterRegex = /(?<!\\)\{([^{}]*?)(?<!\\)\}/g;

  /**
   * Parse a query string and extract all parameters.
   * @param query The query string to parse
   * @returns ParsedQuery with parameters and validation info
   */
  parseQuery(query: string): ParsedQuery {
    const parameters: QueryParameter[] = [];
    const errors: QueryParseError[] = [];
    
    let match: RegExpExecArray | null;
    let index = 0;
    
    // Reset regex state
    this.parameterRegex.lastIndex = 0;
    
    while ((match = this.parameterRegex.exec(query)) !== null) {
      const rawMatch = match[0];
      const content = match[1];
      const startIndex = match.index;
      const endIndex = startIndex + rawMatch.length;
      
      const parseResult = this.parseParameterContent(content, index, rawMatch, startIndex, endIndex);
      
      if (parseResult.error) {
        errors.push(parseResult.error);
      } else if (parseResult.parameter) {
        parameters.push(parseResult.parameter);
        index++;
      }
    }

    // Check for unmatched braces (potential malformed syntax)
    const unmatchedErrors = this.checkUnmatchedBraces(query);
    errors.push(...unmatchedErrors);

    return {
      originalQuery: query,
      parameters,
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Parse the content inside the braces.
   * Format: Label:RenderComponent:DefaultValue
   */
  private parseParameterContent(
    content: string,
    index: number,
    rawMatch: string,
    startIndex: number,
    endIndex: number
  ): { parameter?: QueryParameter; error?: QueryParseError } {
    // Handle empty braces
    if (!content.trim()) {
      return {
        error: {
          message: 'Empty parameter definition',
          startIndex,
          endIndex,
        },
      };
    }

    // Split by colons, but be careful about edge cases
    const parts = this.splitByColons(content);
    
    // Extract label (required)
    const label = parts[0]?.trim();
    if (!label) {
      return {
        error: {
          message: 'Parameter must have a label',
          startIndex,
          endIndex,
        },
      };
    }

    // Extract component type (optional, defaults to StringInput)
    let componentType: RenderComponentType = 'StringInput';
    if (parts.length > 1 && parts[1]?.trim()) {
      const typeStr = parts[1].trim();
      if (!this.validComponentTypes.has(typeStr)) {
        return {
          error: {
            message: `Invalid component type: ${typeStr}. Valid types are: ${[...this.validComponentTypes].join(', ')}`,
            startIndex,
            endIndex,
          },
        };
      }
      componentType = typeStr as RenderComponentType;
    }

    // Extract default value (optional)
    // Join remaining parts back together in case default value contained colons
    const defaultValue = parts.length > 2 
      ? parts.slice(2).join(':').trim() 
      : '';

    return {
      parameter: {
        label,
        componentType,
        defaultValue,
        index,
        rawMatch,
        startIndex,
        endIndex,
      },
    };
  }

  /**
   * Split content by colons, handling edge cases.
   */
  private splitByColons(content: string): string[] {
    return content.split(':');
  }

  /**
   * Check for unmatched or improperly escaped braces.
   */
  private checkUnmatchedBraces(query: string): QueryParseError[] {
    const errors: QueryParseError[] = [];
    
    let depth = 0;
    let lastOpenIndex = -1;
    
    for (let i = 0; i < query.length; i++) {
      const char = query[i];
      const prevChar = i > 0 ? query[i - 1] : '';
      
      // Skip escaped braces
      if (prevChar === '\\') continue;
      
      if (char === '{') {
        if (depth === 0) {
          lastOpenIndex = i;
        }
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth < 0) {
          errors.push({
            message: 'Unmatched closing brace',
            startIndex: i,
            endIndex: i + 1,
          });
          depth = 0; // Reset for continued parsing
        }
      }
    }
    
    if (depth > 0 && lastOpenIndex >= 0) {
      errors.push({
        message: 'Unmatched opening brace',
        startIndex: lastOpenIndex,
        endIndex: query.length,
      });
    }
    
    return errors;
  }

  /**
   * Check if a query string contains any parameter syntax.
   */
  hasParameters(query: string): boolean {
    this.parameterRegex.lastIndex = 0;
    return this.parameterRegex.test(query);
  }

  /**
   * Unescape literal braces in a string.
   * Converts \{ to { and \} to }
   */
  unescapeBraces(str: string): string {
    return str.replace(/\\{/g, '{').replace(/\\}/g, '}');
  }

  /**
   * Get the display query (with parameter syntax highlighted or formatted).
   * Used for showing in the UI.
   */
  getDisplayQuery(query: string): string {
    // For now, just return the original query
    // Could be enhanced to add syntax highlighting
    return query;
  }
}
