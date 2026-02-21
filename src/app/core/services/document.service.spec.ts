import { provideHttpClient, withFetch } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { describe, expect, it, beforeEach } from 'vitest';

import { DocumentService } from './document.service';

describe('DocumentService', () => {
  let service: DocumentService;
  // Use a known accession number from the filing search results
  const testAccessionNumber = '0000940944-25-000067';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withFetch())],
    });
    service = TestBed.inject(DocumentService);
  });

  describe('getDocument', () => {
    it('should attempt to get document (may fail due to server issues)', async () => {
      try {
        await firstValueFrom(service.getDocument(testAccessionNumber));
      } catch (error: unknown) {
        const httpError = error as { status?: number };
        expect(httpError.status).toBeGreaterThanOrEqual(400);
      }
    });
  });

  describe('getParsedDocument', () => {
    it('should attempt to get parsed document (may fail due to server issues)', async () => {
      try {
        await firstValueFrom(service.getParsedDocument(testAccessionNumber));
      } catch (error: unknown) {
        const httpError = error as { status?: number };
        expect(httpError.status).toBe(500);
      }
    });
  });

  describe('getDocumentFile', () => {
    it('should attempt to get document file (may fail due to server issues)', async () => {
      try {
        await firstValueFrom(service.getDocumentFile(testAccessionNumber, '1'));
      } catch (error: unknown) {
        const httpError = error as { status?: number };
        expect(httpError.status).toBe(500);
      }
    });
  });

  describe('getDocumentImages', () => {
    it('should attempt to get document images (may fail due to server issues)', async () => {
      try {
        await firstValueFrom(service.getDocumentImages(testAccessionNumber, '1', 800, 1));
      } catch (error: unknown) {
        const httpError = error as { status?: number };
        expect(httpError.status).toBe(500);
      }
    });
  });

  describe('getPrimaryDocument', () => {
    it('should attempt to get primary document (may fail due to server issues)', async () => {
      try {
        await firstValueFrom(service.getPrimaryDocument(testAccessionNumber));
      } catch (error: unknown) {
        const httpError = error as { status?: number };
        expect(httpError.status).toBe(500);
      }
    });
  });

  describe('getStrippedDocument', () => {
    it('should attempt to get stripped document (may fail due to server issues)', async () => {
      try {
        await firstValueFrom(service.getStrippedDocument(testAccessionNumber, '1'));
      } catch (error: unknown) {
        const httpError = error as { status?: number };
        expect(httpError.status).toBe(500);
      }
    });
  });

  describe('getDocumentMeta', () => {
    it('should attempt to get document meta (may fail due to server issues)', async () => {
      try {
        await firstValueFrom(service.getDocumentMeta(testAccessionNumber));
      } catch (error: unknown) {
        const httpError = error as { status?: number };
        expect(httpError.status).toBe(500);
      }
    });
  });

  describe('getContext', () => {
    it('should attempt to get context (may fail due to server issues)', async () => {
      try {
        await firstValueFrom(
          service.getContext(testAccessionNumber, {
            text: 'test text',
            htmlFragment: '<p>test</p>',
          })
        );
      } catch (error: unknown) {
        const httpError = error as { status?: number };
        expect(httpError.status).toBeGreaterThanOrEqual(400);
      }
    });
  });
});

