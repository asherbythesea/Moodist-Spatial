/**
 * AudioEngine — singleton managing the Web Audio API graph.
 *
 * Architecture:
 *   AudioContext
 *     └── MediaElementSourceNode (per sound, backed by <audio> element)
 *           └── GainNode (per sound, 0.0–1.0)
 *                 └── masterGain
 *                       └── AnalyserNode
 *                             └── AudioContext.destination
 *
 * Audio files stream via <audio> elements (not AudioBufferSourceNode),
 * avoiding the need to load all files into memory simultaneously.
 */

interface SoundNode {
  audio: HTMLAudioElement;
  source: MediaElementAudioSourceNode;
  gain: GainNode;
}

/**
 * Three perceptual frequency bands extracted from the FFT each frame.
 *
 * With fftSize = 256 and a typical sample rate of 44100 Hz, each of the
 * 128 frequency bins spans ~344 Hz. Band boundaries below are chosen to
 * map roughly to psychoacoustic regions rather than strict Hz labels:
 *
 *   bass   — bins 0..3   (~0–1380 Hz sub/low-bass; contains kick, rumble, wind)
 *   mid    — bins 4..15  (~1380–5520 Hz; contains vocals, string texture)
 *   treble — bins 16..40 (~5520–13800 Hz; contains bird chirps, rain, high tones)
 *
 * All values are normalized to 0.0–1.0.
 */
export interface FrequencyBands {
  bass: number;
  mid: number;
  treble: number;
}

const FADE_DURATION = 0.05; // 50ms ramp to prevent click artifacts

// FFT bin ranges — adjust if you change fftSize
const BASS_START   = 0;
const BASS_END     = 3;
const MID_START    = 4;
const MID_END      = 15;
const TREBLE_START = 16;
const TREBLE_END   = 40;

function averageBins(data: Uint8Array, start: number, end: number): number {
  let sum = 0;
  const count = end - start + 1;
  for (let i = start; i <= end; i++) {
    sum += data[i] ?? 0;
  }
  return sum / count / 255;
}

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

      // Setup master analyser for visuals.
      // fftSize of 256 gives 128 frequency bins. Keeping it low is intentional:
      // higher resolution would require wider bin ranges and costs more CPU each frame.
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8; // built-in temporal smoothing
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

    setTimeout(() => {
      node.audio.pause();
    }, FADE_DURATION * 1000 + 10);
  }

  /** Updates volume for a playing sound with smooth ramp */
  setVolume(id: string, volume: number): void {
    const node = this.nodes.get(id);
    if (!node || !this.context) return;

    // setTargetAtTime is preferred over linearRamp for rapid UI updates such
    // as continuous drag events — it prevents "zipper noise" by easing
    // exponentially rather than snapping through intermediate values.
    node.gain.gain.setTargetAtTime(
      Math.max(0, Math.min(1, volume)),
      this.context.currentTime,
      0.05
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

  /**
   * Returns the three perceptual frequency bands for this frame.
   *
   * This is the primary method the Visualizer should call each animation frame.
   * It reads the current FFT snapshot from the AnalyserNode (populated via
   * getByteFrequencyData) and averages the bins within each band range.
   *
   * The AnalyserNode's smoothingTimeConstant (0.8) already applies a
   * first-order IIR low-pass filter to the raw FFT output, so the returned
   * values have gentle temporal smoothing baked in. Additional lerp smoothing
   * in the Visualizer is still useful for band-specific response curves.
   */
  getBands(): FrequencyBands {
    if (!this.analyser || !this.dataArray) {
      return { bass: 0, mid: 0, treble: 0 };
    }

    this.analyser.getByteFrequencyData(this.dataArray as any);

    return {
      bass:   averageBins(this.dataArray, BASS_START,   BASS_END),
      mid:    averageBins(this.dataArray, MID_START,    MID_END),
      treble: averageBins(this.dataArray, TREBLE_START, TREBLE_END),
    };
  }

  /**
   * Returns the overall RMS-like amplitude (0–1) across all bins.
   * Kept for backward compatibility with any callers outside the Visualizer.
   */
  getAmplitude(): number {
    if (!this.analyser || !this.dataArray) return 0;

    this.analyser.getByteFrequencyData(this.dataArray as any);

    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
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
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(d => d.kind === 'audiooutput');
    } catch (e) {
      console.warn('Could not get audio output devices', e);
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
        console.error('Error setting sink ID', e);
      }
    } else {
      console.warn('setSinkId not supported on this browser.');
    }
  }
}

/** Singleton instance */
export const audioEngine = new AudioEngine();
