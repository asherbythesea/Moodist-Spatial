<script lang="ts">
  import { ui } from '@/lib/stores/ui.svelte';

  let text = $state(ui.notepad);

  function handleInput(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    text = target.value;
    ui.setNotepad(text);
  }
</script>

<div class="notepad-panel">
  <textarea
    class="notepad-textarea"
    value={text}
    oninput={handleInput}
    placeholder="Write something here..."
    spellcheck="true"
  ></textarea>
  <div class="notepad-footer">
    <span class="char-count">{text.length} chars</span>
  </div>
</div>

<style>
  .notepad-panel {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 200px;
  }
  .notepad-textarea {
    flex: 1;
    width: 100%;
    min-height: 200px;
    padding: 0.85rem;
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-size: 0.85rem;
    font-family: var(--font-sans);
    line-height: 1.6;
    resize: vertical;
    outline: none;
    transition: border-color 0.2s ease;
  }
  .notepad-textarea:focus {
    border-color: var(--color-accent);
  }
  .notepad-textarea::placeholder {
    color: var(--color-text-muted);
  }
  .notepad-footer {
    display: flex;
    justify-content: flex-end;
    padding: 0.5rem 0;
  }
  .char-count {
    font-size: 0.7rem;
    color: var(--color-text-muted);
  }
</style>
