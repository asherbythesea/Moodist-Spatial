<script lang="ts">
  import type { SoundDefinition } from '@/lib/types';
  import { mixer } from '@/lib/stores/mixer.svelte';
  import VolumeKnob from './VolumeKnob.svelte';
  import { fly } from 'svelte/transition';

  interface Props {
    sound: SoundDefinition;
    index?: number;
  }

  let { sound, index = 0 }: Props = $props();

  let soundState = $derived(mixer.sounds[sound.id]);
  let isActive = $derived(soundState?.active ?? false);
  let volume = $derived(soundState?.volume ?? 0.5);

  function handleToggle() {
    mixer.toggle(sound.id);
  }

  function handleVolumeChange(newVolume: number) {
    mixer.setVolume(sound.id, newVolume);
  }
</script>

<button
  class="sound-card"
  class:active={isActive}
  onclick={handleToggle}
  id="sound-{sound.id}"
  aria-pressed={isActive}
  aria-label="{sound.label} - {isActive ? 'Playing' : 'Stopped'}"
  in:fly={{ y: 20, duration: 400, delay: index * 40, easing: (t) => t * (2 - t) }}
>
  <div class="card-content">
    <div class="card-icon" class:active={isActive}>
      <span class="emoji"><sound.icon size={36} {...sound.iconProps} /></span>
    </div>

    <span class="card-label">{sound.label}</span>

    {#if isActive}
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <div
        class="knob-container"
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => e.stopPropagation()}
        role="group"
        aria-label="Volume control for {sound.label}"
        in:fly={{ y: 5, duration: 300 }}
      >
        <VolumeKnob value={volume} onchange={handleVolumeChange} size={56} />
      </div>
    {/if}
  </div>
</button>

<style>
  .sound-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    cursor: pointer;
    transition: all 0.3s ease-out;
    min-height: 120px;
    width: 140px;
    padding: 1rem 0.5rem;
    background: transparent;
    border: none;
    outline: none;
  }

  .card-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    height: 100%;
  }

  .sound-card:hover {
    transform: translateY(-2px);
  }

  .sound-card:hover .card-icon {
    filter: sepia(0.2) grayscale(0.5) contrast(1.2) brightness(1.2);
    transform: scale(1.05);
  }

  .sound-card.active .card-icon {
    filter: sepia(0.3) grayscale(0.2) contrast(1.1) brightness(1.3);
    transform: scale(1.1);
  }

  .card-icon {
    font-size: 2.25rem;
    line-height: 1;
    transition: all 0.3s ease-out;
    filter: sepia(0.5) grayscale(0.8) contrast(0.8) brightness(1.1);
    transform: scale(0.95);
  }

  .emoji {
    display: block;
  }

  .card-label {
    font-size: 0.95rem;
    font-weight: 400;
    font-family: var(--font-sans);
    color: var(--color-text-secondary);
    text-align: center;
    letter-spacing: 0.03em;
    transition: all 0.3s ease;
    line-height: 1.2;
    margin-top: 0.25rem;
  }

  .sound-card:hover .card-label {
    color: var(--color-text-primary);
  }

  .sound-card.active .card-label {
    color: var(--color-text-primary);
    font-style: italic;
  }

  .knob-container {
    margin-top: 0.25rem;
    display: flex;
    justify-content: center;
    width: 100%;
  }

  @media (max-width: 480px) {
    .sound-card {
      min-height: 100px;
      padding: 0.75rem 0.25rem;
    }
    .card-icon {
      font-size: 1.75rem;
    }
    .card-label {
      font-size: 0.85rem;
    }
  }
</style>
