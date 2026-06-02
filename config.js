/* =============================================
   MOTOBLITZ GP — Configuration
   ============================================= */
'use strict';

const CONFIG = {
  VERSION: '2.0.0',

  // Physics
  PHYSICS: {
    DRAG: 0.02,           // Natural deceleration
    GRAVITY: 9.8,
    MAX_LEAN: 38,         // Max lean angle degrees
    LEAN_SPEED: 4.0,      // How fast bike leans
    STEER_SENSITIVITY: 1.8,
    STEER_HIGHSPEED_FACTOR: 0.4, // Reduced steering at high speed
    OFFTRACK_SLOWDOWN: 0.85,
    OFFTRACK_GRIP: 0.5,
  },

  // Camera
  CAMERA: {
    DISTANCE: 6.5,
    HEIGHT: 2.8,
    LOOK_AHEAD: 4,
    LERP_SPEED: 0.08,
    SHAKE_INTENSITY: 0.05,
    FOV: 75,
  },

  // Racing
  RACE: {
    GRID_POSITIONS: 12,
    START_GAP: 3.5,      // Distance between grid positions
    FINISH_LINE_WIDTH: 12,
    WRONG_WAY_THRESHOLD: -0.5, // Dot product threshold
    LAP_COMPLETE_ZONE: 5.0,   // Distance to start/finish to count lap
    MIN_SPEED_TO_COUNT: 2.0,
  },

  // AI
  AI: {
    LOOKAHEAD_DISTANCE: 15,
    EASY: {
      speed_factor: 0.72,
      aggression: 0.3,
      mistake_freq: 0.004,
      mistake_duration: 80,
    },
    MEDIUM: {
      speed_factor: 0.84,
      aggression: 0.5,
      mistake_freq: 0.002,
      mistake_duration: 50,
    },
    HARD: {
      speed_factor: 0.94,
      aggression: 0.7,
      mistake_freq: 0.001,
      mistake_duration: 25,
    },
    EXTREME: {
      speed_factor: 1.0,
      aggression: 0.9,
      mistake_freq: 0.0003,
      mistake_duration: 10,
    },
  },

  // Gears
  GEARS: {
    RATIOS: [0, 2.8, 2.0, 1.55, 1.25, 1.05, 0.92],
    SHIFT_UP_RPM: 11500,
    SHIFT_DOWN_RPM: 5000,
    MAX_RPM: 16000,
    IDLE_RPM: 1200,
    REDLINE_RPM: 14000,
  },

  // Graphics
  GFX: {
    SHADOW_MAP_SIZE: 1024,
    MAX_PARTICLES: 2000,
    RAIN_PARTICLES: 1500,
    SKID_LIFE: 120,
    FOG_NEAR: 80,
    FOG_FAR: 300,
  },

  // Scoring
  SCORE: {
    COINS_PER_POSITION: [500, 350, 250, 180, 140, 110, 90, 75, 60, 50, 40, 30],
    BONUS_FASTEST_LAP: 100,
    BONUS_NO_CRASH: 50,
    BONUS_CLEAN_RACE: 75,
    CHAMPIONSHIP_POINTS: [25, 20, 16, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
  },

  // Weather effects
  WEATHER: {
    SUNNY: {
      fog: false, rain: false, sky: 0x87ceeb,
      ambient: 0xfff0e0, ambientIntensity: 0.6,
      sunColor: 0xfff5e0, sunIntensity: 1.2,
      fogColor: null, icon: '☀️'
    },
    CLOUDY: {
      fog: true, rain: false, sky: 0x8899aa,
      ambient: 0xaabbcc, ambientIntensity: 0.7,
      sunColor: 0xccddee, sunIntensity: 0.6,
      fogColor: 0x8899aa, icon: '☁️'
    },
    RAIN: {
      fog: true, rain: true, sky: 0x445566,
      ambient: 0x667788, ambientIntensity: 0.4,
      sunColor: 0x889aaa, sunIntensity: 0.3,
      fogColor: 0x445566, icon: '🌧️',
      grip_factor: 0.75,
    },
    DUSK: {
      fog: false, rain: false, sky: 0xff7744,
      ambient: 0xffaa55, ambientIntensity: 0.5,
      sunColor: 0xff6633, sunIntensity: 0.8,
      fogColor: null, icon: '🌅'
    },
    NIGHT: {
      fog: false, rain: false, sky: 0x050510,
      ambient: 0x223366, ambientIntensity: 0.25,
      sunColor: 0x334466, sunIntensity: 0.1,
      fogColor: null, icon: '🌙',
      headlights: true,
    },
  },

  // Storage keys
  STORAGE: {
    SAVE_KEY: 'motoblitz_save_v2',
    SETTINGS_KEY: 'motoblitz_settings_v2',
  },

  // Upgrade system
  UPGRADES: {
    ENGINE: { max_level: 5, cost_per_level: [800, 1500, 2800, 5000, 9000], stat: 'speed', boost: 3 },
    SUSPENSION: { max_level: 5, cost_per_level: [600, 1200, 2200, 4000, 7500], stat: 'handling', boost: 4 },
    BRAKES: { max_level: 5, cost_per_level: [500, 1000, 1800, 3500, 6500], stat: 'braking', boost: 4 },
    TIRES: { max_level: 5, cost_per_level: [400, 800, 1500, 2800, 5500], stat: 'acceleration', boost: 3 },
    AERO: { max_level: 3, cost_per_level: [1200, 3000, 7000], stat: 'speed', boost: 5 },
  },
};
