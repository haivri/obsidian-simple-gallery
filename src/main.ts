import {
  App,
  MarkdownPostProcessorContext,
  MarkdownRenderChild,
  Plugin,
  PluginSettingTab,
  Setting,
  SettingDefinitionItem
} from 'obsidian';

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

type GalleryLayout = 'masonry' | 'grid';

interface SimpleGallerySettings {
  minThumbnailSize: number;
  gapSize: number;
  showCaptions: boolean;
  layout: GalleryLayout;
}

const DEFAULT_SETTINGS: SimpleGallerySettings = {
  minThumbnailSize: 160,
  gapSize: 8,
  showCaptions: true,
  layout: 'masonry'
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
  sections: GallerySection[];
}

const ITEM_LINE = /^-\s+(.+?)\s*$/;
const SECTION_LINE = /^section:\s*(.*)$/i;
const CAPTION_LINE = /^caption:\s*(.*)$/i;
const NOTE_LINE = /^note:\s*(.*)$/i;
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

      const introMatch = NOTE_LINE.exec(trimmed);
      if (introMatch && !sawAnyContent && block.intro === undefined) {
        block.intro = introMatch[1].trim();
        continue;
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

// ---------------------------------------------------------------------------
// Resolution: the same mechanism Obsidian uses internally for embeds.
// ---------------------------------------------------------------------------

function resolveGalleryImageSrc(app: App, linkpath: string, sourcePath: string): string | null {
  const file = app.metadataCache.getFirstLinkpathDest(linkpath, sourcePath);
  if (!file) return null;
  return app.vault.getResourcePath(file);
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function renderGalleryBlock(app: App, block: GalleryBlock, el: HTMLElement, sourcePath: string): void {
  el.addClass('simple-gallery-root');

  if (block.intro) {
    el.createEl('p', { cls: 'simple-gallery-note simple-gallery-intro', text: block.intro });
  }

  const isFlat = block.sections.length === 1 && !block.sections[0].label && !block.sections[0].note;

  for (const section of block.sections) {
    const parent = isFlat ? el : el.createDiv({ cls: 'simple-gallery-section' });

    if (!isFlat) {
      if (section.label) {
        parent.createEl('h4', { cls: 'simple-gallery-section-title', text: section.label });
      }
      if (section.note) {
        parent.createEl('p', { cls: 'simple-gallery-note', text: section.note });
      }
    }

    const grid = parent.createDiv({ cls: 'simple-gallery-grid' });
    for (const item of section.items) {
      renderGalleryItem(app, grid, item, sourcePath);
    }
  }
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
  }
}

function renderBrokenItem(grid: HTMLElement, item: GalleryItem): void {
  const broken = grid.createDiv({ cls: 'simple-gallery-item simple-gallery-broken' });
  broken.createSpan({ cls: 'simple-gallery-broken-icon', text: '⚠' });
  broken.createSpan({ cls: 'simple-gallery-broken-text', text: `Image not found: ${item.raw}` });
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

  onload(): void {
    const grids = Array.from(this.containerEl.querySelectorAll<HTMLElement>('.simple-gallery-grid'));
    if (grids.length === 0) return;

    this.observer = new ResizeObserver(() => this.scheduleRecompute(grids));
    for (const grid of grids) {
      this.observer.observe(grid);
      grid.querySelectorAll<HTMLImageElement>('img.simple-gallery-img').forEach((img) => {
        if (!img.complete) {
          this.registerDomEvent(img, 'load', () => this.scheduleRecompute(grids));
        }
      });
    }
    this.scheduleRecompute(grids);
  }

  onunload(): void {
    this.observer?.disconnect();
    this.observer = null;
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
        ctx.addChild(new GalleryRenderChild(el));
      }
    );
  }

  onunload(): void {
    document.body.classList.remove('simple-gallery-hide-captions', 'simple-gallery-layout-grid');
    document.body.style.removeProperty('--simple-gallery-min-size');
    document.body.style.removeProperty('--simple-gallery-gap');
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.applyAppearanceSettings();
  }

  /**
   * Writes settings as CSS custom properties/classes on <body>. Because these
   * are ordinary inherited CSS, every open gallery updates live when a
   * setting changes, with no per-instance re-render or tracking needed.
   */
  private applyAppearanceSettings(): void {
    document.body.style.setProperty('--simple-gallery-min-size', `${this.settings.minThumbnailSize}px`);
    document.body.style.setProperty('--simple-gallery-gap', `${this.settings.gapSize}px`);
    document.body.classList.toggle('simple-gallery-hide-captions', !this.settings.showCaptions);
    document.body.classList.toggle('simple-gallery-layout-grid', this.settings.layout === 'grid');
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
      }
    ];
  }

  getControlValue(key: string): unknown {
    switch (key) {
      case 'layout': return this.plugin.settings.layout;
      case 'minThumbnailSize': return this.plugin.settings.minThumbnailSize;
      case 'gapSize': return this.plugin.settings.gapSize;
      case 'showCaptions': return this.plugin.settings.showCaptions;
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
  }
}
