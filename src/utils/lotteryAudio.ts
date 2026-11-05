/**
 * Web Audio API synthesizer for the lottery ball generator
 * Generates synthetic mechanical blower ambiance, ball click/pop, and victory chimes
 * 100% self-contained without any external asset dependencies.
 */

class LotteryAudioSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private blowerNoiseNode: AudioNode | null = null;
  private blowerGain: GainNode | null = null;

  constructor() {
    // Lazy initialized on first user gesture
  }

  private initContext() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.blowerGain && this.ctx) {
      this.blowerGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Starts a subtle pneumatic air blower rumble
   */
  public startBlower() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    if (this.blowerNoiseNode) return; // already active

    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02; // Pink-ish noise filter
        lastOut = output[i];
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Bandpass filter to sound like an acrylic chamber airflow
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(420, this.ctx.currentTime);
      filter.Q.setValueAtTime(1.8, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.04, this.ctx.currentTime + 0.5);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start();
      this.blowerNoiseNode = whiteNoise;
      this.blowerGain = gain;
    } catch {
      // AudioContext policy catch
    }
  }

  /**
   * Stops the air blower rumble
   */
  public stopBlower() {
    if (!this.ctx || !this.blowerGain) return;
    try {
      this.blowerGain.gain.setValueAtTime(this.blowerGain.gain.value, this.ctx.currentTime);
      this.blowerGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.3);
      setTimeout(() => {
        if (this.blowerNoiseNode) {
          try {
            (this.blowerNoiseNode as AudioBufferSourceNode).stop();
          } catch {}
          this.blowerNoiseNode = null;
          this.blowerGain = null;
        }
      }, 350);
    } catch {
      this.blowerNoiseNode = null;
      this.blowerGain = null;
    }
  }

  /**
   * Sound effect when a ball is captured and extracted into the chute
   */
  public playBallExtracted() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Mechanical pop/thump
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(840, now + 0.06);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);

      // Acrylic click ping
      const ping = this.ctx.createOscillator();
      const pingGain = this.ctx.createGain();
      ping.type = 'triangle';
      ping.frequency.setValueAtTime(1420, now + 0.04);
      ping.frequency.exponentialRampToValueAtTime(980, now + 0.18);

      pingGain.gain.setValueAtTime(0.18, now + 0.04);
      pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      ping.connect(pingGain);
      pingGain.connect(this.ctx.destination);

      ping.start(now + 0.04);
      ping.stop(now + 0.22);
    } catch {}
  }

  /**
   * Harmonious fanfare chord on completion of all 5 winning balls
   */
  public playDrawCompleteFanfare() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const chordFrequencies = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      chordFrequencies.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        const startTime = this.ctx!.currentTime + idx * 0.09;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.16, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.7);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.7);
      });
    } catch {}
  }
}

export const lotteryAudio = new LotteryAudioSynthesizer();
