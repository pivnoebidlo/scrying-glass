import { describe, expect, it } from 'vitest';
import scenes from '../src/modules/scenes/main';
import { addShown, currentTray, emptyTray, trayOwner, type ScreenNow } from '../src/modules/scenes/tray';
import type { Scene, ScenesState } from '../src/modules/scenes/types';
import type { AdventuresState } from '../src/shared/adventures';
import { ctx, run, tree } from './helpers';

const adv = (current: string | null): AdventuresState => ({ list: ['Страд', 'Фандалин'], current, initialized: true });
const screen = (o: Partial<{ bg: string | null; map: string | null; portraits: string[]; handout: string | null; music: string; encounters: string[]; ambience: string[]; sound: string; seq: number }> = {}): ScreenNow => ({
  scene: { background: o.bg ?? null },
  maps: { current: o.map ?? null },
  portraits: { onScreen: o.portraits ?? [] },
  handouts: { current: o.handout ?? null },
  music: { playing: !!o.music, playlist: o.music ?? null, ambience: (o.ambience ?? []).map((path) => ({ path })), ambiencePlaying: !!o.ambience?.length },
  initiative: { combatants: (o.encounters ?? []).map((encounter) => ({ encounter })) },
  sounds: { last: { path: o.sound ?? null, seq: o.seq ?? 0 } },
});
const content = {
  background: { path: 'Страд/backgrounds/замок.jpg', fit: 'cover' as const },
  map: { path: null },
  portraits: { paths: ['Страд/characters/страд.png'] },
  handout: { path: null },
  music: { playlist: null, shuffle: false },
  ambience: { loops: [] },
};
const base: ScenesState = { scenes: [], active: null, throughBlack: false };
// Действие другого модуля: хук scenes видит экран до и после.
const after = (s: ScenesState, a: AdventuresState, before: ScreenNow, now: ScreenNow) =>
  scenes.afterAction!(s, { ...before, adventures: a }, { ...now, adventures: a }, ctx());

