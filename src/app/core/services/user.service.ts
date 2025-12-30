import { Injectable, inject, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService, User } from '@auth0/auth0-angular';
import { map, filter, distinctUntilChanged } from 'rxjs/operators';

/**
 * User information with persistent GUID
 */
export interface UserInfo {
  /** Persistent unique identifier (Auth0 sub claim) - remains the same across all logins */
  guid: string;
  /** User's email address */
  email: string | null;
  /** Whether the email is verified */
  emailVerified: boolean;
  /** User's display name */
  name: string | null;
  /** User's profile picture URL */
  picture: string | null;
  /** User's nickname */
  nickname: string | null;
  /** Raw Auth0 user object */
  raw: User;
}

/**
 * Service for accessing the authenticated user's information
 * 
 * The GUID (guid property) is the Auth0 `sub` claim which is a persistent
 * unique identifier that remains the same for a user across all logins.
 * 
 * Format examples:
 * - auth0|abc123def456 (Username-Password-Authentication)
 * - google-oauth2|123456789 (Google login)
 * - github|12345678 (GitHub login)
 * 
 * @example
 * ```typescript
 * // In a component
 * private userService = inject(UserService);
 * 
 * // Using signals (reactive)
 * user = this.userService.user;
 * guid = this.userService.guid;
 * isAuthenticated = this.userService.isAuthenticated;
 * 
 * // In template
 * @if (user()) {
 *   <p>Welcome, {{ user()?.name }}</p>
 *   <p>Your ID: {{ guid() }}</p>
 * }
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class UserService {
  private auth = inject(AuthService);

  /** Whether the user is currently authenticated */
  readonly isAuthenticated = toSignal(this.auth.isAuthenticated$, { initialValue: false });

  /** Whether authentication is in progress */
  readonly isLoading = toSignal(this.auth.isLoading$, { initialValue: true });

  /** Raw Auth0 user object */
  private readonly rawUser = toSignal(this.auth.user$, { initialValue: null });

  /**
   * The authenticated user's information with persistent GUID
   * Returns null if not authenticated
   */
  readonly user = computed<UserInfo | null>(() => {
    const raw = this.rawUser();
    if (!raw || !raw.sub) {
      return null;
    }

    return {
      guid: raw.sub, // The 'sub' claim is the persistent unique identifier
      email: raw.email ?? null,
      emailVerified: raw.email_verified ?? false,
      name: raw.name ?? null,
      picture: raw.picture ?? null,
      nickname: raw.nickname ?? null,
      raw,
    };
  });

  /**
   * The user's persistent GUID (Auth0 sub claim)
   * This value remains the same for a user across all logins
   * Returns null if not authenticated
   */
  readonly guid = computed(() => this.user()?.guid ?? null);

  /**
   * The user's email address
   * Returns null if not authenticated or email not available
   */
  readonly email = computed(() => this.user()?.email ?? null);

  /**
   * The user's display name
   * Returns null if not authenticated
   */
  readonly name = computed(() => this.user()?.name ?? null);

  /**
   * Observable stream of the user's GUID
   * Emits only when the GUID changes and filters out null values
   */
  readonly guid$ = this.auth.user$.pipe(
    map((user) => user?.sub ?? null),
    filter((guid): guid is string => guid !== null),
    distinctUntilChanged()
  );

  /**
   * Get the access token for API calls
   */
  getAccessToken() {
    return this.auth.getAccessTokenSilently();
  }

  /**
   * Get the ID token claims
   */
  getIdTokenClaims() {
    return this.auth.idTokenClaims$;
  }
}

