import * as THREE from 'three';

// Map / Level creation
// Urban combat training ground with rooms, corridors, courtyard, and cover

export class GameMap {
  constructor(scene, collisionSystem) {
    this.scene = scene;
    this.collision = collisionSystem;
    this.meshes = [];
    this.waypoints = [];
    this.enemySpawns = [];
    this.playerSpawn = new THREE.Vector3(0, 0, 10);
  }

  build() {
    this._createGround();
    this._createBoundaryWalls();
    this._createBuildings();
    this._createCorridors();
    this._createCover();
    this._createElevatedArea();
    this._createLighting();
    this._createEnvironment();
  }

  _createGround() {
    // Main ground
    const groundGeo = new THREE.PlaneGeometry(100, 100);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.8,
      metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.meshes.push(ground);

    this.collision.addCollider(ground, { isWall: false, isFloor: true });

    // Ground texture variation
    const asphaltGeo = new THREE.PlaneGeometry(30, 30);
    const asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.9,
      metalness: 0.1
    });
    const asphalt = new THREE.Mesh(asphaltGeo, asphaltMat);
    asphalt.rotation.x = -Math.PI / 2;
    asphalt.position.set(0, -0.05, 0);
    asphalt.receiveShadow = true;
    this.scene.add(asphalt);
  }

  _createBoundaryWalls() {
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.9,
      metalness: 0.0
    });
    const wallHeight = 6;
    const thickness = 0.5;

    // Outer walls with openings
    const walls = [
      { pos: [0, wallHeight / 2, -25], size: [50, wallHeight, thickness] }, // North
      { pos: [0, wallHeight / 2, 25], size: [50, wallHeight, thickness] },  // South
      { pos: [-25, wallHeight / 2, 0], size: [thickness, wallHeight, 50] }, // West
      { pos: [25, wallHeight / 2, 0], size: [thickness, wallHeight, 50] }   // East
    ];

    walls.forEach(w => {
      const geo = new THREE.BoxGeometry(...w.size);
      const mesh = new THREE.Mesh(geo, wallMat);
      mesh.position.set(...w.pos);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this.meshes.push(mesh);
      this.collision.addCollider(mesh);
    });
  }

  _createBuildings() {
    // Building 1 - Main structure (northwest)
    this._createBuilding(-10, 0, -15, 12, 4, 10, 0x777777);

    // Building 2 - East structure
    this._createBuilding(12, 0, -5, 8, 4, 12, 0x6a6a6a);

    // Building 3 - South structure
    this._createBuilding(-8, 0, 14, 14, 4, 8, 0x7a7a7a);

    // Building 4 - Center structure (2-story)
    this._createBuilding(0, 2.5, 0, 6, 5, 6, 0x666666);
    // Second story floor
    const floorGeo2 = new THREE.BoxGeometry(6, 0.2, 6);
    const floorMat2 = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });
    const floor2 = new THREE.Mesh(floorGeo2, floorMat2);
    floor2.position.set(0, 2.6, 0);
    floor2.receiveShadow = true;
    this.scene.add(floor2);
    this.meshes.push(floor2);
    this.collision.addCollider(floor2, { isWall: false, isFloor: true });

    // Stairs to second floor (ramp)
    this._createStairs(-3.5, 0, 0);
  }

  _createBuilding(cx, cy, cz, w, h, d, color) {
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.85,
      metalness: 0.05
    });

    // Walls
    const wallT = 0.2;
    const wallPositions = [
      // Front wall (with door opening)
      { pos: [cx, cy + h / 2, cz - d / 2], size: [w, h, wallT] },
      // Back wall
      { pos: [cx, cy + h / 2, cz + d / 2], size: [w, h, wallT] },
      // Left wall
      { pos: [cx - w / 2, cy + h / 2, cz], size: [wallT, h, d] },
      // Right wall
      { pos: [cx + w / 2, cy + h / 2, cz], size: [wallT, h, d] },
    ];

    wallPositions.forEach(wp => {
      const geo = new THREE.BoxGeometry(...wp.size);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...wp.pos);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this.meshes.push(mesh);
      this.collision.addCollider(mesh);
    });

    // Floor
    const floorGeo = new THREE.BoxGeometry(w - wallT * 2, 0.2, d - wallT * 2);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(cx, cy + 0.1, cz);
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.meshes.push(floor);
    this.collision.addCollider(floor, { isWall: false, isFloor: true });

    // Roof
    const roofGeo = new THREE.BoxGeometry(w, 0.2, d);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.7 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(cx, cy + h, cz);
    roof.castShadow = true;
    this.scene.add(roof);
    this.meshes.push(roof);
    this.collision.addCollider(roof);
  }

  _createStairs(x, y, z) {
    const mat = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.8 });
    const stepCount = 8;
    const stepHeight = 0.3;
    const stepDepth = 0.4;
    const stepWidth = 1.2;

    for (let i = 0; i < stepCount; i++) {
      const geo = new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth);
      const step = new THREE.Mesh(geo, mat);
      step.position.set(x, y + i * stepHeight + stepHeight / 2, z - i * stepDepth);
      step.castShadow = true;
      step.receiveShadow = true;
      this.scene.add(step);
      this.meshes.push(step);
      this.collision.addCollider(step, { isWall: false, isFloor: true, isStairs: true });
    }
  }

  _createCorridors() {
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x7a7a7a,
      roughness: 0.9,
      metalness: 0.0
    });

    // North-South corridor connecting buildings
    const corridorWalls = [
      // Corridor 1: from center north
      { pos: [-4, 2, -8], size: [0.2, 4, 6] },
      { pos: [-2, 2, -8], size: [0.2, 4, 6] },
      // Corridor 2: center east
      { pos: [5, 2, -3], size: [6, 4, 0.2] },
      { pos: [5, 2, -1], size: [6, 4, 0.2] },
      // Corridor 3: center south
      { pos: [-3, 2, 8], size: [0.2, 4, 6] },
      { pos: [-1, 2, 8], size: [0.2, 4, 6] },
    ];

    corridorWalls.forEach(w => {
      const geo = new THREE.BoxGeometry(...w.size);
      const mesh = new THREE.Mesh(geo, wallMat);
      mesh.position.set(...w.pos);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this.meshes.push(mesh);
      this.collision.addCollider(mesh);
    });
  }

  _createCover() {
    const crateMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x556b2f, roughness: 0.4, metalness: 0.6 });
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5, metalness: 0.3 });

    const coverPositions = [
      // Central crates
      { pos: [-4, 0.5, -4], size: [1, 1, 1], mat: crateMat },
      { pos: [-2, 0.5, -4], size: [1, 1, 1], mat: crateMat },
      { pos: [-3, 0.25, -2], size: [0.5, 0.5, 2], mat: metalMat },
      // East crates
      { pos: [15, 0.5, 0], size: [1, 1, 1], mat: crateMat },
      { pos: [16, 0.25, -2], size: [2, 0.5, 0.8], mat: metalMat },
      { pos: [14, 0.5, 3], size: [1, 1, 1], mat: crateMat },
      // South crates
      { pos: [-4, 0.5, 18], size: [1.2, 1, 0.8], mat: metalMat },
      { pos: [-6, 0.5, 19], size: [1, 1, 1], mat: crateMat },
      { pos: [-2, 0.5, 17], size: [1, 1, 1], mat: crateMat },
      // Scattered barrels
      { pos: [8, 0.5, -8], size: [0.6, 1, 0.6], mat: barrelMat },
      { pos: [9, 0.5, -7], size: [0.6, 1, 0.6], mat: barrelMat },
      { pos: [-10, 0.5, 5], size: [0.6, 1, 0.6], mat: barrelMat },
      // Additional cover
      { pos: [0, 0.25, -12], size: [3, 0.5, 0.5], mat: metalMat },
      { pos: [-15, 0.5, 10], size: [1, 1, 1], mat: crateMat },
      { pos: [10, 0.5, 12], size: [1, 1, 1.5], mat: crateMat },
    ];

    coverPositions.forEach(c => {
      const geo = new THREE.BoxGeometry(...c.size);
      const mesh = new THREE.Mesh(geo, c.mat);
      mesh.position.set(...c.pos);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this.meshes.push(mesh);
      this.collision.addCollider(mesh);
    });

    // Sandbag walls
    const sandbagMat = new THREE.MeshStandardMaterial({
      color: 0x8B7355,
      roughness: 0.9,
      metalness: 0.0
    });

    const sandbagPositions = [
      { pos: [8, 0.3, -4], size: [2, 0.6, 0.4] },
      { pos: [8, 0.3, -3], size: [2, 0.6, 0.4] },
      { pos: [-8, 0.3, -4], size: [2, 0.6, 0.4] },
      { pos: [-8, 0.3, -3], size: [2, 0.6, 0.4] },
    ];

    sandbagPositions.forEach(s => {
      const geo = new THREE.BoxGeometry(...s.size);
      const mesh = new THREE.Mesh(geo, sandbagMat);
      mesh.position.set(...s.pos);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this.meshes.push(mesh);
      this.collision.addCollider(mesh);
    });
  }

  _createElevatedArea() {
    // Elevated platform / balcony on the center building
    const platMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.7 });
    const platGeo = new THREE.BoxGeometry(4, 0.2, 3);
    const plat = new THREE.Mesh(platGeo, platMat);
    plat.position.set(0, 5.2, 2.5);
    plat.receiveShadow = true;
    this.scene.add(plat);
    this.meshes.push(plat);
    this.collision.addCollider(plat, { isWall: false, isFloor: true });

    // Railing
    const railMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.5, metalness: 0.3 });
    const railPositions = [
      { pos: [2, 5.7, 2.5], size: [0.1, 0.8, 3] },
      { pos: [-2, 5.7, 2.5], size: [0.1, 0.8, 3] },
      { pos: [0, 5.7, 4], size: [4, 0.8, 0.1] },
    ];

    railPositions.forEach(r => {
      const geo = new THREE.BoxGeometry(...r.size);
      const mesh = new THREE.Mesh(geo, railMat);
      mesh.position.set(...r.pos);
      mesh.castShadow = true;
      this.scene.add(mesh);
      this.meshes.push(mesh);
      this.collision.addCollider(mesh);
    });

    // Another elevated platform (watchtower)
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.8 });
    const towerPos = [-18, 2.5, -18];
    const towerFloor = new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 3), towerMat);
    towerFloor.position.set(...towerPos);
    towerFloor.receiveShadow = true;
    this.scene.add(towerFloor);
    this.meshes.push(towerFloor);
    this.collision.addCollider(towerFloor, { isWall: false, isFloor: true });

    // Tower supports
    for (let i = 0; i < 4; i++) {
      const support = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 5, 0.2),
        new THREE.MeshStandardMaterial({ color: 0x777777 })
      );
      const offsets = [[-1.3, 0, -1.3], [1.3, 0, -1.3], [-1.3, 0, 1.3], [1.3, 0, 1.3]];
      support.position.set(towerPos[0] + offsets[i][0], towerPos[1] - 2.5, towerPos[2] + offsets[i][2]);
      this.scene.add(support);
      this.meshes.push(support);
      this.collision.addCollider(support);
    }

    // Ladder (simple ramp geometry)
    this._createStairs(-18, 0, -18);
    this._createStairsSmall(-17, 0, -18);
  }

  _createStairsSmall(x, y, z) {
    const mat = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.8 });
    for (let i = 0; i < 6; i++) {
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.2, 0.3),
        mat
      );
      step.position.set(x, y + i * 0.4 + 0.1, z - i * 0.3);
      step.castShadow = true;
      this.scene.add(step);
      this.meshes.push(step);
      this.collision.addCollider(step, { isWall: false, isFloor: true, isStairs: true });
    }
  }

  _createLighting() {
    // Ambient light
    const ambient = new THREE.AmbientLight(0x404060, 0.4);
    this.scene.add(ambient);

    // Hemisphere light
    const hemi = new THREE.HemisphereLight(0x87CEEB, 0x444444, 0.6);
    this.scene.add(hemi);

    // Main directional light (sun)
    const sun = new THREE.DirectionalLight(0xffeedd, 0.8);
    sun.position.set(20, 30, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 60;
    sun.shadow.camera.left = -30;
    sun.shadow.camera.right = 30;
    sun.shadow.camera.top = 30;
    sun.shadow.camera.bottom = -30;
    this.scene.add(sun);

    // Fill light
    const fill = new THREE.DirectionalLight(0x8888ff, 0.3);
    fill.position.set(-10, 10, -10);
    this.scene.add(fill);

    // Point lights for "industrial" feeling
    const lightPositions = [
      [-5, 5, -5], [5, 5, 5], [-10, 5, 10], [10, 5, -10], [0, 6, 0]
    ];
    lightPositions.forEach(pos => {
      const light = new THREE.PointLight(0xffaa44, 0.5, 15);
      light.position.set(...pos);
      this.scene.add(light);

      // Light fixture (small sphere)
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffaa44 })
      );
      bulb.position.set(...pos);
      this.scene.add(bulb);
    });
  }

  _createEnvironment() {
    // Skybox / background color
    this.scene.background = new THREE.Color(0x87CEEB);
    this.scene.fog = new THREE.Fog(0x87CEEB, 30, 60);

    // Some pillars in open areas
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.7 });
    const pillarPositions = [
      [-6, 0, -10], [6, 0, -10], [-6, 0, 10], [6, 0, 10],
      [-12, 0, 0], [12, 0, 0], [0, 0, -15], [0, 0, 15]
    ];

    pillarPositions.forEach(pos => {
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.4, 5, 8),
        pillarMat
      );
      pillar.position.set(pos[0], 2.5, pos[1]);
      pillar.castShadow = true;
      this.scene.add(pillar);
      this.meshes.push(pillar);
      this.collision.addCollider(pillar);
    });
  }

  // Get waypoints for enemy AI navigation
  getWaypoints() {
    return [
      new THREE.Vector3(-15, 0, -10),
      new THREE.Vector3(-5, 0, -12),
      new THREE.Vector3(5, 0, -10),
      new THREE.Vector3(15, 0, -5),
      new THREE.Vector3(12, 0, 0),
      new THREE.Vector3(10, 0, 5),
      new THREE.Vector3(5, 0, 10),
      new THREE.Vector3(-5, 0, 12),
      new THREE.Vector3(-12, 0, 8),
      new THREE.Vector3(-15, 0, 0),
      new THREE.Vector3(-8, 0, -5),
      new THREE.Vector3(0, 0, -5),
      new THREE.Vector3(0, 0, 5),
      new THREE.Vector3(-5, 0, 0),
      new THREE.Vector3(5, 0, 0),
      new THREE.Vector3(-10, 0, -15),
      new THREE.Vector3(10, 0, 10),
      new THREE.Vector3(-15, 0, 15),
    ];
  }

  // Get enemy spawn points
  getEnemySpawns() {
    return [
      new THREE.Vector3(-15, 0, -15),
      new THREE.Vector3(15, 0, -10),
      new THREE.Vector3(-18, 0, 10),
      new THREE.Vector3(15, 0, 15),
      new THREE.Vector3(-15, 0, 0),
      new THREE.Vector3(0, 0, -18),
    ];
  }
}
