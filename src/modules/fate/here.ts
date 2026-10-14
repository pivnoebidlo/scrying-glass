// Fate-часть экрана нужна только в приключениях Fate.
import { currentSystem } from '../../shared/adventures';
import type { AppState } from '../../shared/types';
import { familyOf } from '../../systems';

export const fateHere = (app: AppState) => familyOf(currentSystem(app.adventures)) === 'fate';
