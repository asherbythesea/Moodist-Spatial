import type { MixerState, SoundState } from '@/lib/types';
import { allSoundIds } from '@/data/sounds';
import { load, save } from '@/lib/utils/storage';
import { decodeMixFromUrl } from '@/lib/utils/share';

function createInitialState(): MixerState {
  // URL share state takes priority over localStorage
  const fromUrl = decodeMixFromUrl();
  if (fromUrl) {
    // Merge URL sounds into a complete state (all others inactive)
    const state: MixerState = {};
    for (const id of allSoundIds) {
      state[id] = fromUrl[id] ?? { active: false, volume: 0.5 };
    }
    return state;
  }

  // Fall back to localStorage
  const stored = load<MixerState>('mixer', {});
  const state: MixerState = {};
  for (const id of allSoundIds) {
    state[id] = stored[id] ?? { active: false, volume: 0.5 };
  }
  return state;
}

class MixerStore {
  sounds = $state<MixerState>(createInitialState());
  masterVolume = $state<number>(load<number>('masterVolume', 1));
  
  get activeSounds(): [string, SoundState][] {
    return Object.entries(this.sounds).filter(([, s]) => s.active);
  }

  get activeCount(): number {
    return this.activeSounds.length;
  }

  get isPlaying(): boolean {
    return this.activeCount > 0;
  }

  toggle(id: string): void {
    if (this.sounds[id]) {
      this.sounds[id] = {
        ...this.sounds[id],
        active: !this.sounds[id].active,
      };
      this.persist();
    }
  }

  setVolume(id: string, volume: number): void {
    if (this.sounds[id]) {
      this.sounds[id] = {
        ...this.sounds[id],
        volume: Math.max(0, Math.min(1, volume)),
      };
      this.persist();
    }
  }

  setActive(id: string, active: boolean): void {
    if (this.sounds[id]) {
      this.sounds[id] = {
        ...this.sounds[id],
        active,
      };
      this.persist();
    }
  }

  stopAll(): void {
    for (const id of Object.keys(this.sounds)) {
      this.sounds[id] = { ...this.sounds[id], active: false };
    }
    this.persist();
  }

  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    save('masterVolume', this.masterVolume);
  }

  /** Load a preset's sound state into the mixer */
  loadState(state: MixerState): void {
    for (const id of allSoundIds) {
      this.sounds[id] = state[id] ?? { active: false, volume: 0.5 };
    }
    this.persist();
  }

  private persist(): void {
    save('mixer', this.sounds);
  }
}

export const mixer = new MixerStore();
