# Changelog

All notable changes to Simple Gallery will be documented here.

## 1.0.0 - 2026-07-23

- First public release.
- Renders a `simple-gallery` code block as a responsive photo gallery.
- **Convert selection to gallery** command turns existing images already in a note — bulleted or not, selected or not — into a gallery block. **Insert empty gallery block** command starts one from scratch.
- Accepts image embeds (`![[file.jpg]]`, with or without an alias), bare filenames/relative paths, or a standard Markdown image link (including a remote URL), one per line.
- Optional per-image captions via an indented `caption:` line.
- Optional `section:` groupings with their own optional `note:` blurb, plus an optional intro `note:` for the whole gallery — all fully opt-in; a plain list of images with none of these works exactly as before.
- Default **Masonry** layout sizes each thumbnail from its own photo's natural proportions; an optional **Grid** layout gives uniform, cropped tiles instead.
- Broken or unresolved image references render an inline placeholder instead of failing the whole block.
- Settings for minimum thumbnail size, gap, layout, whether captions are shown, caption font (default or typewriter/monospace), and caption length (full or truncated to a single line) — each overridable per gallery via optional `layout:`/`min-size:`/`gap:`/`captions:`/`caption-font:`/`caption-lines:` fields.
- Click and drag a thumbnail to reorder it within its section; the code block is rewritten to match. Hover a photo to reveal "+ section above"/"+ section below" buttons that split its section in two.
- Click a caption or a section name directly in the rendered gallery to edit it in place. A photo without a caption reveals a "+ add caption" placeholder on hover rather than showing all the time.
- All editing affordances (reordering, click-to-edit, add-section buttons, the empty-caption placeholder) only appear in Live Preview — Reading Mode is pure presentation, with no caption unless a photo actually has one.
- A gear button on hover opens a settings modal scoped to just that gallery, with the same controls as the Settings tab; a control left matching the global default doesn't get written as an override.
- Public CSS custom properties for corner radius, hover effect, colors, and more.
- Local-first operation with no telemetry or network requests.
- Fixed: Live Preview editing affordances (gear button, section-insert buttons, drag, click-to-edit) failed to appear at all in real usage, because Obsidian can render the block before it's attached under `.markdown-source-view` — checking that at render time gave a false negative. The check now runs in `onload()`, once attachment is guaranteed.
- Fixed: the "+ add caption" hover reveal never actually became visible, because it was measured into the item's masonry row-span *before* the hover state existed, leaving no room for it within the item's own fixed-height, clipped box. It's now an absolutely-positioned overlay that slides up from the bottom edge on hover instead of trying to grow the item's height.
- Fixed: toggling Show captions, Caption font, or Caption length while a gallery was already open could leave stale (too-short or gapped) masonry row-spans, since the grid's own size didn't change and its `ResizeObserver` had nothing to react to. Every open gallery now explicitly re-measures whenever a setting changes.
