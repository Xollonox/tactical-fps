import * as THREE from 'three';

// Enemy entity
// Represents an enemy bot with health, model, and state

import { clamp } from './utils.js';

export class Enemy {
  constructor(scene, position, difficulty = 'normal') {
    this.scene = scene;
    this.position = position.clone();

    // Stats based on difficulty
    const stats = {
      easy: { health: 60, accuracy: 0.3, reactionTime: 800, fireRate: 300, aggression: 0.3, speed: 2.5, patrolSpeed: 1.5 },
      normal: { health: 100, accuracy: 0.55, reactionTime: 500, fireRate: 200, aggression: 0.5, speed: 3.0, patrolSpeed: 1.8 },
      hard: { health: 150, accuracy: 0.75, reactionTime: 300, fireRate: 150, aggression: 0.7, speed: 3.5, patrolSpeed: 2.0 },
      elite: { health: 200, accuracy: 0.9, reactionTime: 200, fireRate: 120, aggression: 0.9, speed: 4.0, patrolSpeed: 2.2 }
    };

    const s = stats[difficulty] || stats.normal;
    this.maxHealth = s.health;
    this.health = s.health;
    this.accuracy = s.accuracy;
    this.reactionTime = s.reactionTime;
    this.fireRate = s.fireRate;
    this.aggression = s.aggression;
    this.speed = s.speed;
    this.patrolSpeed = s.patrolSpeed;
    this.difficulty = difficulty;

    // State machine
    this.state = 'patrol'; // patrol, investigate, combat, take_cover, reload, dead
    this.prevState = 'patrol';
    this.stateTimer = 0;
    this.alertTimer = 0;

    // Movement
    this.velocity = new THREE.Vector3();
    this.targetPosition = null;
    this.currentWaypoint = 0;

    // Combat
    this.lastFireTime = 0;
    this.ammo = 30;
    this.maxAmmo = 30;
    this.isReloading = false;
    this.reloadStartTime = 0;
    this.reloadTime = 2500;

    // Cover
    this.coverPosition = null;
    this.coverTimer = 0;

    // Detection
    this.lastKnownPlayerPos = null;
    this.detectionLevel = 0; // 0 = unaware, 1 = suspicious, 2 = aware

    // Model
    this.mesh = null;
    this.modelGroup = null;
    this.weaponModel = null;
    this._createModel();

    // Hit flash
    this.hitFlashTime = 0;

    // Bounding box for collision
    this.radius = 0.4;
    this.height = 1.7;

    // Head position (for headshot detection)
    this.headHeight = 1.5;
    this.headRadius = 0.15;

    this.alive = true;
  }

