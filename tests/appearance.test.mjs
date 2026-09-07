import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import { transformSync } from 'esbuild';
import { JSDOM } from 'jsdom';

function setup() {
  const dom = new JSDOM('<body><main></main></body>');
  const { window } = dom;
  const { document, HTMLElement } = window;
  HTMLElement.prototype.empty = function () { this.replaceChildren(); };
  HTMLElement.prototype.addClass = function (name) { this.classList.add(name); };
  HTMLElement.prototype.toggleClass = function (name, value) { this.classList.toggle(name, value); };
  HTMLElement.prototype.createEl = function (tag, options = {}) {
    const el = document.createElement(tag);
    if (options.text) el.textContent = options.text;
    if (options.cls) el.className = options.cls;
    for (const [key, value] of Object.entries(options.attr ?? {})) el.setAttribute(key, value);
    this.append(el); return el;
  };
  HTMLElement.prototype.createDiv = function (options) { return this.createEl('div', options); };
  HTMLElement.prototype.createSpan = function (options) { return this.createEl('span', options); };
  class Base {}
  class Modal {
    contentEl = document.createElement('div');
    setTitle(title) { this.title = title; }
    close() { this.onClose(); }
  }
  class Setting {
    constructor(parent) {
      this.settingEl = parent.createDiv({ cls: 'setting-item' });
      this.infoEl = this.settingEl.createDiv({ cls: 'setting-item-info' });
      this.nameEl = this.infoEl.createDiv();
      this.descEl = this.infoEl.createDiv();
      this.controlEl = this.settingEl.createDiv({ cls: 'setting-item-control' });
    }
    setName(value) { this.nameEl.textContent = value; return this; }
    setDesc(value) { this.descEl.textContent = value; return this; }
    addButton(fn) {
      const el = this.controlEl.createEl('button');
      const control = { buttonEl: el,
        setButtonText(t) { el.textContent = t; return this; }, setIcon() { return this; },
        setTooltip(t) { el.title = t; return this; }, setCta() { return this; },
        setDisabled(v) { el.disabled = v; return this; }, onClick(f) { el.addEventListener('click', f); return this; } };
      fn(control); return this;
    }
    addDropdown(fn) {
      const el = this.controlEl.createEl('select');
      const control = { selectEl: el, addOption(value, label) { el.add(new window.Option(label, value)); return this; },
        setValue(v) { el.value = v; return this; }, onChange(f) { el.addEventListener('change', () => f(el.value)); return this; } };
      fn(control); return this;
    }
    addSlider(fn) {
      const el = this.controlEl.createEl('input', { attr: { type: 'range' } });
      const control = { sliderEl: el, setLimits(min, max, step) { Object.assign(el, { min, max, step }); return this; },
        setValue(v) { el.value = v; return this; }, onChange(f) { el.addEventListener('input', () => f(Number(el.value))); return this; } };
      fn(control); return this;
    }
    addText(fn) { return this.text(fn, 'input'); }
    addTextArea(fn) { return this.text(fn, 'textarea'); }
    text(fn, tag) {
      const el = this.controlEl.createEl(tag);
      const control = { inputEl: el, setValue(v) { el.value = v; return this; }, getValue() { return el.value; },
        setPlaceholder(v) { el.placeholder = v; return this; }, onChange(f) { el.addEventListener('input', () => f(el.value)); return this; } };
      fn(control); return this;
    }
  }
  const exports = {};
  const module = { exports };
  const source = readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8');
  const code = transformSync(source + '\nexport { renderAppearanceControls, copyOverrides, DEFAULT_SETTINGS, GallerySettingsModal, PhotoSettingsModal, SimpleGallerySettingTab };', { loader: 'ts', format: 'cjs' }).code;
  runInNewContext(code, { module, exports, window, document, console,
    require: () => ({ Plugin: Base, PluginSettingTab: Base, MarkdownRenderChild: Base, Modal, Setting, setIcon: () => {} }) });
  return { dom, window, document, ...module.exports };
}

function click(root, label) {
  const button = Array.from(root.querySelectorAll('button')).find((el) => el.getAttribute('aria-label') === label || el.textContent === label);
  assert.ok(button, `Button exists: ${label}`); button.click(); return button;
}

test('inherited values are selected; explicit same-value overrides survive; reset restores source', () => {
  const env = setup(); const root = env.document.querySelector('main'); const model = {};
  env.renderAppearanceControls(root, 'Photo', model, env.DEFAULT_SETTINGS, { captionAlign: 'right' }, () => {});
  const row = root.querySelector('[data-appearance-key="captionAlign"]');
  assert.equal(row.querySelector('[aria-pressed="true"]').getAttribute('aria-label'), 'Align right');
  assert.equal(row.querySelector('.simple-gallery-setting-source').textContent, 'From gallery');
  assert.ok(row.querySelector('[aria-label="Align right"]').classList.contains('simple-gallery-choice-inherited'));
  assert.equal(row.querySelector('.simple-gallery-align-active'), null);
  click(row, 'Align right');
  assert.equal(model.captionAlign, 'right');
  assert.ok(row.querySelector('[aria-label="Align right"]').classList.contains('simple-gallery-align-active'));
  assert.equal(row.querySelector('.simple-gallery-choice-inherited'), null);
  assert.equal(row.querySelector('.simple-gallery-setting-source').textContent, 'Photo override');
  click(row, 'Use gallery setting');
  assert.equal(model.captionAlign, undefined);
  assert.equal(row.querySelector('.simple-gallery-align-active'), null);
  assert.ok(row.querySelector('.simple-gallery-choice-inherited'));
  assert.equal(row.querySelector('[aria-pressed="true"]').getAttribute('aria-label'), 'Align right');
  env.dom.window.close();
});

