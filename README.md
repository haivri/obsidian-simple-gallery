# Simple Gallery

Turn a simple list of image embeds into a responsive, portfolio-style photo gallery — no
frontmatter, no per-image HTML, just a short list in a code block. Already dropped some
images into a note? A single command turns them into a gallery on the spot.

Simple Gallery is deliberately small and local-first. It does not modify your notes,
collect telemetry, or make network requests.

## See it in action

<p align="center">
  <img src="assets/simple-gallery-convert-command.png" alt="The Convert selection to gallery command turning a plain list of dropped-in images into a simple-gallery block" width="900">
</p>

### Drop in images, run a command, done

Drag a handful of photos into a note — with or without selecting them, with or without
list bullets — and run **Convert selection to gallery** from the command palette. No
selection at all? It picks up the paragraph of images around your cursor automatically.

<p align="center">
  <img src="assets/simple-gallery-reorder.png" alt="Clicking and dragging a thumbnail to reorder a gallery, with the underlying code block updating to match" width="900">
</p>

### Reorder by dragging

Click and drag a thumbnail to a new spot in the same gallery. The code block's source
updates immediately to match — no manual list-editing needed.

<p align="center">
  <img src="assets/simple-gallery-inline-edit.png" alt="Clicking a caption or section title directly in the rendered gallery to edit it in place" width="900">
</p>

### Click to edit captions and section names

No need to open the code block at all: click any caption (or the "+ add caption"
placeholder on a photo that doesn't have one yet) or a section's name to edit it right
there. Press Enter or click away to save, Escape to cancel.

<p align="center">
  <img src="assets/simple-gallery-masonry.png" alt="Simple Gallery rendering a Brussels sprouts recipe with the default Masonry layout" width="900">
</p>

### An artistic, photographer-style default

Masonry sizes each thumbnail from its own photo's proportions — tall photos get a taller
cell, wide photos a wider one — with no manual tagging required.

<p align="center">
  <img src="assets/simple-gallery-grid.png" alt="The same gallery rendered with the uniform Grid layout" width="900">
</p>

### A clean, uniform alternative

Switch to the **Grid** layout in settings for evenly cropped, uniform tiles instead.

<p align="center">
  <img src="assets/simple-gallery-settings.png" alt="Simple Gallery settings showing the Layout, thumbnail size, gap, and caption controls" width="900">
</p>

## Features

- Renders a `simple-gallery` code block as a responsive, grid-based photo layout.
- A **Convert selection to gallery** command turns existing images already in a note —
  bulleted or not, selected or not — straight into a gallery block. An **Insert empty
  gallery block** command starts one from scratch.
- Reorder photos by clicking and dragging a thumbnail, edit captions or section names by
  clicking them, and feature one photo per section as a bigger visual focus — the note's
  underlying code block updates to match, no manual editing required.
- Every photo's controls are reachable by hover (desktop) or by tapping the small, always-
  visible "⋯" icon in its corner — no feature is hover-only, so everything works on touch
  devices too.
- Accepts standard image embeds (`![[photo.jpg]]`, with or without an alias), bare
  filenames/relative paths, or a standard Markdown image link (`![alt](path)`), including
  a remote URL.
- Optional per-image captions, an optional featured photo per section, optional `section:`
  groupings, and an optional intro blurb — all opt-in; a plain list of images works with
  none of them.
- Default **Masonry** layout sizes each thumbnail from its own photo's natural
  proportions, for an artistic, portfolio-style look. An optional **Grid** layout gives
  clean, uniform tiles instead. Every setting — layout, thumbnail size, gap, captions —
  can also be overridden for a single gallery, right in its code block.
- Broken or unresolved image references degrade gracefully to an inline placeholder.
- A documented set of CSS custom properties for deeper visual customization via snippets.
- Works without external services on desktop and mobile.

## Usage

Add a fenced code block with the language tag `simple-gallery`. List one image per line,
each starting with `- `. Reference images the same way you would embed them anywhere else
in Obsidian — a wikilink embed (`![[photo.jpg]]`, with an alias like Obsidian's own embed
syntax if you like), a bare filename/relative path, or a standard Markdown image link all
work:

    ```simple-gallery
    - ![[brussels-1.jpg]]
    - ![[brussels-2.jpg]]
      caption: Roasting at 425°F
    - ![[brussels-3.jpg]]
    ```

Simple Gallery resolves each reference the same way Obsidian resolves any other embed, so
images anywhere in the vault work without a full path. If a reference can't be resolved,
that one item renders as a small broken-image placeholder instead of failing the whole
block. Or skip typing it out entirely — see **Commands** below.

### Captions

Add an optional caption on the line directly below an item, indented and prefixed with
`caption:`. Captions are entirely optional — leave them off any item you don't want one for.

### Featuring one photo

Mark one photo per section as the visual focus with an indented `featured: true` line —
same shape as `caption:`, and an item can have both:

    ```simple-gallery
    - ![[brussels-1.jpg]]
      caption: Halved and tossed with oil, salt, and pepper
      featured: true
    - ![[brussels-2.jpg]]
    ```

The featured photo gets a bigger cell (roughly 2×2) and everything else in that section
flows around it — masonry or grid alike. At most one per section; marking a second photo
featured un-marks the first. Unlike captions and sections, this is easiest to set with the
★ button described below rather than by hand, since it also handles clearing the previous
one for you.

### Editing directly in the gallery

All of this only appears in **Live Preview**. Reading Mode is pure presentation: no
caption unless a photo actually has one, no buttons, nothing but the gallery itself.

Every photo's controls are reachable two ways: hovering it (nice on desktop), or tapping
the small "⋯" icon in its corner, which stays faintly visible at all times — since touch
devices have no hover state at all, that icon is what makes everything below reachable on
a phone or tablet. Tapping it "pins" that photo's controls open; tapping elsewhere (or
another photo's icon) closes it again.

- **Reorder** — Click and drag any thumbnail to a new position. Dragging is scoped to one
  section (or the whole gallery, if it has no sections) at a time; dragging an item into a
  different section isn't supported.
- **Edit a caption** — A photo's caption area reveals a "+ add caption" placeholder (or the
  existing caption, always visible if it has one); click either to edit in place. Press
  Enter or click elsewhere to save, Escape to cancel. Clearing the text removes the caption.
