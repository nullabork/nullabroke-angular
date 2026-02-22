export const APP_VERSION = '0.1.0';

export interface ChangelogEntry {
  version: string;
  sections: { title: string; items: string[] }[];
}

export const CHANGELOG: ChangelogEntry[] = [
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
