'use strict';
/* =============================================
   MOTOBLITZ GP — AI Opponent System
   ============================================= */

class AIBike {
  constructor(scene, bikeData, riderData, startPos, startHeading, aiConfig, trackData) {
    this.scene = scene;
    this.bikeData = bikeData;
    this.riderData = riderData;
    this.aiConfig = aiConfig;
    this.trackData = trackData;

    // State
    this.position = startPos.clone();
    this.heading = startHeading;
    this.speed = 0;
    this.speedKmh = 0;
    this.leanAngle = 0;
    this.trackT = 0;
    this.lapCount = 0;
    this.lapTimes = [];
    this.bestLapTime = Infinity;
    this.raceTime = 0;
    this.currentLapTime = 0;
    this.lapStartTime = 0;
    this.finishedRace = false;
    this.racePos = 2;
    this.isOnTrack = true;

    // AI state
    this.targetT = 0;
    this.mistakeTimer = 0;
    this.mistakeDir = 0;
    this.overtaking = false;
    this.overtakeDir = 0;
    this.blockedTimer = 0;

    // Derived
    this.maxSpeedMs = (bikeData.maxSpeed / 3.6) * (bikeData.stats.speed / 100) * aiConfig.speed_factor;
    this.accelForce = 15 + (bikeData.stats.acceleration / 100) * 18;
    this.brakeForce = 18 + (bikeData.stats.braking / 100) * 15;
    this.handleMult = 0.6 + (bikeData.stats.handling / 100) * 0.5;

    // Lap zone tracking
    this._inStartZone = true;

    // Build mesh
    this.mesh = this._buildMesh();
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);

