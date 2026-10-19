// music.js - Procedural Music Box Synthesizer using Web Audio API
// Generates a soft, romantic music box chime melody without external audio files.

export class MusicBox {
  constructor() {
    this.audioCtx = null;
    this.isPlaying = false;
    this.timer = null;
    this.noteIndex = 0;

    // A delicate, romantic music-box melody progression (frequencies in Hz)
    // Notes: E5, G#5, B5, E6, D#6, B5, G#5, A5, C#6, E6, D#6, B5, F#5...
    this.melody = [
      { note: 659.25, dur: 0.5 }, // E5
      { note: 830.61, dur: 0.5 }, // G#5
      { note: 987.77, dur: 0.5 }, // B5
      { note: 1318.51, dur: 1.0 }, // E6
      { note: 1244.51, dur: 0.5 }, // D#6
      { note: 987.77, dur: 0.5 }, // B5
      { note: 830.61, dur: 0.5 }, // G#5
      { note: 880.00, dur: 1.0 }, // A5
      { note: 1108.73, dur: 0.5 }, // C#6
      { note: 1318.51, dur: 0.5 }, // E6
      { note: 1244.51, dur: 1.0 }, // D#6
      { note: 987.77, dur: 0.5 }, // B5
      { note: 739.99, dur: 0.5 }, // F#5
      { note: 830.61, dur: 1.2 }, // G#5
      { note: 0, dur: 0.4 },      // rest
      { note: 987.77, dur: 0.5 }, // B5
      { note: 1108.73, dur: 0.5 }, // C#6
      { note: 1318.51, dur: 1.0 }, // E6
      { note: 1479.98, dur: 0.5 }, // F#6
      { note: 1318.51, dur: 0.5 }, // E6
      { note: 1108.73, dur: 0.5 }, // C#6
      { note: 987.77, dur: 1.2 }, // B5
      { note: 830.61, dur: 0.6 }, // G#5
      { note: 659.25, dur: 1.5 }, // E5
      { note: 0, dur: 0.8 }       // rest
    ];
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playChime(freq, duration = 0.8) {
    if (!this.audioCtx || freq <= 0) return;

    const now = this.audioCtx.currentTime;

    // Primary bell tone (Fundamental)
    const osc1 = this.audioCtx.createOscillator();
    const gain1 = this.audioCtx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);

    // Overtone harmonic for music-box chime bell resonance
    const osc2 = this.audioCtx.createOscillator();
    const gain2 = this.audioCtx.createGain();

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2.76, now); // Metallic harmonic ratio

    // Envelope shaping (Instant sharp attack, long resonant bell decay)
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.18, now + 0.015);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.06, now + 0.01);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

    // Connect nodes
    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(this.audioCtx.destination);
    gain2.connect(this.audioCtx.destination);

    osc1.start(now);
    osc2.start(now);

    osc1.stop(now + 2.0);
    osc2.stop(now + 1.2);
  }

  step() {
    if (!this.isPlaying) return;

    const item = this.melody[this.noteIndex];
    if (item.note > 0) {
      this.playChime(item.note, item.dur);
    }

    this.noteIndex = (this.noteIndex + 1) % this.melody.length;
    this.timer = setTimeout(() => this.step(), item.dur * 650);
  }

  toggle() {
    this.init();
    this.isPlaying = !this.isPlaying;

    if (this.isPlaying) {
      this.step();
    } else {
      if (this.timer) clearTimeout(this.timer);
    }

    return this.isPlaying;
  }
}
