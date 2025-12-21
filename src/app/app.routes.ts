import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Public route - authentication page
  {
    path: 'auth',
    loadComponent: () =>
      import('./features/auth/auth.component').then((m) => m.AuthComponent),
  },
  // Protected routes - require authentication
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/filings/filing-search.component').then((m) => m.FilingSearchComponent),
  },
  {
    path: 'document/:accessionNumber',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/document/document-viewer.component').then((m) => m.DocumentViewerComponent),
  },
  {
    path: 'kv-test',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/kv-test/kv-test.component').then((m) => m.KvTestComponent),
  },
  // Wildcard redirect to auth for any unknown routes
  {
    path: '**',
    redirectTo: 'auth',
  },
];
