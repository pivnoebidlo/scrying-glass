// A town's buildings as pins on the map: what it is, who runs it, a name for the tavern. Made afresh for each map
// (the window: names and people come from the settlement generator).
import { locale, t } from '../../../renderer/lib/i18n.svelte';
import type { PinIcon } from '../../maps/icons';
import { helpers } from '../settlement/store.svelte';
import type { LandmarkKind, Layout } from './layout';
import { landmarkCell, type MapExtras } from './toMaps';

const ICON: Record<LandmarkKind, PinIcon> = { tavern: 'beer', temple: 'church', shop: 'store', hall: 'landmark', smithy: 'anvil' };

export async function landmarkPins(l: Layout): Promise<MapExtras['pins']> {
  if (!l.landmarks?.length) return [];
  const h = await helpers(locale.lang === 'ru' ? 'ru' : 'en');
  return l.landmarks.map((m) => {
    const who = h.person('');
    const kind = t(`mapgen.landmark.${m.kind}`);
    const title = m.kind === 'tavern' ? h.tavernName() || kind : kind;
    const trait = who.trait.charAt(0).toUpperCase() + who.trait.slice(1);
    const note = `${m.kind === 'tavern' ? `${kind}\n\n` : ''}${t('mapgen.inCharge', { name: who.name })}\n\n${trait}`;
    return { ...landmarkCell(l, m), title, note, color: 'gold' as const, icon: ICON[m.kind] };
  });
}
