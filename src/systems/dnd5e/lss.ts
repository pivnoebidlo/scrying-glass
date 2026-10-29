// Импорт персонажа из Long Story Short (longstoryshort.app): экспорт листа в JSON -> лист персонажа D&D 5e.
// В экспорте: { jsonType: 'character', edition, data: '<JSON строкой>' }. Тексты в data.text — документы редактора
// TipTap (ProseMirror), они переводятся в простую разметку карточек.
import { t } from '../../shared/i18n';
import type { Ability, Size } from './stats';
import type { CharacterText, Dnd5eCharacter } from './character';

interface PmNode {
  type?: string;
  text?: string;
  marks?: { type?: string; attrs?: { href?: string } }[];
  content?: PmNode[];
  attrs?: { level?: number };
}

function inline(nodes: PmNode[] = []): string {
  return nodes
    .map((n) => {
      if (n.type === 'hardBreak') return '\n';
      let t = n.text ?? inline(n.content);
      if (!t.trim()) return t;
      const marks = new Set((n.marks ?? []).map((m) => m.type));
      if (marks.has('italic')) t = `*${t}*`;
      if (marks.has('bold')) t = `**${t}**`;
      return t;
    })
    .join('');
}

// Документ ProseMirror -> разметка карточек: абзацы через пустую строку, списки — «- …», заголовки — жирным.
export function prosemirrorToMarkdown(doc: PmNode | undefined): string {
  if (!doc) return '';
  const blocks: string[] = [];
  for (const n of doc.content ?? []) {
    if (n.type === 'bulletList' || n.type === 'orderedList') {
      blocks.push((n.content ?? []).map((li, i) => `${n.type === 'orderedList' ? `${i + 1}.` : '-'} ${(li.content ?? []).map((p) => inline(p.content)).join(' ')}`).join('\n'));
    } else if (n.type === 'heading') {
      blocks.push(`**${inline(n.content)}**`);
    } else {
      blocks.push(inline(n.content));
    }
  }
  return blocks.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
}

