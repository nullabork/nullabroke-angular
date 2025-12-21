import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/filings/filing-search.component').then((m) => m.FilingSearchComponent),
  },
  {
    path: 'document/:accessionNumber',
    loadComponent: () =>
      import('./features/document/document-viewer.component').then((m) => m.DocumentViewerComponent),
  },
];
