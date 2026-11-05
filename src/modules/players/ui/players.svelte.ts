// The status of the players' sheets in the control window (the core keeps the real thing, main/players.ts).
import { refKey, type CardRef } from '../../../shared/cards';
import { playerUrl, type PlayerRow, type PlayerStatus } from '../../../shared/players';

class Players {
  status = $state.raw<PlayerStatus>({ on: false, port: 0, addresses: [], party: [] });
  // The character whose QR code is open.
  qr = $state<string | null>(null);
  // The network chosen by the GM; none — the likely one.
  address = $state('');

  get host() {
    return this.status.addresses.includes(this.address) ? this.address : (this.status.addresses[0] ?? '');
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

export async function connectPlayers() {
  window.api.onPlayerStatus((s) => (players.status = s));
  players.status = await window.api.playerStatus();
}