- **Rename a section** — Click a section's name to edit it the same way. An empty name is
  ignored rather than saved, so you can't accidentally blank one out.
- **Add a section** — A photo's corner reveals small "+ section above" / "+ section below"
  buttons; click one to split its section into two right there, with a "New section" label
  ready to rename. Splitting at the very first or last photo of a section creates an empty
  section on that side rather than being disabled — a rare, harmless edge case.
- **Feature a photo** — The "★" button on a photo marks it as that section's one featured
  image: a bigger cell (roughly 2×2) that the rest of the section's photos flow around,
  masonry or grid alike. Featuring a different photo un-features the previous one — there's
  only ever one per section. Unlike the other controls, the bigger cell itself shows in
  Reading Mode too — it's a visual part of the gallery, not an editing affordance.
- **Gallery settings** — Hover the gallery (or tap the gear icon, which also stays faintly
  visible) to open the same Layout / thumbnail size / gap / captions / caption font /
  caption length controls as the main Settings tab, scoped to just this gallery. A control
  left matching the current global default doesn't get written as an override, so a gallery
  you haven't customized stays clean either way.

Every one of these rewrites just the affected part of the gallery's code block and leaves
everything else — other galleries, the rest of the note — untouched.

### Sections and notes

For a longer gallery, group images under labeled sections, each with its own optional
blurb, plus an optional intro blurb for the whole gallery:

    ```simple-gallery
    note: A weeknight side that turns into the best thing on the plate.

    section: Prep
      note: Don't rush the cut — even pieces roast evenly.
    - ![[brussels-1.jpg]]
      caption: Halved and tossed with oil, salt, and pepper
    - ![[brussels-2.jpg]]

    section: Roasting
      note: High heat and a single layer are non-negotiable.
    - ![[brussels-3.jpg]]
      caption: Cut side down, ready for the oven
    ```

Sections and notes are entirely optional. A block with no `section:` lines at all renders
exactly like the plain list above — one flat gallery, no headings.

### Per-gallery overrides

Every setting in **Settings → Simple Gallery** is really just a default. Any single
gallery can override one or more of them by adding a line before its first `section:` or
image — the rest of the settings, and every other gallery in the vault, are unaffected:

    ```simple-gallery
    layout: grid
    min-size: 220
    gap: 4
    captions: false
    caption-font: monospace
    caption-lines: single
    - ![[brussels-1.jpg]]
    - ![[brussels-2.jpg]]
    ```

- **`layout: masonry` / `layout: grid`** — Overrides the Layout setting for this gallery only.
- **`min-size: <pixels>`** — Overrides Minimum thumbnail size for this gallery only.
- **`gap: <pixels>`** — Overrides Gap between images for this gallery only.
- **`captions: true` / `captions: false`** — Overrides Show captions for this gallery only.
- **`caption-font: default` / `caption-font: monospace`** — Overrides Caption font for this
  gallery only.
- **`caption-lines: full` / `caption-lines: single`** — Overrides Caption length for this
  gallery only.

All six are optional and independent — use just the ones you need. They only take effect
before the first `section:` or image line; anywhere after that, they're ignored like any
other stray text.

