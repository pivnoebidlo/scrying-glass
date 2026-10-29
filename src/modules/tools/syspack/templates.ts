// What a new system in the builder starts from: a blank pack, or a small working one of a kind of game — a pool of
// d6 counting sixes, d20 + bonus, 2d6 with outcomes, the best of a d6 pool, a die under the value, 4dF. A few fields,
// their rolls and the tracker; the GM changes them as they like. Texts in English and Russian; pure (a test validates
// every one).
import { blankPack, type FieldDef, type Loc, type SystemPack, type TrackerSpec } from '../../../shared/syspack';

export type TemplateId = 'blank' | 'pool' | 'd20' | 'pbta' | 'fitd' | 'under' | 'fate';
export const TEMPLATES: TemplateId[] = ['blank', 'pool', 'd20', 'pbta', 'fitd', 'under', 'fate'];

const L = (en: string, ru: string): Loc => ({ en, ru });
const dots = (key: string, title: Loc, max: number, extra: Partial<FieldDef> = {}): FieldDef => ({ key, type: 'dots', title, max, ...extra });
const number = (key: string, title: Loc, min: number, max: number, extra: Partial<FieldDef> = {}): FieldDef => ({ key, type: 'number', title, min, max, ...extra });
const notes = (): FieldDef => ({ key: 'notes', type: 'textarea', title: L('Notes', 'Заметки') });

function pack(id: string, title: Loc, about: Loc, sections: SystemPack['sections'], tracker: TrackerSpec, subtitle?: Loc): SystemPack {
  return { scryingGlass: 'system', version: 1, id, title, release: 1, about, sections, tracker, ...(subtitle ? { subtitle } : {}) };
}

