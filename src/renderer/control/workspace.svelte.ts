// Раскладка окна управления: открытые вкладки, боковая панель, настройки. Живёт только в окне,
// в ядро не попадает. Вкладки и боковая панель запоминаются между запусками.
import type { ModuleId } from '../../shared/types';
import { controlContributions } from '../lib/registry';
import { store } from '../lib/store.svelte';
import { provideNav } from '../lib/nav';

const KEY = 'sg.workspace';

interface Saved {
  tabs: ModuleId[];
  active: ModuleId | null;
  sidebar: ModuleId | null;
  sidebarOpen: boolean;
  displayId: number | null;
  screenClosed: string[];
}

const known = new Set<string>(controlContributions.map((c) => c.id));

function load(): Partial<Saved> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

class Workspace {
  tabs = $state<ModuleId[]>([]);
  active = $state<ModuleId | null>(null);
  sidebar = $state<ModuleId | null>(null);
  sidebarOpen = $state(true);
  settingsOpen = $state(false);
  settingsSection = $state<string>('');
  // Экран, выбранный для игроков (null — подобрать автоматически).
  displayId = $state<number | null>(null);
  // Блоки правой панели «Экран игроков», которые мастер свернул (пустые блоки свёрнуты и так).
  screenClosed = $state<string[]>([]);

  constructor() {
    const s = load();
    this.tabs = (s.tabs ?? []).filter((id) => known.has(id));
    this.active = s.active && this.tabs.includes(s.active) ? s.active : (this.tabs[0] ?? null);
    this.sidebar = s.sidebar && known.has(s.sidebar) ? s.sidebar : null;
    this.sidebarOpen = s.sidebarOpen ?? true;
    this.displayId = s.displayId ?? null;
    this.screenClosed = s.screenClosed ?? [];

    // При первом запуске открываем первый модуль.
    const first = controlContributions[0];
    if (!this.tabs.length && !this.sidebar && first) this.select(first.id);
  }

  // Выбранный экран, если он подключён; иначе неосновной (проектор / телевизор), иначе любой.
  get display() {
    const list = store.displays;
    return list.find((d) => d.id === this.displayId) ?? list.find((d) => !d.primary) ?? list[0] ?? null;
  }

  // Клик по модулю в полосе слева: показать его панель и вкладку. Повторный клик сворачивает панель.
  select(id: ModuleId) {
    // У модуля нет боковой панели: просто открываем его вкладку, панель оставляем как есть.
    if (!controlContributions.find((c) => c.id === id)?.sidebar) {
      this.openTab(id);
      return;
    }
    if (this.sidebar === id && this.sidebarOpen && this.active === id) {
      this.sidebarOpen = false;
      return;
    }
    this.sidebar = id;
    this.sidebarOpen = true;
    this.openTab(id);
  }

  openTab(id: ModuleId) {
    const c = controlContributions.find((x) => x.id === id);
    if (!c?.view) return;
    if (!this.tabs.includes(id)) this.tabs = [...this.tabs, id];
    this.active = id;
  }

  closeTab(id: ModuleId) {
    const i = this.tabs.indexOf(id);
    if (i < 0) return;
    this.tabs = this.tabs.filter((t) => t !== id);
    if (this.active === id) this.active = this.tabs[Math.min(i, this.tabs.length - 1)] ?? null;
  }

  openSettings(section = '') {
    this.settingsSection = section;
    this.settingsOpen = true;
  }

  save() {
    const s: Saved = {
      tabs: this.tabs,
      active: this.active,
      sidebar: this.sidebar,
      sidebarOpen: this.sidebarOpen,
      displayId: this.displayId,
      screenClosed: this.screenClosed,
    };
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* не страшно: просто не запомним раскладку */
    }
  }
}

export const workspace = new Workspace();
provideNav({
  openTab: (id) => workspace.openTab(id),
  display: () => workspace.display,
  openSettings: (section) => {
    workspace.settingsSection = section;
    workspace.settingsOpen = true;
  },
});

$effect.root(() => {
  $effect(() => workspace.save());
});
