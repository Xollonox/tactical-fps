// Audio management system
// Uses AudioContext for procedural sounds as placeholders

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterVolume = 0.3;
    this.enabled = true;
    this.initialized = false;
    this.buffers = {};
  }

  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
      this._generateBuffers();
    } catch (e) {
      console.warn('Audio not available:', e.message);
      this.enabled = false;
    }
  }

  _generateBuffers() {
    // Generate procedural sound buffers
    this.buffers.gunshot = this._createNoiseBuffer(0.15);
    this.buffers.pistol = this._createNoiseBuffer(0.12, 800);
    this.buffers.shotgun = this._createNoiseBuffer(0.25, 200);
    this.buffers.sniper = this._createNoiseBuffer(0.2, 150);
    this.buffers.smg = this._createNoiseBuffer(0.1, 600);
    this.buffers.reload = this._createClickBuffer(0.3);
    this.buffers.headshot = this._createHeadshotBuffer();
    this.buffers.impact = this._createNoiseBuffer(0.05, 400);
    this.buffers.footstep = this._createNoiseBuffer(0.08, 300);
    this.buffers.roundStart = this._createToneBuffer(0.5, 440);
    this.buffers.roundWin = this._createToneBuffer(0.8, 660);
    this.buffers.roundLose = this._createToneBuffer(0.6, 220);
    this.buffers.enemyFire = this._createNoiseBuffer(0.12, 500);
    this.buffers.explosion = this._createNoiseBuffer(0.4, 100);
  }

  _createNoiseBuffer(duration, cutoff = 400) {
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 8 / duration);
      data[i] = (Math.random() * 2 - 1) * envelope;
    }
    return buffer;
  }

  _createClickBuffer(duration) {
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const clicks = Math.floor(t * 20);
      const clickPhase = (t * 20) - clicks;
      const clickEnv = Math.exp(-clickPhase * 30);
      data[i] = (Math.random() * 2 - 1) * clickEnv * 0.3;
    }
    return buffer;
  }

  _createHeadshotBuffer() {
    const sampleRate = this.ctx.sampleRate;
    const duration = 0.2;
    const length = sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const env = Math.exp(-t * 20);
      const tone = Math.sin(2 * Math.PI * 800 * t) * 0.3;
      const crackle = (Math.random() * 2 - 1) * env * 0.5;
      data[i] = tone + crackle;
    }
    return buffer;
  }

  _createToneBuffer(duration, freq) {
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const env = Math.exp(-t * 3 / duration);
      data[i] = Math.sin(2 * Math.PI * freq * t) * env * 0.3;
    }
    return buffer;
  }

  play(soundName, volume = 1.0, pitch = 1.0) {
    if (!this.enabled || !this.initialized || !this.buffers[soundName]) return;

    try {
      const source = this.ctx.createBufferSource();
      source.buffer = this.buffers[soundName];
      source.playbackRate.value = pitch;

      const gain = this.ctx.createGain();
      gain.gain.value = volume * this.masterVolume;

      source.connect(gain);
      gain.connect(this.ctx.destination);
      source.start(0);
    } catch (e) {
      // Silently fail for audio glitches
    }
  }

  playGunshot(weaponId) {
    const soundMap = {
      rifle: { name: 'gunshot', vol: 0.5, pitch: 1 },
      pistol: { name: 'pistol', vol: 0.4, pitch: 1.1 },
      smg: { name: 'smg', vol: 0.4, pitch: 1.2 },
      shotgun: { name: 'shotgun', vol: 0.6, pitch: 0.8 },
      sniper: { name: 'sniper', vol: 0.7, pitch: 0.7 }
    };
    const s = soundMap[weaponId] || { name: 'gunshot', vol: 0.5, pitch: 1 };
    this.play(s.name, s.vol, s.pitch);
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
}

// Singleton
export const audio = new AudioManager();
