'use strict';
/* =============================================
   MOTOBLITZ GP — Main Game Engine
   ============================================= */

window.GameEngine = (() => {

  // ─── State ────────────────────────────────────
  let _renderer = null;
  let _scene = null;
  let _camera = null;
  let _clock = null;
  let _animFrame = null;

  let _raceConfig = null;
  let _trackData = null;
  let _playerBike = null;
  let _aiBikes = [];
  let _leaderboard = [];
  let _totalLaps = 5;
  let _raceStarted = false;
  let _raceFinished = false;
  let _paused = false;

  let _input = { throttle: false, brake: false, left: false, right: false };
  let _touchStates = {};

  let _cameraOffset = new THREE.Vector3(0, CONFIG.CAMERA.HEIGHT, -CONFIG.CAMERA.DISTANCE);
  let _cameraShake = new THREE.Vector3();
  let _shakeIntensity = 0;

  let _settings = {};
  let _lastLapTimes = {};

  // ─── Bootstrap ───────────────────────────────
  function init() {
    const save = Storage.load();
    const settings = Storage.loadSettings();
    _settings = settings;

    // Init audio
    AudioEngine.init(settings);

    // Init Three.js
    _initRenderer();
    _initScene();
    _initCamera();

    // Init HUD
    HUDManager.init(settings);

    // Init menu
    MenuSystem.init(save, settings, startRace);

    // Init weather system
    WeatherSystem.init(_scene, _renderer, _camera);

    // Input
    _initInput();

    // Loading sequence
    _runLoadingSequence(() => {
      MenuSystem.showOverlay();
      MenuSystem.showScreen('main');
      _renderLoop(); // Start background render
    });
  }

  // ─── Three.js Init ────────────────────────────
  function _initRenderer() {
    const canvas = document.getElementById('game-canvas');
    _renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: _settings.gfxQuality !== 'low',
      powerPreference: 'high-performance',
    });
    _renderer.setPixelRatio(Math.min(window.devicePixelRatio, _settings.gfxQuality === 'high' ? 2 : 1.5));
    _renderer.setSize(window.innerWidth, window.innerHeight);
    _renderer.shadowMap.enabled = true;
    _renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    _renderer.outputEncoding = THREE.sRGBEncoding;
    _renderer.toneMapping = THREE.ACESFilmicToneMapping;
    _renderer.toneMappingExposure = 1.0;

    window.addEventListener('resize', () => {
      _renderer.setSize(window.innerWidth, window.innerHeight);
      _camera.aspect = window.innerWidth / window.innerHeight;
      _camera.updateProjectionMatrix();
    });
  }

  function _initScene() {
    _scene = new THREE.Scene();
    _scene.background = new THREE.Color(0x07070e);
    _clock = new THREE.Clock();
  }

  function _initCamera() {
    _camera = new THREE.PerspectiveCamera(
      CONFIG.CAMERA.FOV,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    _camera.position.set(0, CONFIG.CAMERA.HEIGHT, -CONFIG.CAMERA.DISTANCE);
  }

  // ─── Loading ──────────────────────────────────
  function _runLoadingSequence(onDone) {
    const bar = document.getElementById('loading-bar');
    const txt = document.getElementById('loading-text');
    const particles = document.getElementById('loading-particles');

    // Spawn particles
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.className = 'loading-particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.animationDuration = (2 + Math.random() * 4) + 's';
      p.style.animationDelay = Math.random() * 3 + 's';
      p.style.background = Math.random() > 0.5 ? '#ff3300' : '#00d4ff';
      if (particles) particles.appendChild(p);
    }

    const steps = [
      { pct: 15, text: 'Loading Track Assets...' },
      { pct: 30, text: 'Building Circuits...' },
      { pct: 50, text: 'Initializing Physics...' },
      { pct: 65, text: 'Configuring AI Opponents...' },
      { pct: 80, text: 'Warming Up Engine...' },
      { pct: 95, text: 'Almost Ready...' },
      { pct: 100, text: 'RACE READY!' },
    ];

    let stepIdx = 0;
    const advance = () => {
      if (stepIdx >= steps.length) {
        setTimeout(() => {
          const ls = document.getElementById('loading-screen');
          if (ls) ls.classList.add('fade-out');
          setTimeout(onDone, 800);
        }, 400);
        return;
      }
      const step = steps[stepIdx++];
      if (bar) bar.style.width = step.pct + '%';
      if (txt) txt.textContent = step.text;
      setTimeout(advance, 300 + Math.random() * 200);
    };
    setTimeout(advance, 400);
  }

  // ─── Background render loop (menu) ───────────
  function _renderLoop() {
    _animFrame = requestAnimationFrame(_renderLoop);
    const dt = Math.min(_clock.getDelta(), 0.05);

    if (!_raceStarted || _raceFinished) {
      // Simple menu background render
      _renderer.render(_scene, _camera);
      return;
    }

    if (_paused) return;

    _gameLoop(dt);
  }

  // ─── Start Race ───────────────────────────────
  function startRace(config) {
    _raceConfig = config;
    _totalLaps = config.laps || 5;
    _raceStarted = false;
    _raceFinished = false;
    _paused = false;
    _lastLapTimes = {};

    // Hide menu
    MenuSystem.hideOverlay();

    // Clear old scene
    _clearScene();

    // Build track
    const loadingEl = document.createElement('div');
    loadingEl.style.cssText = 'position:fixed;inset:0;z-index:900;background:#07070e;display:flex;align-items:center;justify-content:center;font-family:Orbitron;color:#ff3300;font-size:2rem;letter-spacing:0.2em';
    loadingEl.textContent = 'BUILDING CIRCUIT...';
    document.body.appendChild(loadingEl);

    setTimeout(() => {
      _buildRaceScene(config);
      document.body.removeChild(loadingEl);

      // Show HUD
      HUDManager.show();
      HUDManager.setWeather(config.weather);
      HUDManager.setCircuitLabel(config.circuit.name.toUpperCase());

      // Show countdown
      MenuSystem.showCountdown(config.circuit.name, _totalLaps, () => {
        _raceStarted = true;
        _playerBike.initRace();
        _aiBikes.forEach(ai => ai.initRace());
        AudioEngine.startEngine(config.bike.engineNote || 0);
        if (config.weather === 'rain') AudioEngine.startRain();
      });
    }, 100);
  }

  function _clearScene() {
    // Remove all objects from scene
    while (_scene.children.length > 0) {
      const obj = _scene.children[0];
      _scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    }

    // Dispose player and AI
    if (_playerBike) { _playerBike.dispose(); _playerBike = null; }
    _aiBikes.forEach(ai => ai.dispose());
    _aiBikes = [];
    _trackData = null;
  }

  function _buildRaceScene(config) {
    const circuit = config.circuit;
    const weather = config.weather;

    // Apply weather
    const weatherCfg = WeatherSystem.applyWeather(weather);

    // Build track
    _trackData = TrackBuilder.buildTrack(_scene, circuit, weather);

    // Spawn player
    const startPos = _trackData.startPos.clone();
    const startTangent = _trackData.startTangent.clone().normalize();
    const playerStart = startPos.clone().addScaledVector(startTangent, 2);

    _playerBike = new PlayerBike(_scene, config.bike, config.rider, playerStart, startTangent);
    _playerBike.setWeatherGrip(WeatherSystem.getGripFactor());

    if (WeatherSystem.hasHeadlights()) {
      _playerBike.addHeadlights();
    }

    // Spawn AI (11 opponents)
    const aiCount = 11;
    _aiBikes = AIManager.createAIRiders(
      _scene, aiCount, _trackData, config.difficulty, config.rider
    );

    // Position camera behind player
    _positionCameraAtStart();

    // Initial leaderboard
    _leaderboard = AIManager.computeLeaderboard(_playerBike, _aiBikes, _totalLaps);
  }

  function _positionCameraAtStart() {
    if (!_playerBike) return;
    const pos = _playerBike.position.clone();
    const heading = _playerBike.heading;
    _camera.position.set(
      pos.x - Math.sin(heading) * CONFIG.CAMERA.DISTANCE,
      pos.y + CONFIG.CAMERA.HEIGHT,
      pos.z - Math.cos(heading) * CONFIG.CAMERA.DISTANCE
    );
    _camera.lookAt(pos.x, pos.y + 1, pos.z);
  }

  // ─── Game Loop ────────────────────────────────
  function _gameLoop(dt) {
    if (!_playerBike || !_trackData) return;

    const grip = WeatherSystem.getGripFactor();

    // ─── Update player ─────────────────────────
    if (!_playerBike.finishedRace) {
      _playerBike.update(dt, _trackData, _input, grip);

      // Check lap completion
      if (_playerBike.lapCount > _playerBike._lastCheckedLap) {
        _playerBike._lastCheckedLap = _playerBike.lapCount;
        if (_playerBike.lapCount > 1) {
          const lapTime = _playerBike.lapTimes[_playerBike.lapTimes.length - 1];
          const prevBest = _lastLapTimes.best;
          const isBest = !prevBest || lapTime < prevBest;
          if (isBest) _lastLapTimes.best = lapTime;

          HUDManager.showLapComplete(lapTime, prevBest, isBest);
          AudioEngine.playLapComplete(isBest);

          // Save best lap to storage
          Storage.updateBestLap(_raceConfig.circuit.id, lapTime);

          // Check race complete
          if (_playerBike.lapCount > _totalLaps) {
            _playerBike.finishedRace = true;
            _playerBike.finishTime = _playerBike.raceTime;
            _finishRace();
            return;
          }
        }
      }
    }

    // ─── Update AI ─────────────────────────────
    const aiPositions = _aiBikes.map(ai => ai.position.clone());

    _aiBikes.forEach((ai, idx) => {
      if (!ai.finishedRace) {
        ai.update(dt, _trackData, grip, _playerBike.position, aiPositions.filter((_, i) => i !== idx));

        // AI lap check
        if (ai.lapCount > _totalLaps && !ai.finishedRace) {
          ai.finishedRace = true;
          ai.finishTime = ai.raceTime;
        }
      }
    });

    // ─── Leaderboard ───────────────────────────
    _leaderboard = AIManager.computeLeaderboard(_playerBike, _aiBikes, _totalLaps);
    const playerEntry = _leaderboard.find(e => e.isPlayer);
    if (playerEntry) _playerBike.racePos = playerEntry.position;

    // ─── Camera ────────────────────────────────
    _updateCamera(dt);

    // ─── Weather update ────────────────────────
    WeatherSystem.update(dt, _camera.position);

    // ─── Audio ─────────────────────────────────
    AudioEngine.updateEngine(_playerBike.rpm, _playerBike.throttle);

    if (_playerBike.skidActive) {
      AudioEngine.startBrake(_playerBike.braking);
      AudioEngine.updateBrake(_playerBike.braking);
    } else {
      AudioEngine.stopBrake();
    }

    // ─── HUD update ────────────────────────────
    HUDManager.update(dt, _playerBike, _leaderboard, _raceConfig?.circuit, _totalLaps);
    HUDManager.updateMinimap(
      _raceConfig?.circuit,
      _aiBikes.map(ai => ai.position),
      _playerBike.position
    );

    // ─── Render ────────────────────────────────
    _renderer.render(_scene, _camera);
  }

  // ─── Camera System ────────────────────────────
  function _updateCamera(dt) {
    if (!_playerBike) return;

    const bike = _playerBike;
    const pos = bike.position;
    const heading = bike.heading;
    const speed = bike.speed;

    // Dynamic FOV based on speed
    const speedRatio = speed / bike.maxSpeedMs;
    const targetFov = CONFIG.CAMERA.FOV + speedRatio * 15;
    _camera.fov += (targetFov - _camera.fov) * dt * 3;
    _camera.updateProjectionMatrix();

    // Target camera position (behind and above bike)
    const camDist = CONFIG.CAMERA.DISTANCE + speedRatio * 2;
    const camHeight = CONFIG.CAMERA.HEIGHT + bike.leanAngle * 0.5;

    const targetCamPos = new THREE.Vector3(
      pos.x - Math.sin(heading) * camDist,
      pos.y + camHeight,
      pos.z - Math.cos(heading) * camDist
    );

    // Camera shake
    if (_settings.cameraShake && speed > 20) {
      _shakeIntensity = (speedRatio * 0.08) + (bike.isOnTrack ? 0 : 0.15);
      _cameraShake.set(
        (Math.random() - 0.5) * _shakeIntensity,
        (Math.random() - 0.5) * _shakeIntensity * 0.5,
        (Math.random() - 0.5) * _shakeIntensity
      );
      targetCamPos.add(_cameraShake);
    }

    // Smooth follow
    _camera.position.lerp(targetCamPos, 1 - Math.exp(-CONFIG.CAMERA.LERP_SPEED * dt * 60));

    // Look at point ahead of bike
    const lookTarget = new THREE.Vector3(
      pos.x + Math.sin(heading) * CONFIG.CAMERA.LOOK_AHEAD,
      pos.y + 1.2,
      pos.z + Math.cos(heading) * CONFIG.CAMERA.LOOK_AHEAD
    );
    _camera.lookAt(lookTarget);
  }

  // ─── Race Finish ──────────────────────────────
  function _finishRace() {
    _raceFinished = true;
    AudioEngine.stopEngine();
    AudioEngine.stopBrake();
    AudioEngine.stopRain();

    // Final leaderboard
    _leaderboard = AIManager.computeLeaderboard(_playerBike, _aiBikes, _totalLaps);
    const playerEntry = _leaderboard.find(e => e.isPlayer);
    const position = playerEntry ? playerEntry.position : 12;
    const totalRiders = _leaderboard.length;

    // Compute coins
    const coinTable = CONFIG.SCORE.COINS_PER_POSITION;
    let coins = coinTable[Math.min(position - 1, coinTable.length - 1)] || 30;
    if (_playerBike.bestLapTime < Infinity) coins += CONFIG.SCORE.BONUS_FASTEST_LAP;

    Storage.addCoins(coins);
    Storage.recordRaceResult(position, _raceConfig.circuit.id);
    MenuSystem.refreshSave();

    // Show flag
    HUDManager.showFlag('checkered', '🏁 FINISH!');
    AudioEngine.playBeep(800, 0.5, 'sine', 0.15);

    // Show results after delay
    setTimeout(() => {
      HUDManager.hide();

      MenuSystem.showResults({
        position,
        totalRiders,
        lapTimes: _playerBike.lapTimes,
        bestLapMs: _playerBike.bestLapTime < Infinity ? _playerBike.bestLapTime : null,
        circuitName: _raceConfig.circuit.name,
        raceTimeMs: _playerBike.raceTime * 1000,
        coinsEarned: coins,
        leaderboard: _leaderboard,
      });
    }, 3000);
  }

  // ─── Pause ────────────────────────────────────
  function togglePause() {
    _paused = !_paused;
    if (_paused) {
      HUDManager.showPause();
      AudioEngine.stopEngine();
    } else {
      HUDManager.hidePause();
      AudioEngine.startEngine(_raceConfig?.bike?.engineNote || 0);
    }
  }

  function restartRace() {
    HUDManager.hidePause();
    if (_raceConfig) {
      HUDManager.hide();
      startRace(_raceConfig);
    }
  }

  function quitRace() {
    HUDManager.hidePause();
    HUDManager.hide();
    AudioEngine.stopEngine();
    AudioEngine.stopBrake();
    AudioEngine.stopRain();
    _raceStarted = false;
    _raceFinished = false;
    _paused = false;
    _clearScene();
    MenuSystem.showOverlay();
    MenuSystem.showScreen('main');
    MenuSystem.updateCoinsDisplay();
    AudioEngine.playMenuMusic();
  }

  // ─── Input System ─────────────────────────────
  function _initInput() {
    // Keyboard
    const keyMap = {
      'ArrowUp': 'throttle', 'KeyW': 'throttle', ' ': 'throttle',
      'ArrowDown': 'brake', 'KeyS': 'brake',
      'ArrowLeft': 'left', 'KeyA': 'left',
      'ArrowRight': 'right', 'KeyD': 'right',
    };

    document.addEventListener('keydown', e => {
      const action = keyMap[e.code] || keyMap[e.key];
      if (action) {
        _input[action] = true;
        if (action === 'brake') AudioEngine.resume();
        e.preventDefault();
      }
      if (e.code === 'Escape' || e.code === 'KeyP') togglePause();
    });

    document.addEventListener('keyup', e => {
      const action = keyMap[e.code] || keyMap[e.key];
      if (action) _input[action] = false;
    });

    // Touch buttons
    const touchButtons = {
      'btn-throttle': 'throttle',
      'btn-brake': 'brake',
      'btn-left': 'left',
      'btn-right': 'right',
    };

    Object.entries(touchButtons).forEach(([btnId, action]) => {
      const btn = document.getElementById(btnId);
      if (!btn) return;

      const start = e => {
        e.preventDefault();
        AudioEngine.resume();
        _input[action] = true;
        btn.classList.add('pressed');
        _touchStates[btnId] = true;
      };

      const end = e => {
        e.preventDefault();
        _input[action] = false;
        btn.classList.remove('pressed');
        _touchStates[btnId] = false;
      };

      btn.addEventListener('touchstart', start, { passive: false });
      btn.addEventListener('touchend', end, { passive: false });
      btn.addEventListener('touchcancel', end, { passive: false });
      btn.addEventListener('mousedown', start);
      btn.addEventListener('mouseup', end);
      btn.addEventListener('mouseleave', end);
    });

    // Tilt control (mobile gyroscope) - optional
    if (window.DeviceOrientationEvent) {
      let tiltEnabled = false;
      // Only enable on explicit user action to avoid permission issues
      window.enableTiltControl = () => {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
          DeviceOrientationEvent.requestPermission().then(perm => {
            if (perm === 'granted') tiltEnabled = true;
          });
        } else {
          tiltEnabled = true;
        }
      };

      window.addEventListener('deviceorientation', e => {
        if (!tiltEnabled || !_raceStarted || _paused) return;
        const gamma = e.gamma || 0; // left-right tilt
        const threshold = 8;
        if (Math.abs(gamma) > threshold) {
          _input.left = gamma < -threshold;
          _input.right = gamma > threshold;
        } else {
          _input.left = false;
          _input.right = false;
        }
      });
    }

    // Gamepad support
    window.addEventListener('gamepadconnected', () => {
      _startGamepadPoll();
    });
  }

  function _startGamepadPoll() {
    const pollGamepad = () => {
      if (!_raceStarted || _paused) { requestAnimationFrame(pollGamepad); return; }
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      const pad = pads[0];
      if (pad) {
        _input.throttle = pad.buttons[7]?.pressed || pad.axes[5] > 0.3; // R2
        _input.brake = pad.buttons[6]?.pressed || pad.axes[4] > 0.3;    // L2
        _input.left = pad.axes[0] < -0.3;
        _input.right = pad.axes[0] > 0.3;
      }
      requestAnimationFrame(pollGamepad);
    };
    pollGamepad();
  }

  // ─── Public API ───────────────────────────────
  return { init, startRace, togglePause, restartRace, quitRace };
})();

// ─── Bootstrap ───────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  GameEngine.init();
});
