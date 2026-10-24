// The adventure repository (shared/repo.ts): what the vault knows of it — the adventures the GM published (to update
// the same entry) and the ones downloaded from it (to offer their new versions). Keys are adventure folders.
import { defineModule } from '../../shared/module';
import { sourceOf, type InstalledMark, type PublishedMark } from '../../shared/repo';

export interface RepoState {
  published: Record<string, PublishedMark>;
  installed: Record<string, InstalledMark>;
}

const initialState: RepoState = { published: {}, installed: {} };

const without = <T>(o: Record<string, T>, key: string) => Object.fromEntries(Object.entries(o).filter(([k]) => k !== key));

export default defineModule({
  id: 'repo',
  persist: true,
  initialState,

  actions: {
    published(s, { folder, mark }: { folder: string; mark: PublishedMark | null }) {
      return { ...s, published: mark ? { ...s.published, [folder]: mark } : without(s.published, folder) };
    },

    installed(s, { folder, mark }: { folder: string; mark: InstalledMark | null }) {
      return { ...s, installed: mark ? { ...s.installed, [folder]: mark } : without(s.installed, folder) };
    },

    // The GM took an adventure off a source: none of the vault's folders is published there under that id any more.
    unpublished(s, { id, source }: { id: string; source?: string }) {
      const gone = (m: PublishedMark) => m.id === id && sourceOf(m) === (source ?? sourceOf({}));
      return { ...s, published: Object.fromEntries(Object.entries(s.published).filter(([, m]) => !gone(m))) };
    },
  },
});
