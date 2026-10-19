// The schedule in the window: loaded from the core and reloaded on its event; saving the games; starting a game.
import { openTab } from '../../../renderer/lib/nav';
import { dispatch, store } from '../../../renderer/lib/store.svelte';
import { EMPTY_SCHEDULE, nextGame, type Game, type Occurrence, type ScheduleData } from '../../../shared/schedule';
import { setTable } from '../../telegram/ui/tg.svelte';

export const sched = $state({ data: EMPTY_SCHEDULE as ScheduleData, now: Date.now() });

let hooked = false;
export async function loadSchedule() {
  if (!hooked) {
    hooked = true;
    window.api.onScheduleChanged(() => void loadSchedule());
    // «In 2 hours» and the next game move on by themselves.
    setInterval(() => (sched.now = Date.now()), 60000);
  }
  sched.data = await window.api.schedule();
}
export async function saveGames(games: Game[]) {
  sched.data = await window.api.saveSchedule($state.snapshot(games) as Game[]);
}

export const next = () => nextGame(sched.data.games, sched.now);
export const sameVault = (g: Game) => !g.vault || g.vault === store.state.vault.root;

// Start a game: its adventure and table, its plan pinned in the journal, the scenes open.
export async function startGame(o: Occurrence) {
  const g = o.game;
  if (!sameVault(g)) return;
  if (g.adventure !== undefined && g.adventure !== store.state.adventures.current) await dispatch('adventures', 'select', { path: g.adventure ?? null });
  if (g.table !== undefined) setTable(g.table ?? '');
  if (g.plan) await dispatch('journal', 'pin', { adventure: g.adventure ?? null, path: g.plan });
  openTab('scenes');
}
