<script lang="ts">
  import { categories, soundMap, allSoundIds } from '@/data/sounds';
  import { mixer } from '@/lib/stores/mixer.svelte';
  import { User, RotateCcw } from 'lucide-svelte';
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { load, save } from '@/lib/utils/storage';

  const ACTIVE_RADIUS = 300;
  const INACTIVE_RADIUS_MIN = 380;
  const INACTIVE_RADIUS_MAX = 700;
  const LABEL_RADIUS = 500; // where the category labels orbit

  // Store base angles for each sound so they stay relative to the orbit
  let soundAngles = $state<Record<string, number>>(load('mixer_angles', {}));
  let categoryBaseAngles = $state<Record<string, number>>({});
  
  // Track dragging state
  let draggingId = $state<string | null>(null);
  let dragX = $state(0);
  let dragY = $state(0);

  let container: HTMLElement;
  let cx = $state(0);
  let cy = $state(0);

  let orbitAngle = $state(0);
  let animationFrame: number;

  function resetPositions() {
    const initialAngles: Record<string, number> = {};
    const slicePerCategory = (Math.PI * 2) / categories.length;
    
    categories.forEach((cat, i) => {
      const catStartAngle = i * slicePerCategory;
      const soundsInCat = cat.sounds.length;
      const startCatSound = catStartAngle + (slicePerCategory * 0.15);
      const endCatSound = catStartAngle + (slicePerCategory * 0.85);
      
      cat.sounds.forEach((sound, j) => {
        const t = soundsInCat > 1 ? j / (soundsInCat - 1) : 0.5;
        const scatter = (Math.random() - 0.5) * 0.05;
        initialAngles[sound.id] = startCatSound + t * (endCatSound - startCatSound) + scatter;
      });
    });
    
    soundAngles = initialAngles;
    save('mixer_angles', soundAngles);
  }

  onMount(() => {
    // Only calculate if we don't have saved angles
    if (Object.keys(soundAngles).length === 0) {
      resetPositions();
    }

    // Set category labels
    const catAngles: Record<string, number> = {};
    const slicePerCategory = (Math.PI * 2) / categories.length;
    categories.forEach((cat, i) => {
      catAngles[cat.id] = (i * slicePerCategory) + (slicePerCategory / 2);
    });
    categoryBaseAngles = catAngles;

    function updateCenter() {
      if (container) {
        const rect = container.getBoundingClientRect();
        cx = rect.width / 2;
        cy = rect.height / 2;
      }
    }

    updateCenter();
    window.addEventListener('resize', updateCenter);

    // Orbit animation loop
    function animate() {
      orbitAngle += 0.0003; // Very slow, relaxing orbit speed
      animationFrame = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', updateCenter);
    };
  });

  // Calculate position for a sound
  function getPosition(id: string) {
    if (draggingId === id) {
      return { x: dragX, y: dragY };
    }

    const state = mixer.sounds[id];
    const isActive = state?.active ?? false;
    const volume = state?.volume ?? 0;
    const angle = (soundAngles[id] ?? 0) + orbitAngle;

    let distance;
    if (isActive) {
      distance = (1 - volume) * ACTIVE_RADIUS;
    } else {
      const hash = id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
      distance = INACTIVE_RADIUS_MIN + (hash % (INACTIVE_RADIUS_MAX - INACTIVE_RADIUS_MIN));
    }

    return {
      x: cx + Math.cos(angle) * distance,
      y: cy + Math.sin(angle) * distance
    };
  }

  function getCategoryPosition(id: string) {
    const angle = (categoryBaseAngles[id] ?? 0) + orbitAngle;
    return {
      x: cx + Math.cos(angle) * LABEL_RADIUS,
      y: cy + Math.sin(angle) * LABEL_RADIUS
    };
  }

  function handlePointerDown(e: PointerEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();

    draggingId = id;
    
    const updateDrag = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      dragX = e.clientX - rect.left;
      dragY = e.clientY - rect.top;

      const dx = dragX - cx;
      const dy = dragY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist <= ACTIVE_RADIUS) {
        const volume = Math.max(0, Math.min(1, 1 - (dist / ACTIVE_RADIUS)));
        mixer.setVolume(id, volume);
        if (!mixer.sounds[id]?.active && volume > 0) {
          mixer.toggle(id);
        }
      } else {
        if (mixer.sounds[id]?.active) {
          mixer.toggle(id);
        }
      }
    };

    updateDrag(e);

    const handlePointerMove = (e: PointerEvent) => updateDrag(e);

    const handlePointerUp = (e: PointerEvent) => {
      const dx = dragX - cx;
      const dy = dragY - cy;
      const dropAngle = Math.atan2(dy, dx);
      // Save relative angle so it continues orbiting from where it was dropped
      soundAngles[id] = dropAngle - orbitAngle;
      save('mixer_angles', soundAngles);
      
      draggingId = null;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }
