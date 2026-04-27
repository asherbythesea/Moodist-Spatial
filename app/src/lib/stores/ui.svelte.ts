import { load, save } from '@/lib/utils/storage';
export type PaletteId = 'amber' | 'ocean' | 'moss' | 'lunar';

interface UIState {
  theme: 'dark' | 'light';
  palette: PaletteId;
  autoCycle: boolean;
  notepad: string;
  sidebarOpen: boolean;
  activeCategory: string | null;
}

const defaults: UIState = {
  theme: 'dark',
  palette: 'amber',
  autoCycle: false,
  notepad: '',
  sidebarOpen: false,
  activeCategory: null,
};

class UIStore {
  private state = $state<UIState>({ ...defaults, ...load<Partial<UIState>>('ui', {}) });
  toolsOpen = $state(false);
  activeToolTab = $state<'presets' | 'pomodoro' | 'sleep' | 'notepad' | 'device'>('presets');
  shareToastVisible = $state(false);

  get theme() { return this.state.theme || 'dark'; }
  get palette(): PaletteId { return (this.state.palette || 'amber') as PaletteId; }
  get autoCycle() { return this.state.autoCycle || false; }
  get notepad() { return this.state.notepad; }
  get sidebarOpen() { return this.state.sidebarOpen; }
  get activeCategory() { return this.state.activeCategory; }

  setPalette(id: PaletteId): void {
    this.state = { ...this.state, palette: id };
    this.persist();
    this.applyPalette();
  }

  toggleAutoCycle(): void {
    this.state = { ...this.state, autoCycle: !this.state.autoCycle };
    this.persist();
  }

  setNotepad(text: string): void {
    this.state = { ...this.state, notepad: text };
    this.persist();
  }

  toggleSidebar(): void {
    this.state = { ...this.state, sidebarOpen: !this.state.sidebarOpen };
  }

  setActiveCategory(id: string | null): void {
    this.state = { ...this.state, activeCategory: id };
  }

  toggleTools(): void {
    this.toolsOpen = !this.toolsOpen;
  }

  /** Applies the palette class to the document for CSS transitions */
  applyPalette(): void {
    const root = document.documentElement;
    const palettes: PaletteId[] = ['amber', 'ocean', 'moss', 'lunar'];
    palettes.forEach(p => root.classList.remove(`palette-${p}`));
    root.classList.add(`palette-${this.state.palette}`);
  }

  applyTheme(): void {
    const root = document.documentElement;
    root.classList.remove('light');
    root.classList.add('dark');
    this.applyPalette();
  }

  private persist(): void {
    save('ui', this.state);
  }
}

export const ui = new UIStore();
