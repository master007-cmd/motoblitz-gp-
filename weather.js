'use strict';
/* =============================================
   MOTOBLITZ GP — Weather System (Three.js)
   ============================================= */

const WeatherSystem = (() => {
  let _scene = null;
  let _renderer = null;
  let _camera = null;
  let _currentWeather = null;

  let rainSystem = null;
  let skyMesh = null;
  let sunLight = null;
  let ambientLight = null;
  let hemisphereLight = null;

  // ─── Init ────────────────────────────────────
  function init(scene, renderer, camera) {
    _scene = scene;
    _renderer = renderer;
    _camera = camera;
  }

  // ─── Apply weather preset ────────────────────
  function applyWeather(weatherKey) {
    _currentWeather = weatherKey.toUpperCase();
    const W = CONFIG.WEATHER[_currentWeather] || CONFIG.WEATHER.SUNNY;

    // ─── Sky ─────────────────────────────────
    _scene.background = new THREE.Color(W.sky);

    // ─── Fog ─────────────────────────────────
    if (W.fog) {
      _scene.fog = new THREE.FogExp2(W.fogColor || W.sky, 0.008);
    } else {
      _scene.fog = new THREE.Fog(W.sky, CONFIG.GFX.FOG_NEAR, CONFIG.GFX.FOG_FAR);
    }

    // ─── Lighting ────────────────────────────
    // Remove existing lights
    _scene.traverse(obj => {
      if (obj.isLight) _scene.remove(obj);
    });

    // Ambient
    ambientLight = new THREE.AmbientLight(W.ambient || 0xffffff, W.ambientIntensity || 0.5);
    _scene.add(ambientLight);

    // Hemisphere
    const hemiSky = W.sky;
    const hemiGround = _currentWeather === 'NIGHT' ? 0x001122 : 0x334422;
    hemisphereLight = new THREE.HemisphereLight(hemiSky, hemiGround, W.ambientIntensity * 0.5);
    _scene.add(hemisphereLight);

    // Directional (sun / moon)
    sunLight = new THREE.DirectionalLight(W.sunColor || 0xffffff, W.sunIntensity || 1);

    if (_currentWeather === 'DUSK') {
      sunLight.position.set(-80, 15, -50);
    } else if (_currentWeather === 'NIGHT') {
      sunLight.position.set(0, 50, 0);
    } else {
      sunLight.position.set(50, 80, 30);
    }

    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = CONFIG.GFX.SHADOW_MAP_SIZE;
    sunLight.shadow.mapSize.height = CONFIG.GFX.SHADOW_MAP_SIZE;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.camera.left = -120;
    sunLight.shadow.camera.right = 120;
    sunLight.shadow.camera.top = 120;
    sunLight.shadow.camera.bottom = -120;
    sunLight.shadow.bias = -0.001;
    _scene.add(sunLight);

    // ─── Night: track/pit lane lights ────────
    if (_currentWeather === 'NIGHT') {
      addTrackLights();
    }

    // ─── Rain ────────────────────────────────
    removeRain();
    if (W.rain) {
      createRain();
    }

    // ─── Sky dome ────────────────────────────
    createSkyDome(W);

    return W;
  }

  // ─── Sky Dome ────────────────────────────────
  function createSkyDome(W) {
    if (skyMesh) { _scene.remove(skyMesh); skyMesh = null; }

    const geo = new THREE.SphereGeometry(500, 16, 8);
    let mat;

    if (_currentWeather === 'DUSK') {
      // Gradient sky for dusk
      const canvas = document.createElement('canvas');
      canvas.width = 2; canvas.height = 256;
      const ctx = canvas.getContext('2d');
      const grad = ctx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, '#1a0033');
      grad.addColorStop(0.3, '#ff4422');
      grad.addColorStop(0.6, '#ff8833');
      grad.addColorStop(1, '#ffcc66');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 2, 256);
      const tex = new THREE.CanvasTexture(canvas);
      mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide });
    } else if (_currentWeather === 'NIGHT') {
      // Night sky with stars
      const canvas = document.createElement('canvas');
      canvas.width = 512; canvas.height = 512;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#05051a';
      ctx.fillRect(0, 0, 512, 512);
      // Stars
      for (let i = 0; i < 400; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const r = Math.random() * 1.5;
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.8 + 0.2})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      const tex = new THREE.CanvasTexture(canvas);
      mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide });
    } else {
      mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(W.sky),
        side: THREE.BackSide,
      });
    }

    skyMesh = new THREE.Mesh(geo, mat);
    skyMesh.name = 'skyDome';
    _scene.add(skyMesh);
  }

  // ─── Rain particle system ─────────────────────
  function createRain() {
    const count = CONFIG.GFX.RAIN_PARTICLES;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = Math.random() * 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
      velocities[i * 3] = (Math.random() - 0.5) * 0.5;
      velocities[i * 3 + 1] = -(8 + Math.random() * 4);
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x8aabcc,
      size: 0.12,
      transparent: true,
      opacity: 0.5,
      sizeAttenuation: true,
    });

    rainSystem = new THREE.Points(geo, mat);
    rainSystem.name = 'rain';
    rainSystem._velocities = velocities;
    rainSystem._count = count;
    _scene.add(rainSystem);
  }

  function updateRain(cameraPos, dt) {
    if (!rainSystem) return;

    const pos = rainSystem.geometry.attributes.position;
    const vel = rainSystem._velocities;
    const count = rainSystem._count;

    for (let i = 0; i < count; i++) {
      pos.array[i * 3] += vel[i * 3] * dt;
      pos.array[i * 3 + 1] += vel[i * 3 + 1] * dt;
      pos.array[i * 3 + 2] += vel[i * 3 + 2] * dt;

      // Respawn when below ground, centered around camera
      if (pos.array[i * 3 + 1] < -1) {
        pos.array[i * 3] = cameraPos.x + (Math.random() - 0.5) * 100;
        pos.array[i * 3 + 1] = cameraPos.y + 45 + Math.random() * 10;
        pos.array[i * 3 + 2] = cameraPos.z + (Math.random() - 0.5) * 100;
      }
    }

    pos.needsUpdate = true;

    // Follow camera
    rainSystem.position.set(0, 0, 0);
  }

  function removeRain() {
    if (rainSystem) {
      _scene.remove(rainSystem);
      rainSystem.geometry.dispose();
      rainSystem.material.dispose();
      rainSystem = null;
    }
  }

  // ─── Track lights for night ───────────────────
  function addTrackLights() {
    // Pole lights every 30 units around track
    // (We just add a few fill lights since we don't have track reference here)
    const positions = [
      [0, 12, 0], [40, 12, 0], [-40, 12, 0],
      [0, 12, 40], [0, 12, -40], [40, 12, 40],
    ];

    positions.forEach(([x, y, z]) => {
      const light = new THREE.PointLight(0xffffaa, 1.5, 80);
      light.position.set(x, y, z);
      light.castShadow = false;
      _scene.add(light);

      // Pole
      const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, 12, 6);
      const poleMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(x, 6, z);
      _scene.add(pole);

      // Light box
      const boxGeo = new THREE.BoxGeometry(2, 0.4, 0.8);
      const boxMat = new THREE.MeshBasicMaterial({ color: 0xffffcc });
      const box = new THREE.Mesh(boxGeo, boxMat);
      box.position.set(x, 12, z);
      _scene.add(box);
    });
  }

  // ─── Wet track effect overlay ─────────────────
  function createWetOverlay(trackMesh) {
    if (!trackMesh || _currentWeather !== 'RAIN') return;
    // Slightly change track material for wet look
    if (trackMesh.material) {
      trackMesh.material.color.setHex(0x1a2a2a);
      trackMesh.material.shininess = 80;
    }
  }

  // ─── Update per frame ─────────────────────────
  function update(dt, cameraPos) {
    if (rainSystem) updateRain(cameraPos, dt);
    if (skyMesh && _camera) {
      skyMesh.position.copy(_camera.position);
    }
  }

  // ─── Getters ─────────────────────────────────
  function getWeatherConfig() {
    return CONFIG.WEATHER[_currentWeather] || CONFIG.WEATHER.SUNNY;
  }

  function getGripFactor() {
    const W = getWeatherConfig();
    return W.grip_factor !== undefined ? W.grip_factor : 1.0;
  }

  function hasHeadlights() {
    const W = getWeatherConfig();
    return !!W.headlights;
  }

  function isRaining() {
    return !!rainSystem;
  }

  return {
    init, applyWeather, update,
    getWeatherConfig, getGripFactor,
    hasHeadlights, isRaining,
    createWetOverlay,
  };
})();
