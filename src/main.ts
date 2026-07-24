import {
  App,
  Editor,
  EditorPosition,
  MarkdownPostProcessorContext,
  MarkdownRenderChild,
  Modal,
  Plugin,
  PluginSettingTab,
  Setting,
  SettingDefinitionItem,
  TFile
} from 'obsidian';

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

type GalleryLayout = 'masonry' | 'grid';
type CaptionFont = 'default' | 'monospace';
type CaptionLines = 'full' | 'single';

interface SimpleGallerySettings {
  minThumbnailSize: number;
  gapSize: number;
  showCaptions: boolean;
  layout: GalleryLayout;
  captionFont: CaptionFont;
  captionLines: CaptionLines;
}

const DEFAULT_SETTINGS: SimpleGallerySettings = {
  minThumbnailSize: 160,
  gapSize: 8,
  showCaptions: true,
  layout: 'masonry',
  captionFont: 'default',
  captionLines: 'full'
};

// ---------------------------------------------------------------------------
// Parsing: a small tolerant line-scanner, deliberately not a YAML parser.
//
// Real YAML treats a leading "!" as a tag indicator, so an unquoted
// "![[photo.jpg]]" embed can't round-trip through a YAML library without
// quoting every line. Four line shapes are recognized instead; anything else
// is ignored rather than treated as an error.
// ---------------------------------------------------------------------------

export interface GalleryItem {
  /** Original reference text, used verbatim in broken-image messages. */
  raw: string;
  /** Bracket-stripped linkpath to resolve. */
  linkpath: string;
  caption?: string;
}

export interface GallerySection {
  /** Undefined for the implicit section created when no "section:" line was used. */
  label?: string;
  note?: string;
  items: GalleryItem[];
}

export interface GalleryBlock {
  intro?: string;
  /** Per-gallery overrides of the global settings; undefined fields defer to the setting. */
  layout?: GalleryLayout;
  minThumbnailSize?: number;
  gapSize?: number;
  showCaptions?: boolean;
  captionFont?: CaptionFont;
  captionLines?: CaptionLines;
  sections: GallerySection[];
}

const ITEM_LINE = /^-\s+(.+?)\s*$/;
const SECTION_LINE = /^section:\s*(.*)$/i;
const CAPTION_LINE = /^caption:\s*(.*)$/i;
const NOTE_LINE = /^note:\s*(.*)$/i;
const LAYOUT_LINE = /^layout:\s*(masonry|grid)\s*$/i;
const MIN_SIZE_LINE = /^min-size:\s*(\d+)\s*$/i;
const GAP_LINE = /^gap:\s*(\d+)\s*$/i;
const CAPTION_FONT_LINE = /^caption-font:\s*(default|monospace)\s*$/i;
const CAPTION_LINES_LINE = /^caption-lines:\s*(full|single)\s*$/i;
const CAPTIONS_LINE = /^captions:\s*(true|false)\s*$/i;
const EMBED_LINK = /^!?\[\[([^\]|]+)(?:\|[^\]]*)?\]\]$/;

function stripEmbedBrackets(reference: string): string {
  const match = EMBED_LINK.exec(reference);
  return match ? match[1].trim() : reference;
}

export function parseGalleryBlock(source: string): GalleryBlock {
  const block: GalleryBlock = { sections: [] };
  let currentSection: GallerySection | null = null;
  let lastKind: 'none' | 'section' | 'item' = 'none';
  let sawAnyContent = false;

  const ensureImplicitSection = (): GallerySection => {
    if (!currentSection) {
      currentSection = { items: [] };
      block.sections.push(currentSection);
    }
    return currentSection;
  };

  for (const rawLine of source.split(/\r?\n/)) {
    if (!rawLine.trim()) continue;

    const indented = /^\s/.test(rawLine);
    const trimmed = rawLine.trim();

    if (!indented) {
      const itemMatch = ITEM_LINE.exec(rawLine);
      if (itemMatch) {
        const raw = itemMatch[1];
        const section = ensureImplicitSection();
        section.items.push({ raw, linkpath: stripEmbedBrackets(raw) });
        lastKind = 'item';
        sawAnyContent = true;
        continue;
      }

      const sectionMatch = SECTION_LINE.exec(trimmed);
      if (sectionMatch) {
        currentSection = { label: sectionMatch[1].trim(), items: [] };
        block.sections.push(currentSection);
        lastKind = 'section';
        sawAnyContent = true;
        continue;
      }

      // Preamble-only fields: recognized only before the first section/item line.
      if (!sawAnyContent) {
        const layoutMatch = LAYOUT_LINE.exec(trimmed);
        if (layoutMatch && block.layout === undefined) {
          block.layout = layoutMatch[1].toLowerCase() as GalleryLayout;
          continue;
        }

        const minSizeMatch = MIN_SIZE_LINE.exec(trimmed);
        if (minSizeMatch && block.minThumbnailSize === undefined) {
          block.minThumbnailSize = Number(minSizeMatch[1]);
          continue;
        }

        const gapMatch = GAP_LINE.exec(trimmed);
        if (gapMatch && block.gapSize === undefined) {
          block.gapSize = Number(gapMatch[1]);
          continue;
        }

        const captionsMatch = CAPTIONS_LINE.exec(trimmed);
        if (captionsMatch && block.showCaptions === undefined) {
          block.showCaptions = captionsMatch[1].toLowerCase() === 'true';
          continue;
        }

        const captionFontMatch = CAPTION_FONT_LINE.exec(trimmed);
        if (captionFontMatch && block.captionFont === undefined) {
          block.captionFont = captionFontMatch[1].toLowerCase() as CaptionFont;
          continue;
        }

        const captionLinesMatch = CAPTION_LINES_LINE.exec(trimmed);
        if (captionLinesMatch && block.captionLines === undefined) {
          block.captionLines = captionLinesMatch[1].toLowerCase() as CaptionLines;
          continue;
        }

        const introMatch = NOTE_LINE.exec(trimmed);
        if (introMatch && block.intro === undefined) {
          block.intro = introMatch[1].trim();
          continue;
        }
      }

      // Stray top-level text (including a misplaced "caption:"/"note:"): ignored.
      continue;
    }

    if (lastKind === 'item') {
      const captionMatch = CAPTION_LINE.exec(trimmed);
      if (captionMatch) {
        const items = ensureImplicitSection().items;
        const item = items[items.length - 1];
        if (item && item.caption === undefined) {
          item.caption = captionMatch[1].trim();
        }
      }
      continue;
    }

    if (lastKind === 'section' && currentSection) {
      const noteMatch = NOTE_LINE.exec(trimmed);
      if (noteMatch && currentSection.note === undefined) {
        currentSection.note = noteMatch[1].trim();
      }
      continue;
    }
    // Indented line with no open item/section context: ignored.
  }

  if (block.sections.length === 0) {
    block.sections.push({ items: [] });
  }

  return block;
}