export function fromTemplate(id: TemplateId, packId: string, title: Loc): SystemPack {
  switch (id) {
    case 'blank':
      return blankPack(packId, title);
    case 'pool': {
      const attrs: [string, Loc][] = [['strength', L('Strength', 'Сила')], ['agility', L('Agility', 'Ловкость')], ['wits', L('Wits', 'Смекалка')]];
      const skills: [string, Loc, string][] = [['might', L('Might', 'Мощь'), 'strength'], ['stealth', L('Stealth', 'Скрытность'), 'agility'], ['scouting', L('Scouting', 'Разведка'), 'wits']];
      return pack(
        packId,
        title,
        L('Pools of d6: attribute + skill dice, sixes are successes', 'Пулы к6: кубы характеристики и навыка, шестёрки — успехи'),
        [
          { id: 'attributes', title: L('Attributes', 'Характеристики'), fields: attrs.map(([k, t]) => dots(k, t, 5, { default: 2 })) },
          {
            id: 'skills',
            title: L('Skills', 'Навыки'),
            fields: skills.map(([k, t, a]) => dots(k, t, 5, { roll: { type: 'pool', sides: 6, count: `min(15, ${a} + ${k})`, success: 6, ask: true, need: true, tweak: true } })),
          },
          { id: 'health', title: L('Health', 'Здоровье'), fields: [{ key: 'damage', type: 'track', title: L('Damage', 'Урон'), boxes: 'strength' }, notes()] },
        ],
        { init: { type: 'none' }, cells: ['damage'], conditions: { free: true } },
      );
    }
    case 'd20': {
      const abilities: [string, Loc][] = [['might', L('Might', 'Мощь')], ['agility', L('Agility', 'Ловкость')], ['mind', L('Mind', 'Разум')]];
      return pack(
        packId,
        title,
        L('d20 + bonus against a difficulty, hit points and armour', 'к20 + бонус против сложности, хиты и броня'),
        [
          { id: 'abilities', title: L('Abilities', 'Характеристики'), fields: abilities.map(([k, t]) => number(k, t, -5, 10, { default: 0, roll: { type: 'd20', bonus: k, degrees: 'two' } })) },
          { id: 'defence', title: L('Defence', 'Защита'), fields: [number('hp', L('Hit points', 'Хиты'), 0, 999, { default: 10 }), number('ac', L('Armour', 'Броня'), 0, 40, { default: 12 })] },
          { id: 'notes', title: L('Notes', 'Заметки'), fields: [notes()] },
        ],
        { init: { type: 'roll', dice: '1d20', bonus: 'agility' }, hp: 'hp', cells: ['ac'], conditions: { free: true } },
        L('HP {hp} · AC {ac}', 'Хиты {hp} · Броня {ac}'),
      );
    }
    case 'pbta': {
      const stats: [string, Loc][] = [['cool', L('Cool', 'Хладнокровие')], ['hard', L('Hard', 'Жёсткость')], ['hot', L('Hot', 'Обаяние')], ['sharp', L('Sharp', 'Зоркость')]];
      return pack(
        packId,
        title,
        L('2d6 + stat: 10+ — a success, 7–9 — with a cost, 6− — the GM makes a move', '2к6 + показатель: 10+ — успех, 7–9 — с ценой, 6− — ход мастера'),
        [
          {
            id: 'stats',
            title: L('Stats', 'Показатели'),
            fields: stats.map(([k, t]) =>
              number(k, t, -2, 3, {
                default: 0,
                roll: { type: 'bands', dice: '2d6', bonus: k, bands: [{ min: 10, title: L('Success', 'Успех') }, { min: 7, title: L('Success with a cost', 'Успех с ценой') }, { min: -99, title: L('Miss', 'Провал') }] },
              }),
            ),
          },
          { id: 'harm', title: L('Harm', 'Вред'), fields: [{ key: 'harm', type: 'track', title: L('Harm', 'Вред'), boxes: 6 }, { key: 'moves', type: 'textarea', title: L('Moves', 'Ходы') }] },
        ],
        { init: { type: 'none' }, cells: ['harm'], conditions: { free: true } },
      );
    }
    case 'fitd': {
      const actions: [string, Loc][] = [['hunt', L('Hunt', 'Выслеживать')], ['study', L('Study', 'Изучать')], ['prowl', L('Prowl', 'Красться')], ['skirmish', L('Skirmish', 'Драться')], ['sway', L('Sway', 'Убеждать')], ['command', L('Command', 'Командовать')]];
      return pack(
        packId,
        title,
        L('Actions as dots, the best of a d6 pool, stress and harm', 'Действия точками, лучший куб из пула к6, стресс и вред'),
        [
          { id: 'actions', title: L('Actions', 'Действия'), fields: actions.map(([k, t]) => dots(k, t, 4, { roll: { type: 'pool', sides: 6, count: k, best: true, ask: true } })) },
          {
            id: 'stress',
            title: L('Stress and harm', 'Стресс и вред'),
            fields: [
              { key: 'stress', type: 'track', title: L('Stress', 'Стресс'), boxes: 9 },
              { key: 'trauma', type: 'tags', title: L('Trauma', 'Травмы') },
              { key: 'harm', type: 'text', title: L('Harm', 'Вред') },
            ],
          },
        ],
        { init: { type: 'none' }, cells: ['stress'], conditions: { free: true } },
      );
    }
    case 'under': {
      const stats: [string, Loc][] = [['str', L('STR', 'СИЛ')], ['dex', L('DEX', 'ЛОВ')], ['wil', L('WIL', 'ВОЛ')]];
      return pack(
        packId,
        title,
        L('Saves: d20 at most the attribute, hit points, damage', 'Спасброски: к20 не выше характеристики, хиты, урон'),
        [
          {
            id: 'stats',
            title: L('Attributes', 'Характеристики'),
            fields: [number('hp', L('HP', 'Хиты'), 0, 99, { default: 4 }), ...stats.map(([k, t]) => number(k, t, 0, 20, { default: 10, roll: { type: 'under', sides: 20, target: k } }))],
          },
          {
            id: 'attacks',
            title: L('Attacks', 'Атаки'),
            fields: [
              {
                key: 'attacks',
                type: 'list',
                title: L('Weapons', 'Оружие'),
                columns: [{ key: 'name', type: 'text', title: L('Weapon', 'Оружие') }, { key: 'damage', type: 'dice', title: L('Damage', 'Урон') }],
                roll: { type: 'sum', dice: 'row.damage' },
              },
              notes(),
            ],
          },
        ],
        { init: { type: 'none' }, hp: 'hp', cells: ['str', 'dex', 'wil'], conditions: { free: true } },
        L('HP {hp} · STR {str} · DEX {dex} · WIL {wil}', 'Хиты {hp} · СИЛ {str} · ЛОВ {dex} · ВОЛ {wil}'),
      );
    }
    case 'fate': {
      const ladder = [
        [8, 'Legendary', 'Легендарно'], [7, 'Epic', 'Эпично'], [6, 'Fantastic', 'Фантастически'], [5, 'Superb', 'Превосходно'], [4, 'Great', 'Отлично'],
        [3, 'Good', 'Хорошо'], [2, 'Fair', 'Неплохо'], [1, 'Average', 'Средне'], [0, 'Mediocre', 'Посредственно'], [-1, 'Poor', 'Плохо'], [-99, 'Terrible', 'Ужасно'],
      ] as const;
      const labels = ladder.map(([min, en, ru]) => ({ min, title: L(en, ru) }));
      const skills: [string, Loc][] = [['fight', L('Fight', 'Драка')], ['athletics', L('Athletics', 'Атлетика')], ['notice', L('Notice', 'Внимание')], ['will', L('Will', 'Воля')]];
      return pack(
        packId,
        title,
        L('Aspects, skills on the ladder, 4dF + skill, stress', 'Аспекты, навыки по лестнице, 4dF + навык, стресс'),
        [
          { id: 'aspects', title: L('Aspects', 'Аспекты'), fields: [{ key: 'concept', type: 'text', title: L('High concept', 'Концепция') }, { key: 'trouble', type: 'text', title: L('Trouble', 'Беда') }] },
          { id: 'skills', title: L('Skills', 'Навыки'), fields: skills.map(([k, t]) => number(k, t, 0, 5, { hideZero: true, roll: { type: 'fate', bonus: k, labels } })) },
          { id: 'stress', title: L('Stress', 'Стресс'), fields: [{ key: 'stress', type: 'track', title: L('Stress', 'Стресс'), boxes: 3 }, { key: 'consequences', type: 'textarea', title: L('Consequences', 'Последствия') }] },
        ],
        { init: { type: 'none' }, cells: ['stress'], conditions: { free: true } },
      );
    }
  }
}
