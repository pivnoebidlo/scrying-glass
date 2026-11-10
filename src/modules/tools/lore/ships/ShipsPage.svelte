<!-- Tools → Ships: a ship met in port or at sea — what she is and her name, the captain, the crew, the cargo, what is
     odd about her, her secret and her trouble. -->
<script lang="ts">
  import { t } from '../../../../renderer/lib/i18n.svelte';
  import { sentence, type LoreView, type Result } from '../engine';
  import LorePage from '../LorePage.svelte';
  import { loreStore } from '../store.svelte';
  import { en } from './en';
  import { ru } from './ru';
  import { shipParts } from './parts';

  const gen = loreStore('ships.state', { en, ru }, () => shipParts);
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const view = (r: Result): LoreView => ({
    title: `${cap(r['name'] ?? '')} — ${r['kindName']}`,
    page: t('ships.pageTitle', { name: r['name'] ?? '' }),
    parts: [
      { id: 'kind', label: t('ships.part.kind'), lines: [sentence(`${r['kindName']}: ${r['kindAbout']}`)], wide: true },
      { id: 'name', label: t('ships.part.name'), lines: [cap(r['name'] ?? '')] },
      { id: 'captain', label: t('ships.part.captain'), lines: [cap(r['captain'] ?? ''), sentence(r['captainTrait'] ?? '')] },
      { id: 'crew', label: t('ships.part.crew'), lines: [t('ships.crewSize', { count: Number(r['crewSize'] ?? 0) }), sentence(r['crewMood'] ?? '')] },
      { id: 'cargo', label: t('ships.part.cargo'), lines: [sentence(r['cargo'] ?? '')] },
      { id: 'quirk', label: t('ships.part.quirk'), lines: [sentence(r['quirk'] ?? '')] },
      { id: 'secret', label: t('ships.part.secret'), lines: [sentence(r['secret'] ?? '')] },
      { id: 'trouble', label: t('ships.part.trouble'), lines: [sentence(r['trouble'] ?? '')] },
    ],
  });
</script>

<LorePage {gen} title={t('ships.title')} about={t('ships.about')} create={t('ships.create')} empty={t('ships.empty')} {view} />
