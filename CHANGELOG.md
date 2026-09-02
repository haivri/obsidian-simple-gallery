# Changelog

## 1.6.1 - 2026-09-02

- Clarified that **Caption length** governs the gallery view only; the fullscreen viewer's caption length is Fullscreen Image's own setting, defaulting to the full caption even when the gallery truncates to a single line.

## 1.6.0 - 2026-09-02

- Settings modals now save on close: choosing a setting is the action, and closing the gallery or photo settings modal any way — clicking outside, Escape, or Save — applies what's selected. Only the explicit **Cancel** button reverts. Previously everything but the Save button silently reverted the live preview, which read as selections (caption alignment especially) not persisting.
- **Over the photo is now the default caption placement** — dense, and captioning never moves the grid. Below-the-photo remains one dropdown away, globally or per gallery.

## 1.5.2 - 2026-09-02

- Clicking away from an open caption/title editor no longer flips the gallery into its source code block. The dismissal press itself now stops before reaching the underlying Live Preview editor — CodeMirror places its cursor on mousedown, and a cursor landing inside the gallery's fenced block is what switched it to source.

## 1.5.1 - 2026-09-02

- Pressing Enter in a caption or section-title editor now simply commits it: keystrokes no longer also bubble to the Live Preview editor underneath, which had been reacting to the same Enter with its own cursor and selection behavior.

## 1.5.0 - 2026-09-02

- **Justified is now the default layout** — equal-height photo rows at exact proportions is how photography presents itself. Masonry and Grid remain a dropdown away, globally or per gallery.
- **Show captions** grew from on/off into a four-way choice at every level (global, per-gallery `captions:`, per-photo): **Everywhere** (default), **Gallery only**, **Fullscreen only** — the clean-grid-caption-on-open combination — or **Hidden**. Legacy `captions: true/false` lines and stored settings map to Everywhere/Hidden automatically. Each caption carries a `data-fullscreen-caption` stamp so a fullscreen viewer can honor "Fullscreen only" even though the caption is display-none in the note.
- The gallery toolbar's settings control is now a native Obsidian icon button (a quiet gear that brightens on hover) instead of the old bordered pill.

## 1.4.0 - 2026-09-02

- New **Justified** layout (global setting, or `layout: justified` per gallery): photos pack into equal-height rows at their exact proportions, never cropped — the classic photography-portfolio presentation. Full rows scale to fill the width exactly; the trailing partial row keeps the target height instead of stretching. It pairs best with captions hidden or placed over the photo, since below-photo captions of different heights make any layout's rows ragged.
- Per-photo caption visibility: the photo's **Caption settings…** modal gains a **Show caption** control (inherit / show / hide), written as an indented `captions: true`/`captions: false` line. A per-photo show wins over a gallery or global hide, and vice versa.
- The **Remove gallery** buttons (in the gallery settings modal and its confirmation) are now unambiguously red; previously the confirmation button's call-to-action accent could override the destructive coloring.

## 1.3.0 - 2026-09-02

- The click that dismisses an open caption or section-title editor now does only that: it can no longer fall through to whatever it landed on and, say, open that photo in a fullscreen/lightbox plugin.
- Caption alignment is now the familiar four alignment icon buttons in both the gallery settings and per-photo caption settings modals (in the per-photo modal, clicking the active button again returns to the gallery setting).
- Decluttered the global settings tab: Minimum thumbnail size and Gap between images are no longer global settings — the built-in defaults suit most galleries, and any gallery that needs different values sets them for itself via the gear modal or `min-size:`/`gap:` lines. Previously saved global values continue to apply.
- The hover zoom-and-shadow effect is gone by default: its scale transform reversing on a quick hover-and-away visibly re-centered the photo (most noticeable in Grid layout), and it read as app chrome on what should be quiet photographs. A snippet setting `--simple-gallery-hover-scale: 1.03` brings the zoom back.

## 1.2.0 - 2026-09-02

- New **Caption placement** setting (global, and per-gallery via `caption-placement:` or the gear modal): **Below the photo** (default) keeps each caption in its own row; **Over the photo** lays it on the photo's bottom edge in a translucent strip — denser, and adding or editing a caption never shifts the gallery's layout. Caption editing follows the placement, so an overlaid caption edits in an overlaid input.
- New **Rounded corners** setting (global, and per-gallery via `corners:` or the gear modal), replacing the fixed 10px rounding. The default is now 0 — square-cornered, the way a print or portfolio presents photos — with rounding as a deliberate opt-in.
- Hardened the caption-commit flicker: every item's last measured Masonry row-span is remembered and re-applied inline when a rewritten gallery block re-renders, so committing a caption (or any other edit) no longer lets the whole gallery flash through its fallback sizing for a frame.

## 1.1.0 - 2026-09-02

Interface overhaul: one quiet menu per photo, zero layout motion on hover, predictable ordering.

- Replaced the four-control hover overlay ("+ section above/below", "★", "Aa") with a single "⋯" button per photo opening a native menu: Add/Edit caption, Make photo larger / Use regular size, Caption settings, New section above/below, and the new **Remove photo** (removes just that photo's lines from the block; the image file is kept — works on broken-reference placeholders too).
- The "Add a caption" placeholder is now an overlay strip on the photo's bottom edge instead of an expanding row beneath it, and its editor opens in the same overlaid position — hovering and editing no longer make the gallery jump; the grid reflows exactly once, when a caption is saved.
- Dropped the whole mobile tap-to-reveal state machine: the "⋯" button is simply always present on mobile (the menu opens as a native bottom sheet), and a plain tap on a photo passes through untouched to fullscreen/lightbox plugins.
- Masonry no longer uses dense grid packing, so the visual order always matches the list order — drag-reorder and section splits now happen exactly where they appear to.
- "Remove gallery" moved from a second always-hovering toolbar pill to a confirmed action at the bottom of the per-gallery settings modal, leaving one quiet gear button.
- Fixed Reading Mode scrolling being repeatedly yanked back when passing a gallery. The gallery's height used to settle in waves after render (fallback size, then a collapse while lazy images were still empty, then ballooning as each image loaded), and Reading Mode's re-rendering of sections scrolled back into view replayed those waves on every approach, so scroll anchoring kept throwing the reader back. Now: an image that hasn't loaded is never measured (its placeholder span stands), vault images load eagerly instead of lazily (only remote URLs stay lazy), and each image's natural proportions are remembered for the session so a re-rendered gallery reserves its exact final height before a single image loads.

## 1.0.4 - 2026-09-02

- The Live Preview cursor release that keeps a gallery rendered on note open no longer scrolls the page to just after the gallery block (most visible on mobile, where file-open re-fires on app resume): the editor's scroll position is now pinned across the cursor move.

All notable changes to Simple Gallery will be documented here.

## 1.0.3 - 2026-07-24

- Made a second mobile tap hide the photo controls and pass through to compatible fullscreen/lightbox plugins in Live Preview.

## 1.0.2 - 2026-07-24

- Made the first completed mobile tap reveal photo controls even when Obsidian uses that gesture to select the Live Preview block.
- Made switching between photos close the previous controls immediately and open the newly tapped photo in the same gesture.
- Restored the desktop control arrangement on mobile with larger, properly bounded buttons.
- Increased caption padding and added extra caption-editor clearance beneath featured photos.

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
