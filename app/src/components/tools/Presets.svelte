<script lang="ts">
  import { presets } from '@/lib/stores/presets.svelte';
  import { mixer } from '@/lib/stores/mixer.svelte';
  import { fade, fly } from 'svelte/transition';

  let newPresetName = $state('');
  let showSaveForm = $state(false);

  function handleSave() {
    if (!newPresetName.trim()) return;
    presets.add(newPresetName.trim(), mixer.sounds);
    newPresetName = '';
    showSaveForm = false;
  }

  function handleLoad(id: string) {
    const preset = presets.get(id);
    if (preset) {
      mixer.loadState(preset.sounds);
    }
  }

  function handleDelete(id: string) {
    presets.remove(id);
  }
</script>

<div class="presets-panel">
  {#if !showSaveForm}
    <button
      class="save-preset-btn"
      onclick={() => showSaveForm = true}
      disabled={!mixer.isPlaying}
    >
      <span>💾</span>
      <span>Save Current Mix</span>
    </button>
  {:else}
    <form
      class="save-form"
      onsubmit={(e) => { e.preventDefault(); handleSave(); }}
      in:fly={{ y: -10, duration: 200 }}
    >
      <input
        type="text"
        class="preset-input"
        placeholder="Preset name..."
        bind:value={newPresetName}
        maxlength={32}
      />
      <div class="save-actions">
        <button type="submit" class="btn btn-primary" disabled={!newPresetName.trim()}>Save</button>
        <button type="button" class="btn btn-ghost" onclick={() => showSaveForm = false}>Cancel</button>
      </div>
    </form>
  {/if}

  <div class="presets-list">
    {#if presets.presets.length === 0}
      <div class="empty-state">
        <span class="empty-icon">🎵</span>
        <p>No presets saved yet.</p>
        <p class="empty-hint">Start a mix and save it for later.</p>
      </div>
    {:else}
      {#each presets.presets as preset (preset.id)}
        <div class="preset-item" in:fly={{ x: -20, duration: 200 }} out:fade={{ duration: 150 }}>
          <button class="preset-load" onclick={() => handleLoad(preset.id)}>
            <span class="preset-name">{preset.name}</span>
            <span class="preset-meta">
              {Object.values(preset.sounds).filter(s => s.active).length} sounds
            </span>
          </button>
          <button
            class="preset-delete"
            onclick={() => handleDelete(preset.id)}
            aria-label="Delete {preset.name}"
          >×</button>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .presets-panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .save-preset-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: var(--color-accent-soft);
    border: 1px dashed var(--color-accent);
    border-radius: var(--radius-md);
    color: var(--color-accent);
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .save-preset-btn:hover:not(:disabled) {
    background: oklch(0.72 0.18 280 / 0.25);
  }

  .save-preset-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .save-form {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .preset-input {
    width: 100%;
    padding: 0.6rem 0.85rem;
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-size: 0.85rem;
    font-family: var(--font-sans);
    outline: none;
    transition: border-color 0.2s ease;
  }

  .preset-input:focus {
    border-color: var(--color-accent);
  }

  .save-actions {
    display: flex;
    gap: 0.5rem;
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

  .btn-primary {
    background: var(--color-accent);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--color-accent-hover);
  }

  .btn-primary:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .btn-ghost {
    background: transparent;
    color: var(--color-text-secondary);
  }

  .btn-ghost:hover {
    background: var(--color-bg-card);
  }

  .presets-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .empty-state {
    text-align: center;
    padding: 2rem 1rem;
    color: var(--color-text-muted);
  }

  .empty-icon {
    font-size: 2rem;
    display: block;
    margin-bottom: 0.75rem;
    opacity: 0.5;
  }

  .empty-state p {
    font-size: 0.85rem;
  }

  .empty-hint {
    font-size: 0.75rem !important;
    opacity: 0.7;
    margin-top: 0.25rem;
  }

  .preset-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.15rem;
    border-radius: var(--radius-md);
    transition: background 0.2s ease;
  }

  .preset-item:hover {
    background: var(--color-bg-card);
  }

  .preset-load {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    padding: 0.5rem 0.65rem;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;
  }

  .preset-name {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--color-text-primary);
  }

  .preset-meta {
    font-size: 0.7rem;
    color: var(--color-text-muted);
  }

  .preset-delete {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    border-radius: var(--radius-sm);
    cursor: pointer;
    color: var(--color-text-muted);
    font-size: 1.1rem;
    font-weight: 600;
    opacity: 0;
    transition: all 0.2s ease;
  }

  .preset-item:hover .preset-delete {
    opacity: 1;
  }

  .preset-delete:hover {
    background: oklch(0.70 0.20 25 / 0.15);
    color: var(--color-danger);
  }
</style>