function basename(linkpath: string): string {
  const parts = linkpath.split('/');
  return parts[parts.length - 1];
}

/**
 * The inverse of parseGalleryBlock: turns a (possibly edited, e.g.
 * reordered) GalleryBlock back into the full source text of a
 * simple-gallery code block, fences included, ready to replace the
 * original block's lines in the file verbatim.
 */
export function serializeGalleryBlock(block: GalleryBlock): string {
  const preamble: string[] = [];
  if (block.intro) preamble.push(`note: ${block.intro}`);
  if (block.layout !== undefined) preamble.push(`layout: ${block.layout}`);
  if (block.minThumbnailSize !== undefined) preamble.push(`min-size: ${block.minThumbnailSize}`);
  if (block.gapSize !== undefined) preamble.push(`gap: ${block.gapSize}`);
  if (block.showCaptions !== undefined) preamble.push(`captions: ${block.showCaptions}`);
  if (block.captionFont !== undefined) preamble.push(`caption-font: ${block.captionFont}`);
  if (block.captionLines !== undefined) preamble.push(`caption-lines: ${block.captionLines}`);

  const body: string[] = [];
  for (const section of block.sections) {
    if (section.label !== undefined) {
      if (body.length > 0) body.push('');
      body.push(`section: ${section.label}`);
      if (section.note) body.push(`  note: ${section.note}`);
    }
    for (const item of section.items) {
      body.push(`- ${item.raw}`);
      if (item.caption) body.push(`  caption: ${item.caption}`);
    }
  }

  const lines = preamble.length > 0 && body.length > 0 ? [...preamble, '', ...body] : [...preamble, ...body];
  return ['```simple-gallery', ...lines, '```'].join('\n');
}

// ---------------------------------------------------------------------------
// Resolution: the same mechanism Obsidian uses internally for embeds, plus a
// passthrough for remote images (from a pasted Markdown image link).
// ---------------------------------------------------------------------------

const REMOTE_URL = /^https?:\/\//i;

