Run `git diff HEAD` and `git diff --cached` to see all uncommitted changes (staged and unstaged). Analyze the diffs to understand what was changed, then update the changelog accordingly.

## Where to add entries

There are two files that must stay in sync:

1. **In-app changelog:** `src/app/components/welcome-modal/changelog.ts` — add lines to the current version's `items` array in the appropriate section (`New Features`, `Improvements`, or `Bug Fixes`)
2. **Markdown changelog:** `changelog/v{version}.md` — add matching lines under the same section heading

## When to add to the existing version vs create a new one

- **Add to the current version** when the changes are part of ongoing work for that release — bug fixes, tweaks, new features that haven't been shipped yet. Check `APP_VERSION` in `changelog.ts` to see the current version.
- **Create a new version** only when the user explicitly asks to bump the version, or when changes are being made after a release has already been shipped/tagged. To create a new version:
  1. Bump `APP_VERSION` in `changelog.ts`
  2. Add a new entry at the top of the `CHANGELOG` array
  3. Create a new `changelog/v{version}.md` file

## Entry format

- Keep entries concise — one line per change
- Use action verbs: "Added ...", "Fixed ...", "Improved ...", etc.
- Categorize correctly:
  - **New Features**: entirely new functionality
  - **Improvements**: enhancements to existing features, UI polish, performance
  - **Bug Fixes**: corrections to broken behavior
- Don't duplicate entries that already exist in the changelog
