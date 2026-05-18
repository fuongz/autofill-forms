# Autofill Forms

Browser extension that inspects the current page, lists detected form fields in the popup, and applies saved values back into the page.

## Structure

```text
src/
  background/
  common/
  content/
  popup/
extension/
  assets/
  dist/
  manifest.json
```

## Development

```bash
bun install
bun run build
```

Load the extension from the `extension/` directory in Chrome after the build finishes.
