<script lang="ts">
  import { timer } from '@/lib/stores/timer.svelte';

  let running = $derived(timer.sleepRunning);
  let remaining = $derived(timer.sleepRemaining);
  let total = $derived(timer.sleepTotal);

  const presetMinutes = [5, 10, 15, 20, 30, 45, 60, 90];

  function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  let progress = $derived(total > 0 ? remaining / total : 0);
</script>

<div class="sleep-panel">
  {#if running}
    <div class="sleep-active">
      <div class="sleep-icon">🌙</div>
      <div class="sleep-countdown">
        <span class="countdown-time">{formatTime(remaining)}</span>
        <span class="countdown-label">until sleep</span>
      </div>

      <div class="sleep-progress">
        <div class="progress-bg">
          <div class="progress-fill" style="width: {progress * 100}%"></div>
        </div>
      </div>

      <button class="btn btn-ghost" onclick={() => timer.clearSleep()}>
        Cancel
      </button>
    </div>
  {:else}
    <div class="sleep-presets">
      <p class="sleep-description">Fade out and pause all sounds after:</p>
      <div class="presets-grid">
        {#each presetMinutes as minutes}
          <button
            class="preset-btn"
            onclick={() => timer.startSleep(minutes)}
          >
            {minutes < 60 ? `${minutes}m` : `${minutes / 60}h`}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .sleep-panel {
    padding: 0.5rem 0;
  }

  .sleep-active {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem 0;
  }

  .sleep-icon {
    font-size: 2.5rem;
    animation: float 3s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }

  .sleep-countdown {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  .countdown-time {
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-text-primary);
    font-variant-numeric: tabular-nums;
  }

  .countdown-label {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }

  .sleep-progress {
    width: 100%;
    padding: 0 1rem;
  }

  .progress-bg {
    width: 100%;
    height: 4px;
    background: var(--color-border);
    border-radius: var(--radius-full);
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--color-accent), oklch(0.80 0.16 320));
    border-radius: var(--radius-full);
    transition: width 1s linear;
  }

  .btn {
    padding: 0.45rem 1rem;
    border: none;
    border-radius: var(--radius-sm);
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: var(--font-sans);
  }

  .btn-ghost {
    background: transparent;
    color: var(--color-text-secondary);
  }

  .btn-ghost:hover {
    background: var(--color-bg-card);
  }

  .sleep-presets {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .sleep-description {
    font-size: 0.85rem;
    color: var(--color-text-secondary);
  }

  .presets-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
  }

  .preset-btn {
    padding: 0.65rem;
    background: var(--color-bg-card);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-text-secondary);
    transition: all 0.2s ease;
    font-family: var(--font-sans);
  }

  .preset-btn:hover {
    background: var(--color-accent-soft);
    border-color: var(--color-accent);
    color: var(--color-accent);
    transform: translateY(-1px);
  }
</style>