  _createModel() {
    this.modelGroup = new THREE.Group();
    this.modelGroup.position.copy(this.position);

    // Body (torso)
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xcc4444, roughness: 0.7 });
    const bodyGeo = new THREE.BoxGeometry(0.55, 0.6, 0.3);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.5;
    body.castShadow = true;
    this.modelGroup.add(body);

    // Head
    const headMat = new THREE.MeshStandardMaterial({ color: 0xddbb99, roughness: 0.6 });
    const headGeo = new THREE.SphereGeometry(0.18, 8, 8);
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.1;
    head.castShadow = true;
    this.modelGroup.add(head);

    // Legs
    const legMat = new THREE.MeshStandardMaterial({ color: 0x334466, roughness: 0.8 });
    for (let side = -0.15; side <= 0.15; side += 0.3) {
      const legGeo = new THREE.BoxGeometry(0.12, 0.4, 0.12);
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(side, 0.2, 0);
      this.modelGroup.add(leg);
    }

    // Arms
    const armMat = new THREE.MeshStandardMaterial({ color: 0xcc4444, roughness: 0.7 });
    for (let side = -0.4; side <= 0.4; side += 0.8) {
      const armGeo = new THREE.BoxGeometry(0.08, 0.4, 0.08);
      const arm = new THREE.Mesh(armGeo, armMat);
      arm.position.set(side, 0.5, 0);
      this.modelGroup.add(arm);
    }

    // Weapon (simple box)
    const weaponMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.4, metalness: 0.6 });
    const weaponGeo = new THREE.BoxGeometry(0.08, 0.06, 0.4);
    this.weaponModel = new THREE.Mesh(weaponGeo, weaponMat);
    this.weaponModel.position.set(0.4, 0.35, -0.2);
    this.modelGroup.add(this.weaponModel);

    // Outline/helmet
    const helmetMat = new THREE.MeshStandardMaterial({ color: 0x556666, roughness: 0.5, metalness: 0.3 });
    const helmetGeo = new THREE.SphereGeometry(0.2, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    const helmet = new THREE.Mesh(helmetGeo, helmetMat);
    helmet.position.y = 1.1;
    helmet.scale.set(1, 0.3, 1);
    this.modelGroup.add(helmet);

    this.scene.add(this.modelGroup);
    this.mesh = this.modelGroup;
  }

  takeDamage(amount, isHeadshot = false) {
    if (!this.alive) return false;

    const actualDamage = isHeadshot ? amount * 3 : amount;
    this.health -= actualDamage;
    this.hitFlashTime = 0.1;

    if (this.health <= 0) {
      this.health = 0;
      this.die();
      return true;
    }

    // Alert on hit
    this.detectionLevel = 2;
    this.state = 'combat';
    return false;
  }

  die() {
    this.alive = false;
    this.state = 'dead';

    // Ragdoll-like death: rotate and drop
    if (this.modelGroup) {
      this.modelGroup.rotation.x = Math.PI / 2;
      this.modelGroup.position.y = 0.1;
    }
  }

  getHeadPosition() {
    return new THREE.Vector3(
      this.position.x,
      this.position.y + this.headHeight,
      this.position.z
    );
  }

  getBodyPosition() {
    return new THREE.Vector3(
      this.position.x,
      this.position.y + 0.6,
      this.position.z
    );
  }

  getLookDirection() {
    return new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.modelGroup.rotation.y);
  }

  update(delta) {
    if (!this.alive) return;

    // Update model position
    this.modelGroup.position.copy(this.position);

    // Hit flash
    if (this.hitFlashTime > 0) {
      this.hitFlashTime -= delta;
      this.modelGroup.children.forEach(child => {
        if (child.material) {
          child.material.emissive = new THREE.Color(0xff0000);
          child.material.emissiveIntensity = 0.5;
        }
      });
    } else {
      this.modelGroup.children.forEach(child => {
        if (child.material) {
          child.material.emissive = new THREE.Color(0x000000);
          child.material.emissiveIntensity = 0;
        }
      });
    }

    // Walking animation (simple leg bob)
    if (this.velocity.length() > 0.1) {
      const walkPhase = performance.now() * 0.005;
      const legChildren = this.modelGroup.children.filter(c =>
        c.geometry && c.geometry.parameters && c.geometry.parameters.width < 0.15
      );
      legChildren.forEach((leg, i) => {
        if (leg.position.y < 0.5) {
          leg.position.z = Math.sin(walkPhase + i * Math.PI) * 0.05;
        }
      });
    }
  }

  // Move toward a target position
  moveToward(target, speed) {
    const dir = new THREE.Vector3().copy(target).sub(this.position);
    dir.y = 0;
    const dist = dir.length();

    if (dist > 0.3) {
      dir.normalize();
      this.velocity.copy(dir).multiplyScalar(speed);
      this.position.add(this.velocity.clone().multiplyScalar(1 / 60));

      // Face movement direction
      const angle = Math.atan2(dir.x, dir.z);
      this.modelGroup.rotation.y = angle;
      return true;
    }
    this.velocity.set(0, 0, 0);
    return false;
  }

  // Check if player is visible (simplified line of sight)
  canSeePlayer(playerPos) {
    const dist = this.position.distanceTo(playerPos);
    if (dist > 40) return false;

    const dirToPlayer = new THREE.Vector3().copy(playerPos).sub(this.position);
    const lookDir = this.getLookDirection();
    const angle = dirToPlayer.angleTo(lookDir);

    // Field of view check (~120 degrees)
    if (angle > Math.PI * 0.67) return false;

    return dist;
  }

  // Face a target
  faceTarget(target) {
    const dir = new THREE.Vector3().copy(target).sub(this.position);
    dir.y = 0;
    if (dir.length() > 0) {
      const angle = Math.atan2(dir.x, dir.z);
      this.modelGroup.rotation.y = angle;
    }
  }

  reset(position) {
    this.position.copy(position);
    this.health = this.maxHealth;
    this.alive = true;
    this.state = 'patrol';
    this.detectionLevel = 0;
    this.lastKnownPlayerPos = null;
    this.ammo = this.maxAmmo;
    this.isReloading = false;

    if (this.modelGroup) {
      this.modelGroup.rotation.x = 0;
      this.modelGroup.position.y = 0;
      this.modelGroup.visible = true;
    }
  }

  dispose() {
    if (this.modelGroup) {
      this.scene.remove(this.modelGroup);
      this.modelGroup.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    }
  }
}
