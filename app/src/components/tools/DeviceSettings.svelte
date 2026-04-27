<script lang="ts">
  import { remote } from '@/lib/stores/remote.svelte';
  import { Settings, Monitor, Laptop, Smartphone, Check } from 'lucide-svelte';
  import { fade } from 'svelte/transition';
  
  let newName = $state(remote.myName);
  let isEditing = $state(false);
  
  function handleSave() {
    if (newName.trim()) {
      remote.setName(newName.trim());
      isEditing = false;
    }
  }

  function getIcon() {
    if (remote.myName.includes('Mobile')) return Smartphone;
    if (remote.myName.includes('Mac') || remote.myName.includes('Windows')) return Laptop;
    return Monitor;
  }
  let Icon = $derived(getIcon());
</script>

<div class="device-settings">
  <div class="section-header">
    <Settings size={18} />
    <h3>Device Settings</h3>
  </div>

  <p class="description">
    Rename this device so you can recognize it easily from other connected clients.
  </p>

  <div class="device-card">
    <div class="device-visual">
       <Icon size={24} strokeWidth={1.5} />
    </div>
    <div class="device-info">
      <label for="device-name">Device Name</label>
      <div class="input-container">
        <input 
          id="device-name"
          type="text" 
          bind:value={newName}
          onfocus={() => isEditing = true}
          onkeydown={(e) => e.key === 'Enter' && handleSave()}
          placeholder="e.g. Living Room TV"
        />
        {#if isEditing}
          <button class="save-btn" onclick={handleSave} in:fade>
            <Check size={16} />
          </button>
        {/if}
      </div>
      <p class="device-id">ID: {remote.myId || 'Initializing...'}</p>
    </div>
  </div>

  <div class="status-footer">
    <span class="status-dot" class:online={remote.connected}></span>
    <span>{remote.connected ? 'Cloud Sync Online' : 'Connecting to Relay...'}</span>
  </div>
</div>

<style>
  .device-settings {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    color: var(--color-text-primary);
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
  }

  .section-header h3 {
    font-size: 1rem;
    font-weight: 700;
  }

  .description {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    line-height: 1.4;
  }

  .device-card {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border-subtle);
    border-radius: 12px;
    padding: 1rem;
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .device-visual {
    width: 48px;
    height: 48px;
    background: var(--color-bg-elevated);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-accent);
  }

  .device-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .device-info label {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    font-weight: 700;
  }

  .input-container {
    position: relative;
    display: flex;
    align-items: center;
  }

  input {
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--color-border-subtle);
    color: var(--color-text-primary);
    font-family: var(--font-sans);
    font-size: 1rem;
    padding: 0.4rem 0;
    width: 100%;
    outline: none;
    transition: border-color 0.2s ease;
  }

  input:focus {
    border-color: var(--color-accent);
  }

  .save-btn {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    background: #7c4dff;
    color: white;
    border: none;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 12px oklch(0 0 0 / 0.3);
    transition: all 0.2s ease;
  }

  .save-btn:hover {
    background: #9d70ff;
    transform: translateY(-50%) scale(1.05);
  }

  .device-id {
    font-size: 0.65rem;
    font-family: monospace;
    color: var(--color-text-muted);
    opacity: 0.5;
    margin-top: 0.25rem;
  }

  .status-footer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    margin-top: 0.5rem;
    color: var(--color-text-muted);
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #ff9800;
  }

  .status-dot.online {
    background: #4caf50;
    box-shadow: 0 0 8px rgba(76, 175, 80, 0.4);
  }
</style>