function resolveGalleryImageSrc(app: App, linkpath: string, sourcePath: string): string | null {
  if (REMOTE_URL.test(linkpath)) return linkpath;
  const file = app.metadataCache.getFirstLinkpathDest(linkpath, sourcePath);
  if (!file) return null;
  return app.vault.getResourcePath(file);
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

/**
 * Applies this gallery's own layout/min-size/gap/captions fields, if any, on
 * top of the global settings. Numeric overrides are plain CSS custom
 * properties set directly on the block's root element, which naturally win
 * over the inherited value from <body> -- no extra CSS rules needed. Layout
 * and captions are boolean-ish choices instead, so they're applied as
 * higher-specificity classes that explicitly override the body-level class
 * in either direction.
 */
function applyBlockOverrides(el: HTMLElement, block: GalleryBlock): void {
  if (block.layout === 'grid') el.addClass('simple-gallery-force-grid');
  else if (block.layout === 'masonry') el.addClass('simple-gallery-force-masonry');

  if (block.showCaptions === false) el.addClass('simple-gallery-force-hide-captions');
  else if (block.showCaptions === true) el.addClass('simple-gallery-force-show-captions');

  if (block.captionFont === 'monospace') el.addClass('simple-gallery-force-caption-font-mono');
  else if (block.captionFont === 'default') el.addClass('simple-gallery-force-caption-font-default');

  if (block.captionLines === 'single') el.addClass('simple-gallery-force-caption-lines-single');
  else if (block.captionLines === 'full') el.addClass('simple-gallery-force-caption-lines-full');

  if (block.minThumbnailSize !== undefined) {
    el.style.setProperty('--simple-gallery-min-size', `${block.minThumbnailSize}px`);
  }
  if (block.gapSize !== undefined) {
    el.style.setProperty('--simple-gallery-gap', `${block.gapSize}px`);
  }
}

/**
 * Always renders the full interactive markup (editable class, gear button,
 * empty-caption placeholders, section-insert buttons) -- there is no
 * reliable way to know here whether this is Live Preview or Reading Mode:
 * Obsidian can build this widget before it's attached under
 * .markdown-source-view/.markdown-reading-view, so checking el.closest()
 * at this point produced false negatives in practice. GalleryRenderChild's
 * onload() runs after attachment (proven by the masonry sizing, which
 * depends on layout being complete) and strips this markup back out there
 * if it turns out to be Reading Mode -- invisibly, since every element it
 * adds defaults to opacity/max-height 0 until hovered.
 */
function renderGalleryBlock(app: App, block: GalleryBlock, el: HTMLElement, sourcePath: string): void {
  el.addClass('simple-gallery-root', 'simple-gallery-editable');
  const settingsButton = el.createEl('button', { cls: 'simple-gallery-settings-button', text: '⚙' });
  settingsButton.type = 'button';
  settingsButton.setAttribute('aria-label', 'Gallery settings');

  applyBlockOverrides(el, block);

  if (block.intro) {
    el.createEl('p', { cls: 'simple-gallery-note simple-gallery-intro', text: block.intro });
  }

  const isFlat = block.sections.length === 1 && !block.sections[0].label && !block.sections[0].note;

  block.sections.forEach((section, sectionIndex) => {
    const parent = isFlat ? el : el.createDiv({ cls: 'simple-gallery-section' });

    if (!isFlat) {
      parent.dataset.sectionIndex = String(sectionIndex);
      if (section.label) {
        const title = parent.createEl('h4', { cls: 'simple-gallery-section-title', text: section.label });
        title.dataset.sectionIndex = String(sectionIndex);
      }
      if (section.note) {
        parent.createEl('p', { cls: 'simple-gallery-note', text: section.note });
      }
    }

    const grid = parent.createDiv({ cls: 'simple-gallery-grid' });
    grid.dataset.sectionIndex = String(sectionIndex);
    for (const item of section.items) {
      renderGalleryItem(app, grid, item, sourcePath);
    }
  });
}

function renderGalleryItem(app: App, grid: HTMLElement, item: GalleryItem, sourcePath: string): void {
  const src = resolveGalleryImageSrc(app, item.linkpath, sourcePath);
  if (!src) {
    renderBrokenItem(grid, item);
    return;
  }

  const figure = grid.createEl('figure', { cls: 'simple-gallery-item' });
  const img = figure.createEl('img', { cls: 'simple-gallery-img' });
  img.src = src;
  img.loading = 'lazy';
  img.alt = item.caption?.trim() || basename(item.linkpath);

  if (item.caption) {
    figure.createEl('figcaption', { cls: 'simple-gallery-caption', text: item.caption });
  } else {
    const caption = figure.createEl('figcaption', { cls: 'simple-gallery-caption simple-gallery-caption-empty' });
    caption.setText('+ add caption');
  }

  renderSectionInsertButtons(figure);
}

/**
 * Small "add a section boundary here" buttons, revealed on hover over an
 * item -- the visual counterpart to hand-typing a "section:" line.
 */
function renderSectionInsertButtons(item: HTMLElement): void {
  const above = item.createEl('button', {
    cls: 'simple-gallery-section-insert simple-gallery-section-insert-above',
    text: '+ section above'
  });
  above.type = 'button';
  above.draggable = false;

  const below = item.createEl('button', {
    cls: 'simple-gallery-section-insert simple-gallery-section-insert-below',
    text: '+ section below'
  });
  below.type = 'button';
  below.draggable = false;
}

function renderBrokenItem(grid: HTMLElement, item: GalleryItem): void {
  const broken = grid.createDiv({ cls: 'simple-gallery-item simple-gallery-broken' });
  broken.createSpan({ cls: 'simple-gallery-broken-icon', text: '⚠' });
  broken.createSpan({ cls: 'simple-gallery-broken-text', text: `Image not found: ${item.raw}` });
  renderSectionInsertButtons(broken);
}

// ---------------------------------------------------------------------------
// Command support: turn existing image references already sitting in a note
// (dropped-in image embeds, with or without list bullets, or a standard
// Markdown image link) into a simple-gallery block.
// ---------------------------------------------------------------------------

const IMAGE_EXTENSIONS = new Set(['avif', 'bmp', 'gif', 'jpeg', 'jpg', 'png', 'svg', 'webp']);

function hasImageExtension(linkpath: string): boolean {
  const dot = linkpath.lastIndexOf('.');
  if (dot === -1) return false;
  return IMAGE_EXTENSIONS.has(linkpath.slice(dot + 1).toLowerCase());
}

// Matches an embed wikilink (kept only if its extension looks like an image,
// since ![[...]] can embed any file type) or a standard Markdown image link
// (kept unconditionally, since ![]() is by definition always an image).
const REFERENCE_PATTERN = /!\[\[([^\]|]+)(?:\|[^\]]*)?\]\]|!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

/** Extracts image references from arbitrary note text, normalized to `![[linkpath]]` form. */
export function extractImageReferences(text: string): string[] {
  const results: string[] = [];
  REFERENCE_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = REFERENCE_PATTERN.exec(text))) {
    const wikilinkPath = match[1];
    if (wikilinkPath !== undefined) {
      const linkpath = wikilinkPath.trim();
      if (hasImageExtension(linkpath)) results.push(`![[${linkpath}]]`);
      continue;
    }

    const markdownPath = match[2];
    if (markdownPath !== undefined) {
      let linkpath = markdownPath.trim();
      try {
        linkpath = decodeURIComponent(linkpath);
      } catch {
        // Wasn't validly percent-encoded; use it as written.
      }
      results.push(`![[${linkpath}]]`);
    }
  }
  return results;
}

export function buildGalleryBlockText(references: string[]): string {
  return ['```simple-gallery', ...references.map((ref) => `- ${ref}`), '```'].join('\n');
}

/**
 * A user's selection, if there is one; otherwise the contiguous non-blank
 * paragraph around the cursor. This lets the command work on a deliberate
 * selection or, just as often, on a block of dropped-in images the user
 * never bothered to select at all.
 */
function getGallerySourceRange(editor: Editor): { from: EditorPosition; to: EditorPosition } {
  const selection = editor.listSelections()[0];
  const hasSelection = selection
    && (selection.anchor.line !== selection.head.line || selection.anchor.ch !== selection.head.ch);
  if (hasSelection) {
    const [a, b] = [selection.anchor, selection.head];
    const aFirst = a.line < b.line || (a.line === b.line && a.ch <= b.ch);
    return aFirst ? { from: a, to: b } : { from: b, to: a };
  }

  const cursorLine = editor.getCursor().line;
  const lastLine = editor.lastLine();
  let start = cursorLine;
  while (start > 0 && editor.getLine(start - 1).trim() !== '') start--;
  let end = cursorLine;
  while (end < lastLine && editor.getLine(end + 1).trim() !== '') end++;
  return { from: { line: start, ch: 0 }, to: { line: end, ch: editor.getLine(end).length } };
}

