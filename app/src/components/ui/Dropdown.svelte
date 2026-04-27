<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { onMount } from 'svelte';

  interface Option {
    value: string;
    label: string;
  }

  interface Props {
    options: Option[];
    value: string;
    onchange: (value: string) => void;
    title?: string;
    icon?: any;
  }

  let { options, value, onchange, title, icon: Icon }: Props = $props();

  let isOpen = $state(false);
  let container: HTMLDivElement;

  const selectedOption = $derived(options.find(o => o.value === value));

  function toggle() {
    isOpen = !isOpen;
  }

  function select(optionValue: string) {
    onchange(optionValue);
    isOpen = false;
  }

  function handleClickOutside(e: MouseEvent) {
    if (container && !container.contains(e.target as Node)) {
      isOpen = false;
    }
  }

  onMount(() => {
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  });
</script>

<div class="dropdown-container" bind:this={container}>
  <button 
    class="dropdown-trigger" 
    class:active={isOpen}
    onclick={toggle}
    {title}
  >
    {#if Icon}
      <Icon size={18} />
    {/if}
    <span class="selected-label">{selectedOption?.label || 'Select...'}</span>
    <svg 
      class="chevron" 
      class:open={isOpen}
      width="10" 
      height="10" 
      viewBox="0 0 10 10" 
      fill="none"
    >
      <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </button>

  {#if isOpen}
    <div 
      class="dropdown-menu" 
      in:fly={{ y: -10, duration: 200 }} 
      out:fade={{ duration: 150 }}
    >
      {#each options as option}
        <button 
          class="dropdown-item" 
          class:selected={option.value === value}
          onclick={() => select(option.value)}
        >
          {option.label}
          {#if option.value === value}
            <svg class="check" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .dropdown-container {
    position: relative;
    display: inline-block;
  }

  .dropdown-trigger {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.4rem 1rem;
    background: var(--color-bg-card);
    border: 1px solid var(--color-border-subtle);
    border-radius: 12px;
    color: var(--color-text-secondary);
    font-family: var(--font-sans);
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    min-width: 140px;
  }

  .dropdown-trigger:hover {
    background: var(--color-bg-secondary);
    border-color: var(--color-border);
    color: var(--color-text-primary);
  }

  .dropdown-trigger.active {
    border-color: var(--color-accent);
    background: var(--color-bg-secondary);
  }

  .selected-label {
    flex: 1;
    text-align: left;
  }

  .chevron {
    transition: transform 0.3s var(--ease-spring);
    opacity: 0.6;
  }

  .chevron.open {
    transform: rotate(180deg);
  }

  .dropdown-menu {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    right: 0;
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 0.5rem;
    box-shadow: 0 12px 40px oklch(0 0 0 / 0.4);
    z-index: 100;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.6rem 0.75rem;
    border-radius: 8px;
    color: var(--color-text-secondary);
    font-family: var(--font-sans);
    font-size: 0.85rem;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    transition: all 0.15s ease;
  }

  .dropdown-item:hover {
    background: var(--color-accent-soft);
    color: var(--color-accent);
    padding-left: 0.9rem;
  }

  .dropdown-item.selected {
    background: var(--color-accent-glow);
    color: var(--color-accent);
    font-weight: 600;
  }

  .check {
    opacity: 0.8;
  }
</style>
