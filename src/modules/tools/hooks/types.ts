// Adventure hook generator: what the content of one language holds (content/<lang>.ts) and what a hook is.
export const THEMES = ['mystery', 'monster', 'intrigue', 'exploration', 'rescue'] as const;
export type Theme = (typeof THEMES)[number];

export interface HookContent {
  // How the patron reaches the heroes: «{patron}» — the patron's name and occupation.
  approaches: string[];
  // What the patron asks for, by theme.
  tasks: Record<Theme, string[]>;
  deadlines: string[];
  // What happens if the heroes fail or refuse.
  stakes: string[];
  places: string[];
  foes: string[];
  twists: string[];
  rewards: string[];
}

export interface Patron {
  name: string;
  occupation: string;
  trait: string;
}

export interface Hook {
  theme: Theme;
  patron: Patron;
  approach: string;
  task: string;
  deadline: string;
  stakes: string;
  place: string;
  foe: string;
  twist: string;
  reward: string;
}

export const HOOK_PARTS = ['patron', 'task', 'place', 'foe', 'twist', 'reward'] as const;
export type HookPart = (typeof HOOK_PARTS)[number];
