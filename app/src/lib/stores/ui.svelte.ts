import { load, save } from '@/lib/utils/storage';
export type PaletteId = 'amber' | 'ocean' | 'moss' | 'lunar';

interface UIState {
  theme: 'dark' | 'light' | 'system';
  palette: PaletteId;
  autoCycle: boolean;
  notepad: string;
  sidebarOpen: boolean;
  activeCategory: string | null;
}

const defaults: UIState = {
  theme: 'system',
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

  get theme() { return this.state.theme || 'system'; }
  get palette(): PaletteId { return (this.state.palette || 'amber') as PaletteId; }
  get autoCycle() { return this.state.autoCycle || false; }
  get notepad() { return this.state.notepad; }
  get sidebarOpen() { return this.state.sidebarOpen; }
  get activeCategory() { return this.state.activeCategory; }

  setTheme(theme: 'light' | 'dark' | 'system'): void {
    this.state = { ...this.state, theme };
    this.persist();
    this.applyTheme();
  }

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
    const theme = this.state.theme;
    
    root.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(isDark ? 'dark' : 'light');
    } else {
      root.classList.add(theme);
    }
    
    this.applyPalette();
  }

  private persist(): void {
    save('ui', this.state);
  }
}

export const ui = new UIStore();
