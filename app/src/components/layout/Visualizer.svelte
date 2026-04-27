<script lang="ts">
  import { mixer } from '@/lib/stores/mixer.svelte';
  import { audioEngine } from '@/lib/audio/AudioEngine';
  import { onMount } from 'svelte';
  
  let isPlaying = $derived(mixer.isPlaying);
  let amplitude = $state(0);
  let canvas: HTMLCanvasElement;

  interface Particle {
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    opacity: number;
    hue: number;
  }

  onMount(() => {
    const ctx = canvas.getContext('2d')!;
    let particles: Particle[] = [];
    const particleCount = 60;

    const createParticles = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5,
          speedX: (Math.random() - 0.5) * 0.4,
          speedY: (Math.random() - 0.5) * 0.4,
          opacity: Math.random() * 0.5 + 0.2,
          hue: 35 + Math.random() * 15 // Warm firefly amber
        });
      }
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      createParticles();
    };

    window.addEventListener('resize', resize);
    resize();

    let frame: number;
    const loop = () => {
      if (mixer.isPlaying) {
        const target = audioEngine.getAmplitude();
        amplitude = amplitude + (target - amplitude) * 0.1;
      } else {
        amplitude = amplitude + (0 - amplitude) * 0.05;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const intensity = 0.5 + amplitude * 2.5;
      
      particles.forEach(p => {
        p.x += p.speedX * (1 + amplitude * 1.5);
        p.y += p.speedY * (1 + amplitude * 1.5);

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Draw particle
        const alpha = p.opacity * (0.3 + amplitude * 0.7);
        const radius = p.size * (1 + amplitude * 0.5);
        
        // Draw firefly glow (much faster than shadowBlur)
        if (p.size > 1.2) {
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 6 * intensity);
          gradient.addColorStop(0, `hsla(${p.hue}, 80%, 70%, ${alpha * 0.4})`);
          gradient.addColorStop(1, 'transparent');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius * 6 * intensity, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw core
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 90%, ${alpha})`;
        ctx.fill();
      });

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
  <div class="orb-layer" style="opacity: {0.4 + amplitude * 1.5}; transform: scale({1 + amplitude * 0.05});">
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
    transition: transform 0.1s linear, opacity 0.1s linear;
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
    0% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(4%, 6%) scale(1.05); }
    66% { transform: translate(-3%, 7%) scale(0.98); }
    100% { transform: translate(-5%, -4%) scale(1.08); }
  }
</style>