test('presets, exact values and inherited numeric values stay synchronized', () => {
  const env = setup(); const root = env.document.querySelector('main'); const model = {};
  env.renderAppearanceControls(root, 'Gallery', model, env.DEFAULT_SETTINGS, {}, () => {});
  click(root, 'Large'); assert.equal(model.minThumbnailSize, 240);
  const exact = root.querySelector('input[aria-label="Photo size in pixels"]');
  exact.value = '173'; exact.dispatchEvent(new env.window.Event('change'));
  assert.equal(model.minThumbnailSize, 173);
  const basic = root.querySelector('[data-appearance-key="minThumbnailSize"]');
  assert.equal(basic.querySelector('.simple-gallery-setting-value').textContent, '✓ 173 px');
  assert.equal(basic.querySelectorAll('[aria-pressed="true"]').length, 0);
  exact.value = ''; exact.dispatchEvent(new env.window.Event('change'));
  assert.equal(model.minThumbnailSize, 173);
  click(basic, 'Use plugin default'); assert.equal(model.minThumbnailSize, undefined);
  assert.equal(exact.value, '160');
  env.dom.window.close();
});

test('gallery save preserves explicit matching defaults; reset only removes overrides', () => {
  const env = setup(); let saved;
  const modal = new env.GallerySettingsModal({}, env.DEFAULT_SETTINGS, { sections: [], captionAlign: 'center' }, () => {}, (value) => { saved = value; }, () => {}, () => {});
  modal.onOpen(); click(modal.contentEl, 'Done');
  assert.equal(saved.captionAlign, 'center');
  const reset = new env.GallerySettingsModal({}, env.DEFAULT_SETTINGS, { sections: [], captionAlign: 'right' }, () => {}, (value) => { saved = value; }, () => {}, () => {});
  reset.onOpen(); click(reset.contentEl, 'Use plugin defaults'); click(reset.contentEl, 'Done');
  assert.equal(saved.captionAlign, undefined);
  env.dom.window.close();
});

test('photo dialog saves caption, appearance and size together; cancel does not save', () => {
  const env = setup(); let saved; let cancelled = false;
  const modal = new env.PhotoSettingsModal({}, { caption: 'Old', featured: true }, env.DEFAULT_SETTINGS, { layout: 'grid' }, () => {}, (value) => { saved = value; }, () => {});
  modal.onOpen(); const text = modal.contentEl.querySelector('textarea');
  text.value = 'Long caption\nkept as one paragraph'; text.dispatchEvent(new env.window.Event('input'));
  click(modal.contentEl, '− regular'); click(modal.contentEl, 'Align left'); click(modal.contentEl, 'Done');
  assert.equal(saved.caption, 'Long caption kept as one paragraph'); assert.equal(saved.featured, undefined); assert.equal(saved.captionAlign, 'left');
  const cancel = new env.PhotoSettingsModal({}, { caption: 'Old' }, env.DEFAULT_SETTINGS, {}, () => {}, () => assert.fail('Cancel saved changes'), () => { cancelled = true; });
  cancel.onOpen(); click(cancel.contentEl, 'Cancel'); assert.equal(cancelled, true);
  env.dom.window.close();
});

test('justified disables individual sizing without deleting stored size; defaults use alignment buttons', () => {
  const env = setup(); let saved;
  const modal = new env.PhotoSettingsModal({}, { featured: true }, env.DEFAULT_SETTINGS, {}, () => {}, (value) => { saved = value; }, () => {});
  modal.onOpen(); const larger = click(modal.contentEl, '+ larger'); assert.equal(larger.disabled, true);
  click(modal.contentEl, 'Done'); assert.equal(saved.featured, true);
  const root = env.document.querySelector('main'); const defaults = { ...env.DEFAULT_SETTINGS };
  env.renderAppearanceControls(root, 'Plugin', defaults, env.DEFAULT_SETTINGS, {}, () => {});
  const align = root.querySelector('[data-appearance-key="captionAlign"]');
  assert.equal(align.querySelectorAll('button').length, 4); assert.equal(align.querySelectorAll('select').length, 0);
  click(align, 'Justify'); assert.equal(defaults.captionAlign, 'justify');
  env.dom.window.close();
});

test('Obsidian 1.13 settings render the shared controls and save plugin alignment', () => {
  const env = setup(); let saves = 0;
  const plugin = { settings: { ...env.DEFAULT_SETTINGS }, saveSettings: async () => { saves++; } };
  const tab = new env.SimpleGallerySettingTab({}, plugin);
  const root = env.document.querySelector('main');
  tab.getSettingDefinitions()[0].render({ settingEl: root });
  assert.ok(root.querySelector('[data-appearance-key="minThumbnailSize"]'));
  const align = root.querySelector('[data-appearance-key="captionAlign"]');
  click(align, 'Align left');
  assert.equal(plugin.settings.captionAlign, 'left');
  assert.equal(saves, 1);
  env.dom.window.close();
});

test('long captions and explicit appearance overrides round-trip without losing text', () => {
  const env = setup();
  const caption = 'A complete caption with a long unbroken filename_' + 'x'.repeat(3000);
  const source = '```simple-gallery\ncaption-align: center\n- photo.jpg\n  caption: ' + caption + '\n  caption-lines: full\n```';
  const block = env.parseGalleryBlock(source.split('\n').slice(1, -1).join('\n'));
  assert.equal(block.sections[0].items[0].caption, caption);
  assert.equal(block.captionAlign, 'center');
  const serialized = env.serializeGalleryBlock(block);
  const restored = env.parseGalleryBlock(serialized.split('\n').slice(1, -1).join('\n'));
  assert.equal(restored.sections[0].items[0].caption, caption);
  assert.equal(restored.captionAlign, 'center');
  env.dom.window.close();
});
