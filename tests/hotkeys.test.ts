import { afterEach, describe, expect, it } from 'vitest';
import {
  accelerator, alsoUsedBy, comboFor, comboLabel, comboOf, comboProblem, HOTKEY_GROUPS, HOTKEYS, hotkeyLabel, matches, setHotkeys,
} from '../src/shared/hotkeys';
import { tr } from '../src/shared/i18n';

const press = (code: string, mods: Partial<Record<'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey', boolean>> = {}) => ({
  code, metaKey: false, ctrlKey: false, altKey: false, shiftKey: false, ...mods,
});

describe('горячие клавиши', () => {
  afterEach(() => setHotkeys(null));

  it('нажатие → сочетание по месту клавиши (раскладка не важна); ⌘ и Ctrl — оба Mod', () => {
    expect(comboOf(press('KeyK', { metaKey: true }))).toBe('Mod+K');
    expect(comboOf(press('KeyA', { ctrlKey: true, shiftKey: true }))).toBe('Mod+Shift+A');
    expect(comboOf(press('Comma', { metaKey: true }))).toBe('Mod+,');
    expect(comboOf(press('ArrowRight', { metaKey: true }))).toBe('Mod+ArrowRight');
    expect(comboOf(press('MetaLeft', { metaKey: true }))).toBeNull();
    // Russian layout: ⌘ + the key «б» is still Comma.
    expect(matches(press('Comma', { metaKey: true }), 'settings')).toBe(true);
    expect(matches(press('KeyB', { ctrlKey: true }), 'blackout')).toBe(true);
    expect(matches(press('KeyB', { ctrlKey: true, shiftKey: true }), 'blackout')).toBe(false);
  });

  it('свои сочетания: только у переназначаемых и разбираемых; подсказки и меню берут их', () => {
    const kept = setHotkeys({ search: 'Mod+Shift+F', save: 'Mod+J', blackout: 'Mod+Ctrl' });
    expect(kept).toEqual({ search: 'Mod+Shift+F' });
    expect(comboFor('search')).toBe('Mod+Shift+F');
    expect(matches(press('KeyF', { metaKey: true, shiftKey: true }), 'search')).toBe(true);
    expect(matches(press('KeyK', { metaKey: true }), 'search')).toBe(false);
    expect(comboFor('save')).toBe('Mod+S');
    expect(accelerator('settings')).toBe('CmdOrCtrl+,');
    setHotkeys({ settings: 'Mod+Shift+ArrowUp' });
    expect(accelerator('settings')).toBe('CmdOrCtrl+Shift+Up');
  });

  it('подписи: ⌘⇧A на Mac, Ctrl+Shift+A в остальных; диапазон сцен; мышь', () => {
    expect(comboLabel('Mod+Shift+A', true)).toBe('⌘⇧A');
    expect(comboLabel('Mod+Shift+A', false)).toBe('Ctrl+Shift+A');
    expect(comboLabel('Mod+ArrowRight', true)).toBe('⌘→');
    expect(comboLabel('ArrowLeft ArrowRight', false)).toBe('← →');
    expect(comboLabel('Alt+Click', false)).toMatch(/^Alt\+/);
    expect(comboLabel('Alt+Click', true)).toMatch(/^⌥ \+ /);
    expect(hotkeyLabel('scene')).toMatch(/1 … .*9$/);
  });

  it('проверка нового сочетания: без модификатора, системное, занятое; предупреждение о местных', () => {
    expect(comboProblem('search', 'K')).toEqual({ kind: 'bare' });
    expect(comboProblem('search', 'F5')).toBeNull();
    expect(comboProblem('search', 'Mod+C')).toEqual({ kind: 'reserved' });
    expect(comboProblem('search', 'Mod+P')).toEqual({ kind: 'taken', by: 'playPause' });
    expect(comboProblem('search', 'Mod+K')).toBeNull();
    expect(alsoUsedBy('search', 'Mod+I')).toEqual(['italic']);
  });

  it('у каждого сочетания и группы есть подпись на обоих языках; группы не пусты', () => {
    for (const lang of ['en', 'ru'] as const) {
      for (const h of HOTKEYS) expect(tr(lang, `hk.${h.id}` as never), h.id).not.toBe(`hk.${h.id}`);
      for (const g of HOTKEY_GROUPS) expect(tr(lang, `hk.group.${g}` as never), g).not.toBe(`hk.group.${g}`);
    }
    for (const g of HOTKEY_GROUPS) expect(HOTKEYS.some((h) => h.group === g), g).toBe(true);
    expect(new Set(HOTKEYS.map((h) => h.id)).size).toBe(HOTKEYS.length);
  });
});
