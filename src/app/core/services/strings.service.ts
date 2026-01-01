import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Key-Value storage entry
 */
export interface StringEntry {
  key: string;
  value: string;
}

/**
 * Service for strings storage.
 *
 * Endpoints:
 * - GET /strings
 * - GET /strings/{key}
 * - POST /strings/{key}?value={value}
 */
@Injectable({
  providedIn: 'root',
})
export class StringsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  /**
   * Get all strings
   */
  getAll(): Observable<StringEntry[]> {
    return this.http.get<StringEntry[]>(`${this.baseUrl}/strings`);
  }

  /**
   * Get a specific string by key
   * @param key - The key to retrieve
   */
  get(key: string): Observable<string | null> {
    return this.http.get<string | null>(`${this.baseUrl}/strings/${encodeURIComponent(key)}`);
  }

  /**
   * Set a string value
   * @param key - The key to set
   * @param value - The value to store
   */
  set(key: string, value: string): Observable<void> {
    const params = new HttpParams().set('value', value);
    return this.http.post<void>(
      `${this.baseUrl}/strings/${encodeURIComponent(key)}`,
      {},
      { 
        params
      }
    );
  }

  /**
   * Store a JSON object (automatically serializes)
   * @param key - The key to set
   * @param value - The object to store (will be JSON stringified)
   */
  setJson<T>(key: string, value: T): Observable<void> {
    return this.set(key, JSON.stringify(value));
  }

  /**
   * Get a JSON object (automatically deserializes)
   * @param key - The key to retrieve
   * @returns The parsed object or null if not found
   */
  getJson<T>(key: string): Observable<T | null> {
    return this.get(key).pipe(
      map((value) => {
        if (value === null) {
          return null;
        }
        try {
          return JSON.parse(value) as T;
        } catch {
          return null;
        }
      })
    );
  }
}
