import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  Document,
  DocumentMeta,
  ParsedDocument,
  SECFilingDocumentFragment,
} from '../models/document.model';

/**
 * Service for interacting with SEC Document API endpoints.
 */
@Injectable({
  providedIn: 'root',
})
export class DocumentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/document`;

  // ============================================
  // URL Builders (for iframe src)
  // ============================================

  /**
   * Get the URL for a document by sequence number.
   * Use this as iframe src - the API serves HTML with injected JS.
   */
  getDocumentUrl(accessionNumber: string, seq: number | string = 1): string {
    return `${this.baseUrl}/${accessionNumber}/${seq}`;
  }

  /**
   * Get the URL for the primary document.
   * Use this as iframe src.
   */
  getPrimaryDocumentUrl(accessionNumber: string): string {
    return `${this.baseUrl}/${accessionNumber}/primary`;
  }

  /**
   * Get the URL for a document by filename.
   * Use this as iframe src.
   */
  getDocumentByFilenameUrl(accessionNumber: string, filename: string): string {
    return `${this.baseUrl}/${accessionNumber}/${filename}`;
  }

  /**
   * Get thumbnail URL for a document.
   */
  getThumbnailUrl(accessionNumber: string, seq: number | string, width: number = 200): string {
    return `${this.baseUrl}/${accessionNumber}/${seq}/images?width=${width}`;
  }

  // ============================================
  // API Methods
  // ============================================

  /**
   * Get a document by accession number.
   * @param accessionNumber - The document's accession number
   */
  getDocument(accessionNumber: string): Observable<Document> {
    return this.http.get<Document>(`${this.baseUrl}/${accessionNumber}`);
  }

  /**
   * Get parsed document content.
   * @param accessionNumber - The document's accession number
   */
  getParsedDocument(accessionNumber: string): Observable<ParsedDocument> {
    return this.http.get<ParsedDocument>(`${this.baseUrl}/${accessionNumber}/parsed`);
  }

  /**
   * Get a specific file from a document by filename or sequence.
   * @param accessionNumber - The document's accession number
   * @param filenameOrSequence - The filename or sequence number of the file
   */
  getDocumentFile(accessionNumber: string, filenameOrSequence: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${accessionNumber}/${filenameOrSequence}`, {
      responseType: 'blob',
    });
  }

  /**
   * Get images from a document file.
   * @param accessionNumber - The document's accession number
   * @param filenameOrSequence - The filename or sequence number of the file
   * @param width - Optional image width
   * @param page - Optional page number (default: 1)
   */
  getDocumentImages(
    accessionNumber: string,
    filenameOrSequence: string,
    width?: number,
    page = 1
  ): Observable<Blob> {
    let params = new HttpParams().set('page', page.toString());
    if (width) {
      params = params.set('width', width.toString());
    }
    return this.http.get(
      `${this.baseUrl}/${accessionNumber}/${filenameOrSequence}/images`,
      { params, responseType: 'blob' }
    );
  }

  /**
   * Get the primary document from a filing.
   * @param accessionNumber - The document's accession number
   */
  getPrimaryDocument(accessionNumber: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${accessionNumber}/primary`, {
      responseType: 'blob',
    });
  }

  /**
   * Get a stripped (text-only) version of a document file.
   * @param accessionNumber - The document's accession number
   * @param filenameOrSequence - The filename or sequence number of the file
   */
  getStrippedDocument(accessionNumber: string, filenameOrSequence: string): Observable<string> {
    return this.http.get(`${this.baseUrl}/${accessionNumber}/stripped/${filenameOrSequence}`, {
      responseType: 'text',
    });
  }

  /**
   * Get document metadata.
   * @param accessionNumber - The document's accession number
   */
  getDocumentMeta(accessionNumber: string): Observable<DocumentMeta> {
    return this.http.get<DocumentMeta>(`${this.baseUrl}/${accessionNumber}/meta`);
  }

  /**
   * Get context information for a document fragment.
   * @param accessionNumber - The document's accession number
   * @param fragment - The fragment to get context for
   */
  getContext(
    accessionNumber: string,
    fragment: SECFilingDocumentFragment
  ): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/${accessionNumber}/contexter`, fragment);
  }
}

