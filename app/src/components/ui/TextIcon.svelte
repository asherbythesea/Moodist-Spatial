<script lang="ts">
  interface Props {
    size?: number;
    strokeWidth?: number;
    text?: string;
  }
  let { size = 24, strokeWidth = 1.5, text = '' }: Props = $props();
</script>

<svg 
  width={size} 
  height={size} 
  viewBox="0 0 24 24" 
  fill="none" 
  stroke="currentColor" 
  stroke-width={strokeWidth} 
  stroke-linecap="round" 
  stroke-linejoin="round"
>
  <text 
    x="12" 
    y="16.5" 
    text-anchor="middle" 
    font-family="var(--font-serif), serif" 
    font-style="italic"
    font-weight="400" 
    font-size="16" 
    stroke="none" 
    fill="currentColor"
  >
    {text}
  </text>
</svg>
