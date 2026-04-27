<script lang="ts">
  import { mixer } from '@/lib/stores/mixer.svelte';
  import { audioEngine } from '@/lib/audio/AudioEngine';
  import { onMount } from 'svelte';
  
  let isPlaying = $derived(mixer.isPlaying);
  let amplitude = $state(0);

  onMount(() => {
    let frame: number;
    const loop = () => {
      if (mixer.isPlaying) {
        // Smoothly interpolate amplitude to prevent sudden jitters
        const target = audioEngine.getAmplitude();
        amplitude = amplitude + (target - amplitude) * 0.15;
      } else {
        amplitude = amplitude + (0 - amplitude) * 0.05;
      }
      frame = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(frame);
  });
</script>

<div class="visualizer" class:active={isPlaying}>
  <div class="orb-layer" style="opacity: {0.5 + amplitude * 1.5}; transform: scale({1 + amplitude * 0.05});">
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>
  </div>
  <div class="glow-field"></div>
  <div class="noise-overlay"></div>
</div>

<style>
  .visualizer {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
    opacity: 0.15;
    transition: opacity 3s ease-in-out;
  }
  
  .visualizer.active {
    opacity: 1;
  }

  .orb-layer {
    position: absolute;
    inset: 0;
    transition: transform 0.1s linear, opacity 0.1s linear;
  }

  .orb {
    position: absolute;
    border-radius: 50%;
    animation: float 35s infinite ease-in-out alternate;
    pointer-events: none;
  }

  .orb-1 {
    width: 150vw;
    height: 150vw;
    background: radial-gradient(circle at center, rgba(212, 138, 66, 0.12) 0%, rgba(212, 138, 66, 0.05) 30%, transparent 60%);
    top: -50%;
    left: -25%;
    animation-delay: 0s;
  }

  .orb-2 {
    width: 130vw;
    height: 130vw;
    background: radial-gradient(circle at center, rgba(138, 74, 43, 0.15) 0%, rgba(138, 74, 43, 0.05) 40%, transparent 65%);
    bottom: -50%;
    right: -25%;
    animation-delay: -7s;
    animation-duration: 40s;
  }

  .orb-3 {
    width: 120vw;
    height: 120vw;
    background: radial-gradient(circle at center, rgba(82, 59, 44, 0.15) 0%, rgba(82, 59, 44, 0.05) 30%, transparent 60%);
    top: 10%;
    left: 10%;
    animation-delay: -12s;
    animation-duration: 30s;
  }

  .glow-field {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at center, transparent 0%, #121110 100%);
  }

  .noise-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 2;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 200px 200px;
    opacity: 0.03;
    mix-blend-mode: screen;
  }

  @keyframes float {
    0% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(4%, 6%) scale(1.05); }
    66% { transform: translate(-3%, 7%) scale(0.98); }
    100% { transform: translate(-5%, -4%) scale(1.08); }
  }
</style>
