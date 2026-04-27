<script lang="ts">
  import { mixer } from '@/lib/stores/mixer.svelte';
  import { ui } from '@/lib/stores/ui.svelte';
  import { remote } from '@/lib/stores/remote.svelte';
  import { fade } from 'svelte/transition';
  import { TreePine, Palette, Sparkles, Volume2 } from 'lucide-svelte';
  import { type PaletteId } from '@/lib/stores/ui.svelte';
  let activeCount = $derived(mixer.activeCount);
  let isPlaying = $derived(mixer.isPlaying);
</script>

<header class="toolbar">
  <div class="toolbar-top">
    <div class="toolbar-brand">
      <span class="logo-icon"><TreePine size={24} /></span>
      <h1 class="logo-text">Moodist</h1>
    </div>

    <div class="toolbar-actions">
      {#if isPlaying}
        <div class="active-indicator" in:fade={{ duration: 200 }}>
          <span class="indicator-icon"><Volume2 size={16} /></span>
          <span class="active-count">{activeCount} sound{activeCount !== 1 ? 's' : ''}</span>
        </div>
        
        <button
          class="toolbar-btn stop-btn"
          onclick={() => mixer.stopAll()}
          aria-label="Stop all sounds"
          in:fade={{ duration: 200 }}
          title="Stop All"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="4" y="4" width="10" height="10" rx="1.5" fill="currentColor"/>
          </svg>
        </button>
      {/if}

      <!-- Palette Switcher -->
      <div class="palette-switcher">
        <select 
          class="remote-select" 
          value={ui.palette} 
          onchange={(e) => ui.setPalette(e.currentTarget.value as PaletteId)}
          title="Change Color Palette"
        >
          <option value="amber">Amber Forest</option>
          <option value="ocean">Deep Sea</option>
          <option value="moss">Jungle Moss</option>
          <option value="lunar">Lunar Gray</option>
        </select>
      </div>

      <!-- Zen Mode (Auto-Cycle) -->
      <button
        class="toolbar-btn zen-btn"
        class:active={ui.autoCycle}
        onclick={() => ui.toggleAutoCycle()}
        aria-label="Toggle Zen Mode"
        title="Zen Mode (Auto-Cycle Colors)"
      >
        <Sparkles size={18} />
      </button>

      {#if remote.connected && remote.clients.length > 0}
        <div class="remote-selector">
          <select 
            class="remote-select" 
            value={remote.activeOutputId} 
            onchange={(e) => remote.setOutput(e.currentTarget.value)}
          >
            <option value="local">Play Locally</option>
            {#each remote.clients as client}
              <option value={client.id}>{client.name} {client.id === remote.myId ? '(This Device)' : ''}</option>
            {/each}
          </select>
        </div>
      {/if}

      <button
        class="toolbar-btn tools-btn"
        class:active={ui.toolsOpen}
        onclick={() => ui.toggleTools()}
        aria-label="Toggle tools"
        title="Tools"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M7.5 2.25h3v3h-3zM7.5 7.5h3v3h-3zM7.5 12.75h3v3h-3z" fill="currentColor" opacity="0.8"/>
          <path d="M2.25 2.25h3v3h-3zM2.25 7.5h3v3h-3zM2.25 12.75h3v3h-3zM12.75 2.25h3v3h-3zM12.75 7.5h3v3h-3zM12.75 12.75h3v3h-3z" fill="currentColor" opacity="0.4"/>
        </svg>
      </button>
    </div>
  </div>
</header>

{#if ui.shareToastVisible}
  <div class="share-toast" in:fly={{ y: -20, duration: 300 }} out:fade={{ duration: 200 }}>
    ✓ Share link copied to clipboard
  </div>
{/if}

<style>
  .toolbar {
    position: sticky;
    top: 0;
    z-index: 30;
    display: flex;
    flex-direction: column;
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .toolbar-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    gap: 1rem;
  }

  .toolbar-brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .logo-icon {
    font-size: 1.5rem;
  }

  .logo-text {
    font-size: 1.25rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--color-accent);
  }

  .toolbar-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .active-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.8rem;
    background: var(--color-accent-soft);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-accent-soft);
  }

  .indicator-icon {
    display: flex;
    align-items: center;
    color: var(--color-accent);
  }

  .active-count {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-accent);
    white-space: nowrap;
  }

  .remote-select {
    appearance: none;
    background: var(--color-bg-card);
    border: 1px solid var(--color-border-subtle);
    border-radius: 12px;
    padding: 0.4rem 1rem;
    font-size: 0.85rem;
    color: var(--color-text-secondary);
    font-family: var(--font-sans);
    cursor: pointer;
    outline: none;
  }

  .remote-select:focus {
    border-color: var(--color-accent);
  }

  .remote-select option {
    background-color: var(--color-bg-secondary);
    color: var(--color-text-primary);
  }

  .toolbar-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: 1px solid var(--color-border-subtle);
    background: var(--color-bg-card);
    border-radius: var(--radius-full);
    cursor: pointer;
    color: var(--color-text-secondary);
    transition: all 0.2s ease;
  }

  .toolbar-btn:hover {
    background: var(--color-bg-card-hover);
    color: var(--color-text-primary);
    border-color: var(--color-border);
    transform: translateY(-1px);
  }

  .toolbar-btn.active {
    background: var(--color-accent-soft);
    color: var(--color-accent);
    border-color: var(--color-accent);
  }

  .stop-btn:hover {
    background: oklch(0.70 0.20 25 / 0.15);
    color: var(--color-danger);
    border-color: var(--color-danger);
  }

  .share-toast {
    position: fixed;
    top: 6rem;
    left: 50%;
    transform: translateX(-50%);
    color: var(--color-success);
    padding: 0.75rem 1.5rem;
    border-radius: var(--radius-full);
    font-size: 0.85rem;
    font-weight: 600;
    box-shadow: 0 8px 32px oklch(0 0 0 / 0.2);
    z-index: 100;
    pointer-events: none;
  }

  @media (max-width: 640px) {
    .toolbar-top {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }
    .toolbar-actions {
      width: 100%;
      justify-content: space-between;
    }
  }
</style>
