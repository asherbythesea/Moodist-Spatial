<script lang="ts">
  interface Props {
    value: number;
    size?: number;
    onchange: (value: number) => void;
  }

  let { value, size = 48, onchange }: Props = $props();

  let knobEl: SVGSVGElement;
  let dragging = $state(false);

  const strokeWidth = 3;
  let radius = $derived((size - strokeWidth * 2) / 2);
  let center = $derived(size / 2);
  let circumference = $derived(2 * Math.PI * radius);

  // Map value (0-1) to angle (0 to 270 degrees)
  const startAngle = 135; // Start from bottom-left
  const totalAngle = 270;

  function valueToOffset(val: number): number {
    return circumference * (1 - (val * totalAngle) / 360);
  }

  function valueToRotation(val: number): number {
    return startAngle + val * totalAngle;
  }

  function getValueFromEvent(e: MouseEvent | TouchEvent): number {
    if (!knobEl) return value;
    const rect = knobEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    let angle = Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
    // Normalize angle relative to start
    angle = (angle - startAngle + 360) % 360;
    
    if (angle > totalAngle + 20) {
      return angle > totalAngle + (360 - totalAngle) / 2 ? 0 : 1;
    }
    
    return Math.max(0, Math.min(1, angle / totalAngle));
  }

  function handlePointerDown(e: MouseEvent) {
    e.preventDefault();
    dragging = true;
    const newVal = getValueFromEvent(e);
    onchange(newVal);

    const handleMove = (ev: MouseEvent) => {
      if (dragging) {
        const v = getValueFromEvent(ev);
        onchange(v);
      }
    };

    const handleUp = () => {
      dragging = false;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }

  function handleTouchStart(e: TouchEvent) {
    e.preventDefault();
    dragging = true;
    const newVal = getValueFromEvent(e);
    onchange(newVal);

    const handleMove = (ev: TouchEvent) => {
      if (dragging) {
        const v = getValueFromEvent(ev);
        onchange(v);
      }
    };

    const handleUp = () => {
      dragging = false;
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };

    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);
  }
</script>

<svg
  bind:this={knobEl}
  width={size}
  height={size}
  viewBox="0 0 {size} {size}"
  class="volume-knob"
  class:dragging
  onmousedown={handlePointerDown}
  ontouchstart={handleTouchStart}
  role="slider"
  aria-valuenow={Math.round(value * 100)}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label="Volume"
  tabindex={0}
>
  <!-- Background track -->
  <circle
    cx={center}
    cy={center}
    r={radius}
    fill="none"
    stroke="var(--color-border)"
    stroke-width={strokeWidth}
    stroke-linecap="round"
    stroke-dasharray={circumference}
    stroke-dashoffset={circumference * (1 - totalAngle / 360)}
    transform="rotate({startAngle} {center} {center})"
    opacity="0.4"
  />

  <!-- Value arc -->
  <circle
    cx={center}
    cy={center}
    r={radius}
    fill="none"
    stroke="var(--color-accent)"
    stroke-width={strokeWidth}
    stroke-linecap="round"
    stroke-dasharray={circumference}
    stroke-dashoffset={valueToOffset(value)}
    transform="rotate({startAngle} {center} {center})"
    class="value-arc"
  />

  <!-- Knob dot indicator -->
  {#if value > 0}
    <circle
      cx={center + radius * Math.cos((valueToRotation(value) * Math.PI) / 180)}
      cy={center + radius * Math.sin((valueToRotation(value) * Math.PI) / 180)}
      r={strokeWidth + 1}
      fill="var(--color-accent)"
      class="knob-dot"
    />
  {/if}

  <!-- Center display -->
  <text
    x={center}
    y={center + 1}
    text-anchor="middle"
    dominant-baseline="central"
    fill="var(--color-text-secondary)"
    font-size={size * 0.22}
    font-weight="500"
    font-family="var(--font-sans)"
  >
    {Math.round(value * 100)}
  </text>
</svg>

<style>
  .volume-knob {
    cursor: grab;
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
    transition: filter 0.2s ease;
  }

  .volume-knob:hover,
  .volume-knob.dragging {
    cursor: grabbing;
  }

  .value-arc {
    transition: stroke-dashoffset 0.05s ease-out;
  }

  .knob-dot {
    transition: cx 0.05s ease-out, cy 0.05s ease-out;
  }
</style>
