import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

/**
 * Service for testing authentication against the backend.
 *
 * Use the `test()` method to verify JWT authentication is working.
 * The endpoint will fail unless a valid JWT is passed.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthTestService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  /**
   * Test authentication against the backend.
   * This endpoint requires a valid JWT.
   *
   * Endpoint: api/v1/authentication/test
   *
   * @returns Observable with the test response
   * @throws Error if JWT is invalid or missing
   */
  test(): Observable<unknown> {
    return this.http.get(`${this.baseUrl}/authentication/test`);
  }
}

