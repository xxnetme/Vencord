# AutoSuppressEmbeds

Automatically wraps links in `<...>` before sending messages to prevent huge embed cards from cluttering chat.

## Features
- **Filtering Modes:**
  - `All Links`: Suppress all URLs.
  - `Blacklist`: Only suppress specified domains (e.g. `x.com, twitter.com, tiktok.com, reddit.com`).
  - `Whitelist`: Suppress all URLs *except* specified domains (e.g. keep `youtube.com, spotify.com`).
- **Direct Media Passthrough:** Direct links to images/videos (`.png`, `.jpg`, `.gif`, `.mp4`, `.webp`, etc.) stay unsuppressed so they still render preview in chat.
- **Multiple Links Only:** Option to only trigger suppression when 2 or more links are sent in a single message.
- **Chat Bar Button:** Handy toggle button right in the chat bar to quickly pause or resume suppression on the fly.
- **Smart Markdown Handling:** Leaves codeblocks, inline code, already suppressed links (`<...>`), and Markdown hyperlinks (`[text](url)`) untouched.
