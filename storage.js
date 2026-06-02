'use strict';
/* =============================================
   MOTOBLITZ GP — Storage System
   ============================================= */

const Storage = (() => {
  const KEY = CONFIG.STORAGE.SAVE_KEY;
  const SET_KEY = CONFIG.STORAGE.SETTINGS_KEY;

  // ─── Default save state ─────────────────────
  const defaultSave = () => ({
    version: CONFIG.VERSION,
    coins: 1500,
    totalRaces: 0,
    totalWins: 0,
    bestLaps: {},          // circuitId -> best lap time in ms
    unlockedBikes: [1, 2, 3], // Bike IDs
    bikeUpgrades: {},      // bikeId -> { ENGINE: level, SUSPENSION: level, ... }
    selectedRiderId: 1,
    selectedBikeId: 1,
    championship: {
      active: false,
      season: 0,
      round: 0,
      standings: [],       // Array of { riderId, points }
    },
    career: {
      season: 0,
      wins: 0,
      points: 0,
    },
    stats: {
      totalDistanceKm: 0,
      fastestSpeedKmh: 0,
      totalOvertakes: 0,
    },
    achievements: [],
  });

  // ─── Default settings ────────────────────────
  const defaultSettings = () => ({
    musicVol: 60,
    sfxVol: 80,
    gfxQuality: 'medium',
    cameraShake: true,
    motionBlur: true,
    showFps: false,
    touchLayout: 'default',
  });

  let _save = null;
  let _settings = null;

  // ─── Load / Save ─────────────────────────────
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Merge with defaults in case of new fields
        _save = deepMerge(defaultSave(), parsed);
      } else {
        _save = defaultSave();
      }
    } catch (e) {
      console.warn('Save load failed, using defaults:', e);
      _save = defaultSave();
    }
    return _save;
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(_save));
    } catch (e) {
      console.warn('Save failed:', e);
    }
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SET_KEY);
      if (raw) {
        _settings = deepMerge(defaultSettings(), JSON.parse(raw));
      } else {
        _settings = defaultSettings();
      }
    } catch (e) {
      _settings = defaultSettings();
    }
    return _settings;
  }

  function saveSettings() {
    try {
      localStorage.setItem(SET_KEY, JSON.stringify(_settings));
    } catch (e) {}
  }

  function reset() {
    _save = defaultSave();
    save();
  }

  // ─── Getters / Setters ───────────────────────
  function getData() { return _save; }
  function getSettings() { return _settings; }

  function addCoins(amount) {
    _save.coins = Math.max(0, (_save.coins || 0) + amount);
    save();
  }

  function spendCoins(amount) {
    if (_save.coins < amount) return false;
    _save.coins -= amount;
    save();
    return true;
  }

  function unlockBike(bikeId) {
    if (!_save.unlockedBikes.includes(bikeId)) {
      _save.unlockedBikes.push(bikeId);
      save();
    }
  }

  function isBikeUnlocked(bikeId) {
    return _save.unlockedBikes.includes(bikeId);
  }

  function getUpgradeLevel(bikeId, upgradeType) {
    if (!_save.bikeUpgrades[bikeId]) return 0;
    return _save.bikeUpgrades[bikeId][upgradeType] || 0;
  }

  function setUpgradeLevel(bikeId, upgradeType, level) {
    if (!_save.bikeUpgrades[bikeId]) _save.bikeUpgrades[bikeId] = {};
    _save.bikeUpgrades[bikeId][upgradeType] = level;
    save();
  }

  function updateBestLap(circuitId, lapTimeMs) {
    const key = `c${circuitId}`;
    if (!_save.bestLaps[key] || lapTimeMs < _save.bestLaps[key]) {
      _save.bestLaps[key] = lapTimeMs;
      save();
      return true; // new best!
    }
    return false;
  }

  function getBestLap(circuitId) {
    return _save.bestLaps[`c${circuitId}`] || null;
  }

  function recordRaceResult(position, circuitId) {
    _save.totalRaces = (_save.totalRaces || 0) + 1;
    if (position === 1) _save.totalWins = (_save.totalWins || 0) + 1;
    save();
  }

  function applyUpgradeStats(bikeData) {
    if (!bikeData) return bikeData;
    const bikeId = bikeData.id;
    const upgrades = _save.bikeUpgrades[bikeId] || {};
    const result = {
      ...bikeData,
      stats: { ...bikeData.stats },
    };

    Object.keys(CONFIG.UPGRADES).forEach(type => {
      const upg = CONFIG.UPGRADES[type];
      const level = upgrades[type] || 0;
      if (level > 0) {
        result.stats[upg.stat] = Math.min(100, result.stats[upg.stat] + level * upg.boost);
      }
    });

    return result;
  }

  // ─── Utility: Deep merge ─────────────────────
  function deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
      if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  return {
    load, save, loadSettings, saveSettings, reset,
    getData, getSettings,
    addCoins, spendCoins,
    unlockBike, isBikeUnlocked,
    getUpgradeLevel, setUpgradeLevel,
    updateBestLap, getBestLap,
    recordRaceResult,
    applyUpgradeStats,
  };
})();
