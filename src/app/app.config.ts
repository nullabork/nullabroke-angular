import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAuth0, authHttpInterceptorFn } from '@auth0/auth0-angular';

import { routes } from './app.routes';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // HTTP client with Auth0 JWT interceptor - automatically adds Authorization header
    provideHttpClient(withInterceptors([authHttpInterceptorFn])),
    provideAuth0({
      domain: environment.auth0.domain,
      clientId: environment.auth0.clientId,
      authorizationParams: {
        redirect_uri: typeof window !== 'undefined' ? window.location.origin : '',
        // Request access token for the API
        audience: environment.auth0.audience,
      },
      // Configure which API requests should include the JWT
      httpInterceptor: {
        allowedList: [
          // All requests to the API will include the JWT
          `${environment.apiBaseUrl}/*`,
        ],
      },
    }),
  ],
};
