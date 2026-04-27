import type { MixerState } from '@/lib/types';

/**
 * Encodes the active sounds + volumes into a compact query string.
 * Format: ?s=rain-light:0.8,thunder:0.5,cafe:0.3
 */
export function encodeMixToUrl(state: MixerState): string {
  const activeSounds = Object.entries(state)
    .filter(([, s]) => s.active)
    .map(([id, s]) => `${id}:${s.volume.toFixed(2)}`)
    .join(',');

  if (!activeSounds) return window.location.origin + window.location.pathname;
  
  const url = new URL(window.location.href);
  url.searchParams.set('s', activeSounds);
  return url.toString();
}

/**
 * Decodes a shared URL back into a MixerState.
 * Returns null if no share data is present.
 */
export function decodeMixFromUrl(): MixerState | null {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('s');
  if (!raw) return null;

  const state: MixerState = {};
  for (const token of raw.split(',')) {
    const [id, volumeStr] = token.split(':');
    if (id && volumeStr) {
      const volume = parseFloat(volumeStr);
      if (!isNaN(volume)) {
        state[id] = { active: true, volume: Math.max(0, Math.min(1, volume)) };
      }
    }
  }

  return Object.keys(state).length > 0 ? state : null;
}

/** Copies the share URL to clipboard */
export async function copyShareUrl(state: MixerState): Promise<boolean> {
  try {
    const url = encodeMixToUrl(state);
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}
