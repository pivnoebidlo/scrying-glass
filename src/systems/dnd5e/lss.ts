// Импорт персонажа из Long Story Short (longstoryshort.app): экспорт листа в JSON -> лист персонажа D&D 5e.
// В экспорте: { jsonType: 'character', edition, data: '<JSON строкой>' }. Тексты в data.text — документы редактора
// TipTap (ProseMirror), они переводятся в простую разметку карточек.
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
}

export const isLssExport = (j: unknown): j is { data: string; edition?: string } =>
  !!j && typeof j === 'object' && (j as { jsonType?: string }).jsonType === 'character' && typeof (j as { data?: unknown }).data === 'string';

export function fromLss(j: { data: string; edition?: string }): LssImport {
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

  const t: Dnd5eCharacter['text'] = {};
  const notes: { title: string; text: string }[] = [];
  for (const [key, v] of Object.entries((d.text ?? {}) as Record<string, Val & { customLabel?: string }>)) {
    if (/^spells-level-/.test(key)) continue;
    const value = text(v);
    if (!value) continue;
    if (TEXTS[key]) t[TEXTS[key]] = value;
    else notes.push({ title: v?.customLabel?.trim() || 'Заметки', text: value });
  }

  // Заклинания: ячейки slots-N, списки — тексты spells-level-N.
  const slots: Record<string, number> = {};
  for (const [key, v] of Object.entries((d.spells ?? {}) as Record<string, { value?: number }>)) {
    const m = /^slots-(\d)$/.exec(key);
    if (m && num(v)) slots[m[1]!] = num(v)!;
  }
  const spells: Record<string, string> = {};
  for (const [key, v] of Object.entries((d.text ?? {}) as Record<string, Val>)) {
    const m = /^spells-level-(\d)$/.exec(key);
    const value = m ? text(v) : '';
    if (m && value) spells[m[1]!] = value;
  }
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
    text: t,
    ...(notes.length ? { notes } : {}),
  };

  return {
    name: str(d.name) || 'Без имени',
    system: j.edition === '2024' ? 'dnd5e-2024' : 'dnd5e-2014',
    stats: character,
    lssId: avatarUrl ? (/\/avatar\/([0-9a-f]{24})/.exec(avatarUrl)?.[1] ?? null) : null,
    avatarUrl,
  };
}
