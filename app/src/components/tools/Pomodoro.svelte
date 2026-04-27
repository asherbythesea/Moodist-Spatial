<script lang="ts">
  import { timer } from '@/lib/stores/timer.svelte';

  let running = $derived(timer.pomodoroRunning);
  let remaining = $derived(timer.pomodoroRemaining);
  let total = $derived(timer.pomodoroTotal);
  let config = $derived(timer.pomodoroConfig);

  let workMin = $state(25);
  let breakMin = $state(5);

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  let progress = $derived(total > 0 ? (total - remaining) / total : 0);

  // SVG ring dimensions
  const ringSize = 160;
  const ringStroke = 6;
  const ringRadius = (ringSize - ringStroke * 2) / 2;
  const ringCenter = ringSize / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;
</script>

<div class="pomodoro-panel">
  <div class="timer-ring-container">
    <svg width={ringSize} height={ringSize} viewBox="0 0 {ringSize} {ringSize}">
      <!-- Background ring -->
      <circle
        cx={ringCenter}
        cy={ringCenter}
        r={ringRadius}
        fill="none"
        stroke="var(--color-border)"
        stroke-width={ringStroke}
        opacity="0.3"
      />
      <!-- Progress ring -->
      <circle
        cx={ringCenter}
        cy={ringCenter}
        r={ringRadius}
        fill="none"
        stroke={config.isBreak ? 'var(--color-success)' : 'var(--color-accent)'}
        stroke-width={ringStroke}
        stroke-linecap="round"
        stroke-dasharray={ringCircumference}
        stroke-dashoffset={ringCircumference * (1 - progress)}
        transform="rotate(-90 {ringCenter} {ringCenter})"
        class="progress-ring"
      />
    </svg>
    <div class="timer-display">
      <span class="timer-time">{formatTime(remaining)}</span>
      <span class="timer-label">{config.isBreak ? 'Break' : 'Focus'}</span>
    </div>
  </div>

  <div class="timer-controls">
    {#if !running && remaining === total}
      <button class="btn btn-primary" onclick={() => timer.startPomodoro()}>
        Start
      </button>
    {:else if running}
      <button class="btn btn-secondary" onclick={() => timer.pausePomodoro()}>
        Pause
      </button>
    {:else}
      <button class="btn btn-primary" onclick={() => timer.resumePomodoro()}>
        Resume
      </button>
    {/if}
    
    {#if running || remaining !== total}
      <button class="btn btn-ghost" onclick={() => timer.clearPomodoro()}>
        Reset
      </button>
    {/if}
  </div>

  {#if !running && remaining === total}
    <div class="timer-config">
      <div class="config-row">
        <span class="config-label">Work</span>
        <div class="config-input-group">
          <button class="config-btn" onclick={() => { workMin = Math.max(1, workMin - 5); timer.setPomodoroConfig(workMin, breakMin); }}>−</button>
          <span class="config-value">{workMin}m</span>
          <button class="config-btn" onclick={() => { workMin = Math.min(60, workMin + 5); timer.setPomodoroConfig(workMin, breakMin); }}>+</button>
        </div>
      </div>
      <div class="config-row">
        <span class="config-label">Break</span>
        <div class="config-input-group">
          <button class="config-btn" onclick={() => { breakMin = Math.max(1, breakMin - 1); timer.setPomodoroConfig(workMin, breakMin); }}>−</button>
          <span class="config-value">{breakMin}m</span>
          <button class="config-btn" onclick={() => { breakMin = Math.min(30, breakMin + 1); timer.setPomodoroConfig(workMin, breakMin); }}>+</button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .pomodoro-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    padding: 1rem 0;
  }

  .timer-ring-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .timer-display {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  .timer-time {
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-text-primary);
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.02em;
  }

  .timer-label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-muted);
  }

  .progress-ring {
    transition: stroke-dashoffset 0.5s ease;
  }

  .timer-controls {
    display: flex;
    gap: 0.5rem;
  }

  .btn {
    padding: 0.55rem 1.5rem;
    border: none;
    border-radius: var(--radius-full);
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: var(--font-sans);
  }

  .btn-primary {
    background: var(--color-accent);
    color: white;
  }

  .btn-primary:hover {
    background: var(--color-accent-hover);
    transform: scale(1.02);
  }

  .btn-secondary {
    background: var(--color-bg-card);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border);
  }

  .btn-secondary:hover {
    background: var(--color-bg-card-hover);
  }

  .btn-ghost {
    background: transparent;
    color: var(--color-text-secondary);
  }

  .btn-ghost:hover {
    background: var(--color-bg-card);
  }

  .timer-config {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
  }

  .config-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    background: var(--color-bg-card);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border-subtle);
  }

  .config-label {
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--color-text-secondary);
  }

  .config-input-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .config-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--color-border);
    background: var(--color-bg-primary);
    border-radius: var(--radius-sm);
    cursor: pointer;
    color: var(--color-text-secondary);
    font-size: 1rem;
    transition: all 0.15s ease;
  }

  .config-btn:hover {
    background: var(--color-bg-card-hover);
    color: var(--color-text-primary);
  }

  .config-value {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-text-primary);
    min-width: 2.5rem;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }
</style>
