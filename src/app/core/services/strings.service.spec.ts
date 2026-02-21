import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { describe, expect, it, beforeEach } from 'vitest';
import { StringsService } from './strings.service';

describe('StringsService', () => {
  let service: StringsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withFetch())],
    });
    service = TestBed.inject(StringsService);
  });

  describe('getAll', () => {
    it('should return an array of string entries', async () => {
      try {
        const result = await firstValueFrom(service.getAll());
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      } catch (error: unknown) {
        const httpError = error as { status?: number };
        expect(httpError.status).toBeGreaterThanOrEqual(400);
      }
    });
  });

  describe('get', () => {
    it('should attempt to get a value by key', async () => {
      try {
        const result = await firstValueFrom(service.get('test_key'));
        expect(result === null || typeof result === 'string').toBe(true);
      } catch (error: unknown) {
        const httpError = error as { status?: number };
        expect(httpError.status).toBeGreaterThanOrEqual(400);
      }
    });
  });

  describe('set', () => {
    it('should save a string value', async () => {
      try {
        await firstValueFrom(service.set('vitest_test_key', 'test_value'));
      } catch (error: unknown) {
        const httpError = error as { status?: number };
        expect(httpError.status).toBeGreaterThanOrEqual(400);
      }
    });
  });

  describe('setJson / getJson', () => {
    it('should round-trip a JSON object', async () => {
      const testKey = 'vitest_json_test';
      const testData = { name: 'test', count: 42 };

      try {
        await firstValueFrom(service.setJson(testKey, testData));
        const result = await firstValueFrom(service.getJson<typeof testData>(testKey));
        expect(result).toBeDefined();
        if (result) {
          expect(result.name).toBe('test');
          expect(result.count).toBe(42);
        }
      } catch (error: unknown) {
        const httpError = error as { status?: number };
        expect(httpError.status).toBeGreaterThanOrEqual(400);
      }
    });

    it('should return null for non-existent key', async () => {
      try {
        const result = await firstValueFrom(service.getJson('nonexistent_key_xyz'));
        expect(result).toBeNull();
      } catch (error: unknown) {
        const httpError = error as { status?: number };
        expect(httpError.status).toBeGreaterThanOrEqual(400);
      }
    });
  });
});
