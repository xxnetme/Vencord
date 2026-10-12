# NormalizeQuotes

Automatically converts curly "smart quotes", typographical dashes, and non-breaking spaces to standard ASCII characters.

Useful for fixing commands and code snippets broken by mobile or macOS auto-correct (e.g. `“foo”` -> `"foo"`, `—m` -> `--m`).

## Features
- **Configurable Scope:** Normalize quotes everywhere in sent messages, or strictly inside codeblocks and inline code.
- **Quotes Normalization:** Converts `“ ” „ « »` to `"` and `‘ ’ ‚ ‹ ›` to `'`.
- **Dashes Normalization:** Converts em-dash `—` and en-dash `–` to `--` and `-` before command flags.
- **Space Sanitization:** Converts non-breaking spaces (`U+00A0`) into standard spaces.
