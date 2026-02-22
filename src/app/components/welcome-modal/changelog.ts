export const APP_VERSION = '0.3.0';

export interface ChangelogEntry {
  version: string;
  sections: { title: string; items: string[] }[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '0.3.0',
    sections: [
      {
        title: 'New Features',
        items: [
          'Landing page at / with feature overview, screenshots, and sign-in CTA',
        ],
      },
      {
        title: 'Improvements',
        items: [
          'Moved filings to /filings and documents to /filings/document/:id',
          'Auth "Continue to App" now navigates to /filings',
        ],
      },
    ],
  },
  {
    version: '0.2.3',
    sections: [
      {
        title: 'Bug Fixes',
        items: ['Fixed Presentations blueprint query missing `and` keyword before `form_type` clause'],
      },
    ],
  },
  {
    version: '0.2.2',
    sections: [
      {
        title: 'Bug Fixes',
        items: ['Fixed sidebar divider appearing white instead of grey'],
      },
    ],
  },
  {
    version: '0.2.1',
    sections: [
      {
        title: 'New Features',
        items: ['Changelog button in the status bar to re-open the welcome modal at any time'],
      },
      {
        title: 'Bug Fixes',
        items: ['Fixed changelog modal not dismissing correctly after being shown'],
      },
    ],
  },
  {
    version: '0.2.0',
    sections: [
      {
        title: 'New Features',
        items: [
          'Welcome modal with changelog and tips tabs',
          'Version-aware dismissal (re-shows after updates)',
          'Logo splash panel with animated background',
          'Animated logo plays during search',
          'Dynamic title bar shows selected query name',
          'Help and Issues button group in status bar',
          'Pin/unpin queries with sorted display',
          'Last used timestamps on queries',
          'Queries menu with Reset, Delete All Defaults options',
          'Middle-click queries to open in new tab',
          'Changelog system with versioned entries',
        ],
      },
      {
        title: 'Improvements',
        items: [
          'Sidebar scroll fixed (heading stays, list scrolls)',
          'Blueprint queries detach on edit',
          'Queries sorted: pinned first, then most recently used',
          'Filing descriptions wrap in search results',
        ],
      },
      {
        title: 'Bug Fixes',
        items: [
          'Fixed logout button not showing for social logins',
          'Fixed blueprint queries not persisting',
          'Fixed welcome modal dismiss not persisting',
        ],
      },
    ],
  },
  {
    version: '0.1.0',
    sections: [
      {
        title: 'New Features',
        items: [
          'Query builder with dynamic parameter syntax',
          'Four parameter types: StringInput, NumberInput, FormTypes, Tags',
          'Sidebar with saved queries and auto-save',
          '19 default blueprint queries for common SEC searches',
          'Document viewer with iframe-based rendering',
          'Pin/unpin queries to keep favourites at the top',
          'Middle-click queries to open in a new tab',
          'Help page with query cheat sheet and reference',
        ],
      },
      {
        title: 'Improvements',
        items: [
          'Queries sorted by most recently used',
          'Blueprint queries detach when edited',
          'Restore Defaults brings back deleted blueprints',
          'Filing descriptions shown in search results',
        ],
      },
      {
        title: 'Infrastructure',
        items: [
          'Docker deployment with nginx (Coolify-ready)',
          'GitHub Actions CI with build and test',
          'Auth0 with Google and GitHub login',
        ],
      },
    ],
  },
];