    // Wheels for animation
    this.frontWheel = this.mesh.getObjectByName('frontWheel');
    this.rearWheel = this.mesh.getObjectByName('rearWheel');
  }

  _buildMesh() {
    const group = new THREE.Group();
    const bc = this.bikeData.color || 0xff0000;
    const sc = this.bikeData.secondColor || 0xffffff;
    const hc = this.riderData.helmetColor || 0x4444cc;

    const bodyMat = new THREE.MeshLambertMaterial({ color: bc });
    const body2Mat = new THREE.MeshLambertMaterial({ color: sc });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const helmMat = new THREE.MeshLambertMaterial({ color: hc });
    const tireMat = new THREE.MeshLambertMaterial({ color: 0x151515 });
    const rimMat = new THREE.MeshLambertMaterial({ color: this.bikeData.rimColor || 0x888888 });

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 1.5), bodyMat);
    body.position.set(0, 0.5, 0);
    body.castShadow = true;
    group.add(body);

    // Front fairing
    const fairing = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, 0.5, 8), bodyMat);
    fairing.rotation.x = Math.PI / 2;
    fairing.position.set(0, 0.5, 0.7);
    group.add(fairing);

    // Cowl
    const cowl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.6), body2Mat);
    cowl.position.set(0, 0.62, -0.4);
    group.add(cowl);

    // Engine
    const eng = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.26, 0.45), darkMat);
    eng.position.set(0, 0.28, 0.1);
    group.add(eng);

    // Wheels
    const fwGroup = new THREE.Group();
    fwGroup.name = 'frontWheel';
    const rwGroup = new THREE.Group();
    rwGroup.name = 'rearWheel';

    [
      { g: fwGroup, z: 0.72 },
      { g: rwGroup, z: -0.72 },
    ].forEach(({ g, z }) => {
      const torus = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.1, 10, 18), tireMat);
      torus.rotation.y = Math.PI / 2;
      g.add(torus);

      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.03, 6, 12), rimMat);
      rim.rotation.y = Math.PI / 2;
      g.add(rim);

      g.position.set(0, 0.3, z);
      group.add(g);
    });

    // Rider (simplified)
    const riderGroup = new THREE.Group();
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.3, 0.25), body2Mat);
    torso.rotation.x = -0.45;
    torso.position.set(0, 0.26, 0.05);
    riderGroup.add(torso);

    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), helmMat);
    helmet.position.set(0, 0.52, 0.18);
    riderGroup.add(helmet);

    riderGroup.position.set(0, 0.6, -0.05);
    group.add(riderGroup);

    // Number
    const numMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const numPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.1), numMat);
    numPlate.position.set(0, 0.68, 0.78);
    group.add(numPlate);

    group.castShadow = true;
    return group;
  }

  // ─── AI Update ───────────────────────────────
  update(dt, track, weatherGrip, playerPosition, allBikePositions) {
    if (this.finishedRace || !track) return;

    this.raceTime += dt;
    this.currentLapTime = this.raceTime - this.lapStartTime;

    const cfg = this.aiConfig;
    const curve = track.curve;
    const grip = weatherGrip !== undefined ? weatherGrip : 1.0;

    // ─── Look-ahead target on track ──────────
    const lookAheadT = (this.trackT + CONFIG.AI.LOOKAHEAD_DISTANCE / track.totalLength) % 1;
    const lookAheadPt = curve.getPointAt(lookAheadT);

    let targetX = lookAheadPt.x;
    let targetZ = lookAheadPt.z;

    // ─── Mistake system ──────────────────────
    if (Math.random() < cfg.mistake_freq) {
      this.mistakeTimer = cfg.mistake_duration;
      this.mistakeDir = (Math.random() - 0.5) * 2;
    }

    if (this.mistakeTimer > 0) {
      this.mistakeTimer--;
      targetX += this.mistakeDir * 4;
      targetZ += this.mistakeDir * 4;
    }

    // ─── Overtaking logic ────────────────────
    if (allBikePositions) {
      this._handleOvertaking(allBikePositions, targetX, targetZ, lookAheadPt, dt);
    }
    if (this.overtaking) {
      targetX += this.overtakeDir * 3;
    }

    // ─── Steer toward target ─────────────────
    const dx = targetX - this.position.x;
    const dz = targetZ - this.position.z;
    const targetHeading = Math.atan2(dx, dz);

    let headingDiff = targetHeading - this.heading;
    // Normalize to -PI..PI
    while (headingDiff > Math.PI) headingDiff -= Math.PI * 2;
    while (headingDiff < -Math.PI) headingDiff += Math.PI * 2;

    const steerAmount = Math.max(-1, Math.min(1, headingDiff * 2));
    const speedFactor = Math.max(0.1, 1 - (this.speed / this.maxSpeedMs) * 0.4);
    this.heading += steerAmount * 1.5 * speedFactor * this.handleMult * grip * dt;

    // ─── Speed control (corner awareness) ────
    const cornerSharpness = Math.abs(headingDiff);
    const cornerSlowdown = Math.max(0.4, 1 - cornerSharpness * 0.8);
    const targetSpeed = this.maxSpeedMs * cornerSlowdown * grip;

    const accel = this.accelForce * (cornerSlowdown > 0.7 ? 1 : 0.3);
    const brake = this.brakeForce;

    if (this.speed < targetSpeed) {
      this.speed += accel * dt;
    } else {
      this.speed -= brake * 0.5 * dt;
    }

    // Natural drag
    this.speed -= this.speed * this.speed * CONFIG.PHYSICS.DRAG * 0.008 * dt;
    this.speed = Math.max(0, Math.min(this.maxSpeedMs, this.speed));
    this.speedKmh = this.speed * 3.6;

    // ─── Move ────────────────────────────────
    this.position.x += Math.sin(this.heading) * this.speed * dt;
    this.position.z += Math.cos(this.heading) * this.speed * dt;

    // ─── Lean ────────────────────────────────
    const targetLean = -steerAmount * (this.speed / this.maxSpeedMs) * (CONFIG.PHYSICS.MAX_LEAN * Math.PI / 180);
    this.leanAngle += (targetLean - this.leanAngle) * (1 - Math.exp(-dt * 4));

    // ─── Track T update ──────────────────────
    const closest = TrackBuilder.getClosestTrackPoint(curve, this.position, 80);
    this.trackT = closest.t;
    this.isOnTrack = Math.sqrt(closest.distSq) < (TrackBuilder.TRACK_WIDTH / 2 + 1);

    // ─── Lap counting ────────────────────────
    const startPt = track.curvePoints[0];
    const distToStart = new THREE.Vector3(
      this.position.x - startPt.x, 0, this.position.z - startPt.z
    ).length();

    if (distToStart < CONFIG.RACE.LAP_COMPLETE_ZONE && this.speed > 1) {
      if (!this._inStartZone) {
        this._inStartZone = true;
        if (this.lapCount > 0) {
          const lapTime = this.currentLapTime * 1000;
          this.lapTimes.push(lapTime);
          if (lapTime < this.bestLapTime) this.bestLapTime = lapTime;
          this.lapCount++;
          this.lapStartTime = this.raceTime;
        }
      }
    } else if (distToStart > CONFIG.RACE.LAP_COMPLETE_ZONE * 2) {
      this._inStartZone = false;
    }

    // ─── Update mesh ─────────────────────────
    this.mesh.position.set(this.position.x, 0, this.position.z);
    this.mesh.rotation.y = this.heading;
    this.mesh.rotation.z = this.leanAngle;

    const spinSpeed = this.speed * dt * 3;
    if (this.frontWheel) this.frontWheel.rotation.x -= spinSpeed;
    if (this.rearWheel) this.rearWheel.rotation.x -= spinSpeed;
  }

  _handleOvertaking(allPositions, targetX, targetZ, lookAhead, dt) {
    if (this.overtaking) {
      this.blockedTimer -= dt;
      if (this.blockedTimer <= 0) { this.overtaking = false; }
      return;
    }

    // Check for nearby bikes ahead
    for (const otherPos of allPositions) {
      if (!otherPos) continue;
      const dx = otherPos.x - this.position.x;
      const dz = otherPos.z - this.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 4 && dist > 0.5) {
        // Check if they're ahead (roughly in our direction)
        const fwdX = Math.sin(this.heading);
        const fwdZ = Math.cos(this.heading);
        const dot = (dx / dist) * fwdX + (dz / dist) * fwdZ;

        if (dot > 0.5 && Math.random() < this.aiConfig.aggression * 0.05) {
          this.overtaking = true;
          this.overtakeDir = Math.random() < 0.5 ? 1 : -1;
          this.blockedTimer = 2.5;
          break;
        }
      }
    }
  }

  initRace() {
    this.lapCount = 1;
    this._inStartZone = true;
    this.lapStartTime = 0;
    this.raceTime = 0;
  }

  dispose() {
    this.scene.remove(this.mesh);
  }
}

