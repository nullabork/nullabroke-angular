# Changelog

Each version gets its own markdown file named `vX.Y.Z.md`.

## Adding a new version

1. Create a new file: `changelog/vX.Y.Z.md`
2. Write the changes using the format below
3. Update `src/app/components/welcome-modal/changelog.ts`:
   - Set `APP_VERSION` to the new version string
   - Update the `CHANGELOG` array with the new entry at the top

## Format

```markdown
# vX.Y.Z

## New Features
- Feature description

## Improvements
- Improvement description

## Bug Fixes
- Fix description
```

Keep entries concise. The changelog content is displayed in the welcome modal that users see after each update.