const GALLERY_TEMPLATE_ITEM = '![[image.jpg]]';
const GALLERY_TEMPLATE_ITEM_PREFIX = '- ';

// ---------------------------------------------------------------------------
// Per-gallery settings modal, opened from the gear button in Live Preview.
// ---------------------------------------------------------------------------

interface GalleryOverrides {
  layout?: GalleryLayout;
  minThumbnailSize?: number;
  gapSize?: number;
  showCaptions?: boolean;
  captionFont?: CaptionFont;
  captionLines?: CaptionLines;
}

/**
 * Lets a single gallery's settings be edited visually instead of by hand-
 * typing preamble fields. Every control starts at this gallery's current
 * effective value (its own override, or else the live global default).
 * Saving only writes fields that end up differing from the current global
 * default -- pick a value that matches "normal" and no override line is
 * added at all, keeping the block clean.
 */
class GallerySettingsModal extends Modal {
  private layout: GalleryLayout;
  private minThumbnailSize: number;
  private gapSize: number;
  private showCaptions: boolean;
  private captionFont: CaptionFont;
  private captionLines: CaptionLines;

  constructor(
    app: App,
    private readonly defaults: SimpleGallerySettings,
    block: GalleryBlock,
    private readonly onSave: (overrides: GalleryOverrides) => void
  ) {
    super(app);
    this.layout = block.layout ?? defaults.layout;
    this.minThumbnailSize = block.minThumbnailSize ?? defaults.minThumbnailSize;
    this.gapSize = block.gapSize ?? defaults.gapSize;
    this.showCaptions = block.showCaptions ?? defaults.showCaptions;
    this.captionFont = block.captionFont ?? defaults.captionFont;
    this.captionLines = block.captionLines ?? defaults.captionLines;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl('h2', { text: 'Gallery settings' });
    contentEl.createEl('p', {
      cls: 'setting-item-description',
      text: 'Only applies to this gallery. A control left matching the current global default won’t add an override.'
    });

    new Setting(contentEl)
      .setName('Layout')
      .addDropdown((dropdown) => dropdown
        .addOption('masonry', 'Masonry (artistic)')
        .addOption('grid', 'Grid (uniform)')
        .setValue(this.layout)
        .onChange((value) => {
          this.layout = value === 'grid' ? 'grid' : 'masonry';
        }));

    new Setting(contentEl)
      .setName('Minimum thumbnail size')
      .addSlider((slider) => slider
        .setLimits(80, 400, 10)
        .setValue(this.minThumbnailSize)
        .onChange((value) => {
          this.minThumbnailSize = value;
        }));

    new Setting(contentEl)
      .setName('Gap between images')
      .addSlider((slider) => slider
        .setLimits(0, 32, 2)
        .setValue(this.gapSize)
        .onChange((value) => {
          this.gapSize = value;
        }));

    new Setting(contentEl)
      .setName('Show captions')
      .addToggle((toggle) => toggle
        .setValue(this.showCaptions)
        .onChange((value) => {
          this.showCaptions = value;
        }));

    new Setting(contentEl)
      .setName('Caption font')
      .addDropdown((dropdown) => dropdown
        .addOption('default', 'Default')
        .addOption('monospace', 'Typewriter (monospace)')
        .setValue(this.captionFont)
        .onChange((value) => {
          this.captionFont = value === 'monospace' ? 'monospace' : 'default';
        }));

    new Setting(contentEl)
      .setName('Caption length')
      .addDropdown((dropdown) => dropdown
        .addOption('full', 'Full')
        .addOption('single', 'Single line')
        .setValue(this.captionLines)
        .onChange((value) => {
          this.captionLines = value === 'single' ? 'single' : 'full';
        }));

    new Setting(contentEl)
      .addButton((button) => button
        .setButtonText('Save')
        .setCta()
        .onClick(() => {
          this.onSave({
            layout: this.layout === this.defaults.layout ? undefined : this.layout,
            minThumbnailSize:
              this.minThumbnailSize === this.defaults.minThumbnailSize ? undefined : this.minThumbnailSize,
            gapSize: this.gapSize === this.defaults.gapSize ? undefined : this.gapSize,
            showCaptions: this.showCaptions === this.defaults.showCaptions ? undefined : this.showCaptions,
            captionFont: this.captionFont === this.defaults.captionFont ? undefined : this.captionFont,
            captionLines: this.captionLines === this.defaults.captionLines ? undefined : this.captionLines
          });
          this.close();
        }))
      .addButton((button) => button
        .setButtonText('Cancel')
        .onClick(() => this.close()));
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

// ---------------------------------------------------------------------------
// Masonry sizing: a CSS Grid + ResizeObserver technique, no external library.
//
// Each item's row-span is derived from its image's natural aspect ratio at
// the grid's current column width, recomputed whenever that width changes
// (sidebar toggled, pane resized, window resized). This runs unconditionally
// regardless of the "layout" setting -- the arithmetic is cheap, and running
// it always means switching between Masonry and Grid in settings is instant
// for already-open notes, with only a CSS class deciding which mode wins.
// ---------------------------------------------------------------------------

class GalleryRenderChild extends MarkdownRenderChild {
  private observer: ResizeObserver | null = null;
  private scheduled = false;

  private draggedSectionIndex = -1;
  private draggedItemIndex = -1;

  private isLivePreview = false;

  constructor(
    containerEl: HTMLElement,
    private readonly app: App,
    private readonly ctx: MarkdownPostProcessorContext,
    private readonly block: GalleryBlock,
    private readonly plugin: SimpleGalleryPlugin
  ) {
    super(containerEl);
  }

  /**
   * Determining Live Preview vs. Reading Mode has to happen here, not at
   * render time: Obsidian can build this widget before it's attached under
   * .markdown-source-view/.markdown-reading-view, so el.closest() at render
   * time produced false negatives in practice (confirmed by comparing real
   * DOM dumps from both modes). onload() runs after attachment -- proven by
   * the masonry sizing below, which depends on layout being complete -- so
   * the check is reliable here. If it's Reading Mode, the interactive
   * markup rendered unconditionally gets stripped back out; since all of it
   * defaults to invisible (opacity/max-height 0) until hovered, there's
   * nothing to see in the moment before it's removed.
   */
  private grids: HTMLElement[] = [];

  onload(): void {
    this.isLivePreview = this.containerEl.closest('.markdown-source-view') !== null;
    if (!this.isLivePreview) this.stripInteractiveMarkup();

    this.grids = Array.from(this.containerEl.querySelectorAll<HTMLElement>('.simple-gallery-grid'));
    if (this.grids.length === 0) return;

    this.observer = new ResizeObserver(() => this.scheduleRecompute(this.grids));
    this.grids.forEach((grid) => {
      const sectionIndex = Number(grid.dataset.sectionIndex ?? '0');
      this.observer?.observe(grid);
      grid.querySelectorAll<HTMLImageElement>('img.simple-gallery-img').forEach((img) => {
        if (!img.complete) {
          this.registerDomEvent(img, 'load', () => this.scheduleRecompute(this.grids));
        }
      });
      if (this.isLivePreview) {
        this.wireDragAndDrop(grid, sectionIndex);
        this.wireCaptionEditing(grid, sectionIndex);
        this.wireSectionInsertButtons(grid, sectionIndex);
      }
    });
    this.scheduleRecompute(this.grids);
    this.plugin.galleryInstances.add(this);

    if (this.isLivePreview) {
      const settingsButton = this.containerEl.querySelector<HTMLElement>(':scope > .simple-gallery-settings-button');
      if (settingsButton) {
        this.registerDomEvent(settingsButton, 'click', (evt: MouseEvent) => {
          evt.stopPropagation();
          new GallerySettingsModal(this.app, this.plugin.settings, this.block, (overrides) => {
            void this.commitOverrides(overrides);
          }).open();
        });
      }

      this.containerEl.querySelectorAll<HTMLElement>('.simple-gallery-section-title').forEach((titleEl) => {
        const sectionIndex = Number(titleEl.dataset.sectionIndex ?? '-1');
        this.wireSectionTitleEditing(titleEl, sectionIndex);
      });
    }
  }

  /** Removes the interactive-only markup rendered unconditionally, for Reading Mode. */
  private stripInteractiveMarkup(): void {
    this.containerEl.removeClass('simple-gallery-editable');
    this.containerEl.querySelector(':scope > .simple-gallery-settings-button')?.remove();
    this.containerEl.querySelectorAll('.simple-gallery-caption-empty').forEach((el) => el.remove());
    this.containerEl.querySelectorAll('.simple-gallery-section-insert').forEach((el) => el.remove());
  }

  /**
   * Called by the plugin after any global setting changes. A body-level
   * class/CSS-variable toggle (e.g. Show captions, Caption font) can change
   * an item's rendered height without the grid itself resizing, which the
   * ResizeObserver alone would never notice -- so every live instance needs
   * an explicit nudge to recompute its masonry row-spans against the new state.
   */
  recomputeNow(): void {
    this.scheduleRecompute(this.grids);
  }

  onunload(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.plugin.galleryInstances.delete(this);
  }

  /**
   * Native HTML5 drag-and-drop, scoped to reordering within a single
   * section's grid -- no external library. A real drag (pointer movement
   * while held) suppresses the following click, so this doesn't interfere
   * with a plain click opening a lightbox plugin; only a genuine drag ever
   * reaches these handlers.
   */
  private wireDragAndDrop(grid: HTMLElement, sectionIndex: number): void {
    const items = Array.from(grid.querySelectorAll<HTMLElement>(':scope > .simple-gallery-item'));

    items.forEach((itemEl, itemIndex) => {
      itemEl.draggable = true;
      itemEl.addClass('simple-gallery-draggable');

      this.registerDomEvent(itemEl, 'dragstart', (evt: DragEvent) => {
        this.draggedSectionIndex = sectionIndex;
        this.draggedItemIndex = itemIndex;
        itemEl.addClass('simple-gallery-dragging');
        evt.dataTransfer?.setData('text/plain', ''); // Firefox requires this for the drag to start.
        if (evt.dataTransfer) evt.dataTransfer.effectAllowed = 'move';
      });

      this.registerDomEvent(itemEl, 'dragover', (evt: DragEvent) => {
        if (this.draggedSectionIndex !== sectionIndex) return;
        evt.preventDefault();
        if (evt.dataTransfer) evt.dataTransfer.dropEffect = 'move';
        itemEl.addClass('simple-gallery-drop-target');
      });

      this.registerDomEvent(itemEl, 'dragleave', () => {
        itemEl.removeClass('simple-gallery-drop-target');
      });

      this.registerDomEvent(itemEl, 'drop', (evt: DragEvent) => {
        evt.preventDefault();
        itemEl.removeClass('simple-gallery-drop-target');
        const fromIndex = this.draggedItemIndex;
        if (this.draggedSectionIndex !== sectionIndex || fromIndex === itemIndex || fromIndex < 0) return;

        grid.insertBefore(items[fromIndex], fromIndex < itemIndex ? itemEl.nextSibling : itemEl);
        void this.commitReorder(sectionIndex, fromIndex, itemIndex);
      });

      this.registerDomEvent(itemEl, 'dragend', () => {
        itemEl.removeClass('simple-gallery-dragging');
        grid.querySelectorAll('.simple-gallery-drop-target').forEach((el) => el.removeClass('simple-gallery-drop-target'));
        this.draggedSectionIndex = -1;
        this.draggedItemIndex = -1;
      });
    });
  }

  /**
   * Reorders the in-memory model to match the DOM move already made (for
   * instant visual feedback), then writes the block back to the file.
   */
  private async commitReorder(sectionIndex: number, fromIndex: number, toIndex: number): Promise<void> {
    const section = this.block.sections[sectionIndex];
    if (!section) return;
    const [moved] = section.items.splice(fromIndex, 1);
    section.items.splice(toIndex, 0, moved);
    await this.writeBlockToFile();
  }

  private async commitCaptionChange(sectionIndex: number, itemIndex: number, caption: string): Promise<void> {
    const item = this.block.sections[sectionIndex]?.items[itemIndex];
    if (!item) return;
    item.caption = caption || undefined;
    await this.writeBlockToFile();
  }

  private async commitSectionLabelChange(sectionIndex: number, label: string): Promise<void> {
    const section = this.block.sections[sectionIndex];
    if (!section || !label) return;
    section.label = label;
    await this.writeBlockToFile();
  }

  /**
   * Splits a section into two at the given item: everything from that item
   * onward ("above") or after it ("below") moves into a brand-new labeled
   * section inserted right after the current one. Splitting at the very
   * first or last item of a section produces an empty section on one side --
   * accepted as a rare, harmless edge case rather than disabling the button.
   */
  private async commitInsertSectionBoundary(
    sectionIndex: number,
    itemIndex: number,
    position: 'above' | 'below'
  ): Promise<void> {
    const section = this.block.sections[sectionIndex];
    if (!section) return;

    const splitAt = position === 'above' ? itemIndex : itemIndex + 1;
    const movedItems = section.items.splice(splitAt);
    const newSection: GallerySection = { label: 'New section', items: movedItems };
    this.block.sections.splice(sectionIndex + 1, 0, newSection);

    await this.writeBlockToFile();
  }

  /** Applies the (already default-filtered) overrides chosen in GallerySettingsModal. */
  private async commitOverrides(overrides: GalleryOverrides): Promise<void> {
    this.block.layout = overrides.layout;
    this.block.minThumbnailSize = overrides.minThumbnailSize;
    this.block.gapSize = overrides.gapSize;
    this.block.showCaptions = overrides.showCaptions;
    this.block.captionFont = overrides.captionFont;
    this.block.captionLines = overrides.captionLines;
    await this.writeBlockToFile();
  }

  /**
   * Re-serializes the whole in-memory block and splices it back over its own
   * lines in the file. Obsidian re-renders the block from the new source
   * afterward, which settles on the same state -- so a stale line-range
   * lookup here just means the edit is silently dropped rather than
   * corrupting the file.
   */
  private async writeBlockToFile(): Promise<void> {
    const info = this.ctx.getSectionInfo(this.containerEl);
    const file = this.app.vault.getAbstractFileByPath(this.ctx.sourcePath);
    if (!info || !(file instanceof TFile)) return;

    const replacement = serializeGalleryBlock(this.block);
    await this.app.vault.process(file, (data) => {
      const lines = data.split('\n');
      lines.splice(info.lineStart, info.lineEnd - info.lineStart + 1, ...replacement.split('\n'));
      return lines.join('\n');
    });
  }

  /**
   * Click-to-edit for a caption: clicking the caption (or its "+ Add
   * caption" placeholder) swaps it for a text input pre-filled with the
   * current value. Commits on blur or Enter; Escape cancels.
   */
  private wireCaptionEditing(grid: HTMLElement, sectionIndex: number): void {
    grid.querySelectorAll<HTMLElement>(':scope > .simple-gallery-item > .simple-gallery-caption')
      .forEach((captionEl, itemIndex) => {
        this.registerDomEvent(captionEl, 'click', () => {
          const isPlaceholder = captionEl.hasClass('simple-gallery-caption-empty');
          this.makeEditable(captionEl, isPlaceholder ? '' : captionEl.getText(), 'Add a caption…', (value) => {
            void this.commitCaptionChange(sectionIndex, itemIndex, value);
          });
        });
      });
  }

  /** Wires the per-item "+ section above"/"+ section below" buttons rendered in Live Preview. */
  private wireSectionInsertButtons(grid: HTMLElement, sectionIndex: number): void {
    const items = Array.from(grid.querySelectorAll<HTMLElement>(':scope > .simple-gallery-item'));
    items.forEach((itemEl, itemIndex) => {
      const above = itemEl.querySelector<HTMLElement>('.simple-gallery-section-insert-above');
      const below = itemEl.querySelector<HTMLElement>('.simple-gallery-section-insert-below');

      if (above) {
        this.registerDomEvent(above, 'click', (evt: MouseEvent) => {
          evt.stopPropagation();
          void this.commitInsertSectionBoundary(sectionIndex, itemIndex, 'above');
        });
      }
      if (below) {
        this.registerDomEvent(below, 'click', (evt: MouseEvent) => {
          evt.stopPropagation();
          void this.commitInsertSectionBoundary(sectionIndex, itemIndex, 'below');
        });
      }
    });
  }

  private wireSectionTitleEditing(titleEl: HTMLElement, sectionIndex: number): void {
    if (sectionIndex < 0) return;
    this.registerDomEvent(titleEl, 'click', () => {
      this.makeEditable(titleEl, titleEl.getText(), 'Section name…', (value) => {
        void this.commitSectionLabelChange(sectionIndex, value);
      }, 'simple-gallery-edit-input-title');
    });
  }

  /**
   * Swaps displayEl for a text <input> pre-filled with currentValue. Commits
   * the trimmed value via onCommit on blur or Enter (only if it actually
   * changed); Escape or an unchanged value just restores displayEl as-is.
   */
  private makeEditable(
    displayEl: HTMLElement,
    currentValue: string,
    placeholder: string,
    onCommit: (value: string) => void,
    extraClass?: string
  ): void {
    const parent = displayEl.parentElement;
    if (!parent) return;

    // Appended to parent for now; replaceWith() below relocates it to
    // displayEl's exact position (and detaches it from here) in one step.
    const input = parent.createEl('input', { cls: 'simple-gallery-edit-input' });
    if (extraClass) input.addClass(extraClass);
    input.type = 'text';
    input.value = currentValue;
    input.placeholder = placeholder;

    let finished = false;
    const finish = (commit: boolean): void => {
      if (finished) return;
      finished = true;
      input.replaceWith(displayEl);
      const next = input.value.trim();
      if (commit && next !== currentValue.trim()) onCommit(next);
    };

    input.addEventListener('blur', () => finish(true));
    input.addEventListener('keydown', (evt: KeyboardEvent) => {
      if (evt.key === 'Enter') {
        evt.preventDefault();
        input.blur();
      } else if (evt.key === 'Escape') {
        evt.preventDefault();
        finish(false);
      }
    });
    input.addEventListener('click', (evt: MouseEvent) => evt.stopPropagation());

    displayEl.replaceWith(input);
    input.focus();
    input.select();
  }

  private scheduleRecompute(grids: HTMLElement[]): void {
    if (this.scheduled) return;
    this.scheduled = true;
    window.requestAnimationFrame(() => {
      this.scheduled = false;
      for (const grid of grids) this.recomputeGrid(grid);
    });
  }

  /**
   * Measures each item's actual laid-out content height (image at its natural
   * aspect ratio, plus a caption if shown) rather than deriving height purely
   * from image proportions -- that keeps captioned and caption-free items
   * from overlapping the row below regardless of how much caption text there is.
   */
  private recomputeGrid(grid: HTMLElement): void {
    const styles = getComputedStyle(grid);
    const rowUnit = parseFloat(styles.getPropertyValue('--simple-gallery-row-unit')) || 8;
    const gap = parseFloat(styles.getPropertyValue('--simple-gallery-gap')) || 0;

    grid.querySelectorAll<HTMLElement>(':scope > .simple-gallery-item').forEach((item) => {
      const height = item.scrollHeight;
      if (!height) return; // Not laid out yet; the next resize/frame will retry.

      const span = Math.max(1, Math.ceil((height + gap) / (rowUnit + gap)));
      item.style.setProperty('--simple-gallery-row-span', String(span));
    });
  }
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

export default class SimpleGalleryPlugin extends Plugin {
  settings: SimpleGallerySettings = DEFAULT_SETTINGS;
  /** Every currently-rendered gallery, so a settings change can nudge each one to re-measure. */
  readonly galleryInstances = new Set<GalleryRenderChild>();

  async onload(): Promise<void> {
    const stored = (await this.loadData()) as Partial<SimpleGallerySettings> | null;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, stored);
    this.applyAppearanceSettings();
    this.addSettingTab(new SimpleGallerySettingTab(this.app, this));

    this.registerMarkdownCodeBlockProcessor(
      'simple-gallery',
      (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
        const block = parseGalleryBlock(source);
        renderGalleryBlock(this.app, block, el, ctx.sourcePath);
        ctx.addChild(new GalleryRenderChild(el, this.app, ctx, block, this));
      }
    );

    this.addCommand({
      id: 'convert-to-gallery',
      name: 'Convert selection to gallery',
      editorCheckCallback: (checking: boolean, editor: Editor) => {
        const range = getGallerySourceRange(editor);
        const references = extractImageReferences(editor.getRange(range.from, range.to));
        if (references.length === 0) return false;
        if (checking) return true;
        editor.replaceRange(buildGalleryBlockText(references), range.from, range.to);
        return true;
      }
    });

    this.addCommand({
      id: 'insert-gallery-block',
      name: 'Insert empty gallery block',
      editorCallback: (editor: Editor) => {
        const cursor = editor.getCursor();
        const itemLine = `${GALLERY_TEMPLATE_ITEM_PREFIX}${GALLERY_TEMPLATE_ITEM}`;
        editor.replaceRange(['```simple-gallery', itemLine, '```'].join('\n'), cursor);

        const placeholderLine = cursor.line + 1;
        const placeholderStart = GALLERY_TEMPLATE_ITEM_PREFIX.length + '![['.length;
        editor.setSelection(
          { line: placeholderLine, ch: placeholderStart },
          { line: placeholderLine, ch: placeholderStart + 'image.jpg'.length }
        );
      }
    });
  }

  onunload(): void {
    document.body.classList.remove(
      'simple-gallery-hide-captions',
      'simple-gallery-layout-grid',
      'simple-gallery-caption-font-mono',
      'simple-gallery-caption-lines-single'
    );
    document.body.style.removeProperty('--simple-gallery-min-size');
    document.body.style.removeProperty('--simple-gallery-gap');
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.applyAppearanceSettings();
  }

  /**
   * Writes settings as CSS custom properties/classes on <body>. Because these
   * are ordinary inherited CSS, every open gallery updates its appearance
   * live when a setting changes, with no per-instance re-render needed.
   *
   * A body-level class toggle (e.g. Show captions, Caption font) can change
   * an item's rendered height without the grid itself resizing -- something
   * a masonry gallery's own ResizeObserver would never notice on its own --
   * so every live instance also gets an explicit nudge to recompute its
   * row-spans against the new state.
   */
  private applyAppearanceSettings(): void {
    document.body.style.setProperty('--simple-gallery-min-size', `${this.settings.minThumbnailSize}px`);
    document.body.style.setProperty('--simple-gallery-gap', `${this.settings.gapSize}px`);
    document.body.classList.toggle('simple-gallery-hide-captions', !this.settings.showCaptions);
    document.body.classList.toggle('simple-gallery-layout-grid', this.settings.layout === 'grid');
    document.body.classList.toggle('simple-gallery-caption-font-mono', this.settings.captionFont === 'monospace');
    document.body.classList.toggle('simple-gallery-caption-lines-single', this.settings.captionLines === 'single');

    for (const instance of this.galleryInstances) instance.recomputeNow();
  }
}

const LAYOUT_DESC =
  'Masonry sizes each thumbnail by its own photo’s proportions for an artistic, ' +
  'portfolio-style look. Grid uses uniform tiles for a clean, rigid look.';
const SHOW_CAPTIONS_DESC =
  'Display captions under images that have one. Turn off for a clean, caption-free grid ' +
  '— useful for print or export — without removing captions from the source.';

class SimpleGallerySettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: SimpleGalleryPlugin) {
    super(app, plugin);
  }