const ABILITIES: Ability[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const SIZES = new Set(['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan']);
const TEXTS: Record<string, CharacterText> = {
  features: 'features', traits: 'traits', prof: 'proficiencies', equipment: 'equipment', attacks: 'attacks',
  personality: 'personality', ideals: 'ideals', bonds: 'bonds', flaws: 'flaws', appearance: 'appearance',
  background: 'background', allies: 'allies', quests: 'quests',
};

type Val = { value?: unknown } | undefined;
const str = (v: Val) => (v?.value === undefined || v.value === null ? '' : String(v.value).trim());
const num = (v: Val | number | undefined) => {
  const raw = typeof v === 'object' ? v?.value : v;
  const n = typeof raw === 'number' ? raw : parseInt(String(raw ?? ''), 10);
  return Number.isFinite(n) ? n : undefined;
};
const text = (v: Val) => {
  const val = v?.value as { data?: PmNode } | string | undefined;
  return typeof val === 'string' ? val.trim() : prosemirrorToMarkdown(val?.data);
};

export interface LssImport {
  name: string;
  system: string;
  stats: Dnd5eCharacter;
  // Id персонажа в LSS: по нему повторный импорт обновляет карточку, а не создаёт новую.
  lssId: string | null;
  avatarUrl: string | null;
  // Что из LSS перенести не получилось (например, заклинания-карточки: в экспорте только их id).
  warnings: string[];
}

// Книга заклинаний LSS в режиме «карточки»: в экспорте только id заклинаний из базы LSS, без названий (база закрыта
// входом), а списков по кругам текстом нет.
type LssExport = { data: string; edition?: string; spells?: { mode?: string; prepared?: unknown[]; book?: unknown[] } };

export const isLssExport = (j: unknown): j is LssExport =>
  !!j && typeof j === 'object' && (j as { jsonType?: string }).jsonType === 'character' && typeof (j as { data?: unknown }).data === 'string';

// table — таблица заклинаний LSS (номер → название), для заклинаний-карточек.
export function fromLss(j: LssExport, table: LssSpellTable = {}): LssImport {
  const d = JSON.parse(j.data);
  const info = d.info ?? {};
  const stats = d.stats ?? {};
  const vit = d.vitality ?? {};

  const abilities = Object.fromEntries(ABILITIES.map((a) => [a, num(stats[a]?.score) ?? 10])) as Record<Ability, number>;
  const saves = ABILITIES.filter((a) => d.saves?.[a]?.isProf);
  const skills: Dnd5eCharacter['skills'] = {};
  for (const [key, s] of Object.entries((d.skills ?? {}) as Record<string, { isProf?: number | boolean }>)) {
    const level = s.isProf === 2 ? 2 : s.isProf ? 1 : 0;
    if (level) skills[key.replace(/ /g, '-')] = level;
  }

  const texts: Dnd5eCharacter['text'] = {};
  const notes: { title: string; text: string }[] = [];
  for (const [key, v] of Object.entries((d.text ?? {}) as Record<string, Val & { customLabel?: string }>)) {
    if (/^spells-level-/.test(key)) continue;
    const value = text(v);
    if (!value) continue;
    if (TEXTS[key]) texts[TEXTS[key]] = value;
    else notes.push({ title: v?.customLabel?.trim() || t('dnd.lss.notes'), text: value });
  }

  // Заклинания: ячейки slots-N, списки — тексты spells-level-N.
  const slots: Record<string, number> = {};
  for (const [key, v] of Object.entries((d.spells ?? {}) as Record<string, { value?: number }>)) {
    const m = /^slots-(\d)$/.exec(key);
    if (m && num(v)) slots[m[1]!] = num(v)!;
  }
  let spells: Record<string, string> = {};
  for (const [key, v] of Object.entries((d.text ?? {}) as Record<string, Val>)) {
    const m = /^spells-level-(\d)$/.exec(key);
    const value = m ? text(v) : '';
    if (m && value) spells[m[1]!] = value;
  }
  // Списков текстом нет, а книга — карточками: названия по номерам из таблицы.
  const cards = Object.keys(spells).length ? { spells: {}, warnings: [] } : cardSpells(j, table);
  if (!Object.keys(spells).length) spells = cards.spells;
  const base = d.spellsInfo?.base?.code as Ability | undefined;
  const spellcasting =
    base || Object.keys(spells).length
      ? {
          ability: base && ABILITIES.includes(base) ? base : 'int',
          ...(num(d.spellsInfo?.save) !== undefined ? { dc: num(d.spellsInfo.save) } : {}),
          ...(num(d.spellsInfo?.mod) !== undefined ? { attack: num(d.spellsInfo.mod) } : {}),
          slots,
          spells,
        }
      : undefined;

  const coins: Dnd5eCharacter['coins'] = {};
  for (const c of ['cp', 'sp', 'ep', 'gp', 'pp'] as const) {
    const n = num(d.coins?.[c]);
    if (n) coins[c] = n;
  }

  const details: Dnd5eCharacter['details'] = {};
  for (const k of ['age', 'height', 'weight', 'eyes', 'skin', 'hair'] as const) {
    const v = str(d.subInfo?.[k]);
    if (v) details[k] = v;
  }

  const size = String(info.size?.value ?? '');
  const avatarUrl: string | null = d.avatar?.jpeg ?? d.avatar?.webp ?? null;
  const character: Dnd5eCharacter = {
    ...(str(info.playerName) ? { player: str(info.playerName) } : {}),
    classes: [{ name: str(info.charClass), ...(str(info.charSubclass) ? { subclass: str(info.charSubclass) } : {}), level: num(info.level) ?? 1 }],
    race: str(info.race),
    background: str(info.background),
    alignment: str(info.alignment),
    ...(num(info.experience) !== undefined ? { xp: num(info.experience) } : {}),
    ...(SIZES.has(size) ? { size: size as Size } : {}),
    ...(Object.keys(details).length ? { details } : {}),
    abilities,
    saves,
    skills,
    // Бонус мастерства — только если он не такой, как по уровню (иначе пусть растёт с уровнем сам).
    ...(typeof d.proficiency === 'number' && d.proficiency !== 2 + Math.floor(((num(info.level) ?? 1) - 1) / 4) ? { pb: d.proficiency } : {}),
    ...(d.inspiration ? { inspiration: true } : {}),
    ac: num(vit.ac) ?? 10,
    hpMax: num(vit['hp-max']) ?? 1,
    ...(str(vit['hit-die']) ? { hitDie: str(vit['hit-die']) } : {}),
    speed: num(vit.speed) ?? 30,
    attacks: ((d.weaponsList ?? []) as { name?: Val; mod?: Val; dmg?: Val; notes?: Val }[])
      .filter((w) => str(w.name))
      .map((w) => ({ name: str(w.name), bonus: str(w.mod), damage: str(w.dmg), ...(str(w.notes) ? { notes: str(w.notes) } : {}) })),
    ...(spellcasting ? { spellcasting } : {}),
    ...(Object.keys(coins).length ? { coins } : {}),
    text: texts,
    ...(notes.length ? { notes } : {}),
  };

  return {
    name: str(d.name) || t('dnd.lss.unnamed'),
    system: j.edition === '2024' ? 'dnd5e-2024' : 'dnd5e-2014',
    stats: character,
    lssId: avatarUrl ? (/\/avatar\/([0-9a-f]{24})/.exec(avatarUrl)?.[1] ?? null) : null,
    avatarUrl,
    warnings: cards.warnings,
  };
}

// ---------- Заклинания-карточки ----------
// В режиме «карточки» лист LSS хранит только номера заклинаний из базы LSS (id MongoDB, 24 шестнадцатеричных
// символа). Их названия мастер берёт из своей таблицы: сохраняет ответы API LSS (инструменты разработчика браузера)
// и загружает их в настройках «Карточки» — collectLssSpells находит заклинания в любом таком JSON.

export interface LssSpell {
  name: string;
  // Английское название (в LSS — «Свет [Light]»).
  en?: string;
  level: number;
}
export type LssSpellTable = Record<string, LssSpell>;

const LSS_ID = /^[0-9a-f]{24}$/;

// Заклинания LSS в произвольном JSON: объекты с _id, name и кругом (system.level или level), на любой глубине.
export function collectLssSpells(json: unknown, out: LssSpellTable = {}): LssSpellTable {
  const walk = (v: unknown) => {
    if (Array.isArray(v)) return v.forEach(walk);
    if (!v || typeof v !== 'object') return;
    const o = v as { _id?: unknown; name?: unknown; type?: unknown; level?: unknown; system?: { level?: unknown } };
    const level = typeof o.system?.level === 'number' ? o.system.level : typeof o.level === 'number' ? o.level : null;
    if (typeof o._id === 'string' && LSS_ID.test(o._id) && typeof o.name === 'string' && level !== null && (o.type === undefined || o.type === 'spell')) {
      const m = /^(.*?)\s*\[([^\]]+)\]\s*$/.exec(o.name.trim());
      out[o._id] = { name: (m ? m[1]! : o.name).trim(), ...(m ? { en: m[2]!.trim() } : {}), level };
      return;
    }
    Object.values(v).forEach(walk);
  };
  walk(json);
  return out;
}

