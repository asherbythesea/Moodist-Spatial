<script lang="ts">
  import { categories } from '@/data/sounds';
  import SoundCard from './SoundCard.svelte';
  import { ui } from '@/lib/stores/ui.svelte';

  let categoryRefs: Record<string, HTMLElement> = {};

  export function scrollToCategory(id: string) {
    categoryRefs[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Optional: IntersectionObserver to update active category on scroll
  $effect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace('category-', '');
            ui.setActiveCategory(id);
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );

    Object.values(categoryRefs).forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  });
</script>

<div class="sound-grid-container">
  {#each categories as category}
    <section
      class="category-section"
      id="category-{category.id}"
      bind:this={categoryRefs[category.id]}
    >
      <div class="category-header">
        <h2 class="category-title">
          <span class="category-icon">{category.icon}</span>
          {category.title}
        </h2>
        <div class="header-line"></div>
      </div>

      <div class="sounds-grid">
        {#each category.sounds as sound, i}
          <SoundCard {sound} index={i} />
        {/each}
      </div>
    </section>
  {/each}
</div>

<style>
  .sound-grid-container {
    display: flex;
    flex-direction: column;
    gap: 4rem;
    padding: 3rem 2rem;
    max-width: 1400px;
    width: 100%;
    margin: 0 auto;
    padding-bottom: 120px;
  }

  .category-section {
    scroll-margin-top: 8rem;
    position: relative;
    width: 100%;
  }

  .category-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
    opacity: 0.8;
    width: 100%;
  }

  .category-title {
    font-size: 1.5rem;
    font-weight: 300;
    color: var(--color-text-primary);
    letter-spacing: 0.05em;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    white-space: nowrap;
  }

  .category-icon {
    font-size: 1.75rem;
    filter: drop-shadow(0 0 8px var(--color-accent-glow));
  }

  .header-line {
    height: 1px;
    flex: 1;
    background: linear-gradient(90deg, var(--color-border) 0%, transparent 100%);
  }

  .sounds-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;
    width: 100%;
    justify-content: flex-start;
  }

  @media (max-width: 768px) {
    .sound-grid-container {
      padding: 2rem 1.5rem;
      gap: 3rem;
    }
    .sounds-grid {
      gap: 1.5rem;
      justify-content: center;
    }
    .category-title {
      font-size: 1.25rem;
    }
  }

  @media (max-width: 480px) {
    .sound-grid-container {
      padding: 1.5rem 1rem;
    }
    .sounds-grid {
      gap: 1rem;
      justify-content: center;
    }
  }
</style>
