import { provideHttpClient, withFetch } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { describe, expect, it, beforeEach } from 'vitest';

import { FilingService } from './filing.service';
import { Filing, AutocompleteResult } from '../models/filing.model';

describe('FilingService', () => {
  let service: FilingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withFetch())],
    });
    service = TestBed.inject(FilingService);
  });

  describe('search (GET)', () => {
    it('should return filings for 8-K form type query', async () => {
      const query = "form_type = '8-K' order by snowflake desc limit 5";
      const results = await firstValueFrom(service.search(query));

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(5);

      const filing = results[0];
      expect(filing.formType).toBe('8-K');
      expect(filing.accessionNumber).toBeDefined();
      expect(filing.companyConformedName).toBeDefined();
      expect(filing.centralIndexKey).toBeTypeOf('number');
    });

    it('should return filings with expected structure', async () => {
      const query = "form_type = '10-K' limit 1";
      const results = await firstValueFrom(service.search(query));

      expect(results).toBeDefined();
      expect(results.length).toBe(1);
      const filing: Filing = results[0];

      // Verify all expected fields exist
      expect(filing).toHaveProperty('id');
      expect(filing).toHaveProperty('accessionNumber');
      expect(filing).toHaveProperty('formType');
      expect(filing).toHaveProperty('companyConformedName');
      expect(filing).toHaveProperty('centralIndexKey');
      expect(filing).toHaveProperty('dateFiled');
      expect(filing).toHaveProperty('datePublished');
      expect(filing).toHaveProperty('size');
      expect(filing).toHaveProperty('tags');
      expect(filing).toHaveProperty('snowflakeId');
      expect(filing).toHaveProperty('absoluteFileUrl');
    });
  });

  describe('searchPost (POST)', () => {
    it('should return filings using POST method', async () => {
      const response = await firstValueFrom(
        service.searchPost({
          query: "form_type = '10-K' limit 3",
          save: false,
        })
      );

      expect(response).toBeDefined();
      expect(response.value).toBeDefined();
      expect(Array.isArray(response.value)).toBe(true);
      expect(response.value.length).toBeLessThanOrEqual(3);
      expect(response.statusCode).toBe(200);
    });
  });

  describe('getById', () => {
    it('should return a filing by ID', async () => {
      const results = await firstValueFrom(service.getById(1));

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe(1);
    });
  });

  describe('autocomplete', () => {
    it('should return autocomplete suggestions for form', async () => {
      const results = await firstValueFrom(service.autocomplete('form'));

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      const suggestion: AutocompleteResult = results[0];
      expect(suggestion.word).toBeDefined();
      expect(suggestion.type).toBeTypeOf('number');
    });

    it('should return suggestions containing form_type', async () => {
      const results = await firstValueFrom(service.autocomplete('form_type'));

      expect(results).toBeDefined();
      const words = results.map((r) => r.word);
      expect(words).toContain('form_type');
    });
  });
});

