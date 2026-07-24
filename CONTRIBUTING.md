# Contributing

Bug reports and pull requests are welcome.

Before submitting a change:

1. Run `npm ci`.
2. Run `npm run build`.
3. Run `npm run lint`.
4. Test a `simple-gallery` code block in both Reading view and Live Preview, in both light
   and dark themes.
5. Test a caption, a section with a note, an intro note, a bare filename reference, and a
   reference that can't be resolved (it should render a broken-image placeholder instead
   of failing the block).
6. Test both the Masonry and Grid layout settings, and confirm switching between them
   updates an already-open gallery immediately.
7. If Fullscreen Image is installed, confirm clicking a thumbnail still opens it in the
   lightbox.
8. Test **Convert selection to gallery** on: a bulleted list of image embeds, a bare list
   with no bullets, a selection with non-image content mixed in (should be excluded), and
   with nothing selected (should fall back to the paragraph around the cursor). Test
   **Insert empty gallery block** as well.

Keep the plugin simple and local-first. New functionality must not transmit vault content
without explicit user action and clear documentation. Do not include vault content or
`data.json` in commits.

Simple Gallery's code-block syntax is intentionally YAML-inspired rather than strict YAML
(see the README for why). Please keep the parser small and tolerant rather than replacing
it with a general YAML library.