</script>

<div class="spatial-mixer" bind:this={container}>
  <!-- Inner Active Zone -->
  <div 
    class="active-zone"
    style="width: {ACTIVE_RADIUS * 2}px; height: {ACTIVE_RADIUS * 2}px; left: {cx}px; top: {cy}px;"
  ></div>

  <!-- Center Listener Orb (Click to Reset) -->
  <button 
    class="center-orb" 
    style="left: {cx}px; top: {cy}px;"
    onclick={resetPositions}
    title="Reset Positions"
  >
    <div class="center-glow" class:pulsing={mixer.isPlaying}></div>
    <span class="center-icon"><User size={28} /></span>
  </button>

  <!-- Category Orbit Labels -->
  {#if cx > 0}
    {#each categories as cat}
      {@const pos = getCategoryPosition(cat.id)}
      {@const CatIcon = cat.icon}
      <div 
        class="category-orbit-label"
        style="transform: translate({pos.x}px, {pos.y}px) translate(-50%, -50%);"
        in:fade={{ duration: 1000 }}
      >
        <span class="orbit-cat-icon"><CatIcon size={32} {...(cat.iconProps || {})} /></span>
        <span class="orbit-cat-title">{cat.title}</span>
      </div>
    {/each}
  {/if}

  <!-- Sound Nodes -->
  {#if cx > 0}
    {#each allSoundIds as id}
      {@const sound = soundMap.get(id)}
      {@const pos = getPosition(id)}
      {@const state = mixer.sounds[id]}
      {@const isActive = state?.active ?? false}
      
      {#if sound}
        {@const SoundIcon = sound.icon}
        <button
          class="sound-node"
          class:active={isActive}
          class:dragging={draggingId === id}
          style="transform: translate({pos.x}px, {pos.y}px) translate(-50%, -50%);"
          onpointerdown={(e) => handlePointerDown(e, id)}
          aria-label="{sound.label}"
          in:fade={{ duration: 1000, delay: Math.random() * 500 }}
        >
          <span class="node-icon"><SoundIcon size={20} strokeWidth={1.5} {...(sound.iconProps || {})} /></span>
          <span class="node-label">{sound.label}</span>
          {#if isActive}
            <div class="connection-line" 
                 style="width: {Math.sqrt(Math.pow(pos.x - cx, 2) + Math.pow(pos.y - cy, 2))}px; 
                        transform: rotate({Math.atan2(cy - pos.y, cx - pos.x)}rad);">
            </div>
            <svg class="volume-ring" viewBox="0 0 100 100">
               <circle cx="50" cy="50" r="48" 
                       stroke-dasharray="301" 
                       stroke-dashoffset={301 * (1 - (state.volume || 0))} />
            </svg>
          {/if}
        </button>
      {/if}
    {/each}
  {/if}

  <div class="instructions">
    <p>Drag sounds into the center zone to play them.</p>
    <p>The closer to you, the louder they get.</p>
  </div>
</div>

<style>
  .spatial-mixer {
    position: relative;
    width: 100vw;
    height: calc(100vh - 80px); /* Adjust for toolbar */
    overflow: hidden;
    background: transparent;
    touch-action: none; /* Prevent scroll while dragging */
  }

  .active-zone {
    position: absolute;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    border: 1px dashed var(--color-border-subtle);
    background: radial-gradient(circle, var(--color-accent-soft) 0%, transparent 70%);
    pointer-events: none;
    transition: all 0.5s ease;
  }

  .category-orbit-label {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    pointer-events: none;
    opacity: 0.15;
    z-index: 1;
  }

  .orbit-cat-icon {
    font-size: 2rem;
    filter: grayscale(1);
  }

  .orbit-cat-title {
    font-family: var(--font-sans);
    font-size: 0.85rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--color-text-secondary);
  }

  .center-orb {
    position: absolute;
    transform: translate(-50%, -50%);
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border);
    z-index: 10;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .center-orb:hover {
    transform: translate(-50%, -50%) scale(1.05);
    border-color: var(--color-accent);
    background: var(--color-bg-secondary);
  }

  .center-icon {
    font-size: 1.5rem;
    position: relative;
    z-index: 2;
  }

  .center-glow {
    position: absolute;
    inset: -20px;
    border-radius: 50%;
    background: radial-gradient(circle, var(--color-accent-glow) 0%, transparent 70%);
    opacity: 0.5;
    transition: opacity 0.3s ease;
  }

  .center-glow.pulsing {
    animation: pulse 2s infinite alternate ease-in-out;
  }

  @keyframes pulse {
    0% { opacity: 0.4; transform: scale(0.9); }
    100% { opacity: 0.8; transform: scale(1.1); }
  }

  .sound-node {
    position: absolute;
    top: 0; left: 0;
    width: 50px;
    height: 50px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: transparent;
    border: none;
    cursor: grab;
    z-index: 5;
    /* No transform transition because it's handled by requestAnimationFrame */
    transition: filter 0.3s ease, opacity 0.3s ease;
    will-change: transform;
  }

  .sound-node.dragging {
    cursor: grabbing;
    z-index: 50;
    transition: none;
  }

  .node-icon {
    font-size: 1.5rem;
    filter: sepia(0.5) grayscale(0.8) opacity(0.6);
    transition: all 0.3s ease;
  }

  .sound-node:hover .node-icon {
    filter: sepia(0.2) grayscale(0.2) opacity(0.9) drop-shadow(0 0 5px var(--color-accent-glow));
    transform: scale(1.1);
  }

  .sound-node.active .node-icon {
    filter: sepia(0.1) grayscale(0) opacity(1) drop-shadow(0 0 10px var(--color-accent-glow));
    transform: scale(1.2);
  }

  .node-label {
    position: absolute;
    top: 100%;
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: all 0.3s ease;
    font-family: var(--font-sans);
    background: var(--color-bg-primary);
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    border: 1px solid var(--color-border-subtle);
  }

  .sound-node:hover .node-label,
  .sound-node.active .node-label {
    opacity: 1;
    transform: translateY(2px);
  }
  
  .sound-node.active .node-label {
    color: var(--color-accent);
    font-style: italic;
  }

  .connection-line {
    position: absolute;
    height: 1px;
    background: linear-gradient(90deg, var(--color-accent-glow) 0%, transparent 100%);
    top: 50%;
    left: 50%;
    transform-origin: left center;
    pointer-events: none;
    z-index: -1;
    opacity: 0.4;
  }

  .volume-ring {
    position: absolute;
    inset: -6px;
    width: calc(100% + 12px);
    height: calc(100% + 12px);
    pointer-events: none;
    transform: rotate(-90deg);
  }

  .volume-ring circle {
    fill: none;
    stroke: var(--color-accent);
    stroke-width: 2;
    transition: stroke-dashoffset 0.1s linear;
    opacity: 0.6;
  }

  .instructions {
    position: absolute;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
    color: var(--color-text-muted);
    font-size: 0.85rem;
    pointer-events: none;
    opacity: 0.6;
    background: var(--color-bg-primary);
    padding: 0.5rem 1rem;
    border-radius: 20px;
    border: 1px solid var(--color-border-subtle);
  }
</style>