describe('подборка правой панели', () => {
  it('новое на экране — в подборку; что уже было на экране — не повторяется', () => {
    const t = addShown(emptyTray(), screen({ portraits: ['a.png'] }), screen({ bg: 'bg.jpg', portraits: ['a.png', 'b.png'], handout: 'n.note.json' }));
    expect(t).toEqual({ ...emptyTray(), background: ['bg.jpg'], portraits: ['b.png'], handout: ['n.note.json'] });
  });

  it('без включённой сцены — подборка приключения, у каждого своя', () => {
    let s = after(base, adv('Страд'), screen(), screen({ bg: 'Страд/backgrounds/туман.jpg' }));
    s = after(s, adv('Фандалин'), screen(), screen({ map: 'Фандалин/maps/шахта.jpg' }));
    expect(s.trays?.['Страд']?.background).toEqual(['Страд/backgrounds/туман.jpg']);
    expect(s.trays?.['Фандалин']?.map).toEqual(['Фандалин/maps/шахта.jpg']);
    expect(currentTray(s, adv(null))).toEqual(emptyTray());
  });

  it('новая сцена начинает подборку со своего содержимого и становится владельцем подборки', () => {
    const s = run(scenes, base, 'create', { name: 'Замок', content, adventure: 'Страд' });
    const sc = s.scenes[0]!;
    expect(sc.tray).toEqual({ ...emptyTray(), background: ['Страд/backgrounds/замок.jpg'], portraits: ['Страд/characters/страд.png'] });
    expect(trayOwner(s, adv('Страд'))).toEqual({ scene: sc.id });
    // В другом приключении сцена не видна — там подборка приключения.
    expect(trayOwner(s, adv('Фандалин'))).toEqual({ adventure: 'Фандалин' });

    const s2 = after(s, adv('Страд'), screen(), screen({ handout: 'Страд/handouts/письмо.png' }));
    expect(s2.scenes[0]!.tray!.handout).toEqual(['Страд/handouts/письмо.png']);
    expect(s2.trays?.['Страд']).toBeUndefined();
  });

  it('новая сцена из накиданного в панель: подборка вместе с тем, что на экране', () => {
    const tray = { ...emptyTray(), background: ['Страд/backgrounds/туман.jpg'], music: ['Страд/music/башня.mp3'], encounters: ['e1'] };
    const s = run(scenes, base, 'create', { name: 'Башня', content, adventure: 'Страд', tray });
    expect(s.scenes[0]!.tray).toEqual({
      ...emptyTray(),
      background: ['Страд/backgrounds/туман.jpg', 'Страд/backgrounds/замок.jpg'],
      portraits: ['Страд/characters/страд.png'],
      music: ['Страд/music/башня.mp3'],
      encounters: ['e1'],
    });
  });

  it('музыка и бои: включённое попадает в подборку, на паузе — нет', () => {
    let s = after(base, adv('Страд'), screen(), screen({ music: 'Страд/music/бой', encounters: ['крысы'] }));
    expect(s.trays?.['Страд']).toMatchObject({ music: ['Страд/music/бой'], encounters: ['крысы'] });
    s = after(s, adv(null), screen(), { ...screen(), music: { ...screen().music, playing: false, playlist: 'общая' } });
    expect(currentTray(s, adv(null)).music).toEqual([]);
  });

  it('атмосфера и звуки: включённая атмосфера и сыгранный звук — в подборку', () => {
    let s = after(base, adv(null), screen(), screen({ ambience: ['дождь.mp3'], sound: 'гром.mp3', seq: 1 }));
    expect(currentTray(s, adv(null))).toMatchObject({ ambience: ['дождь.mp3'], sounds: ['гром.mp3'] });
    // Тот же звук ещё раз — без повтора; команда «остановить» (path null) ничего не добавляет.
    s = after(s, adv(null), screen({ sound: 'гром.mp3', seq: 1 }), screen({ sound: 'гром.mp3', seq: 2 }));
    s = after(s, adv(null), screen({ seq: 2 }), screen({ seq: 3 }));
    expect(currentTray(s, adv(null)).sounds).toEqual(['гром.mp3']);
  });

  it('добавить и убрать вручную; повтор не дублируется', () => {
    const owner = { adventure: '' };
    let s = run(scenes, base, 'trayAdd', { owner, part: 'portraits', paths: ['a.png', 'b.png', 'a.png'] });
    s = run(scenes, s, 'trayAdd', { owner, part: 'portraits', paths: ['b.png', 'c.png'] });
    expect(s.trays?.['']?.portraits).toEqual(['a.png', 'b.png', 'c.png']);
    s = run(scenes, s, 'trayRemove', { owner, part: 'portraits', path: 'b.png' });
    expect(s.trays?.['']?.portraits).toEqual(['a.png', 'c.png']);
  });

  it('сцены прежних версий получают подборку из содержимого; пропавшие файлы уходят из подборок', () => {
    const old = { id: 's1', name: 'Замок', adventure: 'Страд', include: { background: true, map: true, portraits: true, handout: true, music: true, ambience: true }, ...content } as Scene;
    const s: ScenesState = {
      ...base,
      scenes: [old],
      trays: { Страд: { ...emptyTray(), portraits: ['Страд/characters/нет.png', 'library:images/x.png'], music: ['Страд/music', 'Страд/нет'], encounters: ['e1'] } },
    };
    const next = scenes.init!(s, ctx(tree(['Страд/backgrounds/замок.jpg', 'Страд/music/башня.mp3'])));
    expect(next.scenes[0]!.tray).toEqual({ ...emptyTray(), background: ['Страд/backgrounds/замок.jpg'] });
    // Папки (плейлисты) остаются, бои — не пути, их очистка не трогает.
    expect(next.trays?.['Страд']).toMatchObject({ portraits: ['library:images/x.png'], music: ['Страд/music'], encounters: ['e1'] });
  });
});
