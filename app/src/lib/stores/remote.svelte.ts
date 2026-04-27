import { mixer } from './mixer.svelte';
import { audioEngine } from '../audio/AudioEngine';

interface RemoteClient {
  id: string;
  name: string;
}

function getDeviceDescription() {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'Mobile (iOS)';
  if (/Android/.test(ua)) return 'Mobile (Android)';
  if (/Macintosh/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Windows PC';
  if (/Linux/.test(ua)) return 'Linux PC';
  return 'Web Browser';
}

class RemoteStore {
  // Connected state
  connected = $state(false);
  
  // My own device ID assigned by server
  myId = $state<string | null>(null);
  
  // Custom device name
  myName = $state(localStorage.getItem('moodist_device_name') || getDeviceDescription());
  
  // All connected clients
  clients = $state<RemoteClient[]>([]);
  
  // Which device is currently outputting audio ('local' or client id)
  activeOutputId = $state('local');
  
  private ws: WebSocket | null = null;
  private isApplyingRemoteState = false;

  connect() {
    // Determine WS URL based on current protocol/host
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // If dev server (vite usually 5173, 5174, etc.), fallback to port 3001 for the relay
    const isDev = window.location.port.startsWith('51');
    const host = isDev ? `${window.location.hostname}:3001` : window.location.host;
    const wsUrl = `${protocol}//${host}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.connected = true;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'init':
            this.myId = data.id;
            this.clients = data.clients;
            this.activeOutputId = data.activeOutputId;
            
            // Send our custom name immediately
            this.setName(this.myName);
            
            // If we are joining and the server has a mixer state, apply it
            if (data.mixerState && Object.keys(data.mixerState).length > 0) {
              this.isApplyingRemoteState = true;
              mixer.sounds = data.mixerState;
              setTimeout(() => this.isApplyingRemoteState = false, 50);
            }
            break;
            
          case 'clients':
            this.clients = data.clients;
            break;
            
          case 'output_changed':
            this.activeOutputId = data.activeOutputId;
            this.updateAudioEngineState();
            break;
            
          case 'mixer_synced':
            this.isApplyingRemoteState = true;
            mixer.sounds = data.state;
            setTimeout(() => this.isApplyingRemoteState = false, 50);
            break;
        }
      } catch (e) {
        console.error('WS message error', e);
      }
    };

    this.ws.onclose = () => {
      this.connected = false;
      // Reconnect logic
      setTimeout(() => this.connect(), 3000);
    };
  }

  setName(name: string) {
    this.myName = name;
    localStorage.setItem('moodist_device_name', name);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'set_name', name }));
    }
  }

  setOutput(outputId: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'set_output', outputId }));
    } else {
      // Offline fallback
      this.activeOutputId = outputId;
      this.updateAudioEngineState();
    }
  }

  syncMixerState() {
    // Only broadcast if the change originated locally
    if (this.isApplyingRemoteState || !this.connected || !this.ws) return;
    
    if (this.ws.readyState === WebSocket.OPEN) {
      // Use standard deep copy object to avoid reactivity proxy issues
      const state = JSON.parse(JSON.stringify(mixer.sounds));
      this.ws.send(JSON.stringify({ type: 'sync_mixer', state }));
    }
  }

  /**
   * Mutes or unmutes the AudioEngine based on who is supposed to be playing.
   */
  updateAudioEngineState() {
    const shouldPlay = this.activeOutputId === 'local' || this.activeOutputId === this.myId;
    
    if (!shouldPlay) {
      // We are remote controlling another device, mute ourselves instantly
      audioEngine.pauseAll();
    } else {
      // We are the output device, make sure playing sounds are resumed
      // App.svelte $effect takes care of this if we just toggle something, 
      // but we might need to manually trigger play if they were paused.
      // Easiest hack: temporarily reset mixer active count to force re-evaluation
      // in App.svelte if needed, or rely on the user dragging to start it.
      // Actually, since App.svelte sets volume, just forcing a volume update works:
      for (const [id, state] of Object.entries(mixer.sounds)) {
        if (state.active) {
          // Play will handle creating the node and setting volume
          // We must get the src from the map though. We can let App.svelte handle it
          // by dispatching a fake state update.
          mixer.sounds = { ...mixer.sounds };
          break; // only need to do it once to trigger reactivity
        }
      }
    }
  }
}

export const remote = new RemoteStore();
