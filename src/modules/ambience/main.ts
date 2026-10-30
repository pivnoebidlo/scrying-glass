// Ambience: looped sounds over the music. A block of its own in the right panel; the state is the music's
// (`music.ambience`, `ambiencePlaying`, `ambienceVolume` — the background player plays it), so nothing here.
import { defineModule } from '../../shared/module';

export default defineModule({
  id: 'ambience',
  persist: false,
  initialState: {} as Record<string, never>,
  actions: {},
});
