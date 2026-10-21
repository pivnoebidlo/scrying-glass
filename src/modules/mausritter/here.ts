// The Mausritter parts of the window are needed only in Mausritter adventures.
import { currentSystem } from '../../shared/adventures';
import type { AppState } from '../../shared/types';
import { familyOf } from '../../systems';

export const mausHere = (app: AppState) => familyOf(currentSystem(app.adventures)) === 'mausritter';
