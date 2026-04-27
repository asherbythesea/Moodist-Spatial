import { load, save } from '@/lib/utils/storage';
import type { UIState } from '@/lib/types';

const defaults: UIState = {
  theme: 'system',
  notepad: '',
  sidebarOpen: false,
  activeCategory: null,
};

class UIStore {
  private state = $state<UIState>(load<UIState>('ui', defaults));
  toolsOpen = $state(false);
  activeToolTab = $state<'presets' | 'pomodoro' | 'sleep' | 'notepad' | 'device'>('presets');
  shareToastVisible = $state(false);

  get theme() { return this.state.theme; }
  get notepad() { return this.state.notepad; }
  get sidebarOpen() { return this.state.sidebarOpen; }
  get activeCategory() { return this.state.activeCategory; }

  setTheme(theme: UIState['theme']): void {
    this.state = { ...this.state, theme };
    this.applyTheme();
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

  /** Applies the theme class to the document */
  applyTheme(): void {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');

    if (this.state.theme === 'system') {
      // Let CSS @media handle it
    } else {
      root.classList.add(this.state.theme);
    }
  }

  private persist(): void {
    save('ui', this.state);
  }
}

export const ui = new UIStore();
