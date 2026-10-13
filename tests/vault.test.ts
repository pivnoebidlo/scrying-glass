import { afterEach, describe, expect, it } from 'vitest';
import { assetUrl, folderRole, prettyName, roleFolders, roleNames, setRoleNames, thumb } from '../src/shared/vault';
import { missingFolders, placeTitle, visibleIn, type AdventuresState } from '../src/shared/adventures';
import { tree } from './helpers';

afterEach(() => setRoleNames(null));

describe('папки ролей', () => {
  it('названия по умолчанию, без учёта регистра', () => {
    expect(folderRole('Maps')).toBe('maps');
    expect(folderRole('Бестиарий')).toBe('bestiary');
    expect(folderRole('Глава 1')).toBeNull();
  });

  it('свои названия заменяют названия роли, первое — основное', () => {
    setRoleNames({ maps: ['Атласы', 'атласы', ''] });
    expect(roleNames().maps).toEqual(['атласы']);
    expect(folderRole('атласы')).toBe('maps');
    expect(folderRole('maps')).toBeNull();
    expect(folderRole('music')).toBe('music');
  });

  it('папки роли на любой глубине с подписью «где лежит»', () => {
    const t = tree(['Страд/Глава 1/maps/замок.png', 'maps/мир.png', 'Страд/characters/x.png']);
    expect(roleFolders(t, 'maps', 'Хранилище').map((r) => r.title)).toEqual(['Страд / Глава 1', 'Хранилище']);
  });

  it('стандартные папки, которых не хватает приключению', () => {
    const t = tree(['Страд/карты/x.png', 'Страд/персонажи/y.png']);
    expect(missingFolders(t.folders[0]!)).toEqual(['party', 'monsters', 'backgrounds', 'handouts', 'music']);
  });
});

describe('адреса картинок', () => {
  it('хранилище и библиотека, миниатюра', () => {
    expect(assetUrl('a/b c.png')).toBe('sg-asset://v/a%2Fb%20c.png');
    expect(assetUrl('library:images/x.png')).toBe('sg-asset://l/images%2Fx.png');
    expect(thumb('sg-asset://v/x.png', 200)).toBe('sg-asset://v/x.png?w=200');
  });

  it('подпись картинки по имени файла', () => {
    expect(prettyName('Глава 1/characters/староста_гилберт.jpg')).toBe('Староста Гилберт');
  });
});

describe('приключения', () => {
  const adv: AdventuresState = { list: ['Страд', 'Шахты'], current: 'Страд', initialized: true };

  it('видно своё приключение и общее, но не чужое', () => {
    expect(visibleIn(adv, 'Страд/maps/x.png')).toBe(true);
    expect(visibleIn(adv, 'maps/x.png')).toBe(true);
    expect(visibleIn(adv, 'Шахты/maps/x.png')).toBe(false);
    expect(visibleIn({ ...adv, current: null }, 'Шахты/maps/x.png')).toBe(true);
  });

  it('подписи групп', () => {
    expect(placeTitle(adv, 'Страд/Глава 1/maps', 'V')).toBe('Глава 1 / maps');
    expect(placeTitle(adv, 'Страд', 'V')).toBe('Страд');
    expect(placeTitle(adv, 'maps', 'V')).toBe('Общее / maps');
    expect(placeTitle({ ...adv, current: null }, '', 'V')).toBe('V');
  });
});
