<script lang="ts">
  import { ui } from '@/lib/stores/ui.svelte';
  import Presets from './Presets.svelte';
  import Pomodoro from './Pomodoro.svelte';
  import SleepTimer from './SleepTimer.svelte';
  import Notepad from './Notepad.svelte';
  import DeviceSettings from './DeviceSettings.svelte';
  import { fly } from 'svelte/transition';

  const tabs = [
    { id: 'presets' as const, label: 'Presets', icon: '💾' },
    { id: 'pomodoro' as const, label: 'Pomodoro', icon: '🍅' },
    { id: 'sleep' as const, label: 'Sleep', icon: '🌙' },
    { id: 'notepad' as const, label: 'Notes', icon: '📝' },
    { id: 'device' as const, label: 'Device', icon: '📱' },
  ];
</script>

{#if ui.toolsOpen}
  <aside class="tools-panel" transition:fly={{ x: 320, duration: 400, easing: (t) => t * (2 - t) }}>
    <div class="tools-header">
      <h2 class="tools-title">Tools</h2>
      <button class="close-btn" onclick={() => ui.toggleTools()} aria-label="Close tools">
        ×
      </button>
    </div>

    <nav class="tools-tabs">
      {#each tabs as tab}
        <button
          class="tab-btn"
          class:active={ui.activeToolTab === tab.id}
          onclick={() => ui.activeToolTab = tab.id}
        >
          <span class="tab-icon">{tab.icon}</span>
          <span class="tab-label">{tab.label}</span>
        </button>
      {/each}
    </nav>

    <div class="tools-content">
      {#if ui.activeToolTab === 'presets'}
        <Presets />
      {:else if ui.activeToolTab === 'pomodoro'}
        <Pomodoro />
      {:else if ui.activeToolTab === 'sleep'}
        <SleepTimer />
      {:else if ui.activeToolTab === 'notepad'}
        <Notepad />
      {/if}
    </div>
  </aside>
{/if}

<style>
  .tools-panel {
    position: fixed;
    right: 1.5rem;
    top: 5.5rem;
    bottom: 5.5rem;
    width: 320px;
    max-width: calc(100vw - 3rem);
    border-radius: var(--radius-2xl);
    z-index: 45;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 0 1px var(--color-border-subtle);
    overflow: hidden;
    background: var(--color-bg-elevated);
  }

  @media (max-width: 640px) {
    .tools-panel {
      right: 1rem;
      left: 1rem;
      top: 6rem;
      bottom: 5rem;
      width: auto;
      max-width: none;
    }
  }

  .tools-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--color-border-subtle);
    background: oklch(0 0 0 / 0.1);
  }

  .tools-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--color-text-primary);
    letter-spacing: -0.01em;
  }

  .close-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    border-radius: var(--radius-full);
    cursor: pointer;
    color: var(--color-text-muted);
    font-size: 1.5rem;
    transition: all 0.2s ease;
  }

  .close-btn:hover {
    background: var(--color-bg-card-hover);
    color: var(--color-text-primary);
  }

  .tools-tabs {
    display: flex;
    padding: 0.75rem 1rem;
    gap: 0.25rem;
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .tab-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem 0.25rem;
    border: none;
    background: transparent;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.2s ease;
    color: var(--color-text-muted);
  }

  .tab-btn:hover {
    background: var(--color-bg-card);
    color: var(--color-text-secondary);
  }

  .tab-btn.active {
    background: var(--color-accent-soft);
    color: var(--color-accent);
  }

  .tab-icon {
    font-size: 1.2rem;
    line-height: 1;
  }

  .tab-label {
    font-size: 0.65rem;
    font-weight: 600;
  }

  .tools-content {
    flex: 1;
    padding: 1.5rem;
    overflow-y: auto;
  }
</style>
