<script lang="ts">
  import { remote } from '@/lib/stores/remote.svelte';
  import { Settings, Monitor, Laptop, Smartphone, Check } from 'lucide-svelte';
  
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
</script>

<div class="device-settings">
  <div class="section-header">
    <Settings size={18} />
    <h3>Device Settings</h3>
  </div>

  <p class="description">
    Give this device a friendly name so you can recognize it from other clients.
  </p>

  <div class="device-card">
    <div class="device-visual">
       {#if true}
         {@const Icon = getIcon()}
         <Icon size={32} strokeWidth={1.5} />
       {/if}
    </div>
    <div class="device-info">
      <div class="input-group">
        <label for="device-name">Device Name</label>
        <div class="input-wrapper">
          <input 
            id="device-name"
            type="text" 
            bind:value={newName}
            onfocus={() => isEditing = true}
            onkeydown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="e.g. Living Room Speakers"
          />
          {#if isEditing}
            <button class="save-btn" onclick={handleSave} in:fade>
              <Check size={16} />
            </button>
          {/if}
        </div>
      </div>
      <span class="device-id">Device ID: {remote.myId}</span>
    </div>
  </div>

  <div class="status-info">
    <div class="status-dot" class:online={remote.connected}></div>
    <span>{remote.connected ? 'Connected to relay server' : 'Connecting...'}</span>
  </div>
</div>

<style>
  .device-settings {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--color-text-primary);
  }

  .section-header h3 {
    font-size: 1rem;
    font-weight: 700;
  }

  .description {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    line-height: 1.5;
  }

  .device-card {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border-subtle);
    border-radius: 16px;
    padding: 1.25rem;
    display: flex;
    gap: 1.25rem;
    align-items: center;
  }

  .device-visual {
    width: 64px;
    height: 64px;
    background: var(--color-bg-elevated);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-accent);
  }

  .device-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .device-info label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    font-weight: 700;
  }

  input {
    background: transparent;
    border: none;
    border-bottom: 2px solid var(--color-border-subtle);
    color: var(--color-text-primary);
    font-family: var(--font-sans);
    font-size: 1.1rem;
    padding: 0.25rem 0;
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
    bottom: 4px;
    background: var(--color-accent);
    color: white;
    border: none;
    width: 24px;
    height: 24px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .save-btn:hover {
    transform: scale(1.1);
    background: var(--color-accent-2);
  }

  .device-id {
    font-size: 0.7rem;
    font-family: monospace;
    color: var(--color-text-muted);
    opacity: 0.6;
  }

  .status-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    color: var(--color-text-muted);
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-text-muted);
  }

  .status-dot.online {
    background: #4caf50;
    box-shadow: 0 0 8px rgba(76, 175, 80, 0.4);
  }
</style>
