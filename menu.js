'use strict';
/* =============================================
   MOTOBLITZ GP — Menu System
   ============================================= */

const MenuSystem = (() => {
  let _save = null;
  let _settings = null;
  let _selectedRider = null;
  let _selectedBike = null;
  let _selectedCircuit = null;
  let _gameMode = 'quick-race';
  let _bikePreviewRenderer = null;
  let _onStartRace = null;

  // ─── Init ─────────────────────────────────────
  function init(save, settings, onStartRace) {
    _save = save;
    _settings = settings;
    _onStartRace = onStartRace;

    bindNavigation();
    bindRiderSelect();
    bindBikeSelect();
    bindCircuitSelect();
    bindGarage();
    bindSettings();
    bindResults();
    bindInGame();

    updateCoinsDisplay();

    // Apply settings
    applySettings(settings);
  }

  // ─── Screen Navigation ─────────────────────────
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    const el = document.getElementById(`screen-${id}`);
    if (el) el.classList.remove('hidden');

    // Scroll to top
    if (el) el.scrollTop = 0;
  }

  function showOverlay() {
    const overlay = document.getElementById('menu-overlay');
    if (overlay) overlay.classList.remove('hidden');
    AudioEngine.playMenuMusic();
  }

  function hideOverlay() {
    const overlay = document.getElementById('menu-overlay');
    if (overlay) overlay.classList.add('hidden');
    AudioEngine.stopMenuMusic();
  }

  // ─── Main Nav Bindings ────────────────────────
  function bindNavigation() {
    // Main menu buttons
    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        AudioEngine.resume();
        AudioEngine.playBeep(440, 0.05, 'sine', 0.05);
        handleAction(action);
      });
    });

    // Back buttons
    document.querySelectorAll('[data-back]').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.back;
        AudioEngine.playBeep(330, 0.05, 'sine', 0.04);
        showScreen(target);
        if (target === 'main') updateCoinsDisplay();
      });
    });
  }

  function handleAction(action) {
    switch (action) {
      case 'quick-race':
        _gameMode = 'quick-race';
        buildRiderGrid();
        showScreen('rider');
        break;
      case 'championship':
        _gameMode = 'championship';
        buildRiderGrid();
        showScreen('rider');
        break;
      case 'time-trial':
        _gameMode = 'time-trial';
        buildRiderGrid();
        showScreen('rider');
        break;
      case 'career':
        _gameMode = 'career';
        buildRiderGrid();
        showScreen('rider');
        break;
      case 'garage':
        buildGarage();
        showScreen('garage');
        break;
      case 'settings':
        showScreen('settings');
        break;
    }
  }

  // ─── Rider Select ──────────────────────────────
  function buildRiderGrid() {
    const grid = document.getElementById('riders-grid');
    if (!grid) return;

    grid.innerHTML = RIDERS_DATA.map(rider => `
      <div class="rider-card" data-rider-id="${rider.id}" style="--team-color: ${rider.teamColor}">
        <div class="rider-check">✓</div>
        <div class="rider-number" style="color:${rider.teamColor}">${rider.number}</div>
        <div class="rider-flag">${rider.flag}</div>
        <div class="rider-name">${rider.name}</div>
        <div class="rider-team-tag">${rider.team}</div>
      </div>
    `).join('');

    grid.querySelectorAll('.rider-card').forEach(card => {
      card.addEventListener('click', () => {
        grid.querySelectorAll('.rider-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        const riderId = parseInt(card.dataset.riderId);
        _selectedRider = getRiderById(riderId);
        showRiderDetail(_selectedRider);
        document.getElementById('rider-next').disabled = false;
      });
    });

    // Pre-select saved rider
    if (_save.selectedRiderId) {
      const card = grid.querySelector(`[data-rider-id="${_save.selectedRiderId}"]`);
      if (card) card.click();
    }
  }

  function showRiderDetail(rider) {
    const panel = document.getElementById('rider-detail');
    if (!panel) return;

    document.getElementById('detail-avatar').textContent = rider.emoji || '🏍️';
    document.getElementById('detail-name').textContent = rider.name;
    document.getElementById('detail-team').textContent = `${rider.team} · ${rider.flag} ${rider.country}`;

    const statsEl = document.getElementById('detail-stats');
    const statColors = {
      speed: '#ff3300', acceleration: '#ff7700',
      handling: '#00d4ff', braking: '#ffd700',
    };

    statsEl.innerHTML = Object.entries(rider.stats).map(([key, val]) => `
      <div class="stat-bar-row">
        <span class="stat-bar-label">${key.toUpperCase()}</span>
        <div class="stat-bar-track">
          <div class="stat-bar-fill" style="width:${val}%; background:${statColors[key] || '#fff'}"></div>
        </div>
        <span class="stat-bar-value">${val}</span>
      </div>
    `).join('');
  }

  function bindRiderSelect() {
    document.getElementById('rider-next')?.addEventListener('click', () => {
      if (!_selectedRider) return;
      _save.selectedRiderId = _selectedRider.id;
      Storage.save();
      buildBikeList();
      showScreen('bike');
    });
  }

  // ─── Bike Select ───────────────────────────────
  function buildBikeList() {
    const list = document.getElementById('bikes-list');
    if (!list) return;

    list.innerHTML = BIKES_DATA.map(bike => {
      const unlocked = Storage.isBikeUnlocked(bike.id);
      return `
        <div class="bike-card ${unlocked ? '' : 'locked'}" data-bike-id="${bike.id}">
          <div class="bike-color-swatch" style="background:${hexToCSS(bike.color)}">${bike.emoji}</div>
          <div class="bike-card-info">
            <div class="bike-card-name">${bike.name}</div>
            <div class="bike-card-brand">${bike.brand}</div>
            <div class="bike-mini-stats">
              <div class="mini-stat"><span class="mini-stat-val">${bike.stats.speed}</span><span class="mini-stat-lbl">SPD</span></div>
              <div class="mini-stat"><span class="mini-stat-val">${bike.stats.acceleration}</span><span class="mini-stat-lbl">ACC</span></div>
              <div class="mini-stat"><span class="mini-stat-val">${bike.stats.handling}</span><span class="mini-stat-lbl">HDL</span></div>
              <div class="mini-stat"><span class="mini-stat-val">${bike.stats.braking}</span><span class="mini-stat-lbl">BRK</span></div>
            </div>
          </div>
          ${unlocked ? '' : `<div class="bike-lock-badge">🔒 🪙${bike.price.toLocaleString()}</div>`}
        </div>
      `;
    }).join('');

    list.querySelectorAll('.bike-card:not(.locked)').forEach(card => {
      card.addEventListener('click', () => {
        list.querySelectorAll('.bike-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        const bikeId = parseInt(card.dataset.bikeId);
        _selectedBike = Storage.applyUpgradeStats(getBikeById(bikeId));
        showBikeStats(_selectedBike);
        document.getElementById('bike-next').disabled = false;
      });
    });

    // Locked bike click → buy prompt
    list.querySelectorAll('.bike-card.locked').forEach(card => {
      card.addEventListener('click', () => {
        const bikeId = parseInt(card.dataset.bikeId);
        const bike = getBikeById(bikeId);
        if (_save.coins >= bike.price) {
          if (confirm(`Buy ${bike.name} for 🪙${bike.price.toLocaleString()} coins?`)) {
            Storage.spendCoins(bike.price);
            Storage.unlockBike(bikeId);
            _save = Storage.getData();
            buildBikeList();
            updateCoinsDisplay();
          }
        } else {
          alert(`Not enough coins! Need 🪙${bike.price.toLocaleString()}`);
        }
      });
    });

    // Pre-select saved bike
    if (_save.selectedBikeId) {
      const card = list.querySelector(`[data-bike-id="${_save.selectedBikeId}"]`);
      if (card && !card.classList.contains('locked')) card.click();
    }
  }

  function showBikeStats(bike) {
    const panel = document.getElementById('bike-stats');
    if (!panel) return;

    const statsConfig = [
      { label: 'TOP SPEED', val: bike.stats.speed, color: '#ff3300' },
      { label: 'ACCEL', val: bike.stats.acceleration, color: '#ff7700' },
      { label: 'HANDLING', val: bike.stats.handling, color: '#00d4ff' },
      { label: 'BRAKING', val: bike.stats.braking, color: '#ffd700' },
    ];

    panel.innerHTML = statsConfig.map(s => `
      <div class="bike-stat-item">
        <span class="bike-stat-label">${s.label}</span>
        <span class="bike-stat-val" style="color:${s.color}">${s.val}</span>
      </div>
    `).join('');

    // Draw bike preview
    const canvas = document.getElementById('bike-preview-canvas');
    if (canvas && _bikePreviewRenderer) {
      _bikePreviewRenderer.dispose();
    }
    if (canvas) {
      _bikePreviewRenderer = TrackBuilder.buildBikePreview(canvas, bike);
    }
  }

  function bindBikeSelect() {
    document.getElementById('bike-next')?.addEventListener('click', () => {
      if (!_selectedBike) return;
      _save.selectedBikeId = _selectedBike.id;
      Storage.save();
      buildCircuitGrid();
      showScreen('circuit');
    });
  }

  // ─── Circuit Select ────────────────────────────
  function buildCircuitGrid() {
    const grid = document.getElementById('circuits-grid');
    if (!grid) return;

    grid.innerHTML = CIRCUITS_DATA.map(c => `
      <div class="circuit-card" data-circuit-id="${c.id}">
        <div class="circuit-card-flag">${c.flag}</div>
        <div class="circuit-card-name">${c.name}</div>
        <div class="circuit-card-country">${c.country}</div>
        <div class="circuit-card-length">${c.length} · ${c.corners} corners</div>
      </div>
    `).join('');

    grid.querySelectorAll('.circuit-card').forEach(card => {
      card.addEventListener('click', () => {
        grid.querySelectorAll('.circuit-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        const circuitId = parseInt(card.dataset.circuitId);
        _selectedCircuit = getCircuitById(circuitId);
        showCircuitDetail(_selectedCircuit);
        document.getElementById('start-race-btn').disabled = false;
      });
    });

    // Auto-select first
    grid.querySelector('.circuit-card')?.click();
  }

  function showCircuitDetail(circuit) {
    const infoEl = document.getElementById('circuit-info');
    if (infoEl) {
      const bestLap = Storage.getBestLap(circuit.id);
      infoEl.innerHTML = `
        <div class="circuit-info-name">${circuit.name}</div>
        <div class="circuit-info-detail">
          🏁 Length: <span>${circuit.length}</span><br>
          🔄 Corners: <span>${circuit.corners}</span><br>
          ⏱️ Ref Lap: <span>${circuit.bestLap}</span><br>
          ⭐ Best Lap: <span>${bestLap ? HUDManager.formatTime(bestLap) : 'No record'}</span>
        </div>
      `;
    }

    // Draw map preview
    const canvas = document.getElementById('circuit-preview-map');
    if (canvas) TrackBuilder.drawCircuitPreview(canvas, circuit);

    // Set default weather
    const weatherSel = document.getElementById('weather-select');
    if (weatherSel && circuit.defaultWeather) {
      weatherSel.value = circuit.defaultWeather;
    }
  }

  function bindCircuitSelect() {
    document.getElementById('start-race-btn')?.addEventListener('click', () => {
      if (!_selectedCircuit || !_selectedRider || !_selectedBike) return;

      const laps = parseInt(document.getElementById('laps-select')?.value || '5');
      const difficulty = document.getElementById('difficulty-select')?.value || 'medium';
      const weather = document.getElementById('weather-select')?.value || 'sunny';

      const raceConfig = {
        mode: _gameMode,
        rider: _selectedRider,
        bike: _selectedBike,
        circuit: _selectedCircuit,
        laps,
        difficulty,
        weather,
      };

      if (_onStartRace) _onStartRace(raceConfig);
    });
  }

  // ─── Countdown ────────────────────────────────
  function showCountdown(circuitName, totalLaps, onComplete) {
    const overlay = document.getElementById('countdown-overlay');
    const numEl = document.getElementById('countdown-num');
    const circuitEl = document.getElementById('race-circuit-name');
    const lapsEl = document.getElementById('race-laps-count');

    if (!overlay || !numEl) { if (onComplete) onComplete(); return; }

    circuitEl.textContent = circuitName;
    lapsEl.textContent = `${totalLaps} LAPS`;
    overlay.classList.remove('hidden');

    let count = 3;
    const tick = () => {
      if (count > 0) {
        numEl.textContent = count;
        numEl.className = 'countdown-number';
        AudioEngine.playCountdown(count);
        count--;
        setTimeout(tick, 900);
      } else {
        numEl.textContent = 'GO!';
        numEl.className = 'countdown-number go';
        AudioEngine.playCountdown(0);
        setTimeout(() => {
          overlay.classList.add('hidden');
          if (onComplete) onComplete();
        }, 700);
      }
    };
    setTimeout(tick, 300);
  }

  // ─── Race Results ─────────────────────────────
  function showResults(results) {
    const { position, totalRiders, lapTimes, bestLapMs, circuitName,
            raceTimeMs, coinsEarned, leaderboard } = results;

    // Title
    const rankTexts = ['🏆 VICTORY!', '🥈 2ND PLACE', '🥉 3RD PLACE', `${position}TH PLACE`];
    const rankIdx = Math.min(position - 1, rankTexts.length - 1);
    document.getElementById('result-rank-text').textContent = rankTexts[rankIdx];
    document.getElementById('result-circuit').textContent = circuitName.toUpperCase();

    // Podium
    const podium = document.getElementById('podium-display');
    if (podium && leaderboard) {
      const top3 = leaderboard.slice(0, 3);
      const order = [1, 0, 2]; // P2, P1, P3 for visual
      podium.innerHTML = order.map(i => {
        const entry = top3[i];
        if (!entry) return '';
        const cls = ['p2', 'p1', 'p3'][order.indexOf(i)];
        const medal = ['🥈', '🥇', '🥉'][order.indexOf(i)];
        const name = entry.isPlayer ? 'YOU' : (entry.bike?.riderData?.short || `P${i + 1}`);
        const flag = entry.isPlayer ? '🏍️' : (entry.bike?.riderData?.flag || '🏴');
        return `
          <div class="podium-rider ${cls}">
            <div class="podium-avatar">${flag}</div>
            <div class="podium-name">${name}</div>
            <div class="podium-block">${medal}</div>
          </div>`;
      }).join('');
    }

    // Stats
    const statsGrid = document.getElementById('race-stats');
    if (statsGrid) {
      statsGrid.innerHTML = `
        <div class="race-stat-cell"><div class="race-stat-label">POSITION</div><div class="race-stat-value">P${position}</div></div>
        <div class="race-stat-cell"><div class="race-stat-label">RACE TIME</div><div class="race-stat-value">${HUDManager.formatTime(raceTimeMs)}</div></div>
        <div class="race-stat-cell"><div class="race-stat-label">BEST LAP</div><div class="race-stat-value">${HUDManager.formatTime(bestLapMs)}</div></div>
        <div class="race-stat-cell"><div class="race-stat-label">LAPS</div><div class="race-stat-value">${lapTimes?.length || 0}</div></div>
      `;
    }

    // Coins
    const coinsEl = document.getElementById('coins-earned');
    if (coinsEl) coinsEl.textContent = `+${coinsEarned.toLocaleString()} 🪙`;

    hideOverlay();
    const resultsScreen = document.getElementById('screen-results');
    const menuOverlay = document.getElementById('menu-overlay');
    if (menuOverlay) menuOverlay.classList.remove('hidden');
    showScreen('results');
  }

  // ─── Garage ───────────────────────────────────
  function buildGarage() {
    document.getElementById('garage-coins').textContent = _save.coins?.toLocaleString() || '0';

    const content = document.getElementById('garage-content');
    if (!content) return;

    const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab || 'upgrades';
    renderGarageTab(activeTab, content);
  }

  function renderGarageTab(tab, content) {
    if (tab === 'upgrades') {
      const bikeId = _save.selectedBikeId || 1;
      const bike = getBikeById(bikeId);

      content.innerHTML = `<div class="upgrade-header" style="padding:0.5rem;color:var(--clr-text-dim);font-size:0.75rem">Upgrading: <strong style="color:var(--clr-accent)">${bike.name}</strong></div>` +
        Object.entries(CONFIG.UPGRADES).map(([type, cfg]) => {
          const level = Storage.getUpgradeLevel(bikeId, type);
          const maxed = level >= cfg.max_level;
          const cost = maxed ? 0 : cfg.cost_per_level[level];
          const dots = Array.from({ length: cfg.max_level }, (_, i) =>
            `<div class="upgrade-dot ${i < level ? 'filled' : ''}"></div>`
          ).join('');

          const icons = { ENGINE: '⚙️', SUSPENSION: '🔩', BRAKES: '🛑', TIRES: '🏎️', AERO: '💨' };
          const statBoostLabel = `+${level * cfg.boost} ${cfg.stat.toUpperCase()}`;

          return `
            <div class="upgrade-item">
              <div class="upgrade-icon">${icons[type] || '🔧'}</div>
              <div class="upgrade-info">
                <div class="upgrade-name">${type}</div>
                <div class="upgrade-desc">${maxed ? `MAX (${statBoostLabel})` : `Next: +${cfg.boost} ${cfg.stat}`}</div>
                <div class="upgrade-level-dots">${dots}</div>
              </div>
              <button class="upgrade-cost-btn" ${maxed || _save.coins < cost ? 'disabled' : ''}
                data-upgrade="${type}" data-cost="${cost}" data-bike="${bikeId}">
                ${maxed ? 'MAXED' : `🪙${cost.toLocaleString()}`}
              </button>
            </div>`;
        }).join('');

      content.querySelectorAll('.upgrade-cost-btn:not(:disabled)').forEach(btn => {
        btn.addEventListener('click', () => {
          const type = btn.dataset.upgrade;
          const cost = parseInt(btn.dataset.cost);
          const bike = parseInt(btn.dataset.bike);
          if (Storage.spendCoins(cost)) {
            const level = Storage.getUpgradeLevel(bike, type) + 1;
            Storage.setUpgradeLevel(bike, type, level);
            _save = Storage.getData();
            buildGarage();
          }
        });
      });

    } else if (tab === 'shop') {
      content.innerHTML = BIKES_DATA.map(bike => {
        const owned = Storage.isBikeUnlocked(bike.id);
        return `
          <div class="upgrade-item">
            <div class="upgrade-icon" style="color:${hexToCSS(bike.color)}">${bike.emoji}</div>
            <div class="upgrade-info">
              <div class="upgrade-name">${bike.name}</div>
              <div class="upgrade-desc">${bike.brand} · ${bike.description.substring(0, 40)}...</div>
              <div class="upgrade-level-dots">
                SPD:${bike.stats.speed} ACC:${bike.stats.acceleration}
              </div>
            </div>
            <button class="upgrade-cost-btn" ${owned || _save.coins < bike.price ? 'disabled' : ''}
              data-buy-bike="${bike.id}" data-cost="${bike.price}">
              ${owned ? 'OWNED' : `🪙${bike.price.toLocaleString()}`}
            </button>
          </div>`;
      }).join('');

      content.querySelectorAll('[data-buy-bike]:not(:disabled)').forEach(btn => {
        btn.addEventListener('click', () => {
          const bikeId = parseInt(btn.dataset.buyBike);
          const cost = parseInt(btn.dataset.cost);
          if (Storage.spendCoins(cost)) {
            Storage.unlockBike(bikeId);
            _save = Storage.getData();
            buildGarage();
            updateCoinsDisplay();
          }
        });
      });
    }
  }

  function bindGarage() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const content = document.getElementById('garage-content');
        if (content) renderGarageTab(btn.dataset.tab, content);
        document.getElementById('garage-coins').textContent = _save.coins?.toLocaleString() || '0';
      });
    });
  }

  // ─── Settings ─────────────────────────────────
  function applySettings(settings) {
    if (!settings) return;
    const mv = document.getElementById('music-vol');
    const sv = document.getElementById('sfx-vol');
    const gq = document.getElementById('gfx-quality');
    const cs = document.getElementById('cam-shake');
    const mb = document.getElementById('motion-blur');
    const sf = document.getElementById('show-fps');

    if (mv) mv.value = settings.musicVol;
    if (sv) sv.value = settings.sfxVol;
    if (gq) gq.value = settings.gfxQuality;
    if (cs) cs.checked = settings.cameraShake;
    if (mb) mb.checked = settings.motionBlur;
    if (sf) sf.checked = settings.showFps;
  }

  function bindSettings() {
    document.getElementById('music-vol')?.addEventListener('input', e => {
      _settings.musicVol = parseInt(e.target.value);
      AudioEngine.setMusicVolume(_settings.musicVol);
      Storage.saveSettings();
    });

    document.getElementById('sfx-vol')?.addEventListener('input', e => {
      _settings.sfxVol = parseInt(e.target.value);
      AudioEngine.setSfxVolume(_settings.sfxVol);
      Storage.saveSettings();
    });

    document.getElementById('gfx-quality')?.addEventListener('change', e => {
      _settings.gfxQuality = e.target.value;
      Storage.saveSettings();
    });

    document.getElementById('cam-shake')?.addEventListener('change', e => {
      _settings.cameraShake = e.target.checked;
      Storage.saveSettings();
    });

    document.getElementById('motion-blur')?.addEventListener('change', e => {
      _settings.motionBlur = e.target.checked;
      Storage.saveSettings();
    });

    document.getElementById('show-fps')?.addEventListener('change', e => {
      _settings.showFps = e.target.checked;
      Storage.saveSettings();
    });

    document.getElementById('reset-btn')?.addEventListener('click', () => {
      if (confirm('Reset ALL progress? This cannot be undone!')) {
        Storage.reset();
        _save = Storage.getData();
        updateCoinsDisplay();
        showScreen('main');
      }
    });
  }

  // ─── Results bindings ─────────────────────────
  function bindResults() {
    document.getElementById('back-menu-btn')?.addEventListener('click', () => {
      showScreen('main');
      updateCoinsDisplay();
      AudioEngine.playMenuMusic();
    });

    document.getElementById('retry-btn')?.addEventListener('click', () => {
      if (_onStartRace && _selectedCircuit && _selectedRider && _selectedBike) {
        const laps = parseInt(document.getElementById('laps-select')?.value || '5');
        const difficulty = document.getElementById('difficulty-select')?.value || 'medium';
        const weather = document.getElementById('weather-select')?.value || 'sunny';

        hideOverlay();
        _onStartRace({
          mode: _gameMode,
          rider: _selectedRider,
          bike: _selectedBike,
          circuit: _selectedCircuit,
          laps, difficulty, weather,
        });
      }
    });
  }

  // ─── In-game controls ─────────────────────────
  function bindInGame() {
    document.getElementById('pause-btn')?.addEventListener('click', () => {
      window.GameEngine?.togglePause();
    });

    document.getElementById('resume-btn')?.addEventListener('click', () => {
      window.GameEngine?.togglePause();
    });

    document.getElementById('restart-race-btn')?.addEventListener('click', () => {
      window.GameEngine?.restartRace();
    });

    document.getElementById('quit-race-btn')?.addEventListener('click', () => {
      window.GameEngine?.quitRace();
    });
  }

  // ─── Helpers ─────────────────────────────────
  function updateCoinsDisplay() {
    _save = Storage.getData();
    const el = document.getElementById('menu-coins');
    if (el) el.textContent = (_save.coins || 0).toLocaleString();
  }

  function refreshSave() {
    _save = Storage.getData();
  }

  return {
    init, showScreen, showOverlay, hideOverlay,
    showCountdown, showResults, refreshSave,
    updateCoinsDisplay,
  };
})();
