import { describe, expect, it } from 'vitest';
import portraits from '../src/modules/portraits/main';
import { inTrayOrder, type PortraitsState } from '../src/modules/portraits/types';
import { ctx, run } from './helpers';

describe('портреты', () => {
  it('«игроки не знают имени»: переключается; старые сохранения дополняются', () => {
    let s = run(portraits, portraits.initialState, 'toggleUnknown', { path: 'a.png' });
    expect(s.unknown).toEqual(['a.png']);
    s = run(portraits, s, 'toggleUnknown', { path: 'a.png' });
    expect(s.unknown).toEqual([]);
    const old = { ...portraits.initialState, unknown: undefined } as unknown as PortraitsState;
    expect(portraits.init!(old, ctx()).unknown).toEqual([]);
  });

  it('the portraits on screen follow the order of the tray; those not in it stay after them', () => {
    expect(inTrayOrder(['a', 'b', 'loose', 'c'], ['c', 'x', 'a', 'b'])).toEqual(['c', 'a', 'b', 'loose']);
    expect(inTrayOrder([], ['a'])).toEqual([]);
  });
});
