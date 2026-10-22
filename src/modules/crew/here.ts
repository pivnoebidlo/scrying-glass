// The crew parts of the window are needed only in Forged in the Dark adventures.
import { currentSystem } from '../../shared/adventures';
import type { AppState } from '../../shared/types';
import { familyOf } from '../../systems';

export const fitdHere = (app: AppState) => familyOf(currentSystem(app.adventures)) === 'fitd';
