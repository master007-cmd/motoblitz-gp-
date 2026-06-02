'use strict';
/* =============================================
   MOTOBLITZ GP — HUD Manager
   ============================================= */

const HUDManager = (() => {
  // DOM element cache
  let els = {};
  let _visible = false;
  let _minimapCtx = null;
  let _lastFpsUpdate = 0;
  let _frameCount = 0;
  let _currentFps = 60;
  let _lapPopupTimer = 0;
  let _flagTimer = 0;
  let _settings = {};

  function init(settings) {
    _settings = settings || {};
    els = {
      hud: document.getElementById('hud-overlay'),
      pos: document.getElementById('hud-pos'),
      posTotal: document.getElementById('hud-pos-total'),
      lap: document.getElementById('hud-lap'),
      lapTotal: document.getElementById('hud-lap-total'),
      raceTime: document.getElementById('hud-race-time'),
      best: document.getElementById('hud-best'),
      speed: document.getElementById('hud-speed'),
      rpm: document.getElementById('hud-rpm'),
      rpmFill: document.getElementById('hud-rpm-fill'),
      gear: document.getElementById('hud-gear'),
      leaderboard: document.getElementById('hud-leaderboard'),
      minimap: document.getElementById('minimap-canvas'),
      minimapLabel: document.getElementById('minimap-circuit-label'),
      weatherIcon: document.getElementById('weather-indicator'),
      fpsCounter: document.getElementById('fps-counter'),
      lapPopup: document.getElementById('lap-popup'),
      lapPopupTime: document.getElementById('lap-popup-time'),
      lapPopupDelta: document.getElementById('lap-popup-delta'),
      wrongWay: document.getElementById('wrong-way'),
      flagNotif: document.getElementById('flag-notif'),
      pauseMenu: document.getElementById('pause-menu'),
    };

    if (els.minimap) {
      _minimapCtx = els.minimap.getContext('2d');
    }
  }

  function show() {
    _visible = true;
    if (els.hud) els.hud.classList.remove('hidden');
  }

  function hide() {
    _visible = false;
    if (els.hud) els.hud.classList.add('hidden');
  }

  // ─── Update all HUD elements ─────────────────
  function update(dt, playerBike, leaderboard, circuitData, totalLaps) {
    if (!_visible || !playerBike) return;

    // FPS
    _frameCount++;
    _lastFpsUpdate += dt;
    if (_lastFpsUpdate >= 0.5) {
      _currentFps = Math.round(_frameCount / _lastFpsUpdate);
      _frameCount = 0;
      _lastFpsUpdate = 0;
      if (_settings.showFps && els.fpsCounter) {
        els.fpsCounter.textContent = `${_currentFps} FPS`;
        els.fpsCounter.classList.remove('hidden');
      }
    }

    // Speed
    const speedInt = Math.round(playerBike.speedKmh);
    if (els.speed) els.speed.textContent = speedInt;

    // RPM
    const rpmRatio = Math.min(1, playerBike.rpm / CONFIG.GEARS.MAX_RPM);
    const rpmPct = Math.round(rpmRatio * 100);
    if (els.rpm) els.rpm.textContent = Math.round(playerBike.rpm / 1000).toFixed(1) + 'k';
    if (els.rpmFill) {
      els.rpmFill.style.width = rpmPct + '%';
      // Redline flash
      if (rpmRatio > 0.87) {
        els.rpmFill.style.background = 'linear-gradient(90deg, #ff1744, #ff1744)';
      } else {
        els.rpmFill.style.background = 'linear-gradient(90deg, #00e676, #ffeb3b, #ff5722)';
      }
    }

    // Gear
    if (els.gear) els.gear.textContent = playerBike.gear;

    // Position
    if (leaderboard && els.pos) {
      const playerEntry = leaderboard.find(e => e.isPlayer);
      const pos = playerEntry ? playerEntry.position : playerBike.racePos;
      els.pos.textContent = pos;
      if (els.posTotal) els.posTotal.textContent = '/' + leaderboard.length;
    }

    // Lap
    if (els.lap) els.lap.textContent = Math.min(playerBike.lapCount, totalLaps);
    if (els.lapTotal) els.lapTotal.textContent = totalLaps;

    // Race time
    if (els.raceTime) els.raceTime.textContent = formatTime(playerBike.raceTime * 1000);

    // Best lap
    if (els.best) {
      if (playerBike.bestLapTime < Infinity) {
        els.best.textContent = formatTime(playerBike.bestLapTime);
      } else {
        els.best.textContent = '--:--.---';
      }
    }

    // Wrong way
    if (els.wrongWay) {
      if (playerBike.wrongWay) {
        els.wrongWay.classList.remove('hidden');
      } else {
        els.wrongWay.classList.add('hidden');
      }
    }

    // Lap popup timer
    if (_lapPopupTimer > 0) {
      _lapPopupTimer -= dt;
      if (_lapPopupTimer <= 0 && els.lapPopup) {
        els.lapPopup.classList.add('hidden');
      }
    }

    // Flag timer
    if (_flagTimer > 0) {
      _flagTimer -= dt;
      if (_flagTimer <= 0 && els.flagNotif) {
        els.flagNotif.classList.add('hidden');
      }
    }

    // Update leaderboard
    if (leaderboard) updateLeaderboard(leaderboard, playerBike);
  }

  function updateLeaderboard(leaderboard, playerBike) {
    if (!els.leaderboard) return;
    const max = Math.min(8, leaderboard.length);
    let html = '';

    for (let i = 0; i < max; i++) {
      const entry = leaderboard[i];
      const isPlayer = entry.isPlayer;
      const name = isPlayer ? 'YOU' : (entry.bike.riderData?.short || `P${i + 1}`);
      const flag = isPlayer ? '🏍️' : (entry.bike.riderData?.flag || '🏴');
      const gap = i === 0 ? 'LEADER' : '';

      html += `
        <div class="leaderboard-row ${isPlayer ? 'is-player' : ''}">
          <span class="lb-pos">${entry.position}</span>
          <span class="lb-flag">${flag}</span>
          <span class="lb-name">${name}</span>
          <span class="lb-gap">${gap}</span>
        </div>`;
    }

    els.leaderboard.innerHTML = html;
  }

  // ─── Lap complete notification ────────────────
  function showLapComplete(lapTimeMs, prevBestMs, isBest) {
    if (!els.lapPopup) return;
    els.lapPopup.classList.remove('hidden');
    if (els.lapPopupTime) els.lapPopupTime.textContent = formatTime(lapTimeMs);

    if (els.lapPopupDelta) {
      if (prevBestMs && prevBestMs < Infinity) {
        const delta = lapTimeMs - prevBestMs;
        const sign = delta >= 0 ? '+' : '-';
        els.lapPopupDelta.textContent = `${sign}${formatTime(Math.abs(delta))}`;
        els.lapPopupDelta.className = 'lap-popup-delta ' + (delta >= 0 ? 'positive' : 'negative');
      } else {
        els.lapPopupDelta.textContent = isBest ? '⭐ BEST LAP!' : '';
        els.lapPopupDelta.className = 'lap-popup-delta negative';
      }
    }

    _lapPopupTimer = 3.5;
  }

  // ─── Minimap update ───────────────────────────
  function updateMinimap(circuitData, aiPositions, playerPos) {
    if (!els.minimap || !circuitData) return;
    TrackBuilder.drawMinimap(els.minimap, circuitData, aiPositions, playerPos);
  }

  function setCircuitLabel(name) {
    if (els.minimapLabel) els.minimapLabel.textContent = name;
  }

  // ─── Weather indicator ───────────────────────
  function setWeather(weatherKey) {
    if (!els.weatherIcon) return;
    const W = CONFIG.WEATHER[weatherKey.toUpperCase()] || CONFIG.WEATHER.SUNNY;
    els.weatherIcon.textContent = W.icon || '☀️';
  }

  // ─── Flag notifications ───────────────────────
  function showFlag(type, text) {
    if (!els.flagNotif) return;
    els.flagNotif.className = `flag-notification ${type}`;
    els.flagNotif.textContent = text;
    els.flagNotif.classList.remove('hidden');
    _flagTimer = 3;
  }

  // ─── Pause menu ───────────────────────────────
  function showPause() {
    if (els.pauseMenu) els.pauseMenu.classList.remove('hidden');
  }

  function hidePause() {
    if (els.pauseMenu) els.pauseMenu.classList.add('hidden');
  }

  // ─── Time formatting ──────────────────────────
  function formatTime(ms) {
    if (!ms || ms < 0) return '--:--.---';
    const totalSec = ms / 1000;
    const minutes = Math.floor(totalSec / 60);
    const seconds = Math.floor(totalSec % 60);
    const millis = Math.round((totalSec % 1) * 1000);
    return `${minutes}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
  }

  return {
    init, show, hide, update,
    showLapComplete, updateMinimap, setCircuitLabel,
    setWeather, showFlag, showPause, hidePause,
    formatTime,
  };
})();
