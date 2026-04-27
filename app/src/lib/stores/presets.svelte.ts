import type { Preset, MixerState } from '@/lib/types';
import { load, save } from '@/lib/utils/storage';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

const defaultPresets: Preset[] = [
  {
    id: generateId(),
    name: 'Cozy Cabin',
    sounds: {
      'campfire': { active: true, volume: 0.6 },
      'wind-in-trees': { active: true, volume: 0.3 },
      'rain-on-window': { active: true, volume: 0.4 },
      'owl': { active: true, volume: 0.2 },
    },
    createdAt: Date.now(),
  },
  {
    id: generateId(),
    name: 'Deep Focus',
    sounds: {
      'brown-noise': { active: true, volume: 0.5 },
      'cafe': { active: true, volume: 0.3 },
      'keyboard': { active: true, volume: 0.2 },
    },
    createdAt: Date.now(),
  },
  {
    id: generateId(),
    name: 'Rainy Commute',
    sounds: {
      'inside-a-train': { active: true, volume: 0.5 },
      'rain-on-window': { active: true, volume: 0.6 },
      'wind': { active: true, volume: 0.2 },
    },
    createdAt: Date.now(),
  },
  {
    id: generateId(),
    name: 'Forest Walk',
    sounds: {
      'walk-on-leaves': { active: true, volume: 0.4 },
      'birds': { active: true, volume: 0.5 },
      'wind-in-trees': { active: true, volume: 0.3 },
      'river': { active: true, volume: 0.2 },
    },
    createdAt: Date.now(),
  },
  {
    id: generateId(),
    name: 'Ocean Night',
    sounds: {
      'waves': { active: true, volume: 0.6 },
      'crickets': { active: true, volume: 0.4 },
      'seagulls': { active: true, volume: 0.1 },
    },
    createdAt: Date.now(),
  }
];

class PresetsStore {
  presets = $state<Preset[]>(load<Preset[]>('presets', defaultPresets));

  add(name: string, sounds: MixerState): Preset {
    const preset: Preset = {
      id: generateId(),
      name,
      sounds: { ...sounds },
      createdAt: Date.now(),
    };
    this.presets = [...this.presets, preset];
    this.persist();
    return preset;
  }

  remove(id: string): void {
    this.presets = this.presets.filter(p => p.id !== id);
    this.persist();
  }

  rename(id: string, name: string): void {
    this.presets = this.presets.map(p =>
      p.id === id ? { ...p, name } : p
    );
    this.persist();
  }

  get(id: string): Preset | undefined {
    return this.presets.find(p => p.id === id);
  }

  private persist(): void {
    save('presets', this.presets);
  }
}

export const presets = new PresetsStore();
