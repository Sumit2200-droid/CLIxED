# CLIxED content integrity

- Keep every HTML, CSS, JavaScript, Markdown, and content file encoded as valid UTF-8.
- Preserve existing Unicode punctuation and text during targeted edits. Never use ASCII, ANSI, Windows-1252, lossy replacement, or a fallback that converts unknown characters to `?` or the replacement character.
- Do not rewrite whole pages when a targeted edit is sufficient.
- Never create `[?]` or `[?](...)` links, localhost links, or empty/meaningless link labels. Internal links must use meaningful visible text.
- Before finishing a content change, run `powershell -ExecutionPolicy Bypass -File scripts/check-content-integrity.ps1` and inspect the rendered page at desktop and mobile widths when practical.
- Treat legitimate question marks in prose as valid content; only fix suspicious generated fragments or encoding corruption.
