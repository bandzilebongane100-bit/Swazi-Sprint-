class SoundEngine {
  private ctx: AudioContext | null = null;
  private musicInterval: any = null;
  private mainGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  
  private musicPlaying = false;
  private beatCount = 0;
  private scale = [130.81, 146.83, 164.81, 196.00, 220.00, 261.63, 293.66, 329.63, 392.00, 440.00]; // Pentatonic C Major (warm, organic African sound)
  private melodyTheme = [4, 4, 6, 7, 6, 4, 3, 4, 3, 1, 0, 1, 3, 1, 3, 4];
  
  private isMuted = false;
  private isMusicMuted = false;

  constructor() {
    // Lazy initialized on user click
  }

  private initCtx() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      this.mainGain = this.ctx.createGain();
      this.mainGain.gain.setValueAtTime(0.6, this.ctx.currentTime);
      this.mainGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.isMusicMuted ? 0 : 0.45, this.ctx.currentTime);
      this.musicGain.connect(this.mainGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
      this.sfxGain.connect(this.mainGain);
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  public setMute(mute: boolean) {
    this.isMuted = mute;
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(mute ? 0 : 0.8, this.ctx.currentTime);
    }
  }

  public setMusicMute(mute: boolean) {
    this.isMusicMuted = mute;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(mute ? 0 : 0.4, this.ctx.currentTime);
    }
  }

  // PLAY SFX: Coin chime sound (Classic dual-sine ring)
  public playCoin() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    
    // Primary sound
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(987.77, t); // B5
    osc1.frequency.setValueAtTime(1318.51, t + 0.08); // E6
    
    gain1.gain.setValueAtTime(0.0, t);
    gain1.gain.linearRampToValueAtTime(0.2, t + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    
    osc1.connect(gain1);
    gain1.connect(this.sfxGain!);
    osc1.start(t);
    osc1.stop(t + 0.3);
  }

  // PLAY SFX: Gem pickup sound (Shiny arpeggio)
  public playGem() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t + idx * 0.05);
      
      gain.gain.setValueAtTime(0.0, t + idx * 0.05);
      gain.gain.linearRampToValueAtTime(0.15, t + idx * 0.05 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.2);
      
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + idx * 0.05);
      osc.stop(t + idx * 0.05 + 0.2);
    });
  }

  // PLAY SFX: Jump sound effect (rising bend)
  public playJump() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(450, t + 0.15);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  // PLAY SFX: Slide sound effect (low pass windy slide)
  public playSlide() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    // Generate simple filtered white noise buffer
    const bufferSize = this.ctx.sampleRate * 0.25; // 0.25 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(150, t + 0.25);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain!);
    
    noise.start(t);
    noise.stop(t + 0.25);
  }

  // PLAY SFX: Lane change whoosh
  public playLaneChange() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.linearRampToValueAtTime(200, t + 0.1);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  // PLAY SFX: Shield or power up pickup shimmer
  public playPowerUp() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.setValueAtTime(440, t + 0.05);
    osc.frequency.setValueAtTime(660, t + 0.1);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.25);

    gain.gain.setValueAtTime(0.0, t);
    gain.gain.linearRampToValueAtTime(0.15, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  // PLAY SFX: Standard button click
  public playClick() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.setValueAtTime(200, t + 0.03);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  // PLAY SFX: Store upgrade cash register
  public playUpgrade() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.frequency.setValueAtTime(1500, t);
    osc2.frequency.setValueAtTime(1800, t);

    gain.gain.setValueAtTime(0.11, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain!);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.15);
    osc2.stop(t + 0.15);
  }

  // PLAY SFX: Bad Crash (deep rumble crash with noise)
  public playCrash() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    
    // Bass rumble
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.linearRampToValueAtTime(30, t + 0.4);
    
    oscGain.gain.setValueAtTime(0.4, t);
    oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
    
    osc.connect(oscGain);
    oscGain.connect(this.sfxGain!);
    osc.start(t);
    osc.stop(t + 0.5);

    // Crack noise
    try {
      const bufferSize = this.ctx.sampleRate * 0.4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(250, t);
      
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.25, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.sfxGain!);
      
      noise.start(t);
      noise.stop(t + 0.4);
    } catch (e) {
      // safe fallback
    }
  }

  // PROC GEN MUSIC ENGINE
  // Produces periodic African polyrhythms with a bouncy bass and a melody sync'd to eighth notes.
  public startMusic() {
    this.initCtx();
    if (!this.ctx || this.musicPlaying) return;
    this.musicPlaying = true;

    let tempo = 135; // BPM
    let beatDuration = 60 / tempo; // Duration of a single quarter note
    let stepDuration = beatDuration / 2; // Eighth notes

    const playDrumPattern = (time: number, step: number) => {
      if (!this.ctx || this.isMusicMuted) return;

      // 1. Synth Cowbell/Woodblock sound on specific steps (high Afro-beat syncopation)
      if (step % 4 === 1 || step === 5 || step === 11 || step === 14) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, time); // D5
        
        gain.gain.setValueAtTime(0.05, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.08);
        
        osc.connect(gain);
        gain.connect(this.musicGain!);
        osc.start(time);
        osc.stop(time + 0.1);
      }

      // 2. Warm Bass (Pentatonic root bouncy bass line)
      if (step % 2 === 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        
        // Dynamic bouncy bass pattern
        const bassNotes = [65.41, 65.41, 73.42, 82.41, 98.00, 98.00, 82.41, 73.42]; // C2, C2, D2, E2, G2, G2, E2, D2
        const note = bassNotes[(Math.floor(this.beatCount / 2)) % bassNotes.length];
        
        osc.frequency.setValueAtTime(note, time);
        
        gain.gain.setValueAtTime(Math.random() * 0.05 + 0.1, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + stepDuration * 0.9);
        
        osc.connect(gain);
        gain.connect(this.musicGain!);
        osc.start(time);
        osc.stop(time + stepDuration);
      }

      // 3. Kalimba Lead (Pentatonic melody sweep in Eswatini Pentatonic Scale)
      if (step % 2 === 1 && Math.random() > 0.3) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        
        // Play melodic sequence
        const themeIdx = this.beatCount % this.melodyTheme.length;
        const noteFreq = this.scale[this.melodyTheme[themeIdx]];
        
        osc.frequency.setValueAtTime(noteFreq, time);
        
        gain.gain.setValueAtTime(0.07, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.2);
        
        osc.connect(gain);
        gain.connect(this.musicGain!);
        osc.start(time);
        osc.stop(time + 0.25);
      }

      // 4. Shaker loop (Afrobeat shaker background)
      if (step % 1 === 0) {
        try {
          const oscNoise = this.ctx.createOscillator(); // we filter or just use raw low volume clicks
          const gain = this.ctx.createGain();
          
          const dur = 0.03;
          gain.gain.setValueAtTime(step % 4 === 0 ? 0.015 : 0.008, time);
          gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
          
          // Using a high pass band for metallic sound
          const filter = this.ctx.createBiquadFilter();
          filter.type = "highpass";
          filter.frequency.setValueAtTime(6000, time);
          
          const oscRand = this.ctx.createOscillator();
          oscRand.type = "sawtooth";
          oscRand.frequency.setValueAtTime(10000, time);
          
          oscRand.connect(filter);
          filter.connect(gain);
          gain.connect(this.musicGain!);
          oscRand.start(time);
          oscRand.stop(time + dur);
        } catch (e) {
          // ignore error with synthesizer fallback
        }
      }
    };

    let lookAhead = 0.1;
    let nextNoteTime = this.ctx.currentTime + lookAhead;

    this.musicInterval = setInterval(() => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      while (nextNoteTime < t + lookAhead) {
        playDrumPattern(nextNoteTime, this.beatCount % 16);
        nextNoteTime += stepDuration;
        this.beatCount++;
      }
    }, 40);
  }

  public stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.musicPlaying = false;
  }
}

export const sounds = new SoundEngine();
