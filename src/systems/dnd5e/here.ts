// Is a system D&D: for the D&D tools that also open in other systems' adventures (turned on in the settings) and
// then leave the rules and the SRD out.
import { familyOf } from '..';

export const isDnd = (id: string) => familyOf(id) === 'dnd5e';
