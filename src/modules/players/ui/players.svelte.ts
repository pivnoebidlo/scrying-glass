// The status of the players' sheets in the control window (the core keeps the real thing, main/players.ts).
import { refKey, type CardRef } from '../../../shared/cards';
import { playerUrl, type PlayerRow, type PlayerStatus } from '../../../shared/players';
import { dispatch, store } from '../../../renderer/lib/store.svelte';

class Players {
  status = $state.raw<PlayerStatus>({ on: false, port: 0, addresses: [], party: [] });
  // The character whose QR code is open.
  qr = $state<string | null>(null);
  // The network chosen by the GM (in the state: the players' screen shows the same links); none — the likely one.
  get address() {
    return store.state.players.address ?? '';
  }
  set address(address: string) {
    void dispatch('players', 'setAddress', { address });
  }

  get host() {
    return this.status.addresses.includes(this.address) ? this.address : (this.status.addresses[0] ?? '');
  }
  get codes() {
    return !!store.state.players.codes;
  }
  // The codes of the whole party on the players' screen; the server goes on with them.
  async showCodes(on: boolean) {
    if (on && !this.status.on) await this.toggle(true);
    await dispatch('players', 'showCodes', { on });
  }
  urlOf(row: PlayerRow) {
    return playerUrl(this.host, this.status.port, row.token);
  }
  async toggle(on: boolean) {
    this.status = await window.api.setPlayersOn(on);
  }
  async renew(ref: CardRef) {
    this.status = await window.api.renewPlayer($state.snapshot(ref));
  }
  // Turns the server on if it is off: a code nobody can open helps no one.
  async show(row: PlayerRow) {
    if (!this.status.on) await this.toggle(true);
    this.qr = refKey(row.ref);
  }
}

export const players = new Players();

let connected = false;
// Once per window: the GM's window and the players' screen both listen.
export async function connectPlayers() {
  if (connected) return;
  connected = true;
  window.api.onPlayerStatus((s) => (players.status = s));
  players.status = await window.api.playerStatus();
}
