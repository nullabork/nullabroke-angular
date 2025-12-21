import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  AutocompleteResult,
  Filing,
  FilingSearchQuery,
  FilingSearchResponse,
} from '../models/filing.model';

/**
 * Service for interacting with SEC Filing API endpoints.
 */
@Injectable({
  providedIn: 'root',
})
export class FilingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/filing`;

  /**
   * Search filings using a query string (GET method).
   * @param query - The search query (e.g., "form_type = '8-K' order by snowflake desc limit 150")
   * @param save - Whether to save the query (default: false)
   */
  search(query: string, save = false): Observable<Filing[]> {
    let params = new HttpParams().set('query', query);
    if (save) {
      params = params.set('save', 'true');
    }
    return this.http.get<Filing[]>(`${this.baseUrl}/search`, { params });
  }

  /**
   * Search filings using a request body (POST method).
   * Returns the full response including metadata.
   * @param searchQuery - The search query object
   */
  searchPost(searchQuery: FilingSearchQuery): Observable<FilingSearchResponse> {
    return this.http.post<FilingSearchResponse>(`${this.baseUrl}/search`, searchQuery);
  }

  /**
   * Get a specific filing by ID.
   * @param id - The filing ID
   */
  getById(id: number): Observable<Filing[]> {
    return this.http.get<Filing[]>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get autocomplete suggestions for search queries.
   * @param query - The partial query to autocomplete
   */
  autocomplete(query: string): Observable<AutocompleteResult[]> {
    const params = new HttpParams().set('query', query);
    return this.http.get<AutocompleteResult[]>(`${this.baseUrl}/search/autocomplete`, { params });
  }
}

