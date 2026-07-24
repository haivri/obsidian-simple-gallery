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
- Settings for minimum thumbnail size, gap, layout, and whether captions are shown — each overridable per gallery via optional `layout:`/`min-size:`/`gap:`/`captions:` fields.
- Click and drag a thumbnail to reorder it within its section; the code block is rewritten to match.
- Public CSS custom properties for corner radius, hover effect, colors, and more.
- Local-first operation with no telemetry or network requests.
