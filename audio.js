'use strict';
/* =============================================
   MOTOBLITZ GP — Audio Engine (Web Audio API)
   ============================================= */

const AudioEngine = (() => {
  let ctx = null;
  let masterGain, musicGain, sfxGain;
  let engineNode = null, engineOsc = null, engineOsc2 = null;
  let rainNode = null;
  let brakeNode = null;
  let musicOscillators = [];
  let initialized = false;
  let currentEngineRPM = 1200;
  let targetEngineRPM = 1200;
  let _settings = { musicVol: 60, sfxVol: 80 };

  // ─── Init ────────────────────────────────────
  function init(settings) {
    if (initialized) return;
    _settings = settings || _settings;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 1.0;
      masterGain.connect(ctx.destination);

      musicGain = ctx.createGain();
      musicGain.gain.value = _settings.musicVol / 100;
      musicGain.connect(masterGain);

      sfxGain = ctx.createGain();
      sfxGain.gain.value = _settings.sfxVol / 100;
      sfxGain.connect(masterGain);

      initialized = true;
    } catch (e) {
      console.warn('Web Audio not available:', e);
    }
  }

  function resume() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  // ─── Engine Sound ─────────────────────────────
  function startEngine(bikeEngineNote = 0) {
    if (!initialized) return;
    stopEngine();

    // Main oscillator
    engineOsc = ctx.createOscillator();
    engineOsc2 = ctx.createOscillator();

    const distortion = ctx.createWaveShaper();
    distortion.curve = makeDistortionCurve(200);
    distortion.oversample = '4x';

    const engineGainNode = ctx.createGain();
    engineGainNode.gain.value = 0.12;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 0.8;

    // Note-based frequency offsets for different bikes
    const baseFreqs = [55, 48, 52, 45]; // V4, inline4, inline4, V2
    const base = baseFreqs[bikeEngineNote % baseFreqs.length];

    engineOsc.type = 'sawtooth';
    engineOsc.frequency.value = base;
    engineOsc2.type = 'square';
    engineOsc2.frequency.value = base * 1.5;

    const osc2Gain = ctx.createGain();
    osc2Gain.gain.value = 0.3;

    engineOsc.connect(distortion);
    engineOsc2.connect(osc2Gain);
    osc2Gain.connect(distortion);
    distortion.connect(filter);
    filter.connect(engineGainNode);
    engineGainNode.connect(sfxGain);

    engineOsc.start();
    engineOsc2.start();
    engineNode = { osc: engineOsc, osc2: engineOsc2, gainNode: engineGainNode, base };
  }

  function updateEngine(rpm, throttle) {
    if (!engineNode || !ctx) return;
    targetEngineRPM = rpm;
    currentEngineRPM += (targetEngineRPM - currentEngineRPM) * 0.15;

    const rpmRatio = currentEngineRPM / CONFIG.GEARS.MAX_RPM;
    const freq = engineNode.base + rpmRatio * engineNode.base * 8;
    const vol = 0.05 + throttle * 0.12 + rpmRatio * 0.06;

    engineNode.osc.frequency.setTargetAtTime(freq, ctx.currentTime, 0.05);
    engineNode.osc2.frequency.setTargetAtTime(freq * 1.5, ctx.currentTime, 0.05);
    engineNode.gainNode.gain.setTargetAtTime(Math.min(0.25, vol), ctx.currentTime, 0.05);
  }

  function stopEngine() {
    if (engineNode) {
      try { engineNode.osc.stop(); engineNode.osc2.stop(); } catch (e) {}
      engineNode = null;
    }
  }

  // ─── Brake Screech ───────────────────────────
  function startBrake(intensity) {
    if (!initialized || brakeNode) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 3200 + Math.random() * 800;
    gain.gain.value = intensity * 0.04;
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start();
    brakeNode = { osc, gain };
  }

  function updateBrake(intensity) {
    if (!brakeNode || !ctx) return;
    brakeNode.gain.gain.setTargetAtTime(intensity * 0.04, ctx.currentTime, 0.1);
  }

  function stopBrake() {
    if (brakeNode) {
      try {
        brakeNode.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
        setTimeout(() => { try { brakeNode.osc.stop(); } catch(e){} brakeNode = null; }, 200);
      } catch (e) { brakeNode = null; }
    }
  }

  // ─── Rain Sound ──────────────────────────────
  function startRain() {
    if (!initialized || rainNode) return;
    // White noise via AudioBuffer
    const bufSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    filter.Q.value = 0.5;

    const gain = ctx.createGain();
    gain.gain.value = 0.06;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(sfxGain);
    source.start();
    rainNode = { source, gain };
  }

  function stopRain() {
    if (rainNode) {
      try {
        rainNode.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
        setTimeout(() => { try { rainNode.source.stop(); } catch(e){} rainNode = null; }, 600);
      } catch(e) { rainNode = null; }
    }
  }

  // ─── One-shot SFX ────────────────────────────
  function playBeep(freq, duration, type = 'sine', vol = 0.2) {
    if (!initialized) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = vol;
    gain.gain.setTargetAtTime(0, ctx.currentTime + duration * 0.8, duration * 0.1);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  function playCountdown(num) {
    if (num > 0) {
      playBeep(440, 0.15, 'square', 0.15);
    } else {
      // GO!
      playBeep(880, 0.08, 'square', 0.2);
      setTimeout(() => playBeep(1100, 0.3, 'square', 0.15), 100);
    }
  }

  function playLapComplete(isBest) {
    if (isBest) {
      [800, 1000, 1200].forEach((f, i) => {
        setTimeout(() => playBeep(f, 0.15, 'sine', 0.15), i * 120);
      });
    } else {
      playBeep(600, 0.2, 'sine', 0.1);
    }
  }

  function playOvertake() {
    playBeep(550, 0.1, 'square', 0.08);
  }

  function playCrash() {
    playBeep(200, 0.5, 'sawtooth', 0.12);
  }

  // ─── Menu Music ──────────────────────────────
  function playMenuMusic() {
    if (!initialized) return;
    stopMenuMusic();

    // Ambient electronic menu music - arpeggiated
    const notes = [220, 261.63, 329.63, 392, 440, 523.25];
    let noteIdx = 0;
    let step = 0;
    const sequence = [0, 2, 4, 5, 4, 2, 1, 0, 3, 4, 5, 4, 3, 2];

    const playNext = () => {
      if (!initialized) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1200;

      osc.type = 'triangle';
      osc.frequency.value = notes[sequence[noteIdx % sequence.length]] * 0.5;
      gain.gain.value = 0.05;
      gain.gain.setTargetAtTime(0, ctx.currentTime + 0.3, 0.1);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(musicGain);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);

      musicOscillators.push(osc);
      noteIdx++;

      const timer = setTimeout(playNext, 280);
      musicOscillators.push({ stop: () => clearTimeout(timer) });
    };

    playNext();
  }

  function stopMenuMusic() {
    musicOscillators.forEach(o => { try { o.stop(); } catch(e){} });
    musicOscillators = [];
  }

  // ─── Volume Control ──────────────────────────
  function setMusicVolume(vol) {
    if (musicGain) musicGain.gain.setTargetAtTime(vol / 100, ctx.currentTime, 0.1);
  }

  function setSfxVolume(vol) {
    if (sfxGain) sfxGain.gain.setTargetAtTime(vol / 100, ctx.currentTime, 0.1);
  }

  // ─── Utility ─────────────────────────────────
  function makeDistortionCurve(amount) {
    const n = 256;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }

  return {
    init, resume,
    startEngine, updateEngine, stopEngine,
    startBrake, updateBrake, stopBrake,
    startRain, stopRain,
    playBeep, playCountdown, playLapComplete, playOvertake, playCrash,
    playMenuMusic, stopMenuMusic,
    setMusicVolume, setSfxVolume,
  };
})();
