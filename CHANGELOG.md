# Changelog

All notable changes to Simple Gallery will be documented here.

## 1.0.1 - 2026-07-24

- Replaced the mobile-only three-dot menu with a direct photo tap that reveals four compact corner controls.
- Fixed featured photos occasionally leaving too little Masonry space for the expanded caption editor by observing caption size changes and guarding against rounded row measurements.

## 1.0.0 - 2026-07-23

- First public release.
- Renders a `simple-gallery` code block as a responsive photo gallery.
- **Convert selection to gallery** command turns existing images already in a note — bulleted or not, selected or not — into a gallery block. **Insert empty gallery block** command starts one from scratch.
- Accepts image embeds (`![[file.jpg]]`, with or without an alias), bare filenames/relative paths, or a standard Markdown image link (including a remote URL), one per line.
- Optional per-image captions via an indented `caption:` line.
- Optional `section:` groupings with their own optional `note:` blurb, plus an optional intro `note:` for the whole gallery — all fully opt-in; a plain list of images with none of these works exactly as before.
- Default **Masonry** layout sizes each thumbnail from its own photo's natural proportions; an optional **Grid** layout gives uniform, cropped tiles instead.
- Broken or unresolved image references render an inline placeholder instead of failing the whole block.
- Settings for minimum thumbnail size, gap, layout, whether captions are shown, caption font (default or typewriter/monospace), caption length (full or truncated to a single line), and caption alignment — each overridable per gallery via optional `layout:`/`min-size:`/`gap:`/`captions:`/`caption-font:`/`caption-lines:`/`caption-align:` fields.
- Click and drag a thumbnail to reorder it within its section; the code block is rewritten to match. Hover a photo to reveal "+ section above"/"+ section below" buttons that split its section in two.
- Click a caption or a section name directly in the rendered gallery to edit it in place. A photo without a caption reveals a "+ add caption" placeholder on hover rather than showing all the time.
- All editing affordances (reordering, click-to-edit, add-section buttons, the empty-caption placeholder) only appear in Live Preview — Reading Mode is pure presentation, with no caption unless a photo actually has one.
- A gear button on hover opens a settings modal scoped to just that gallery, with the same controls as the Settings tab; a control left matching the global default doesn't get written as an override.
- Public CSS custom properties for corner radius, hover effect, colors, and more.
- Local-first operation with no telemetry or network requests.
- Fixed: Obsidian can initialize a block before attaching it to the final view tree. Mode-specific setup now waits until the next animation frame: Live Preview receives all editing affordances, while Reading Mode removes every control and never wires dragging or click-to-edit, leaving image taps available to lightbox and fullscreen-image plugins.
- Fixed: the "Add a caption" hover reveal now expands downward beneath the photo in the same row a real caption occupies. Masonry follows the short transition and updates the item's row span while it opens and closes.
- Fixed: toggling Show captions, Caption font, or Caption length while a gallery was already open could leave stale (too-short or gapped) masonry row-spans, since the grid's own size didn't change and its `ResizeObserver` had nothing to react to. Every open gallery now explicitly re-measures whenever a setting changes.
- Mark any number of photos as featured (bigger, roughly 2×2 cells that the rest of the section flows around) via an indented `featured: true` line or each photo's independent ★ button. The larger cells show in Reading Mode too, since sizing is part of presentation rather than an editing affordance.
- Every per-item control remains available on desktop hover. On mobile only, a ⋯ icon opens a labeled 2×2 action panel so touch users can add section boundaries, toggle larger sizing, and open that photo's caption settings without hover.
- Fixed overlapping photo controls: section and feature actions now appear without a group backdrop in the photo's lower-left corner, while the photo menu remains at upper-right. A dedicated photo wrapper keeps all overlays off existing captions. The gallery settings control occupies its own toolbar row so it and Obsidian's edit-block button do not cover the first image.
- Sections can now be removed without deleting their photos; the photos merge into the neighboring section in their existing order.
- Per-gallery settings preview live as each modal control changes. Save persists the preview, while Cancel or closing the modal restores the gallery's prior appearance.
- Dragging within a section still reorders photos; dragging onto a photo in another section now swaps the two photos between their sections.
- A note opened with its restored Live Preview cursor inside a `simple-gallery` fence now releases that initial cursor from the block, allowing the gallery to render immediately instead of waiting for a click elsewhere.
- Caption alignment is now configurable globally or per gallery: center (the default), left, right, or justified. The gallery settings modal also includes **Reset to defaults**, which previews the global defaults and removes the gallery's overrides when saved.
- Photo actions now occupy distinct positions over the photo: add-section-above at top-center, add-section-below at bottom-center, feature at bottom-left, and the menu at top-right. The photo menu also intercepts the initial press so Live Preview's draggable block cannot swallow the tap.
- The Minimum thumbnail size sliders now move in 5-pixel increments and show their current value while dragging for finer adjustment.
- Reading Mode and PDF export now have a CSS-level presentation safeguard that always removes gallery settings, per-photo menus, section/feature controls, empty-caption prompts, and transient editing fields—even when Obsidian retains a hidden Live Preview tree or uses a separate export renderer.
- Section names may now be deleted completely. A bare `section:` remains a real grouping boundary with a transparent, editable header row, so the following photos still start in their own section.
- Fixed the per-photo ⋯ menu's visual reveal by applying its open state directly to the controls panel instead of relying only on an ancestor state selector.
- Added per-photo caption font, full/single-line length, and alignment overrides through an **Aa** modal and optional indented `caption-font:`, `caption-lines:`, and `caption-align:` fields.
- The gallery settings button is now contextual: hidden at rest and visible only while its gallery is hovered, focused, or selected.
- Added a confirmation-protected **Remove gallery** toolbar action. It removes the gallery block from the note while leaving every referenced image file untouched.
