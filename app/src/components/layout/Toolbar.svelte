<script lang="ts">
  import { mixer } from '@/lib/stores/mixer.svelte';
  import { ui } from '@/lib/stores/ui.svelte';
  import { remote } from '@/lib/stores/remote.svelte';
  import { copyShareUrl } from '@/lib/utils/share';
  import { fade, fly } from 'svelte/transition';
  import { Sun, Moon, Monitor, TreePine } from 'lucide-svelte';
  let activeCount = $derived(mixer.activeCount);
  let isPlaying = $derived(mixer.isPlaying);

  async function handleShare() {
    const success = await copyShareUrl(mixer.sounds);
    if (success) {
      ui.shareToastVisible = true;
      setTimeout(() => {
        ui.shareToastVisible = false;
      }, 2000);
    }
  }
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
          <div class="sound-bars">
            <span class="bar"></span>
            <span class="bar"></span>
            <span class="bar"></span>
          </div>
          <span class="active-count">{activeCount} sound{activeCount !== 1 ? 's' : ''}</span>
        </div>
        
        <button
          class="toolbar-btn share-btn"
          onclick={handleShare}
          aria-label="Share current mix"
          in:fade={{ duration: 200 }}
          title="Share Mix"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M13.5 6a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5zM4.5 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5zM13.5 16.5a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5zM6.44 10.24l5.13 2.77M11.56 4.99L6.44 7.76" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

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

      <div class="theme-switcher">
        <button
          class="theme-btn"
          class:active={ui.theme === 'light'}
          onclick={() => ui.setTheme('light')}
          aria-label="Light theme"
        ><Sun size={14} /></button>
        <button
          class="theme-btn"
          class:active={ui.theme === 'system'}
          onclick={() => ui.setTheme('system')}
          aria-label="System theme"
        ><Monitor size={14} /></button>
        <button
          class="theme-btn"
          class:active={ui.theme === 'dark'}
          onclick={() => ui.setTheme('dark')}
          aria-label="Dark theme"
        ><Moon size={14} /></button>
      </div>

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
    background: linear-gradient(135deg, var(--color-accent), var(--color-accent-2));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
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
    border-radius: var(--radius-full);
    border: 1px solid var(--color-accent-soft);
  }

  .sound-bars {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 14px;
  }

  .bar {
    width: 3px;
    background: var(--color-accent);
    border-radius: 1px;
    animation: sound-bar 0.8s ease-in-out infinite alternate;
  }

  .bar:nth-child(1) { height: 40%; animation-delay: 0s; }
  .bar:nth-child(2) { height: 80%; animation-delay: 0.2s; }
  .bar:nth-child(3) { height: 60%; animation-delay: 0.4s; }

  .active-count {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-accent);
    white-space: nowrap;
  }

  .theme-switcher {
    display: flex;
    gap: 0.25rem;
    background: var(--color-bg-card);
    padding: 0.25rem;
    border-radius: 12px;
    border: 1px solid var(--color-border-subtle);
    margin: 0 0.5rem;
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

  .theme-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s ease;
    opacity: 0.5;
  }

  .theme-btn:hover {
    opacity: 0.8;
  }

  .theme-btn.active {
    background: var(--color-bg-elevated);
    opacity: 1;
    box-shadow: 0 1px 3px oklch(0 0 0 / 0.1);
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
    .theme-switcher {
      margin: 0;
    }
  }
</style>
