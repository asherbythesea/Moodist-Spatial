<script lang="ts">
  import { mixer } from '@/lib/stores/mixer.svelte';
  import { soundMap } from '@/data/sounds';
  import { slide, fade } from 'svelte/transition';

  let activeSounds = $derived(mixer.activeSounds);
  let isVisible = $derived(activeSounds.length > 0);
</script>

{#if isVisible}
  <div class="active-bar" transition:slide={{ duration: 300 }}>
    <div class="active-bar-inner">
      <div class="bar-label">
        <span class="bar-label-text">Now Playing</span>
      </div>
      <div class="active-chips">
        {#each activeSounds as [id, state] (id)}
          {@const sound = soundMap.get(id)}
          {#if sound}
            <button
              class="active-chip"
              onclick={() => mixer.toggle(id)}
              aria-label="Stop {sound.label}"
              in:fade={{ duration: 200 }}
              out:fade={{ duration: 150 }}
            >
              <span class="chip-icon">{sound.icon}</span>
              <span class="chip-label">{sound.label}</span>
              <span class="chip-volume">{Math.round(state.volume * 100)}%</span>
              <span class="chip-close">×</span>
            </button>
          {/if}
        {/each}
      </div>
    </div>
  </div>
{/if}

<style>
  .active-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 35;
    padding: 0.75rem 1.5rem;
    border-top: 1px solid var(--color-border-subtle);
  }

  .active-bar-inner {
    display: flex;
    align-items: center;
    gap: 1rem;
    max-width: 1400px;
    margin: 0 auto;
  }

  .bar-label {
    flex-shrink: 0;
  }

  .bar-label-text {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-primary);
    opacity: 0.8;
  }

  .active-chips {
    display: flex;
    gap: 0.5rem;
    overflow-x: auto;
    padding: 0.25rem 0;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .active-chips::-webkit-scrollbar {
    display: none;
  }

  .active-chip {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.8rem;
    background: var(--color-bg-card);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-full);
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s ease;
    font-size: 0.8rem;
    color: var(--color-text-secondary);
  }

  .active-chip:hover {
    background: var(--color-bg-card-hover);
    border-color: var(--color-danger);
    color: var(--color-danger);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px oklch(0.70 0.20 25 / 0.15);
  }

  .chip-icon {
    font-size: 1rem;
    line-height: 1;
  }

  .chip-label {
    font-weight: 500;
  }

  .chip-volume {
    font-size: 0.7rem;
    opacity: 0.6;
    font-variant-numeric: tabular-nums;
  }

  .chip-close {
    font-size: 1.1rem;
    font-weight: 600;
    opacity: 0;
    margin-left: 0.1rem;
    transition: opacity 0.2s ease;
  }

  .active-chip:hover .chip-close {
    opacity: 1;
  }
</style>
