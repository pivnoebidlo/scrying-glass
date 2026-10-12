// Вклады всех модулей подхватываются автоматически: modules/<имя>/control.ts и display.ts
import type { ModuleId } from '../../shared/types';
import type { ControlContribution, DisplayContribution, FileAction } from './contrib';

export const controlContributions = Object.values(
  import.meta.glob<ControlContribution<ModuleId>>('../../modules/*/control.ts', { eager: true, import: 'default' })
).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

export const displayContributions = Object.values(
  import.meta.glob<DisplayContribution<ModuleId>>('../../modules/*/display.ts', { eager: true, import: 'default' })
).sort((a, b) => a.order - b.order);

// Действия с файлами от всех модулей, в порядке модулей.
export const imageActions: FileAction[] = controlContributions.flatMap((c) => c.imageActions ?? []);
export const audioActions: FileAction[] = controlContributions.flatMap((c) => c.audioActions ?? []);
