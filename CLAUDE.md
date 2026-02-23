# Project Instructions for Claude

## Changelog Policy
After every code change, update the changelog:
- **In-app changelog:** `src/app/components/welcome-modal/changelog.ts` — add a line to the current version's items array
- **Markdown changelog:** `changelog/v{version}.md` — add a matching line
- If the change warrants a new version, bump `APP_VERSION` in `changelog.ts`, create a new `changelog/v{version}.md` file, and add a new entry to the `CHANGELOG` array
- Keep entries concise (one line per change)

## Testing
- Run tests with `npm test` after changes
- When creating or significantly modifying a component/service, add or update tests to maintain coverage
- Test files live alongside their source: `foo.component.spec.ts` next to `foo.component.ts`
- Use Vitest (`describe`, `it`, `expect`, `beforeEach` from 'vitest') with Angular TestBed
- In jsdom, use `getAttribute()` instead of direct properties for non-standard HTML attributes (e.g. `img.getAttribute('loading')` not `img.loading`)

## Project Structure
- Angular 19+ standalone components with lazy-loaded routes
- Tailwind CSS v4 for styling
- Vitest for testing (jsdom environment)
- Routes: `/` (homepage), `/auth`, `/filings`, `/filings/document/:accessionNumber`, `/help`
- Auth: Auth0 with Google/GitHub social logins
- `AppChromeService` controls status bar/modal visibility — page components opt in via signal