  /** Declarative settings (Obsidian 1.13+): makes settings appear in Obsidian's settings search. */
  getSettingDefinitions(): SettingDefinitionItem[] {
    return [
      {
        name: 'Layout',
        desc: LAYOUT_DESC,
        control: {
          type: 'dropdown',
          key: 'layout',
          defaultValue: DEFAULT_SETTINGS.layout,
          options: {
            masonry: 'Masonry (artistic)',
            grid: 'Grid (uniform)'
          }
        }
      },
      {
        name: 'Minimum thumbnail size',
        desc: 'Smallest width, in pixels, a thumbnail can shrink to before the grid wraps to fewer columns.',
        control: {
          type: 'slider',
          key: 'minThumbnailSize',
          defaultValue: DEFAULT_SETTINGS.minThumbnailSize,
          min: 80,
          max: 400,
          step: 10
        }
      },
      {
        name: 'Gap between images',
        desc: 'Spacing, in pixels, between thumbnails in the grid.',
        control: {
          type: 'slider',
          key: 'gapSize',
          defaultValue: DEFAULT_SETTINGS.gapSize,
          min: 0,
          max: 32,
          step: 2
        }
      },
      {
        name: 'Show captions',
        desc: SHOW_CAPTIONS_DESC,
        control: {
          type: 'toggle',
          key: 'showCaptions',
          defaultValue: DEFAULT_SETTINGS.showCaptions
        }
      },
      {
        name: 'Caption font',
        desc: 'Typewriter uses your configured monospace font for captions instead of the normal text font.',
        control: {
          type: 'dropdown',
          key: 'captionFont',
          defaultValue: DEFAULT_SETTINGS.captionFont,
          options: {
            default: 'Default',
            monospace: 'Typewriter (monospace)'
          }
        }
      },
      {
        name: 'Caption length',
        desc: 'Full shows the whole caption, wrapping as needed. Single line truncates a long caption with an ellipsis.',
        control: {
          type: 'dropdown',
          key: 'captionLines',
          defaultValue: DEFAULT_SETTINGS.captionLines,
          options: {
            full: 'Full',
            single: 'Single line'
          }
        }
      }
    ];
  }

