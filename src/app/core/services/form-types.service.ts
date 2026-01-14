import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Represents a form type from the SEC filings API.
 */
export interface FormType {
  id?: number;
  /** Form type code (e.g., '10-K', '8-K') */
  code: string;
  /** Form type name */
  name?: string;
  /** Optional description */
  description?: string | null;
  /** XSLT URL if available */
  xsltUrl?: string;
}

/**
 * Common SEC filing form types for fallback.
 */
const FALLBACK_FORM_TYPES: FormType[] = [
  { code: '10-K', description: 'Annual Report' },
  { code: '10-Q', description: 'Quarterly Report' },
  { code: '8-K', description: 'Current Report' },
  { code: '4', description: 'Statement of Changes in Beneficial Ownership' },
  { code: '13F-HR', description: '13F Holdings Report' },
  { code: 'S-1', description: 'Registration Statement' },
  { code: 'DEF 14A', description: 'Proxy Statement' },
  { code: '10-K/A', description: 'Amended Annual Report' },
  { code: '10-Q/A', description: 'Amended Quarterly Report' },
  { code: '8-K/A', description: 'Amended Current Report' },
  { code: '13D', description: 'Beneficial Ownership Report' },
  { code: '13G', description: 'Beneficial Ownership Statement' },
  { code: 'SC 13G', description: 'Schedule 13G' },
  { code: 'SC 13D', description: 'Schedule 13D' },
  { code: '3', description: 'Initial Statement of Beneficial Ownership' },
  { code: '5', description: 'Annual Statement of Beneficial Ownership' },
  { code: '6-K', description: 'Foreign Private Issuer Report' },
  { code: '20-F', description: 'Foreign Private Issuer Annual Report' },
  { code: 'EFFECT', description: 'Notice of Effectiveness' },
  { code: 'NT 10-K', description: 'Notification of Late Filing (10-K)' },
  { code: 'NT 10-Q', description: 'Notification of Late Filing (10-Q)' },
];

/**
 * Service for fetching SEC form types from the API.
 */
@Injectable({
  providedIn: 'root',
})
export class FormTypesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  // Cache the form types request
  private formTypes$: Observable<FormType[]> | null = null;
  
  // Signal for synchronous access after load
  readonly formTypes = signal<FormType[]>(FALLBACK_FORM_TYPES);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  /**
   * Get form types from API or cache.
   * Falls back to static list if API fails.
   */
  getFormTypes(): Observable<FormType[]> {
    if (this.formTypes$) {
      return this.formTypes$;
    }

    this.loading.set(true);
    this.error.set(null);

    this.formTypes$ = this.http.get<FormType[]>(`${this.baseUrl}/formtypes`).pipe(
      tap(types => {
        this.formTypes.set(types);
        this.loading.set(false);
      }),
      catchError(err => {
        console.error('Failed to load form types from API, using fallback:', err);
        this.error.set('Failed to load form types');
        this.loading.set(false);
        this.formTypes.set(FALLBACK_FORM_TYPES);
        return of(FALLBACK_FORM_TYPES);
      }),
      shareReplay(1)
    );

    return this.formTypes$;
  }

  /**
   * Load form types and update signal.
   * Call this on app initialization.
   */
  load(): void {
    this.getFormTypes().subscribe();
  }

  /**
   * Get form type codes as simple string array.
   */
  getFormTypeCodes(): Observable<string[]> {
    return this.getFormTypes().pipe(
      map(types => types.map(t => t.code))
    );
  }

  /**
   * Search/filter form types by query.
   */
  searchFormTypes(query: string): FormType[] {
    if (!query) {
      return this.formTypes();
    }
    const lowerQuery = query.toLowerCase();
    return this.formTypes().filter(type => 
      type.code.toLowerCase().includes(lowerQuery) ||
      type.name?.toLowerCase().includes(lowerQuery) ||
      type.description?.toLowerCase().includes(lowerQuery)
    );
  }
}
