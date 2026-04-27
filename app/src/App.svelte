<script lang="ts">
  import { mixer } from '@/lib/stores/mixer.svelte';
  import { ui } from '@/lib/stores/ui.svelte';
  import { audioEngine } from '@/lib/audio/AudioEngine';
  import { soundMap } from '@/data/sounds';
  import { remote } from '@/lib/stores/remote.svelte';
  import { onMount } from 'svelte';

  import Toolbar from './components/layout/Toolbar.svelte';
  import SpatialMixer from './components/sounds/SpatialMixer.svelte';
  import ToolsPanel from './components/tools/ToolsPanel.svelte';
  import Visualizer from './components/layout/Visualizer.svelte';

  onMount(() => {
    // Apply theme on mount
    ui.applyTheme();

    // Initialize Web Audio Engine
    audioEngine;
    
    // Connect to remote sync server
    remote.connect();
    
    // Clear loading state
    document.getElementById('initial-loader')?.remove();
  });

  // Bridge reactive mixer state to the audio engine
  $effect(() => {
    const sounds = mixer.sounds;
    
    // Determine if we are the designated playback device
    const shouldPlay = remote.activeOutputId === 'local' || remote.activeOutputId === remote.myId;
    
    for (const [id, state] of Object.entries(sounds)) {
      const def = soundMap.get(id);
      if (!def) continue;

      if (state.active && shouldPlay) {
        audioEngine.play(id, def.src, state.volume);
      } else {
        audioEngine.stop(id);
      }
    }
    
    // Sync state to remote clients whenever it changes locally
    remote.syncMixerState();
  });

  // Update volume changes in real-time
  $effect(() => {
    const shouldPlay = remote.activeOutputId === 'local' || remote.activeOutputId === remote.myId;
    
    for (const [id, state] of Object.entries(mixer.sounds)) {
      if (state.active && shouldPlay) {
        audioEngine.setVolume(id, state.volume);
      }
    }
  });

  // Media Session API integration
  $effect(() => {
    if (!('mediaSession' in navigator)) return;

    if (mixer.isPlaying) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Moodist',
        artist: `${mixer.activeCount} sound${mixer.activeCount !== 1 ? 's' : ''} playing`,
      });

      navigator.mediaSession.setActionHandler('pause', () => mixer.stopAll());
      navigator.mediaSession.setActionHandler('stop', () => mixer.stopAll());
    }
  });

  // Keyboard shortcuts
  function handleKeydown(e: KeyboardEvent) {
    // Don't capture when typing in inputs
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    if (e.key === ' ' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      if (mixer.isPlaying) {
        mixer.stopAll();
      }
    }

    if (e.key === 'Escape') {
      if (ui.toolsOpen) {
        ui.toggleTools();
      }
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<Visualizer />

<div class="app-layout">
  <main class="main-content">
    <Toolbar />
    <SpatialMixer />
  </main>

  <ToolsPanel />
</div>

<style>
  .app-layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 1;
  }

  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
</style>
