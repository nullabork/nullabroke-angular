import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { combineLatest } from 'rxjs';
import { map, filter, take } from 'rxjs/operators';

/**
 * Functional auth guard that redirects unauthenticated users to /auth
 * Waits for Auth0 to finish loading before checking authentication status
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return combineLatest([auth.isLoading$, auth.isAuthenticated$]).pipe(
    // Wait until Auth0 has finished loading
    filter(([isLoading]) => !isLoading),
    take(1),
    map(([, isAuthenticated]) => {
      if (isAuthenticated) {
        return true;
      }
      // Redirect to auth page if not authenticated
      return router.createUrlTree(['/auth']);
    })
  );
};

