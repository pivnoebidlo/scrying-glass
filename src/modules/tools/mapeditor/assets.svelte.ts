// The GM's own pictures in the window: the index from the core (main/mapassets.ts) and the pictures a map uses, loaded
// once each. The palette shows thumbnails (sg-asset://l/…?w=); the map draws full pictures, loaded with CORS so that
// the canvas can still be saved as a PNG («To Maps»).
import { assetUrl, LIBRARY } from '../../../shared/vault';
import { ASSET_DIR, assetThings, type AssetThing, type InstalledAssetPack, type MapAsset } from '../../../shared/mapassets';
import { setAssetPictures } from '../mapgen/draw-props';
import type { Layout } from '../mapgen/layout';

export const assetSrc = (path: string) => assetUrl(`${LIBRARY}${ASSET_DIR}/${path}`);

class Assets {
  list = $state.raw<MapAsset[]>([]);
  // The folders of assets/ that are packs.
  packs = $state.raw<InstalledAssetPack[]>([]);
  cut = $state(false);
  ready = $state(false);
  // Grows when a picture has loaded: the map draws again.
  rev = $state(0);
  things = $derived<AssetThing[]>(assetThings(this.list));
  byPath = $derived(new Map(this.list.map((a) => [a.path, a])));
  byBase = $derived(new Map(this.things.map((t) => [t.base, t])));
  private pictures = new Map<string, HTMLImageElement | null>();
  private waiting = new Map<string, Promise<void>>();
  private listening = false;

  async load(fresh = false) {
    if (!this.listening) {
      this.listening = true;
      window.api.onMapAssetsChanged(() => void this.load());
    }
    const r = await window.api.listMapAssets(fresh);
    this.list = r.list;
    this.packs = r.packs;
    this.cut = r.cut;
    this.ready = true;
    if (fresh) {
      // Pictures changed on disk: load them again when drawn.
      this.pictures.clear();
      this.waiting.clear();
      this.rev++;
    }
  }

  // A picture ready to draw, or null (loading now, or the file is gone).
  picture(path: string): HTMLImageElement | null {
    const known = this.pictures.get(path);
    if (known === undefined) {
      void this.fetch(path);
      return null;
    }
    return known && known.complete && known.naturalWidth ? known : null;
  }

  private fetch(path: string): Promise<void> {
    const had = this.waiting.get(path);
    if (had) return had;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    this.pictures.set(path, img);
    const done = new Promise<void>((resolve) => {
      img.onload = () => {
        this.rev++;
        resolve();
      };
      img.onerror = () => {
        this.pictures.set(path, null);
        this.rev++;
        resolve();
      };
    });
    img.src = assetSrc(path);
    this.waiting.set(path, done);
    return done;
  }

  // Every picture of a layout loaded (before it is saved as a PNG).
  async loadFor(l: Layout) {
    const paths = new Set((l.props ?? []).flatMap((p) => (p.kind === 'asset' && p.asset ? [p.asset] : [])));
    await Promise.all([...paths].map((p) => this.fetch(p)));
  }
}

export const assets = new Assets();
setAssetPictures((path) => assets.picture(path));
