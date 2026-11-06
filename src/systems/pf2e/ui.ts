// Pathfinder 2e in the control window: the pack draws everything, this only claims the core's generators.
import type { SystemUi } from '../ui';

export const pf2eUi: SystemUi = {
  family: 'pf2e',
  // The core's fantasy generators fit Golarion too.
  claims: ['names', 'npc', 'tavern', 'settlement', 'hooks'],
};
