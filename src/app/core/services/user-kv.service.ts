import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, switchMap, take } from 'rxjs';

import { environment } from '../../../environments/environment';
import { UserService } from './user.service';

/**
 * Key-Value storage entry
 */
export interface KVEntry {
  key: string;
  value: string;
}

/**
 * Service for user-specific key-value storage.
 * Stores data per user using their Auth0 ID.
 *
 * Endpoint: api/v1/user/{userId}/kv
 *
 * @example
 * ```typescript
 * // Save user preference
 * this.userKvService.set('theme', 'dark').subscribe();
 *
 * // Get user preference
 * this.userKvService.get('theme').subscribe(value => console.log(value));
 *
 * // Get all user data
 * this.userKvService.getAll().subscribe(entries => console.log(entries));
 *
 * // Delete a key
 * this.userKvService.delete('theme').subscribe();
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class UserKvService {
  private readonly http = inject(HttpClient);
  private readonly userService = inject(UserService);
  private readonly baseUrl = environment.apiBaseUrl;

  /**
   * Get the user's KV endpoint URL
   * Uses the Auth0 user ID (sub claim) as the user identifier
   */
  private getUserKvUrl(): Observable<string> {
    return this.userService.guid$.pipe(
      take(1),
      switchMap((guid) => {
        if (!guid) {
          throw new Error('User not authenticated');
        }
        // URL encode the guid since it contains special characters like |
        const encodedGuid = encodeURIComponent(guid);
        return [(`${this.baseUrl}/user/${encodedGuid}/kv`)];
      })
    );
  }

  /**
   * Get all key-value pairs for the current user
   */
  getAll(): Observable<KVEntry[]> {
    return this.getUserKvUrl().pipe(
      switchMap((url) => this.http.get<KVEntry[]>(url))
    );
  }

  /**
   * Get a specific value by key
   * @param key - The key to retrieve
   */
  get(key: string): Observable<string | null> {
    return this.getUserKvUrl().pipe(
      switchMap((url) => this.http.get<string | null>(`${url}/${encodeURIComponent(key)}`))
    );
  }

  /**
   * Set a key-value pair
   * @param key - The key to set
   * @param value - The value to store
   */
  set(key: string, value: string): Observable<void> {
    return this.getUserKvUrl().pipe(
      switchMap((url) =>
        this.http.put<void>(`${url}/${encodeURIComponent(key)}`, { value })
      )
    );
  }

  /**
   * Set a key-value pair (POST method - alternative to PUT)
   * @param key - The key to set
   * @param value - The value to store
   */
  create(key: string, value: string): Observable<void> {
    return this.getUserKvUrl().pipe(
      switchMap((url) =>
        this.http.post<void>(url, { key, value })
      )
    );
  }

  /**
   * Delete a key-value pair
   * @param key - The key to delete
   */
  delete(key: string): Observable<void> {
    return this.getUserKvUrl().pipe(
      switchMap((url) =>
        this.http.delete<void>(`${url}/${encodeURIComponent(key)}`)
      )
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
      switchMap((value) => {
        if (value === null) {
          return [null];
        }
        try {
          return [JSON.parse(value) as T];
        } catch {
          return [null];
        }
      })
    );
  }
}