const spellIds = (j: LssExport) => [...new Set([...(j.spells?.prepared ?? []), ...(j.spells?.book ?? [])].filter((x): x is string => typeof x === 'string'))];

// Списки заклинаний по кругам из номеров (по таблице) и предупреждение о тех, что не нашлись.
function cardSpells(j: LssExport, table: LssSpellTable): { spells: Record<string, string>; warnings: string[] } {
  const ids = spellIds(j);
  const byLevel: Record<string, string[]> = {};
  const missing = ids.filter((id) => !table[id]);
  // LSS has two spell databases (2014 and 2024) with different ids and Russian names, and a spellbook can mix
  // them: one spell is one line, by its English name. Prepared spells come first, so their name wins.
  const seen = new Set<string>();
  for (const id of ids) {
    const s = table[id];
    if (!s) continue;
    const key = `${s.level}:${(s.en ?? s.name).toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    (byLevel[String(s.level)] ??= []).push(s.name);
  }
  const total = seen.size + missing.length;
  const spells = Object.fromEntries(Object.entries(byLevel).map(([l, names]) => [l, names.sort((a, b) => a.localeCompare(b, 'ru')).join(', ')]));
  if (!missing.length) return { spells, warnings: [] };
  const how = t('dnd.lss.how');
  return {
    spells,
    warnings: [
      missing.length === ids.length
        ? t('dnd.lss.cards', { n: ids.length, how })
        : t('dnd.lss.missing', { n: missing.length, total, how }),
    ],
  };
}