// ─── AI Manager ──────────────────────────────
const AIManager = (() => {
  function createGrid(count, startPos, startTangent, spacing) {
    const positions = [];
    const perpDir = new THREE.Vector3(-startTangent.z, 0, startTangent.x);

    // Grid: pairs of 2 side by side, separated backwards
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / 2);
      const col = (i % 2 === 0) ? -1 : 1;

      const pos = startPos.clone()
        .addScaledVector(startTangent, -(row + 1) * spacing)
        .addScaledVector(perpDir, col * 1.8);

      positions.push(pos);
    }

    return positions;
  }

  function createAIRiders(scene, count, track, difficulty, playerRider) {
    const diffConfig = CONFIG.AI[difficulty.toUpperCase()] || CONFIG.AI.MEDIUM;

    // Pick riders (all except player)
    const availableRiders = RIDERS_DATA.filter(r => r.id !== playerRider.id);
    const selectedRiders = [];
    for (let i = 0; i < Math.min(count, availableRiders.length); i++) {
      selectedRiders.push(availableRiders[i]);
    }
    // Fill remaining with repeats if needed
    while (selectedRiders.length < count) {
      selectedRiders.push(availableRiders[selectedRiders.length % availableRiders.length]);
    }

    const startPos = track.startPos.clone();
    const startTangent = track.startTangent.normalize();
    const gridPositions = createGrid(count, startPos, startTangent, CONFIG.RACE.START_GAP);

    const aiBikes = [];
    for (let i = 0; i < count; i++) {
      const rider = selectedRiders[i];
      const bikeId = rider.bikeId || 1;
      const bikeData = getBikeById(bikeId);
      const heading = Math.atan2(startTangent.x, startTangent.z);

      const cfg = {
        ...diffConfig,
        // Slight variation per AI
        speed_factor: diffConfig.speed_factor * (0.95 + Math.random() * 0.1),
        aggression: diffConfig.aggression * (0.8 + Math.random() * 0.4),
      };

      const ai = new AIBike(scene, bikeData, rider, gridPositions[i], heading, cfg, track);
      ai.lapCount = 1;
      ai._inStartZone = true;
      aiBikes.push(ai);
    }

    return aiBikes;
  }

  function computeLeaderboard(playerBike, aiBikes, totalLaps) {
    const all = [{ bike: playerBike, isPlayer: true }, ...aiBikes.map(a => ({ bike: a, isPlayer: false }))];

    all.sort((a, b) => {
      const la = a.bike.finishedRace ? (a.bike.finishTime || 0) : 0;
      const lb = b.bike.finishedRace ? (b.bike.finishTime || 0) : 0;

      // Finished bikes first (lower finish time = better)
      if (a.bike.finishedRace && b.bike.finishedRace) return la - lb;
      if (a.bike.finishedRace) return -1;
      if (b.bike.finishedRace) return 1;

      // Compare by lap + trackT
      const lapDiff = b.bike.lapCount - a.bike.lapCount;
      if (lapDiff !== 0) return lapDiff;
      return b.bike.trackT - a.bike.trackT;
    });

    return all.map((entry, idx) => ({
      position: idx + 1,
      bike: entry.bike,
      isPlayer: entry.isPlayer,
      rider: entry.isPlayer ? null : entry.bike.riderData,
      gap: idx === 0 ? 'LEADER' : null,
    }));
  }

  return { createGrid, createAIRiders, computeLeaderboard };
})();