> **Note:** this syntax is YAML-inspired, not strict YAML. Real YAML treats a leading `!`
> as a tag indicator and can't parse an unquoted `![[...]]` embed, which would force
> quoting every image link. Simple Gallery instead uses a small, tolerant line parser built
> specifically for this shape: a top-level `- ` line is an image, an indented `caption:`
> line beneath it is that image's caption, a top-level `section:` line starts a labeled
> group, and an indented `note:` line beneath a section (or at the very top of the block)
> is a short blurb. Nothing else in the block is interpreted.

## Commands

- **Convert selection to gallery** — Scans the current selection (or, if nothing is
  selected, the paragraph of text around the cursor) for image references — embed
  wikilinks, bare filenames, or Markdown image links, whether or not they're in a bulleted
  list — and replaces that text with a `simple-gallery` block containing them, one per
  line. Only appears in the command palette when there's actually something to convert.
  Non-image content mixed into the selection (other notes, audio embeds, prose) is left
  out of the resulting gallery automatically.
- **Insert empty gallery block** — Inserts a starter `simple-gallery` block at the cursor
  with a single placeholder image reference pre-selected, so you can immediately type over
  it with a real filename.

## Settings

These are the defaults for every gallery in the vault. Any single gallery can override
any of them — see [Per-gallery overrides](#per-gallery-overrides) above.

- **Layout** — **Masonry** (default) sizes each thumbnail from its own photo's
  proportions, for an artistic, portfolio-style look. **Grid** uses uniform, cropped tiles
  instead. Switching this instantly updates any gallery already open.
- **Minimum thumbnail size** — Smallest width a thumbnail can shrink to before the grid
  wraps to fewer columns.
- **Gap between images** — Spacing between thumbnails.
- **Show captions** — Display captions under images that have one. Turn this off for a
  clean, caption-free grid — useful for print or export — without removing captions from
  the source.
- **Caption font** — Default uses the normal text font. Typewriter uses your configured
  monospace font instead.
- **Caption length** — Full (default) shows the whole caption, wrapping onto multiple
  lines if needed. Single line truncates a long caption with an ellipsis instead.

Finer visual control (corner radius, hover effect, colors) is available through CSS
custom properties rather than additional settings. See
[Customizing the appearance](#customizing-the-appearance) below.

## Customizing the appearance

Themes and CSS snippets can override the plugin's public variables. For example:

```css
body {
  --simple-gallery-radius: 4px;
  --simple-gallery-hover-scale: 1;
  --simple-gallery-background: var(--background-primary);
  --simple-gallery-caption-color: var(--text-faint);
}
```

Because these are ordinary CSS custom properties, users have final control without
editing the plugin files.

## Installation

### Community Plugins

Once accepted, install **Simple Gallery** from **Settings → Community plugins → Browse**.

### Manual installation

Copy `main.js`, `manifest.json`, and `styles.css` from a release into:

```text
<vault>/.obsidian/plugins/simple-gallery/
```

Then reload Obsidian and enable **Simple Gallery** under Community plugins.

## Development

Requires Node.js 20 or newer.

```bash
npm install
npm run dev     # esbuild watch mode
npm run build   # type-check + production build
npm run lint
```

## Release checklist

1. Run `npm run build` and `npm run lint`.
2. Test a gallery in both Reading view and Live Preview, in both layout modes, and in both
   light and dark themes. Test both commands, with and without a selection.
3. Run `npm version patch`, `npm version minor`, or `npm version major`. The version
   script keeps `manifest.json` and `versions.json` in sync.
4. Push the resulting numeric tag (for example `1.0.1`). GitHub Actions builds the plugin
   and attaches `main.js`, `manifest.json`, and `styles.css` to the GitHub Release.

## Contributing

Bug reports and pull requests are welcome. Please keep the plugin focused: it should
remain a simple, dependable gallery renderer that respects local-first Obsidian workflows.
Before opening a pull request, run `npm run build` and `npm run lint`. See
[CONTRIBUTING.md](CONTRIBUTING.md) for the full checklist.

## Privacy

Simple Gallery does not collect telemetry, make network requests, or send vault data
anywhere.

## Support

If **Simple Gallery** improves your workflow, you can support its continued development on
[Buy Me a Coffee](https://www.buymeacoffee.com/robertfleming).

## Acknowledgements

Simple Gallery was directed by Robert Fleming, who set the vision, made every product
call — the gallery syntax, the masonry-by-default look, per-gallery overrides, drag-to-
reorder, click-to-edit, what belongs in Reading Mode versus Live Preview — and tested it
against a real recipe note along the way. The implementation, architecture, and
documentation were written by Claude (Sonnet 5, Anthropic) in close collaboration with
him. Robert wanted this credited plainly, and gladly: this plugin exists because of that
collaboration, and he's grateful for it.

## License

MIT
