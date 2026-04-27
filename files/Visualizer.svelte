<script lang="ts">
  import { mixer } from '@/lib/stores/mixer.svelte';
  import { audioEngine } from '@/lib/audio/AudioEngine';
  import type { FrequencyBands } from '@/lib/audio/AudioEngine';
  import { onMount } from 'svelte';

  let isPlaying = $derived(mixer.isPlaying);
  let canvas: HTMLCanvasElement;

  // Smoothed band values — updated each frame by lerping toward raw FFT output.
  // Using separate lerp rates per band to match the perceptual "speed" of each
  // frequency range: bass should feel slow and weighty; treble should snap.
  let bassSmoothed  = $state(0);
  let midSmoothed   = $state(0);
  let trebleSmoothed = $state(0);

  // Expose a scalar for the CSS orb layer (driven by bass only)
  let orbAmplitude = $state(0);

  // ─────────────────────────────────────────────────────────────────────────
  // Particle type definitions
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * LargeOrb — slow drifting blobs that swell with low-frequency bass.
   * There are very few of these (5–8); they are big and heavily blurred.
   */
  interface LargeOrb {
    kind: 'orb';
    x: number;
    y: number;
    baseSize: number;   // radius at rest
    speedX: number;
    speedY: number;
    opacity: number;
    hue: number;        // warm amber range
    // Per-orb phase offset so they don't all pulse in sync
    phaseOffset: number;
  }

  /**
   * SmallFirefly — tiny sparks that flicker and zip with high treble energy.
   * There are many of these (50–60). They carry a "zip velocity" that gets
   * an impulse when treble crosses a threshold.
   */
  interface SmallFirefly {
    kind: 'fly';
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    // Accumulated zip impulse added on treble transients
    zipVX: number;
    zipVY: number;
    opacity: number;
    hue: number;
    flickerPhase: number;  // per-particle flicker offset
  }

  type Particle = LargeOrb | SmallFirefly;

  onMount(() => {
    const ctx = canvas.getContext('2d')!;
    let orbs: LargeOrb[] = [];
    let fireflies: SmallFirefly[] = [];

    // ── Creation helpers ───────────────────────────────────────────────────

    const makeOrb = (w: number, h: number): LargeOrb => ({
      kind: 'orb',
      x: Math.random() * w,
      y: Math.random() * h,
      baseSize: 60 + Math.random() * 80,   // large: 60–140px radius
      speedX: (Math.random() - 0.5) * 0.25,
      speedY: (Math.random() - 0.5) * 0.25,
      opacity: 0.08 + Math.random() * 0.12,
      hue: 28 + Math.random() * 20,         // amber 28–48°
      phaseOffset: Math.random() * Math.PI * 2,
    });

    const makeFirefly = (w: number, h: number): SmallFirefly => ({
      kind: 'fly',
      x: Math.random() * w,
      y: Math.random() * h,
      size: 0.5 + Math.random() * 1.8,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: (Math.random() - 0.5) * 0.4,
      zipVX: 0,
      zipVY: 0,
      opacity: 0.2 + Math.random() * 0.5,
      hue: 35 + Math.random() * 15,
      flickerPhase: Math.random() * Math.PI * 2,
    });

    const createParticles = (w: number, h: number) => {
      orbs       = Array.from({ length: 7  }, () => makeOrb(w, h));
      fireflies  = Array.from({ length: 55 }, () => makeFirefly(w, h));
    };

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      createParticles(canvas.width, canvas.height);
    };

    window.addEventListener('resize', resize);
    resize();

    // ── Treble transient detection ─────────────────────────────────────────
    // We want fireflies to "zip" when a sudden high-frequency spike arrives
    // (a bird call, a raindrop burst). A simple approach: track the previous
    // treble value and, if the delta exceeds a threshold, fire an impulse.
    let prevTreble = 0;
    const TREBLE_TRANSIENT_THRESHOLD = 0.06;
    const ZIP_STRENGTH = 2.5; // pixels per frame impulse magnitude

    // ── Animation frame counter for phase-based flicker ───────────────────
    let t = 0;

    // ── Idle drift amplitude (keeps things alive when audio is silent) ─────
    const IDLE_AMPLITUDE = 0.03;

    let frame: number;
    const loop = () => {
      t += 0.016; // ~60fps tick, used as a time parameter

      // ── Band sampling & smoothing ────────────────────────────────────────
      // Each band gets its own lerp alpha to simulate the physical "weight"
      // of that frequency range:
      //   bass   — slow alpha (0.04): feels heavy, like a subwoofer pumping
      //   mid    — medium (0.08)
      //   treble — fast alpha (0.18): snappy, like a shutter clicking open
      if (mixer.isPlaying) {
        const bands: FrequencyBands = audioEngine.getBands();
        bassSmoothed   = bassSmoothed   + (bands.bass   - bassSmoothed)   * 0.04;
        midSmoothed    = midSmoothed    + (bands.mid    - midSmoothed)    * 0.08;
        trebleSmoothed = trebleSmoothed + (bands.treble - trebleSmoothed) * 0.18;
      } else {
        // Gentle idle decay so particles don't freeze
        bassSmoothed   = bassSmoothed   * 0.97 + IDLE_AMPLITUDE * 0.03;
        midSmoothed    = midSmoothed    * 0.97;
        trebleSmoothed = trebleSmoothed * 0.97;
      }

      orbAmplitude = bassSmoothed;

      // Detect treble transients for zip impulse
      const trebleDelta = trebleSmoothed - prevTreble;
      const hasTransient = trebleDelta > TREBLE_TRANSIENT_THRESHOLD;
      prevTreble = trebleSmoothed;

      // ── Clear ────────────────────────────────────────────────────────────
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const W = canvas.width;
      const H = canvas.height;

      // ── Draw large orbs (bass-driven) ─────────────────────────────────────
      // The orb radius grows proportionally to bass energy. We use the per-orb
      // phaseOffset to make them breathe slightly out of phase with each other.
      for (const orb of orbs) {
        // Drift
        orb.x += orb.speedX * (1 + bassSmoothed * 1.2);
        orb.y += orb.speedY * (1 + bassSmoothed * 1.2);

        if (orb.x < -orb.baseSize * 2) orb.x = W + orb.baseSize;
        if (orb.x > W + orb.baseSize)  orb.x = -orb.baseSize * 2;
        if (orb.y < -orb.baseSize * 2) orb.y = H + orb.baseSize;
        if (orb.y > H + orb.baseSize)  orb.y = -orb.baseSize * 2;

        // Bass swell: radius oscillates with a slow sinusoidal phase offset
        // so the visual expansion feels organic rather than mechanical.
        const swell = 1 + bassSmoothed * 1.8 + Math.sin(t * 0.4 + orb.phaseOffset) * 0.08;
        const radius = orb.baseSize * swell;
        const alpha  = orb.opacity * (0.5 + bassSmoothed * 1.5);

        const g = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, radius);
        g.addColorStop(0,   `hsla(${orb.hue}, 70%, 55%, ${Math.min(alpha, 0.45)})`);
        g.addColorStop(0.4, `hsla(${orb.hue}, 60%, 40%, ${alpha * 0.3})`);
        g.addColorStop(1,   'transparent');

        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Draw small fireflies (treble-driven) ──────────────────────────────
      for (const fly of fireflies) {
        // Apply zip impulse on transient
        if (hasTransient) {
          const angle = Math.random() * Math.PI * 2;
          fly.zipVX += Math.cos(angle) * ZIP_STRENGTH * trebleDelta * 20;
          fly.zipVY += Math.sin(angle) * ZIP_STRENGTH * trebleDelta * 20;
        }

        // Decay zip velocity (friction coefficient 0.88 — tunable)
        fly.zipVX *= 0.88;
        fly.zipVY *= 0.88;

        // Base speed multiplied by treble energy + zip
        const speedScale = 1 + trebleSmoothed * 4;
        fly.x += fly.speedX * speedScale + fly.zipVX;
        fly.y += fly.speedY * speedScale + fly.zipVY;

        if (fly.x < 0)  fly.x = W;
        if (fly.x > W)  fly.x = 0;
        if (fly.y < 0)  fly.y = H;
        if (fly.y > H)  fly.y = 0;

        // Treble flicker: opacity oscillates rapidly at high frequencies.
        // The flickerPhase offset ensures each firefly blinks independently.
        const flickerRate = 3 + trebleSmoothed * 12; // Hz equivalent
        const flicker = 0.5 + 0.5 * Math.sin(t * flickerRate + fly.flickerPhase);
        const alpha   = fly.opacity * (0.2 + trebleSmoothed * 0.8) * flicker;

        // Scale core dot slightly with treble
        const radius = fly.size * (1 + trebleSmoothed * 0.6);

        // Draw halo glow only for larger fireflies (performance guard)
        if (fly.size > 1.0) {
          const haloRadius = radius * 7 * (1 + trebleSmoothed * 0.5);
          const hg = ctx.createRadialGradient(fly.x, fly.y, 0, fly.x, fly.y, haloRadius);
          hg.addColorStop(0, `hsla(${fly.hue}, 85%, 75%, ${alpha * 0.5})`);
          hg.addColorStop(1, 'transparent');
          ctx.fillStyle = hg;
          ctx.beginPath();
          ctx.arc(fly.x, fly.y, haloRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw bright core
        ctx.beginPath();
        ctx.arc(fly.x, fly.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${fly.hue}, 85%, 92%, ${Math.min(alpha * 1.4, 1)})`;
        ctx.fill();
      }

      frame = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  });
</script>

<div class="visualizer" class:active={isPlaying}>
  <canvas bind:this={canvas} class="particle-canvas"></canvas>

  <!--
    CSS orb layer now driven exclusively by bassSmoothed (via orbAmplitude).
    Scale swells with low-frequency content; opacity is clamped conservatively
    so the background orbs never overpower the canvas fireflies.
  -->
  <div
    class="orb-layer"
    style="opacity: {0.35 + orbAmplitude * 1.4}; transform: scale({1 + orbAmplitude * 0.06});"
  >
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
    background: #121110;
  }

  .visualizer.active {
    opacity: 1;
  }

  .particle-canvas {
    position: absolute;
    inset: 0;
    z-index: 1;
  }

  .orb-layer {
    position: absolute;
    inset: 0;
    /* Transition here is intentionally short — JS is driving this reactively */
    transition: transform 0.12s linear, opacity 0.12s linear;
  }

  .orb {
    position: absolute;
    border-radius: 50%;
    animation: float 35s infinite ease-in-out alternate;
    pointer-events: none;
  }

  .orb-1 {
    width: 80vw;
    height: 80vw;
    background: rgba(212, 138, 66, 0.1);
    filter: blur(120px);
    top: -20%;
    left: -10%;
    animation-delay: 0s;
  }

  .orb-2 {
    width: 70vw;
    height: 70vw;
    background: rgba(138, 74, 43, 0.12);
    filter: blur(140px);
    bottom: -15%;
    right: -10%;
    animation-delay: -7s;
    animation-duration: 40s;
  }

  .orb-3 {
    width: 60vw;
    height: 60vw;
    background: rgba(82, 59, 44, 0.15);
    filter: blur(100px);
    top: 20%;
    left: 20%;
    animation-delay: -12s;
    animation-duration: 30s;
  }

  .glow-field {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at center, transparent 0%, #121110 100%);
    pointer-events: none;
  }

  .noise-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 2;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 256px 256px;
    opacity: 0.04;
    mix-blend-mode: overlay;
    filter: contrast(120%) brightness(100%);
  }

  @keyframes float {
    0%   { transform: translate(0, 0) scale(1); }
    33%  { transform: translate(4%, 6%) scale(1.05); }
    66%  { transform: translate(-3%, 7%) scale(0.98); }
    100% { transform: translate(-5%, -4%) scale(1.08); }
  }
</style>
