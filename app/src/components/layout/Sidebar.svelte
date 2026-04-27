<script lang="ts">
  import { categories } from '@/data/sounds';
  import { ui } from '@/lib/stores/ui.svelte';
  import { fly } from 'svelte/transition';

  interface Props {
    onnavigateCategory: (id: string) => void;
  }

  let { onnavigateCategory }: Props = $props();

  function handleCategoryClick(id: string) {
    ui.setActiveCategory(id);
    onnavigateCategory(id);

    // Close sidebar on mobile
    if (window.innerWidth < 768) {
      ui.toggleSidebar();
    }
  }
</script>

{#if ui.sidebarOpen}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="sidebar-overlay"
    onclick={() => ui.toggleSidebar()}
    onkeydown={(e) => e.key === 'Escape' && ui.toggleSidebar()}
    in:fly={{ opacity: 0, duration: 200 }}
  ></div>
{/if}

<aside class="sidebar" class:open={ui.sidebarOpen} in:fly={{ x: -280, duration: 300 }}>
  <div class="sidebar-header">
    <h1 class="logo">
      <span class="logo-icon">🌲</span>
      <span class="logo-text">Moodist</span>
    </h1>
  </div>

  <nav class="sidebar-nav" aria-label="Sound categories">
    <ul class="category-list">
      {#each categories as category}
        <li>
          <button
            class="category-btn"
            class:active={ui.activeCategory === category.id}
            onclick={() => handleCategoryClick(category.id)}
          >
            <span class="cat-icon">{category.icon}</span>
            <span class="cat-name">{category.title}</span>
            <span class="cat-count">{category.sounds.length}</span>
          </button>
        </li>
      {/each}
    </ul>
  </nav>

  <div class="sidebar-footer">
    <div class="theme-switcher">
      <button
        class="theme-btn"
        class:active={ui.theme === 'light'}
        onclick={() => ui.setTheme('light')}
        aria-label="Light theme"
      >☀️</button>
      <button
        class="theme-btn"
        class:active={ui.theme === 'system'}
        onclick={() => ui.setTheme('system')}
        aria-label="System theme"
      >💻</button>
      <button
        class="theme-btn"
        class:active={ui.theme === 'dark'}
        onclick={() => ui.setTheme('dark')}
        aria-label="Dark theme"
      >🌙</button>
    </div>
  </div>
</aside>

<style>
  .sidebar-overlay {
    position: fixed;
    inset: 0;
    background: oklch(0 0 0 / 0.5);
    z-index: 40;
    backdrop-filter: blur(4px);
  }

  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: 260px;
    background: var(--color-bg-secondary);
    border-right: 1px solid var(--color-border-subtle);
    z-index: 50;
    display: flex;
    flex-direction: column;
    transform: translateX(-100%);
    transition: transform 0.3s var(--ease-smooth);
    overflow-y: auto;
  }

  .sidebar.open {
    transform: translateX(0);
  }

  @media (min-width: 768px) {
    .sidebar {
      transform: translateX(0);
    }
    .sidebar-overlay {
      display: none;
    }
  }

  .sidebar-header {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.35rem;
    font-weight: 700;
    color: var(--color-text-primary);
    letter-spacing: -0.02em;
  }

  .logo-icon {
    font-size: 1.5rem;
  }

  .logo-text {
    background: linear-gradient(135deg, var(--color-accent), oklch(0.80 0.16 320));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .sidebar-nav {
    flex: 1;
    padding: 0.75rem;
    overflow-y: auto;
  }

  .category-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .category-btn {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.65rem 0.85rem;
    border: none;
    background: transparent;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.2s ease;
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    font-weight: 500;
    text-align: left;
  }

  .category-btn:hover {
    background: var(--color-bg-card);
    color: var(--color-text-primary);
  }

  .category-btn.active {
    background: var(--color-accent-soft);
    color: var(--color-accent);
  }

  .cat-icon {
    font-size: 1.1rem;
    line-height: 1;
    width: 1.5rem;
    text-align: center;
  }

  .cat-name {
    flex: 1;
  }

  .cat-count {
    font-size: 0.7rem;
    color: var(--color-text-muted);
    background: var(--color-bg-primary);
    padding: 0.15rem 0.4rem;
    border-radius: var(--radius-full);
  }

  .sidebar-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--color-border-subtle);
  }

  .theme-switcher {
    display: flex;
    gap: 0.25rem;
    background: var(--color-bg-primary);
    padding: 0.25rem;
    border-radius: var(--radius-full);
    border: 1px solid var(--color-border-subtle);
  }

  .theme-btn {
    flex: 1;
    padding: 0.4rem;
    border: none;
    background: transparent;
    border-radius: var(--radius-full);
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s ease;
    opacity: 0.5;
  }

  .theme-btn:hover {
    opacity: 0.8;
  }

  .theme-btn.active {
    background: var(--color-bg-card);
    opacity: 1;
    box-shadow: 0 1px 3px oklch(0 0 0 / 0.1);
  }
</style>
