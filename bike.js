'use strict';
/* =============================================
   MOTOBLITZ GP — Player Bike Physics + 3D
   ============================================= */

class PlayerBike {
  constructor(scene, bikeData, riderData, startPos, startTangent) {
    this.scene = scene;
    this.bikeData = bikeData;
    this.riderData = riderData;

    // ─── Physics state ───────────────────────
    this.position = startPos.clone();
    this.velocity = new THREE.Vector3();
    this.speed = 0;           // m/s
    this.speedKmh = 0;
    this.heading = Math.atan2(startTangent.x, startTangent.z);
    this.leanAngle = 0;       // radians
    this.gear = 1;
    this.rpm = CONFIG.GEARS.IDLE_RPM;
    this.throttle = 0;        // 0-1
    this.braking = 0;         // 0-1
    this.steering = 0;        // -1 to 1
    this.isOnTrack = true;
    this.crashed = false;
    this.crashTimer = 0;
    this.wrongWay = false;

    // Track progress
    this.trackT = 0;          // 0-1 position on curve
    this.lapCount = 0;
    this.lapStartTime = 0;
    this.lapTimes = [];
    this.bestLapTime = Infinity;
    this.currentLapTime = 0;
    this.raceTime = 0;
    this.racePos = 1;
    this.finishedLap = false;
    this.finishedRace = false;
    this.distanceTravelled = 0;

    // Gear shift state
    this.shiftCooldown = 0;
    this.lastTrackT = 0;

    // Skid particles
    this.skidParticles = [];
    this.skidActive = false;

    // Internal tracking flags
    this._inStartZone = true;
    this._lastCheckedLap = 0;

    // Build 3D mesh
    this.mesh = this._buildMesh();
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);

    // Add headlights for night
    this.headlightL = null;
    this.headlightR = null;

    // Derived stats from bikeData
    this._computeStats();

    // Controls state
    this.controls = {
      throttle: false,
      brake: false,
      left: false,
      right: false,
    };

