import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { QueryCompilerService } from './query-compiler.service';
import { QueryParserService } from './query-parser.service';

describe('QueryCompilerService', () => {
  let service: QueryCompilerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QueryCompilerService);
  });

  describe('compileQuery', () => {
    it('should return plain query unchanged', () => {
      const result = service.compileQuery("form_type = '8-K' limit 50", []);
      expect(result.compiledQuery).toBe("form_type = '8-K' limit 50");
      expect(result.success).toBe(true);
    });

    it('should compile StringInput as quoted string', () => {
      const result = service.compileQuery('ticker = {Ticker::MSFT}', ['AAPL']);
      expect(result.compiledQuery).toBe("ticker = 'AAPL'");
      expect(result.success).toBe(true);
    });

    it('should use default value when no value provided', () => {
      const result = service.compileQuery('ticker = {Ticker::MSFT}', []);
      expect(result.compiledQuery).toBe("ticker = 'MSFT'");
    });

    it('should compile NumberInput as raw number', () => {
      const result = service.compileQuery('limit {Limit:NumberInput:50}', [25]);
      expect(result.compiledQuery).toBe('limit 25');
    });

    it('should use 0 for invalid NumberInput', () => {
      const result = service.compileQuery('limit {Limit:NumberInput:50}', ['abc']);
      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('numeric');
    });

    it('should compile FormTypes as quoted string', () => {
      const result = service.compileQuery('form_type = {Type:FormTypes:8-K}', ['10-K']);
      expect(result.compiledQuery).toBe("form_type = '10-K'");
    });

    it('should compile Tags as comma-separated quoted strings', () => {
      const result = service.compileQuery('tags && {Tags:Tags:Presentation}', [['PDF', 'Report']]);
      expect(result.compiledQuery).toBe("tags && 'PDF','Report'");
    });

    it('should compile Tags from comma-separated string', () => {
      const result = service.compileQuery('tags && {Tags:Tags:Presentation}', ['PDF,Report']);
      expect(result.compiledQuery).toBe("tags && 'PDF','Report'");
    });

    it('should compile empty Tags as empty string', () => {
      const result = service.compileQuery('tags && {Tags:Tags:}', [[]]);
      expect(result.compiledQuery).toBe("tags && ''");
    });

    it('should escape single quotes in StringInput', () => {
      const result = service.compileQuery('name = {Name}', ["O'Brien"]);
      expect(result.compiledQuery).toBe("name = 'O''Brien'");
    });

    it('should compile multiple parameters', () => {
      const result = service.compileQuery(
        'form_type = {Type:FormTypes:8-K} limit {Limit:NumberInput:50}',
        ['10-Q', 25]
      );
      expect(result.compiledQuery).toBe("form_type = '10-Q' limit 25");
    });

    it('should unescape literal braces', () => {
      const result = service.compileQuery('test \\{literal\\}', []);
      expect(result.compiledQuery).toBe('test {literal}');
    });

    it('should fail on invalid query syntax', () => {
      const result = service.compileQuery('test { unclosed', []);
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle empty string value by using default', () => {
      const result = service.compileQuery('{Col::fallback}', ['']);
      expect(result.compiledQuery).toBe("'fallback'");
    });

    it('should handle null/undefined values by using default', () => {
      const result = service.compileQuery('{Col::fallback}', [undefined as any]);
      expect(result.compiledQuery).toBe("'fallback'");
    });
  });

  describe('getDefaultValues', () => {
    it('should return defaults for each parameter', () => {
      const parser = TestBed.inject(QueryParserService);
      const parsed = parser.parseQuery('{A} {B:NumberInput:42} {C:Tags:}');
      const defaults = service.getDefaultValues(parsed);
      expect(defaults[0]).toBe('');
      expect(defaults[1]).toBe('42');
      expect(defaults[2]).toEqual([]);
    });

    it('should return empty array for no parameters', () => {
      const parser = TestBed.inject(QueryParserService);
      const parsed = parser.parseQuery('plain query');
      const defaults = service.getDefaultValues(parsed);
      expect(defaults).toEqual([]);
    });
  });
});
