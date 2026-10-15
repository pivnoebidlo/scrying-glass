// Встроенные звуки приложения (resources/sounds): пути «sound:sfx/Гром.ogg», «sound:ambience/Дождь.m4a».
export const BUILTIN_SOUND = 'sound:';
export const isBuiltinSound = (path: string) => path.startsWith(BUILTIN_SOUND);

export interface BuiltinSounds {
  // Разовые эффекты.
  sfx: string[];
  // Петли атмосферы.
  ambience: string[];
}
