import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Represents a tag for categorizing SEC filings.
 */
export interface Tag {
  /** Tag name/value */
  name: string;
  /** Optional description */
  description?: string;
}

/**
 * Static fallback tags until API endpoint is available.
 */
const FALLBACK_TAGS: Tag[] = [
  { name: 'Presentation', description: 'Presentation materials' },
  { name: 'Generic', description: 'Generic filing' },
  { name: 'Financial Statements', description: 'Financial statement documents' },
  { name: 'Exhibit', description: 'Exhibit attachments' },
  { name: 'Management Discussion', description: 'MD&A sections' },
  { name: 'Risk Factors', description: 'Risk factor disclosures' },
  { name: 'Executive Compensation', description: 'Compensation information' },
  { name: 'Legal Proceedings', description: 'Legal matter disclosures' },
];

/**
 * Service for fetching filing tags from the API.
 */
@Injectable({
  providedIn: 'root',
})
export class TagsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  // Cache the tags request
  private tags$: Observable<Tag[]> | null = null;
  
  // Signal for synchronous access after load
  readonly tags = signal<Tag[]>(FALLBACK_TAGS);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  /**
   * Get tags from API or cache.
   * Falls back to static list if API fails or endpoint not available.
   */
  getTags(): Observable<Tag[]> {
    if (this.tags$) {
      return this.tags$;
    }

    this.loading.set(true);
    this.error.set(null);

    this.tags$ = this.http.get<string[]>(`${this.baseUrl}/tags`).pipe(
      map(tagNames => tagNames.map(name => ({ name }))),
      tap(tags => {
        this.tags.set(tags);
        this.loading.set(false);
      }),
      catchError(err => {
        console.error('Failed to load tags from API, using fallback:', err);
        this.error.set('Failed to load tags');
        this.loading.set(false);
        // Use fallback tags
        this.tags.set(FALLBACK_TAGS);
        return of(FALLBACK_TAGS);
      }),
      shareReplay(1)
    );

    return this.tags$;
  }

  /**
   * Load tags and update signal.
   * Call this on app initialization.
   */
  load(): void {
    this.getTags().subscribe();
  }

  /**
   * Get tag names as simple string array.
   */
  getTagNames(): Observable<string[]> {
    return this.getTags().pipe(
      map(tags => tags.map(t => t.name))
    );
  }

  /**
   * Search/filter tags by query.
   */
  searchTags(query: string): Tag[] {
    if (!query) {
      return this.tags();
    }
    const lowerQuery = query.toLowerCase();
    return this.tags().filter(tag => 
      tag.name.toLowerCase().includes(lowerQuery) ||
      tag.description?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Check if a tag name is valid.
   */
  isValidTag(tagName: string): boolean {
    return this.tags().some(t => t.name === tagName);
  }
}
