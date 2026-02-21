import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { QueryParserService } from './query-parser.service';

describe('QueryParserService', () => {
  let service: QueryParserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QueryParserService);
  });

  describe('parseQuery', () => {
    it('should parse a simple query with no parameters', () => {
      const result = service.parseQuery("form_type = '8-K' limit 50");
      expect(result.parameters).toHaveLength(0);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should parse full syntax {Label:Type:Default}', () => {
      const result = service.parseQuery('form_type = {Form Type:FormTypes:8-K}');
      expect(result.parameters).toHaveLength(1);
      expect(result.parameters[0].label).toBe('Form Type');
      expect(result.parameters[0].componentType).toBe('FormTypes');
      expect(result.parameters[0].defaultValue).toBe('8-K');
      expect(result.isValid).toBe(true);
    });

    it('should parse minimal syntax {Label}', () => {
      const result = service.parseQuery('column = {Column}');
      expect(result.parameters).toHaveLength(1);
      expect(result.parameters[0].label).toBe('Column');
      expect(result.parameters[0].componentType).toBe('StringInput');
      expect(result.parameters[0].defaultValue).toBe('');
    });

    it('should parse {Label::Default} defaulting to StringInput', () => {
      const result = service.parseQuery("{Column::snowflake}");
      expect(result.parameters).toHaveLength(1);
      expect(result.parameters[0].label).toBe('Column');
      expect(result.parameters[0].componentType).toBe('StringInput');
      expect(result.parameters[0].defaultValue).toBe('snowflake');
    });

    it('should parse {Label::} as StringInput with empty default', () => {
      const result = service.parseQuery('{Column::}');
      expect(result.parameters).toHaveLength(1);
      expect(result.parameters[0].label).toBe('Column');
      expect(result.parameters[0].componentType).toBe('StringInput');
      expect(result.parameters[0].defaultValue).toBe('');
    });

    it('should parse NumberInput type', () => {
      const result = service.parseQuery('{Limit:NumberInput:50}');
      expect(result.parameters[0].componentType).toBe('NumberInput');
      expect(result.parameters[0].defaultValue).toBe('50');
    });

    it('should parse Tags type', () => {
      const result = service.parseQuery('{Tags:Tags:Presentation}');
      expect(result.parameters[0].componentType).toBe('Tags');
      expect(result.parameters[0].defaultValue).toBe('Presentation');
    });

    it('should parse multiple parameters', () => {
      const result = service.parseQuery('form_type = {Type:FormTypes:8-K} limit {Limit:NumberInput:50}');
      expect(result.parameters).toHaveLength(2);
      expect(result.parameters[0].label).toBe('Type');
      expect(result.parameters[0].index).toBe(0);
      expect(result.parameters[1].label).toBe('Limit');
      expect(result.parameters[1].index).toBe(1);
    });

    it('should track start and end indices', () => {
      const query = 'x = {Foo}';
      const result = service.parseQuery(query);
      expect(result.parameters[0].startIndex).toBe(4);
      expect(result.parameters[0].endIndex).toBe(9);
      expect(result.parameters[0].rawMatch).toBe('{Foo}');
    });

    it('should preserve the original query', () => {
      const query = 'form_type = {Type:FormTypes:10-K}';
      const result = service.parseQuery(query);
      expect(result.originalQuery).toBe(query);
    });

    it('should handle labels with spaces', () => {
      const result = service.parseQuery('{Form Type:FormTypes:8-K}');
      expect(result.parameters[0].label).toBe('Form Type');
    });

    it('should handle default values with colons', () => {
      const result = service.parseQuery('{URL::http://example.com}');
      expect(result.parameters[0].defaultValue).toBe('http://example.com');
    });

    it('should ignore escaped braces', () => {
      const result = service.parseQuery('\\{not a param\\}');
      expect(result.parameters).toHaveLength(0);
    });

    it('should report error for empty braces', () => {
      const result = service.parseQuery('test {}');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('Empty parameter');
    });

    it('should report error for invalid component type', () => {
      const result = service.parseQuery('{Label:InvalidType:val}');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('Invalid component type');
    });

    it('should report error for unmatched opening brace', () => {
      const result = service.parseQuery('test { unclosed');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Unmatched opening brace'))).toBe(true);
    });

    it('should report error for unmatched closing brace', () => {
      const result = service.parseQuery('test } extra');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Unmatched closing brace'))).toBe(true);
    });

    it('should handle empty query', () => {
      const result = service.parseQuery('');
      expect(result.parameters).toHaveLength(0);
      expect(result.isValid).toBe(true);
    });
  });

  describe('hasParameters', () => {
    it('should return true for query with parameters', () => {
      expect(service.hasParameters('{Test}')).toBe(true);
    });

    it('should return false for plain query', () => {
      expect(service.hasParameters("form_type = '8-K'")).toBe(false);
    });

    it('should return false for escaped braces', () => {
      expect(service.hasParameters('\\{not a param\\}')).toBe(false);
    });
  });

  describe('unescapeBraces', () => {
    it('should unescape \\{ to {', () => {
      expect(service.unescapeBraces('\\{test\\}')).toBe('{test}');
    });

    it('should not change strings without escaped braces', () => {
      expect(service.unescapeBraces('no braces')).toBe('no braces');
    });
  });

  describe('getDisplayQuery', () => {
    it('should return the query as-is', () => {
      const query = 'form_type = {Type:FormTypes:8-K}';
      expect(service.getDisplayQuery(query)).toBe(query);
    });
  });
});
