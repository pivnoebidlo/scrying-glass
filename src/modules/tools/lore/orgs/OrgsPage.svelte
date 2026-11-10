<!-- Tools → Guilds and cults: a guild (trade, leader, seat, goal, custom, rival, secret, sign, what it offers the
     heroes) or a cult (whom it serves, leader, its public face, rite, sign, who joins, goal, secret, omens). -->
<script lang="ts">
  import { t } from '../../../../renderer/lib/i18n.svelte';
  import { sentence, type LoreView, type Result } from '../engine';
  import LorePage from '../LorePage.svelte';
  import { loreStore } from '../store.svelte';
  import { en } from './en';
  import { ru } from './ru';
  import { cultParts, guildParts } from './parts';
  import { ORG_KINDS } from './types';

  const gen = loreStore('orgs.state', { en, ru }, (k) => (k === 'cult' ? cultParts : guildParts), ORG_KINDS);
  const s = (r: Result, k: string) => sentence(r[k] ?? '');

  function view(r: Result, kind: string): LoreView {
    const name = r['name'] ?? '';
    if (kind === 'cult')
      return {
        title: name,
        page: t('orgs.pageTitle', { name }),
        parts: [
          { id: 'what', label: t('orgs.cult.what'), lines: [s(r, 'entity')], wide: true },
          { id: 'leader', label: t('orgs.leader'), lines: [r['leader'] ?? '', s(r, 'leaderTrait')] },
          { id: 'front', label: t('orgs.cult.front'), lines: [s(r, 'front')] },
          { id: 'rite', label: t('orgs.cult.rite'), lines: [s(r, 'rite')] },
          { id: 'sign', label: t('orgs.sign'), lines: [s(r, 'sign')] },
          { id: 'members', label: t('orgs.cult.members'), lines: [s(r, 'members')] },
          { id: 'goal', label: t('orgs.goal'), lines: [s(r, 'goal')] },
          { id: 'secret', label: t('orgs.secret'), lines: [s(r, 'secret')] },
          { id: 'omens', label: t('orgs.cult.omens'), lines: [s(r, 'omens'), s(r, 'omens2')], wide: true },
        ],
      };
    return {
      title: name,
      page: t('orgs.pageTitle', { name }),
      parts: [
        { id: 'what', label: t('orgs.guild.what'), lines: [s(r, 'trade')], wide: true },
        { id: 'leader', label: t('orgs.leader'), lines: [r['leader'] ?? '', s(r, 'leaderTrait')] },
        { id: 'seat', label: t('orgs.guild.seat'), lines: [s(r, 'seat')] },
        { id: 'goal', label: t('orgs.goal'), lines: [s(r, 'goal')] },
        { id: 'custom', label: t('orgs.guild.custom'), lines: [s(r, 'custom')] },
        { id: 'rival', label: t('orgs.guild.rival'), lines: [s(r, 'rival')] },
        { id: 'secret', label: t('orgs.secret'), lines: [s(r, 'secret')] },
        { id: 'sign', label: t('orgs.sign'), lines: [s(r, 'sign')] },
        { id: 'offer', label: t('orgs.guild.offer'), lines: [s(r, 'offer')] },
      ],
    };
  }
</script>

<LorePage
  {gen}
  title={t('orgs.title')}
  about={t('orgs.about')}
  create={t('orgs.create')}
  empty={t('orgs.empty')}
  kindLabel={t('orgs.kind')}
  kinds={ORG_KINDS.map((id) => ({ id, label: t(`orgs.kind.${id}`) }))}
  {view}
/>
