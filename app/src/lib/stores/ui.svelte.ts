import { load, save } from '@/lib/utils/storage';
import type { UIState } from '@/lib/types';

const defaults: UIState = {
  theme: 'dark',
  notepad: '',
  sidebarOpen: false,
  activeCategory: null,
};

class UIStore {
  private state = $state<UIState>(load<UIState>('ui', defaults));
  toolsOpen = $state(false);
  activeToolTab = $state<'presets' | 'pomodoro' | 'sleep' | 'notepad' | 'device'>('presets');
  shareToastVisible = $state(false);

  get theme() { return 'dark'; }
  get notepad() { return this.state.notepad; }
  get sidebarOpen() { return this.state.sidebarOpen; }
  get activeCategory() { return this.state.activeCategory; }

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
    root.classList.remove('light');
    root.classList.add('dark');
  }

  private persist(): void {
    save('ui', this.state);
  }
}

export const ui = new UIStore();
