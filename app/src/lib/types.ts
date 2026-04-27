export interface SoundDefinition {
  id: string;
  label: string;
  icon: any; // Svelte component
  iconProps?: Record<string, any>;
  src: string;
}

export interface CategoryDefinition {
  id: string;
  title: string;
  icon: any; // Svelte component
  iconProps?: Record<string, any>;
  sounds: SoundDefinition[];
}

export interface SoundState {
  active: boolean;
  volume: number;
}

export type MixerState = Record<string, SoundState>;

export interface Preset {
  id: string;
  name: string;
  sounds: MixerState;
  createdAt: number;
}

export interface UIState {
  theme: 'light' | 'dark' | 'system';
  palette: string;
  autoCycle: boolean;
  notepad: string;
  sidebarOpen: boolean;
  activeCategory: string | null;
}

export interface TimerState {
  type: 'sleep' | 'pomodoro';
  running: boolean;
  remaining: number; // seconds
  total: number; // seconds
}

export interface PomodoroConfig {
  workMinutes: number;
  breakMinutes: number;
  isBreak: boolean;
}