  getControlValue(key: string): unknown {
    switch (key) {
      case 'layout': return this.plugin.settings.layout;
      case 'minThumbnailSize': return this.plugin.settings.minThumbnailSize;
      case 'gapSize': return this.plugin.settings.gapSize;
      case 'showCaptions': return this.plugin.settings.showCaptions;
      case 'captionFont': return this.plugin.settings.captionFont;
      case 'captionLines': return this.plugin.settings.captionLines;
      default: return undefined;
    }
  }

  async setControlValue(key: string, value: unknown): Promise<void> {
    switch (key) {
      case 'layout':
        if (value === 'masonry' || value === 'grid') this.plugin.settings.layout = value;
        break;
      case 'minThumbnailSize':
        if (typeof value === 'number') this.plugin.settings.minThumbnailSize = value;
        break;
      case 'gapSize':
        if (typeof value === 'number') this.plugin.settings.gapSize = value;
        break;
      case 'showCaptions':
        if (typeof value === 'boolean') this.plugin.settings.showCaptions = value;
        break;
      case 'captionFont':
        if (value === 'default' || value === 'monospace') this.plugin.settings.captionFont = value;
        break;
      case 'captionLines':
        if (value === 'full' || value === 'single') this.plugin.settings.captionLines = value;
        break;
      default:
        return;
    }
    await this.plugin.saveSettings();
  }

