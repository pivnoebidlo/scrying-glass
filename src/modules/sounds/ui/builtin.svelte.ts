// Встроенные звуки приложения (resources/sounds) для выбора в подборке: грузятся один раз за запуск окна.
import type { BuiltinSounds } from '../../../shared/sounds';

export const builtin = $state<BuiltinSounds>({ sfx: [], ambience: [] });

let loading: Promise<void> | null = null;
export function loadBuiltin() {
  loading ??= window.api.builtinSounds().then((b) => void Object.assign(builtin, b));
  return loading;
}