    // Skid trail geometry (reused)
    this._initSkidTrail();
  }

  // ─── Compute bike performance stats ─────────
  _computeStats() {
    const s = this.bikeData.stats;
    this.maxSpeedMs = (this.bikeData.maxSpeed / 3.6) * (s.speed / 100);
    this.accelForce = 18 + (s.acceleration / 100) * 22;
    this.brakeForce = 20 + (s.braking / 100) * 18;
    this.handleMultiplier = 0.7 + (s.handling / 100) * 0.6;

    // Weather grip penalty
    this.gripFactor = 1.0;
  }

  setWeatherGrip(factor) {
    this.gripFactor = factor;
  }

  // ─── Build 3D model ─────────────────────────
  _buildMesh() {
    const group = new THREE.Group();
    const bc = this.bikeData.color || 0xff0000;
    const rc = this.bikeData.rimColor || 0x888888;
    const sc = this.bikeData.secondColor || 0xffffff;

    const bodyMat = new THREE.MeshPhongMaterial({ color: bc, shininess: 120 });
    const body2Mat = new THREE.MeshPhongMaterial({ color: sc, shininess: 80 });
    const darkMat = new THREE.MeshPhongMaterial({ color: 0x111111, shininess: 50 });
    const rimMat = new THREE.MeshPhongMaterial({ color: rc, shininess: 100 });
    const tireMat = new THREE.MeshPhongMaterial({ color: 0x151515 });
    const visGlass = new THREE.MeshPhongMaterial({ color: 0x88aaff, transparent: true, opacity: 0.4, shininess: 200 });

    // ─── Chassis / frame ─────────────────────
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 1.2), darkMat);
    frame.position.set(0, 0.38, 0);
    frame.castShadow = true;
    group.add(frame);

    // ─── Main fairing (front) ────────────────
    const fairingGeo = new THREE.CylinderGeometry(0.18, 0.28, 0.55, 10);
    const fairing = new THREE.Mesh(fairingGeo, bodyMat);
    fairing.rotation.x = Math.PI / 2;
    fairing.position.set(0, 0.52, 0.72);
    fairing.castShadow = true;
    group.add(fairing);

    // Lower fairing
    const lowerFairing = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.22, 0.7), bodyMat);
    lowerFairing.position.set(0, 0.32, 0.35);
    lowerFairing.castShadow = true;
    group.add(lowerFairing);

    // ─── Tank ────────────────────────────────
    const tank = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.24, 0.55), bodyMat);
    tank.position.set(0, 0.7, 0.12);
    tank.castShadow = true;
    group.add(tank);

    // ─── Seat cowl ────────────────────────────
    const cowl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.7), body2Mat);
    cowl.position.set(0, 0.65, -0.42);
    cowl.castShadow = true;
    group.add(cowl);

    // ─── Engine block ────────────────────────
    const eng = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.28, 0.5), darkMat);
    eng.position.set(0, 0.3, 0.1);
    eng.castShadow = true;
    group.add(eng);

    // ─── Exhaust pipe ────────────────────────
    const exhMat = new THREE.MeshPhongMaterial({ color: 0xaaaaaa, shininess: 80 });
    const exh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.9, 8), exhMat);
    exh.rotation.z = Math.PI / 2;
    exh.rotation.x = 0.25;
    exh.position.set(0.25, 0.2, -0.25);
    group.add(exh);

    const exhEnd = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.1, 8), exhMat);
    exhEnd.position.set(0.3, 0.12, -0.62);
    group.add(exhEnd);

    // ─── Windscreen ──────────────────────────
    const windscreen = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.22, 0.04), visGlass);
    windscreen.position.set(0, 0.82, 0.63);
    windscreen.rotation.x = -0.4;
    group.add(windscreen);

    // ─── Handlebar ───────────────────────────
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.04), darkMat);
    bar.position.set(0, 0.88, 0.4);
    group.add(bar);

    // ─── Fork ────────────────────────────────
    const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.52, 6), darkMat);
    fork.rotation.x = 0.25;
    fork.position.set(-0.1, 0.42, 0.7);
    group.add(fork);

    const fork2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.52, 6), darkMat);
    fork2.rotation.x = 0.25;
    fork2.position.set(0.1, 0.42, 0.7);
    group.add(fork2);

    // ─── Swingarm ────────────────────────────
    const swing = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.55), darkMat);
    swing.position.set(0, 0.3, -0.55);
    group.add(swing);

    // ─── Headlight ───────────────────────────
    const hlGeo = new THREE.CircleGeometry(0.1, 10);
    const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffcc });
    const hl = new THREE.Mesh(hlGeo, hlMat);
    hl.position.set(0, 0.56, 0.82);
    group.add(hl);

    // ─── Taillights ──────────────────────────
    const tlMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.05, 0.02), tlMat);
    tl.position.set(0, 0.65, -0.82);
    this.taillightMat = tlMat;
    group.add(tl);

    // ─── Wheels ──────────────────────────────
    this.frontWheel = new THREE.Group();
    this.rearWheel = new THREE.Group();

    [
      { group: this.frontWheel, z: 0.75 },
      { group: this.rearWheel, z: -0.75 },
    ].forEach(({ group: wg, z }) => {
      const torus = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.1, 14, 24), tireMat);
      torus.rotation.y = Math.PI / 2;
      wg.add(torus);

      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.035, 8, 16), rimMat);
      rim.rotation.y = Math.PI / 2;
      wg.add(rim);

      // Spokes
      for (let s = 0; s < 7; s++) {
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.4, 0.025), rimMat);
        spoke.rotation.y = Math.PI / 2;
        spoke.rotation.z = (s / 7) * Math.PI;
        wg.add(spoke);
      }

      // Disc
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.02, 12), new THREE.MeshPhongMaterial({ color: 0x888888 }));
      disc.rotation.z = Math.PI / 2;
      disc.position.x = 0.1;
      wg.add(disc);

      wg.position.set(0, 0.32, z);
      group.add(wg);
    });

    // ─── Rider ───────────────────────────────
    this.riderMesh = this._buildRider();
    this.riderMesh.position.set(0, 0.62, -0.05);
    group.add(this.riderMesh);

    // Number board
    const numMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const numBoard = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.12), numMat);
    numBoard.position.set(0, 0.72, 0.81);
    group.add(numBoard);

    group.castShadow = true;
    return group;
  }

  _buildRider() {
    const group = new THREE.Group();
    const helmetColor = this.riderData.helmetColor || 0xff4400;
    const hMat = new THREE.MeshPhongMaterial({ color: helmetColor, shininess: 120 });
    const suitMat = new THREE.MeshPhongMaterial({ color: this.bikeData.secondColor || 0xffffff });

    // Torso (racing tuck)
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 0.28), suitMat);
    torso.rotation.x = -0.5;
    torso.position.set(0, 0.28, 0.05);
    group.add(torso);

    // Helmet
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), hMat);
    helmet.position.set(0, 0.55, 0.2);
    helmet.scale.y = 1.1;
    group.add(helmet);

    // Visor
    const visGlass = new THREE.MeshPhongMaterial({ color: 0x222244, transparent: true, opacity: 0.7, shininess: 200 });
    const visor = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.45), visGlass);
    visor.position.copy(helmet.position);
    visor.position.z += 0.06;
    group.add(visor);

    // Arms (tucked)
    [-0.15, 0.15].forEach(x => {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.28, 6), suitMat);
      arm.rotation.z = x < 0 ? -0.5 : 0.5;
      arm.rotation.x = -0.8;
      arm.position.set(x, 0.3, 0.2);
      group.add(arm);
    });

    return group;
  }

  // ─── Skid trail ─────────────────────────────
  _initSkidTrail() {
    const maxSkids = 500;
    const geo = new THREE.BufferGeometry();
    this._skidPositions = new Float32Array(maxSkids * 3);
    this._skidCount = 0;
    this._skidMaxCount = maxSkids;
    geo.setAttribute('position', new THREE.BufferAttribute(this._skidPositions, 3));
    geo.setDrawRange(0, 0);

    const mat = new THREE.PointsMaterial({
      color: 0x111111,
      size: 0.3,
      transparent: true,
      opacity: 0.6,
    });
    this._skidPoints = new THREE.Points(geo, mat);
    this.scene.add(this._skidPoints);
  }

  _addSkidPoint() {
    const i = (this._skidCount % this._skidMaxCount) * 3;
    this._skidPositions[i] = this.position.x;
    this._skidPositions[i + 1] = 0.02;
    this._skidPositions[i + 2] = this.position.z;
    this._skidCount++;
    this._skidPoints.geometry.attributes.position.needsUpdate = true;
    this._skidPoints.geometry.setDrawRange(0, Math.min(this._skidCount, this._skidMaxCount));
  }

  // ─── Headlights ──────────────────────────────
  addHeadlights() {
    if (this.headlightL) return;
    const spotL = new THREE.SpotLight(0xffffcc, 2, 40, Math.PI * 0.12, 0.5);
    const spotR = new THREE.SpotLight(0xffffcc, 2, 40, Math.PI * 0.12, 0.5);
    this.headlightL = spotL;
    this.headlightR = spotR;
    this.mesh.add(spotL);
    this.mesh.add(spotR);
    spotL.position.set(-0.1, 0.56, 0.82);
    spotR.position.set(0.1, 0.56, 0.82);
    const targetL = new THREE.Object3D();
    const targetR = new THREE.Object3D();
    targetL.position.set(-0.1, 0, 5);
    targetR.position.set(0.1, 0, 5);
    this.mesh.add(targetL);
    this.mesh.add(targetR);
    spotL.target = targetL;
    spotR.target = targetR;
  }

  removeHeadlights() {
    if (this.headlightL) { this.mesh.remove(this.headlightL); this.headlightL = null; }
    if (this.headlightR) { this.mesh.remove(this.headlightR); this.headlightR = null; }
  }

  // ─── Physics Update ──────────────────────────
  update(dt, track, inputControls, weatherGrip) {
    if (this.finishedRace) return;

    this.controls = inputControls;
    const ctrl = this.controls;

    // ─── Throttle / Brake inputs ─────────────
    const targetThrottle = ctrl.throttle ? 1.0 : 0.0;
    const targetBrake = ctrl.brake ? 1.0 : 0.0;

    this.throttle += (targetThrottle - this.throttle) * (1 - Math.exp(-dt * 8));
    this.braking += (targetBrake - this.braking) * (1 - Math.exp(-dt * 12));

    // ─── Steering input ──────────────────────
    let steerTarget = 0;
    if (ctrl.left) steerTarget = -1;
    if (ctrl.right) steerTarget = 1;
    this.steering += (steerTarget - this.steering) * (1 - Math.exp(-dt * 10));

    // ─── Gear shifting ───────────────────────
    this.shiftCooldown = Math.max(0, this.shiftCooldown - dt);
    if (this.shiftCooldown <= 0) {
      if (this.rpm >= CONFIG.GEARS.SHIFT_UP_RPM && this.gear < 6) {
        this.gear++;
        this.shiftCooldown = 0.2;
      } else if (this.rpm <= CONFIG.GEARS.SHIFT_DOWN_RPM && this.gear > 1 && this.speed > 5) {
        this.gear--;
        this.shiftCooldown = 0.15;
      }
    }

    // ─── RPM calculation ─────────────────────
    const gearRatio = CONFIG.GEARS.RATIOS[this.gear] || 1;
    const speedRpm = (this.speed / this.maxSpeedMs) * CONFIG.GEARS.MAX_RPM / gearRatio;
    const targetRpm = this.throttle > 0.05
      ? Math.min(CONFIG.GEARS.MAX_RPM, speedRpm * gearRatio + this.throttle * 2000)
      : Math.max(CONFIG.GEARS.IDLE_RPM, speedRpm * gearRatio * 0.9);

    this.rpm += (targetRpm - this.rpm) * (1 - Math.exp(-dt * 5));
    this.rpm = Math.max(CONFIG.GEARS.IDLE_RPM, Math.min(CONFIG.GEARS.MAX_RPM, this.rpm));

    // ─── Acceleration physics ─────────────────
    const grip = weatherGrip !== undefined ? weatherGrip : 1.0;
    const accel = this.throttle * this.accelForce * grip;
    const brake = this.braking * this.brakeForce;

    // Off-track slowdown
    if (!this.isOnTrack) {
      this.speed *= Math.pow(CONFIG.PHYSICS.OFFTRACK_SLOWDOWN, dt * 60);
    }

    // Natural drag
    const drag = this.speed * this.speed * CONFIG.PHYSICS.DRAG * 0.01;
    const netForce = accel - brake - drag;

    this.speed = Math.max(0, this.speed + netForce * dt);
    this.speed = Math.min(this.maxSpeedMs, this.speed);
    this.speedKmh = this.speed * 3.6;

    // ─── Steering (speed-dependent) ──────────
    const speedFactor = Math.max(0.1, 1 - (this.speed / this.maxSpeedMs) * CONFIG.PHYSICS.STEER_HIGHSPEED_FACTOR);
    const steerRate = CONFIG.PHYSICS.STEER_SENSITIVITY * speedFactor * this.handleMultiplier * grip;
    this.heading += this.steering * steerRate * dt * Math.min(this.speed / 5, 1);

    // ─── Lean angle ───────────────────────────
    const targetLean = -this.steering * (this.speed / this.maxSpeedMs) * (CONFIG.PHYSICS.MAX_LEAN * Math.PI / 180);
    this.leanAngle += (targetLean - this.leanAngle) * (1 - Math.exp(-dt * CONFIG.PHYSICS.LEAN_SPEED));

    // ─── Move ────────────────────────────────
    this.velocity.x = Math.sin(this.heading) * this.speed;
    this.velocity.z = Math.cos(this.heading) * this.speed;

    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.z * dt;
    this.distanceTravelled += this.speed * dt;

    // ─── Track detection ─────────────────────
    if (track) {
      const closest = TrackBuilder.getClosestTrackPoint(track.curve, this.position, 150);
      const distFromCenter = Math.sqrt(closest.distSq);
      this.isOnTrack = distFromCenter < (TrackBuilder.TRACK_WIDTH / 2 + 0.5);
      this.trackT = closest.t;

      // Wrong way detection
      const tangent = closest.tangent;
      const myDir = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
      const dot = tangent.dot(myDir);
      this.wrongWay = dot < CONFIG.RACE.WRONG_WAY_THRESHOLD;

      // Lap counting
      const lapZone = track.curvePoints[0];
      const distToStart = new THREE.Vector3(
        this.position.x - lapZone.x, 0, this.position.z - lapZone.z
      ).length();

      const crossingLine = distToStart < CONFIG.RACE.LAP_COMPLETE_ZONE;
      const movingForward = !this.wrongWay;

      if (crossingLine && movingForward && this.speed > CONFIG.RACE.MIN_SPEED_TO_COUNT) {
        if (!this._inStartZone) {
          this._inStartZone = true;
          if (this.lapCount > 0) {
            this._completeLap();
          } else if (this.lapCount === 0) {
            this.lapCount = 1;
            this.lapStartTime = this.raceTime;
            this._inStartZone = true;
          }
        }
      } else if (distToStart > CONFIG.RACE.LAP_COMPLETE_ZONE * 2) {
        this._inStartZone = false;
      }
    }

    // ─── Race time ───────────────────────────
    this.raceTime += dt;
    this.currentLapTime = this.raceTime - this.lapStartTime;

    // ─── Update mesh ─────────────────────────
    this.mesh.position.copy(this.position);
    this.mesh.position.y = 0;
    this.mesh.rotation.y = this.heading;
    this.mesh.rotation.z = this.leanAngle;

    // Wheel spin
    const spinSpeed = this.speed * dt * 3;
    if (this.frontWheel) this.frontWheel.rotation.x -= spinSpeed;
    if (this.rearWheel) this.rearWheel.rotation.x -= spinSpeed;

    // Braking taillight
    if (this.taillightMat) {
      this.taillightMat.color.setHex(this.braking > 0.1 ? 0xff0000 : 0x330000);
      this.taillightMat.emissive = this.braking > 0.1 ? new THREE.Color(0.5, 0, 0) : new THREE.Color(0, 0, 0);
    }

    // Skid trail
    const shouldSkid = (this.braking > 0.4 && this.speed > 15) || (!this.isOnTrack && this.speed > 10);
    if (shouldSkid) this._addSkidPoint();

    this.skidActive = shouldSkid;
    this.lastTrackT = this.trackT;
  }

  _completeLap() {
    const lapTime = this.currentLapTime * 1000; // ms
    this.lapTimes.push(lapTime);
    const wasBest = lapTime < this.bestLapTime;
    if (wasBest) this.bestLapTime = lapTime;

    this.lapCount++;
    this.lapStartTime = this.raceTime;

    return { lapTime, wasBest, lapNumber: this.lapCount - 1 };
  }

  initRace() {
    this.lapCount = 1;
    this._inStartZone = true;
    this.lapStartTime = 0;
    this.raceTime = 0;
    this.currentLapTime = 0;
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.scene.remove(this._skidPoints);
  }
}

// ─── Patch: _lastCheckedLap init ───────────────
// Called automatically during construction
// (Already set inside update() check, but ensure field exists)
// PlayerBike.prototype already has this via update loop check