  /**
   * Imperative fallback for Obsidian versions older than 1.13.0, where
   * getSettingDefinitions() isn't recognized. Not called at all on 1.13+,
   * where the declarative definitions above render instead.
   */
  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('Layout')
      .setDesc(LAYOUT_DESC)
      .addDropdown((dropdown) => dropdown
        .addOption('masonry', 'Masonry (artistic)')
        .addOption('grid', 'Grid (uniform)')
        .setValue(this.plugin.settings.layout)
        .onChange(async (value) => {
          this.plugin.settings.layout = value === 'grid' ? 'grid' : 'masonry';
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Minimum thumbnail size')
      .setDesc('Smallest width, in pixels, a thumbnail can shrink to before the grid wraps to fewer columns.')
      .addSlider((slider) => slider
        .setLimits(80, 400, 10)
        .setValue(this.plugin.settings.minThumbnailSize)
        .onChange(async (value) => {
          this.plugin.settings.minThumbnailSize = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Gap between images')
      .setDesc('Spacing, in pixels, between thumbnails in the grid.')
      .addSlider((slider) => slider
        .setLimits(0, 32, 2)
        .setValue(this.plugin.settings.gapSize)
        .onChange(async (value) => {
          this.plugin.settings.gapSize = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Show captions')
      .setDesc(SHOW_CAPTIONS_DESC)
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.showCaptions)
        .onChange(async (value) => {
          this.plugin.settings.showCaptions = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Caption font')
      .setDesc('Typewriter uses your configured monospace font for captions instead of the normal text font.')
      .addDropdown((dropdown) => dropdown
        .addOption('default', 'Default')
        .addOption('monospace', 'Typewriter (monospace)')
        .setValue(this.plugin.settings.captionFont)
        .onChange(async (value) => {
          this.plugin.settings.captionFont = value === 'monospace' ? 'monospace' : 'default';
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Caption length')
      .setDesc('Full shows the whole caption, wrapping as needed. Single line truncates a long caption with an ellipsis.')
      .addDropdown((dropdown) => dropdown
        .addOption('full', 'Full')
        .addOption('single', 'Single line')
        .setValue(this.plugin.settings.captionLines)
        .onChange(async (value) => {
          this.plugin.settings.captionLines = value === 'single' ? 'single' : 'full';
          await this.plugin.saveSettings();
        }));
  }
}
