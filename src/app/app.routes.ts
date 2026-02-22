import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Public route - authentication page
  {
    path: 'auth',
    loadComponent: () =>
      import('./features/auth/auth.component').then((m) => m.AuthComponent),
  },
  // Public route - home/landing page
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  // Protected routes - require authentication
  {
    path: 'filings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/filings/filing-search.component').then((m) => m.FilingSearchComponent),
  },
  {
    path: 'filings/document/:accessionNumber',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/document/document-viewer.component').then((m) => m.DocumentViewerComponent),
  },
  {
    path: 'help',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/help/help.component').then((m) => m.HelpComponent),
  },
  {
    path: 'strings-test',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/strings-test/strings-test.component').then((m) => m.StringsTestComponent),
  },
  {
    path: 'claims-test',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/claims-test/claims-test.component').then((m) => m.ClaimsTestComponent),
  },
  // Wildcard redirect to auth for any unknown routes
  {
    path: '**',
    redirectTo: 'auth',
  },
];
