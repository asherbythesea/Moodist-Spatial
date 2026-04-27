/**
 * AudioEngine — singleton managing the Web Audio API graph.
 * 
 * Architecture:
 *   AudioContext
 *     └── MediaElementSourceNode (per sound, backed by <audio> element)
 *           └── GainNode (per sound, 0.0–1.0)
 *                 └── AudioContext.destination
 * 
 * Audio files stream via <audio> elements (not AudioBufferSourceNode),
 * avoiding the need to load all files into memory simultaneously.
 */

interface SoundNode {
  audio: HTMLAudioElement;
  source: MediaElementAudioSourceNode;
  gain: GainNode;
}

const FADE_DURATION = 0.05; // 50ms ramp to prevent click artifacts

class AudioEngine {
  private context: AudioContext | null = null;
  private nodes: Map<string, SoundNode> = new Map();
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;

  /** Lazily initializes AudioContext on first user interaction */
  private ensureContext(): AudioContext {
    if (!this.context) {
      this.context = new AudioContext();
      this.masterGain = this.context.createGain();
      
      // Setup master analyser for visuals
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 256; // Keep low for CPU efficiency
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
    return this.context;
  }

  /** Gets or creates the audio node graph for a sound */
  private getOrCreateNode(id: string, src: string): SoundNode {
    let node = this.nodes.get(id);
    if (node) return node;

    const ctx = this.ensureContext();
    const audio = new Audio(src);
    audio.loop = true;
    audio.preload = 'none';
    audio.crossOrigin = 'anonymous';

    const source = ctx.createMediaElementSource(audio);
    const gain = ctx.createGain();
    gain.gain.value = 0;

    source.connect(gain);
    gain.connect(this.masterGain!);

    node = { audio, source, gain };
    this.nodes.set(id, node);
    return node;
  }

  /** Plays a sound with a smooth fade-in */
  play(id: string, src: string, volume: number): void {
    const ctx = this.ensureContext();
    const node = this.getOrCreateNode(id, src);

    node.gain.gain.cancelScheduledValues(ctx.currentTime);
    node.gain.gain.linearRampToValueAtTime(
      Math.max(0, Math.min(1, volume)),
      ctx.currentTime + FADE_DURATION
    );

    node.audio.play().catch(() => {
      // Browser may block autoplay; handled silently
    });
  }

  /** Pauses a sound with a smooth fade-out */
  stop(id: string): void {
    const node = this.nodes.get(id);
    if (!node || !this.context) return;

    node.gain.gain.cancelScheduledValues(this.context.currentTime);
    node.gain.gain.linearRampToValueAtTime(0, this.context.currentTime + FADE_DURATION);

    // Actually pause after fade completes
    setTimeout(() => {
      node.audio.pause();
    }, FADE_DURATION * 1000 + 10);
  }

  /** Updates volume for a playing sound with smooth ramp */
  setVolume(id: string, volume: number): void {
    const node = this.nodes.get(id);
    if (!node || !this.context) return;

    // Use setTargetAtTime for rapid UI updates (like dragging) to prevent zipper noise
    node.gain.gain.setTargetAtTime(
      Math.max(0, Math.min(1, volume)),
      this.context.currentTime,
      0.05 // 50ms time constant for smooth exponential easing
    );
  }

  /** Sets the master volume for all sounds */
  setMasterVolume(volume: number): void {
    if (!this.masterGain || !this.context) return;
    
    this.masterGain.gain.setTargetAtTime(
      Math.max(0, Math.min(1, volume)),
      this.context.currentTime,
      0.05
    );
  }

  /** Fades out all sounds over a duration (for sleep timer) */
  fadeOutAll(durationSeconds: number): Promise<void> {
    return new Promise((resolve) => {
      if (!this.context || !this.masterGain) {
        resolve();
        return;
      }
      this.masterGain.gain.cancelScheduledValues(this.context.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(0, this.context.currentTime + durationSeconds);

      setTimeout(() => {
        this.pauseAll();
        // Restore master volume for next play
        if (this.masterGain && this.context) {
          this.masterGain.gain.value = 1;
        }
        resolve();
      }, durationSeconds * 1000 + 50);
    });
  }

  /** Pauses all sounds immediately */
  pauseAll(): void {
    for (const [, node] of this.nodes) {
      node.audio.pause();
      if (this.context) {
        node.gain.gain.cancelScheduledValues(this.context.currentTime);
        node.gain.gain.value = 0;
      }
    }
  }

  /** Returns whether a specific sound's audio element is ready */
  isReady(id: string): boolean {
    const node = this.nodes.get(id);
    return node ? node.audio.readyState >= 2 : false;
  }

  /** Preloads a sound by creating its audio element */
  preload(id: string, src: string): HTMLAudioElement {
    const node = this.getOrCreateNode(id, src);
    node.audio.preload = 'auto';
    return node.audio;
  }

  /** Gets current overall audio amplitude (0-1) for visualizer */
  getAmplitude(): number {
    if (!this.analyser || !this.dataArray) return 0;
    
    // Use frequency data for ambient reactivity
    this.analyser.getByteFrequencyData(this.dataArray as any);
    
    let sum = 0;
    for(let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    return (sum / this.dataArray.length) / 255;
  }

  /** Gets all available audio output devices (requires secure context/localhost) */
  async getAudioOutputs(): Promise<MediaDeviceInfo[]> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return [];
    }
    try {
      // Need to ask for permission to get labels, though enumeration might work without it
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(d => d.kind === 'audiooutput');
    } catch (e) {
      console.warn("Could not get audio output devices", e);
      return [];
    }
  }

  /** Sets the physical output device (Speakers, Headphones, etc.) */
  async setSinkId(deviceId: string): Promise<void> {
    const ctx = this.ensureContext() as any;
    if (typeof ctx.setSinkId === 'function') {
      try {
        await ctx.setSinkId(deviceId);
      } catch (e) {
        console.error("Error setting sink ID", e);
      }
    } else {
      console.warn("setSinkId not supported on this browser.");
    }
  }
}

/** Singleton instance */
export const audioEngine = new AudioEngine();
