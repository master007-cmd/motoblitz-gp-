'use strict';
/* =============================================
   MOTOBLITZ GP — Track Builder (Three.js)
   ============================================= */

const TrackBuilder = (() => {

  const TRACK_WIDTH = 10;
  const TRACK_SCALE = 2.2;  // scale waypoints to world units

  // ─── Build full track scene ──────────────────
  function buildTrack(scene, circuitData, weatherKey) {
    const group = new THREE.Group();
    group.name = 'track';

    const weather = CONFIG.WEATHER[weatherKey.toUpperCase()] || CONFIG.WEATHER.SUNNY;

    // Scale & smooth waypoints
    const rawPoints = circuitData.waypoints.map(([x, z]) => new THREE.Vector2(x * TRACK_SCALE, z * TRACK_SCALE));
    const points3D = rawPoints.map(p => new THREE.Vector3(p.x, 0, p.y));

    // Create smooth spline
    const curve = new THREE.CatmullRomCurve3(points3D, true, 'catmullrom', 0.5);
    const curvePoints = curve.getPoints(600);

    // ─── Track Surface ────────────────────────
    const trackMesh = buildTrackSurface(curve, weather, circuitData.environment);
    group.add(trackMesh);

    // ─── Track Kerbs ─────────────────────────
    const kerbMesh = buildKerbs(curve);
    group.add(kerbMesh);

    // ─── Track Markings ──────────────────────
    const markings = buildMarkings(curve);
    group.add(markings);

    // ─── Start/Finish Line ───────────────────
    const startLine = buildStartLine(curvePoints[0], curvePoints[1]);
    group.add(startLine);

    // ─── Ground / Terrain ────────────────────
    const terrain = buildTerrain(circuitData, weather);
    group.add(terrain);

    // ─── Environment Objects ─────────────────
    const env = buildEnvironment(scene, circuitData, curve, weather);
    group.add(env);

    scene.add(group);

    return {
      group,
      curve,
      curvePoints,
      totalLength: curve.getLength(),
      trackWidth: TRACK_WIDTH,
      startPos: curvePoints[0].clone().add(new THREE.Vector3(0, 0.5, 0)),
      startTangent: curve.getTangentAt(0),
    };
  }

  // ─── Track surface geometry ──────────────────
  function buildTrackSurface(curve, weather, envType) {
    const segments = 600;
    const w = TRACK_WIDTH;
    const positions = [];
    const uvs = [];
    const normals = [];
    const indices = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t).normalize();
      const right = new THREE.Vector3(-tangent.z, 0, tangent.x);

      const left = point.clone().addScaledVector(right, -w / 2);
      const rightPt = point.clone().addScaledVector(right, w / 2);

      positions.push(left.x, left.y + 0.02, left.z);
      positions.push(rightPt.x, rightPt.y + 0.02, rightPt.z);
      uvs.push(0, t * 30);
      uvs.push(1, t * 30);
      normals.push(0, 1, 0, 0, 1, 0);
    }

    for (let i = 0; i < segments; i++) {
      const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
      indices.push(a, b, c, b, d, c);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setIndex(indices);

    // Track color based on weather
    const trackColor = weather.rain ? 0x2a2a2a : 0x1a1a1a;
    const mat = new THREE.MeshLambertMaterial({
      color: trackColor,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    mesh.name = 'trackSurface';
    return mesh;
  }

  // ─── Kerbs (red/white stripes on edges) ──────
  function buildKerbs(curve) {
    const group = new THREE.Group();
    const segments = 400;
    const kerbW = 1.2;
    const w = TRACK_WIDTH / 2;

    for (let side = -1; side <= 1; side += 2) {
      const positions = [];
      const colors = [];
      const indices = [];

      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const point = curve.getPointAt(t);
        const tangent = curve.getTangentAt(t).normalize();
        const right = new THREE.Vector3(-tangent.z, 0, tangent.x);

        const inner = point.clone().addScaledVector(right, side * w);
        const outer = point.clone().addScaledVector(right, side * (w + kerbW));

        positions.push(inner.x, inner.y + 0.03, inner.z);
        positions.push(outer.x, outer.y + 0.03, outer.z);

        // Alternating red/white kerb
        const stripe = Math.floor(i / 6) % 2 === 0;
        const c = stripe ? [0.9, 0.1, 0.1] : [0.95, 0.95, 0.95];
        colors.push(...c, ...c);
      }

      for (let i = 0; i < segments; i++) {
        const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
        indices.push(a, b, c, b, d, c);
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geo.setIndex(indices);
      geo.computeVertexNormals();

      const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.receiveShadow = true;
      group.add(mesh);
    }

    return group;
  }

  // ─── Track markings (center line, etc.) ──────
  function buildMarkings(curve) {
    const group = new THREE.Group();
    const segments = 300;

    // Center dashed line
    const positions = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = curve.getPointAt(t);
      const dash = Math.floor(i / 8) % 2 === 0;
      if (!dash) continue;
      positions.push(point.x, point.y + 0.04, point.z);
    }

    if (positions.length >= 6) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      const mat = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.3, transparent: true });
      const line = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.15, opacity: 0.4, transparent: true }));
      group.add(line);
    }

    return group;
  }

  // ─── Start/Finish Line ───────────────────────
  function buildStartLine(pos, nextPos) {
    const group = new THREE.Group();

    // White/black checkerboard
    const w = TRACK_WIDTH + 2;
    const geo = new THREE.PlaneGeometry(w, 3, 8, 1);
    const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });

    // Direction
    const dir = new THREE.Vector3().subVectors(nextPos, pos).normalize();
    const angle = Math.atan2(dir.x, dir.z);

    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = angle;
    mesh.position.set(pos.x, pos.y + 0.05, pos.z);
    mesh.receiveShadow = true;

    group.add(mesh);

    // Finish gantry poles
    const poleGeo = new THREE.CylinderGeometry(0.15, 0.15, 8, 8);
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    const perpDir = new THREE.Vector3(-dir.z, 0, dir.x);

    [-1, 1].forEach(side => {
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(
        pos.x + perpDir.x * (w / 2) * side,
        4,
        pos.z + perpDir.z * (w / 2) * side
      );
      pole.castShadow = true;
      group.add(pole);
    });

    // Horizontal bar
    const barGeo = new THREE.BoxGeometry(w + 1, 0.3, 0.3);
    const barMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    const bar = new THREE.Mesh(barGeo, barMat);
    bar.rotation.y = angle;
    bar.position.set(pos.x, 8, pos.z);
    bar.castShadow = true;
    group.add(bar);

    return group;
  }

  // ─── Ground / Terrain ────────────────────────
  function buildTerrain(circuitData, weather) {
    const group = new THREE.Group();

    // Large ground plane
    const groundGeo = new THREE.PlaneGeometry(800, 800, 1, 1);
    let groundColor;
    switch (circuitData.environment) {
      case 'desert': groundColor = 0xc4a35a; break;
      case 'coastal': groundColor = 0x4a8a4a; break;
      case 'urban': groundColor = 0x555555; break;
      default: groundColor = 0x3d7a3d; break;
    }
    if (weather.rain) groundColor = 0x2a4a2a;

    const groundMat = new THREE.MeshLambertMaterial({ color: groundColor });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    ground.name = 'ground';
    group.add(ground);

    // Run-off area (gravel/grass around track) - wide gray ring
    const runoffGeo = new THREE.PlaneGeometry(800, 800, 1, 1);
    const runoffMat = new THREE.MeshLambertMaterial({ color: 0x888866, transparent: true, opacity: 0.5 });
    const runoff = new THREE.Mesh(runoffGeo, runoffMat);
    runoff.rotation.x = -Math.PI / 2;
    runoff.position.y = -0.02;
    group.add(runoff);

    return group;
  }

  // ─── Environment (trees, stands, etc.) ───────
  function buildEnvironment(scene, circuitData, curve, weather) {
    const group = new THREE.Group();
    const env = circuitData.environment;

    // Add spectator stands
    addStands(group, curve, 4);

    // Add trackside objects based on environment
    if (env === 'hills' || env === 'coastal') {
      addTrees(group, curve, 60, weather);
    }

    // Add tire barriers
    addTireBarriers(group, curve);

    // Sky / environment
    if (env === 'desert') addRocks(group, curve, 20);

    return group;
  }

  function addStands(group, curve, count) {
    const mat = new THREE.MeshLambertMaterial({ color: 0x667788 });
    for (let i = 0; i < count; i++) {
      const t = (i / count);
      const pos = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const right = new THREE.Vector3(-tangent.z, 0, tangent.x);

      const standGeo = new THREE.BoxGeometry(15, 4, 6);
      const stand = new THREE.Mesh(standGeo, mat);
      stand.position.copy(pos).addScaledVector(right, 14);
      stand.position.y = 2;
      stand.rotation.y = Math.atan2(tangent.x, tangent.z);
      stand.castShadow = true;
      stand.receiveShadow = true;
      group.add(stand);

      // Crowd dots (instanced)
      const crowdColor = [0xe74c3c, 0x3498db, 0xf1c40f, 0x2ecc71][i % 4];
      const crowdGeo = new THREE.BoxGeometry(14, 2, 5);
      const crowdMat = new THREE.MeshLambertMaterial({ color: crowdColor, opacity: 0.8, transparent: true });
      const crowd = new THREE.Mesh(crowdGeo, crowdMat);
      crowd.position.copy(stand.position);
      crowd.position.y = 5;
      crowd.rotation.y = stand.rotation.y;
      group.add(crowd);
    }
  }

  function addTrees(group, curve, count, weather) {
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const leafColor = weather.rain ? 0x2d5a27 : 0x3d8b3d;
    const leafMat = new THREE.MeshLambertMaterial({ color: leafColor });

    for (let i = 0; i < count; i++) {
      const t = (i / count) + Math.random() * 0.01;
      const pos = curve.getPointAt(t % 1);
      const tangent = curve.getTangentAt(t % 1);
      const right = new THREE.Vector3(-tangent.z, 0, tangent.x);

      const side = (i % 2 === 0 ? 1 : -1);
      const offset = 12 + Math.random() * 20;
      const treePos = pos.clone().addScaledVector(right, side * offset);
      treePos.x += (Math.random() - 0.5) * 5;
      treePos.z += (Math.random() - 0.5) * 5;

      const h = 3 + Math.random() * 4;

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, h, 5), trunkMat);
      trunk.position.set(treePos.x, h / 2, treePos.z);
      trunk.castShadow = true;
      group.add(trunk);

      const leaves = new THREE.Mesh(new THREE.ConeGeometry(1.5 + Math.random(), h * 0.7, 6), leafMat);
      leaves.position.set(treePos.x, h + 0.5, treePos.z);
      leaves.castShadow = true;
      group.add(leaves);
    }
  }

  function addTireBarriers(group, curve) {
    const tireMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const safetyMat = new THREE.MeshLambertMaterial({ color: 0x3333ee });

    // Place at every 10th segment
    for (let i = 0; i < 30; i++) {
      const t = i / 30;
      const pos = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const right = new THREE.Vector3(-tangent.z, 0, tangent.x);

      [-1, 1].forEach(side => {
        const bPos = pos.clone().addScaledVector(right, side * (TRACK_WIDTH / 2 + 1.5));

        const tireGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.5, 8);
        const tire = new THREE.Mesh(tireGeo, tireMat);
        tire.rotation.x = Math.PI / 2;
        tire.position.set(bPos.x, 0.5, bPos.z);
        tire.castShadow = true;
        group.add(tire);
      });
    }

    // Safety barrier strips
    const segments = 120;
    for (let side = -1; side <= 1; side += 2) {
      const positions = [];
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const pos = curve.getPointAt(t);
        const tangent = curve.getTangentAt(t);
        const right = new THREE.Vector3(-tangent.z, 0, tangent.x);
        const p = pos.clone().addScaledVector(right, side * (TRACK_WIDTH / 2 + 2.5));
        positions.push(p.x, p.y + 0.5, p.z);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      const mat = new THREE.LineBasicMaterial({ color: 0x3333cc });
      const line = new THREE.Line(geo, mat);
      group.add(line);
    }
  }

  function addRocks(group, curve, count) {
    const rockMat = new THREE.MeshLambertMaterial({ color: 0x998877 });
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const pos = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const right = new THREE.Vector3(-tangent.z, 0, tangent.x);
      const side = (i % 2 === 0 ? 1 : -1);
      const rPos = pos.clone().addScaledVector(right, side * (15 + Math.random() * 15));

      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(1 + Math.random() * 2, 0),
        rockMat
      );
      rock.position.set(rPos.x, 0.5, rPos.z);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      group.add(rock);
    }
  }

  // ─── Minimap Drawing ─────────────────────────
  function drawMinimap(canvas, circuitData, positions, playerPos, playerT) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const wps = circuitData.waypoints;
    const minX = Math.min(...wps.map(p => p[0]));
    const maxX = Math.max(...wps.map(p => p[0]));
    const minZ = Math.min(...wps.map(p => p[1]));
    const maxZ = Math.max(...wps.map(p => p[1]));
    const rangeX = maxX - minX || 1;
    const rangeZ = maxZ - minZ || 1;
    const pad = 12;

    function toCanvas(x, z) {
      return [
        pad + ((x - minX) / rangeX) * (W - pad * 2),
        pad + ((z - minZ) / rangeZ) * (H - pad * 2),
      ];
    }

    // Draw track path
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    wps.forEach(([x, z], i) => {
      const [cx, cz] = toCanvas(x, z);
      if (i === 0) ctx.moveTo(cx, cz);
      else ctx.lineTo(cx, cz);
    });
    ctx.closePath();
    ctx.stroke();

    // AI dots
    if (positions) {
      positions.forEach(p => {
        if (!p) return;
        const [cx, cz] = toCanvas(p.x / TRACK_SCALE, p.z / TRACK_SCALE);
        ctx.fillStyle = 'rgba(200,200,200,0.7)';
        ctx.beginPath();
        ctx.arc(cx, cz, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Player dot
    if (playerPos) {
      const [cx, cz] = toCanvas(playerPos.x / TRACK_SCALE, playerPos.z / TRACK_SCALE);
      ctx.fillStyle = '#ff3300';
      ctx.shadowColor = '#ff3300';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(cx, cz, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Start/Finish mark
    const [sx, sz] = toCanvas(wps[0][0], wps[0][1]);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx - 2, sz - 4, 4, 8);
  }

  // ─── Circuit preview for selection screen ────
  function drawCircuitPreview(canvas, circuitData) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, W, H);

    const wps = circuitData.waypoints;
    const minX = Math.min(...wps.map(p => p[0]));
    const maxX = Math.max(...wps.map(p => p[0]));
    const minZ = Math.min(...wps.map(p => p[1]));
    const maxZ = Math.max(...wps.map(p => p[1]));
    const rangeX = maxX - minX || 1;
    const rangeZ = maxZ - minZ || 1;
    const pad = 16;
    const scale = Math.min((W - pad * 2) / rangeX, (H - pad * 2) / rangeZ);

    function toC(x, z) {
      return [
        pad + (x - minX) * scale,
        pad + (z - minZ) * scale,
      ];
    }

    // Track outline glow
    ctx.shadowColor = '#ff3300';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = '#ff5500';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    wps.forEach(([x, z], i) => {
      const [cx, cz] = toC(x, z);
      if (i === 0) ctx.moveTo(cx, cz);
      else ctx.lineTo(cx, cz);
    });
    ctx.closePath();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Start line
    const [sx, sz] = toC(wps[0][0], wps[0][1]);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx - 3, sz - 5, 6, 10);
  }

  // ─── Get closest point on track ─────────────
  function getClosestTrackPoint(curve, worldPos, samples = 200) {
    let minDist = Infinity;
    let closestT = 0;

    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const pt = curve.getPointAt(t);
      const dx = pt.x - worldPos.x;
      const dz = pt.z - worldPos.z;
      const dist = dx * dx + dz * dz;
      if (dist < minDist) { minDist = dist; closestT = t; }
    }

    return {
      t: closestT,
      point: curve.getPointAt(closestT),
      tangent: curve.getTangentAt(closestT),
      distSq: minDist,
    };
  }

  // ─── Build bike preview (for menu) ───────────
  function buildBikePreview(canvas, bikeData) {
    if (!canvas) return;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(canvas.clientWidth || 300, canvas.clientHeight || 200);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, (canvas.clientWidth || 300) / (canvas.clientHeight || 200), 0.1, 100);
    camera.position.set(3, 1.5, 3);
    camera.lookAt(0, 0.5, 0);

    const ambient = new THREE.AmbientLight(0x333333, 1);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 8, 5);
    scene.add(dirLight);

    // Build simplified bike mesh
    const bikeGroup = buildSimpleBike(bikeData);
    scene.add(bikeGroup);

    let angle = 0;
    let animFrame;

    const animate = () => {
      animFrame = requestAnimationFrame(animate);
      angle += 0.015;
      bikeGroup.rotation.y = angle;
      renderer.render(scene, camera);
    };
    animate();

    return { renderer, dispose: () => { cancelAnimationFrame(animFrame); renderer.dispose(); } };
  }

  function buildSimpleBike(bikeData) {
    const group = new THREE.Group();
    const bodyColor = bikeData.color || 0xff0000;
    const rimColor = bikeData.rimColor || 0x888888;

    const bodyMat = new THREE.MeshPhongMaterial({ color: bodyColor, shininess: 100 });
    const darkMat = new THREE.MeshPhongMaterial({ color: 0x111111, shininess: 60 });
    const rimMat = new THREE.MeshPhongMaterial({ color: rimColor, shininess: 80 });
    const tireMat = new THREE.MeshPhongMaterial({ color: 0x111111 });

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 1.6), bodyMat);
    body.position.y = 0.55;
    group.add(body);

    // Fairing front
    const fairing = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, 0.5, 8), bodyMat);
    fairing.rotation.x = Math.PI / 2;
    fairing.position.set(0, 0.55, 0.75);
    group.add(fairing);

    // Tank
    const tank = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.22, 0.6), bodyMat);
    tank.position.set(0, 0.72, 0.1);
    group.add(tank);

    // Seat cowl
    const cowl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.18, 0.65), darkMat);
    cowl.position.set(0, 0.66, -0.5);
    group.add(cowl);

    // Engine block
    const engine = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.5), darkMat);
    engine.position.set(0, 0.3, 0.1);
    group.add(engine);

    // Exhaust
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.8, 6), new THREE.MeshPhongMaterial({ color: 0x888888 }));
    exhaust.rotation.z = Math.PI / 2;
    exhaust.rotation.x = 0.3;
    exhaust.position.set(0.22, 0.2, -0.2);
    group.add(exhaust);

    // Wheels
    [0.75, -0.75].forEach(zOff => {
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.1, 12, 20), tireMat);
      wheel.rotation.y = Math.PI / 2;
      wheel.position.set(0, 0.3, zOff);
      group.add(wheel);

      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 6, 12), rimMat);
      rim.rotation.y = Math.PI / 2;
      rim.position.set(0, 0.3, zOff);
      group.add(rim);

      // Spokes
      for (let s = 0; s < 6; s++) {
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.38, 0.02), rimMat);
        spoke.rotation.y = Math.PI / 2;
        spoke.rotation.z = (s / 6) * Math.PI;
        spoke.position.set(0, 0.3, zOff);
        group.add(spoke);
      }
    });

    // Fork
    const fork = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.06), darkMat);
    fork.rotation.x = 0.2;
    fork.position.set(0, 0.4, 0.72);
    group.add(fork);

    // Handlebar
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.04), darkMat);
    bar.position.set(0, 0.85, 0.4);
    group.add(bar);

    // Headlight
    const light = new THREE.Mesh(new THREE.CircleGeometry(0.08, 8), new THREE.MeshBasicMaterial({ color: 0xffffcc }));
    light.position.set(0, 0.6, 0.81);
    group.add(light);

    // Number plate
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.15), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    plate.position.set(0, 0.7, 0.8);
    group.add(plate);

    group.position.y = 0;
    return group;
  }

  return {
    buildTrack,
    buildSimpleBike,
    buildBikePreview,
    drawMinimap,
    drawCircuitPreview,
    getClosestTrackPoint,
    TRACK_WIDTH,
    TRACK_SCALE,
  };
})();
