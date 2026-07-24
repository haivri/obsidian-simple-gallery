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
9. Test dragging a thumbnail to reorder it within a section (and within a flat, sectionless
   gallery), including a gallery with per-gallery `layout:`/`min-size:`/`gap:`/`captions:`
   overrides — confirm the code block is rewritten correctly and the override lines are
   preserved.
10. Test clicking to edit a caption (both an existing one and the "+ add caption"
    placeholder), clearing a caption to remove it, clicking to rename a section, and
    confirm an empty section name remains a transparent, editable section boundary. Confirm
    Escape cancels without writing anything, and an unchanged value on blur doesn't trigger
    a write.
11. Confirm Reading Mode never shows the "+ add caption" placeholder, the section-insert
    buttons, the gallery toolbar, photo controls, or a draggable cursor on hover — it should be
    indistinguishable from a static image grid. Confirm all of that DOES appear in Live
    Preview.
12. Test hovering a photo to reveal "+ section above"/"+ section below", including at the
    very first and last photo of a section (should still work, producing an empty section
    on the boundary side rather than being disabled).
13. Test caption font, length, and alignment globally, per gallery, and per photo, including
    a caption long enough to wrap or truncate. Confirm each per-photo **Aa** option can return
    to **Use gallery setting** without leaving an override line behind.
14. Test the contextual gallery toolbar: it should hide at rest and appear on hover, focus,
    or selection. Open settings on a gallery with no overrides yet
    (every control should show the current global default), change only one control and
    save (only that field should be written), and change nothing at all and save (no
    override lines should appear). Test Cancel discards changes. Test **Remove gallery** both
    ways: Cancel keeps the block; confirmation removes the block but not any image files.
15. Test the ★ larger-photo toggle on several photos in the same section. Confirm every
    starred photo gets a bigger cell in Masonry and Grid, all remain larger in Reading Mode,
    and the remaining photos reflow without overlap.
16. On mobile, tap a photo and confirm its four compact corner controls appear without
    hover; tapping elsewhere or another photo should close them. Confirm an empty caption
    expands far enough beneath both normal and featured photos without overlapping the next
    row. On desktop, confirm the same controls appear on hover. Confirm all controls are
    stripped in Reading Mode.
17. **Important**: after rebuilding (`npm run build`), Obsidian does not hot-reload the
    plugin automatically — reload the app, or disable/re-enable Simple Gallery under
    Community Plugins, before testing, or you'll be looking at stale behavior.

Keep the plugin simple and local-first. New functionality must not transmit vault content
without explicit user action and clear documentation. Do not include vault content or
`data.json` in commits.

Simple Gallery's code-block syntax is intentionally YAML-inspired rather than strict YAML
(see the README for why). Please keep the parser small and tolerant rather than replacing
it with a general YAML library.
