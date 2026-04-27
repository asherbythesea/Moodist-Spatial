<script lang="ts">
  import { remote } from '@/lib/stores/remote.svelte';
  import { Settings, Monitor, Laptop, Smartphone } from 'lucide-svelte';
  
  let newName = $state(remote.myName);
  
  function handleUpdate() {
    if (newName.trim()) {
      remote.setName(newName.trim());
    }
  }

  function getIcon() {
    if (remote.myName.includes('Mobile')) return Smartphone;
    if (remote.myName.includes('Mac') || remote.myName.includes('Windows')) return Laptop;
    return Monitor;
  }
  
  const DeviceIcon = $derived(getIcon());
</script>

<div class="device-settings">
  <div class="section-header">
    <Settings size={18} />
    <h3>Remote Control</h3>
  </div>

  <p class="description">
    Identify this device when connecting from other computers.
  </p>

  <div class="device-card">
    <div class="device-visual">
       <DeviceIcon size={32} strokeWidth={1.5} />
    </div>
    <div class="device-info">
      <label for="device-name">Device Name</label>
      <input 
        id="device-name"
        type="text" 
        bind:value={newName} 
        onblur={handleUpdate}
        onkeydown={(e) => e.key === 'Enter' && handleUpdate()}
        placeholder="e.g. Living Room Speakers"
      />
      <span class="device-id">ID: {remote.myId}</span>
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
    gap: 0.25rem;
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

  .device-id {
    font-size: 0.7rem;
    font-family: monospace;
    color: var(--color-text-muted);
    margin-top: 0.25rem;
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
