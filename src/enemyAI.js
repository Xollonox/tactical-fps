import * as THREE from 'three';

// Enemy AI behavior system
// State machine: patrol, investigate, combat, take_cover, reload

import { randomRange, randomInt } from './utils.js';

export class EnemyAI {
  constructor(scene, collisionSystem) {
    this.scene = scene;
    this.collision = collisionSystem;
    this.enemies = [];
    this.waypoints = [];
    this.time = 0;
  }

  setWaypoints(waypoints) {
    this.waypoints = waypoints;
  }

  addEnemy(enemy) {
    this.enemies.push(enemy);
    // Assign nearest waypoint
    let nearestDist = Infinity;
    let nearestIdx = 0;
    this.waypoints.forEach((wp, i) => {
      const d = enemy.position.distanceTo(wp);
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    });
    enemy.currentWaypoint = nearestIdx;
  }

  removeEnemy(enemy) {
    const idx = this.enemies.indexOf(enemy);
    if (idx !== -1) this.enemies.splice(idx, 1);
  }

  update(delta, player, colliderMeshes) {
    this.time += delta;

    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;

      enemy.update(delta);

      const distToPlayer = enemy.position.distanceTo(player.position);
      const canSee = enemy.canSeePlayer(player.getCameraPosition());

      // Detection logic
      if (canSee) {
        enemy.detectionLevel = Math.min(2, enemy.detectionLevel + delta * 2);
        enemy.lastKnownPlayerPos = player.position.clone();
      } else if (enemy.detectionLevel > 0) {
        enemy.detectionLevel -= delta * 0.5;
      }

      // State transitions
      switch (enemy.state) {
        case 'patrol':
          this._updatePatrol(enemy, delta, distToPlayer, canSee);
          break;
        case 'investigate':
          this._updateInvestigate(enemy, delta, distToPlayer, canSee, player);
          break;
        case 'combat':
          this._updateCombat(enemy, delta, distToPlayer, canSee, player, colliderMeshes);
          break;
        case 'take_cover':
          this._updateTakeCover(enemy, delta, distToPlayer, canSee, player);
          break;
        case 'reload':
          this._updateReload(enemy, delta);
          break;
      }

      // Handle reload
      if (enemy.ammo <= 0 && !enemy.isReloading && enemy.state !== 'dead') {
        enemy.state = 'reload';
        enemy.isReloading = true;
        enemy.reloadStartTime = this.time;
      }
    }
  }

  _updatePatrol(enemy, delta, distToPlayer, canSee) {
    // Transition to combat if player detected
    if (canSee && enemy.detectionLevel >= 2) {
      enemy.state = 'combat';
      enemy.stateTimer = 0;
      return;
    }

    // Move along waypoints
    const target = this.waypoints[enemy.currentWaypoint];
    if (target) {
      const reached = enemy.moveToward(target, enemy.patrolSpeed);
      if (reached) {
        // Pick next waypoint
        enemy.currentWaypoint = (enemy.currentWaypoint + 1) % this.waypoints.length;
        // Add some randomness
        if (Math.random() < 0.3) {
          enemy.currentWaypoint = randomInt(0, this.waypoints.length - 1);
        }
      }
    }

    // Investigate suspicious sounds (if alert)
    if (enemy.detectionLevel >= 1 && enemy.lastKnownPlayerPos) {
      enemy.state = 'investigate';
      enemy.targetPosition = enemy.lastKnownPlayerPos;
      enemy.stateTimer = 3;
    }
  }

  _updateInvestigate(enemy, delta, distToPlayer, canSee, player) {
    if (canSee && enemy.detectionLevel >= 2) {
      enemy.state = 'combat';
      return;
    }

    if (enemy.targetPosition) {
      const reached = enemy.moveToward(enemy.targetPosition, enemy.speed * 0.7);
      if (reached || enemy.stateTimer <= 0) {
        enemy.stateTimer = 0;
        enemy.detectionLevel = Math.max(0, enemy.detectionLevel - 1);
        enemy.state = 'patrol';
        enemy.targetPosition = null;
      }
    }

    enemy.stateTimer -= delta;
  }

  _updateCombat(enemy, delta, distToPlayer, canSee, player, colliderMeshes) {
    // Combat behavior
    if (!canSee && enemy.lastKnownPlayerPos) {
      // Move toward last known position
      const reached = enemy.moveToward(enemy.lastKnownPlayerPos, enemy.speed);
      if (reached) {
        enemy.state = 'patrol';
        enemy.stateTimer = 0;
      }
      return;
    }

    if (!canSee) {
      enemy.state = 'patrol';
      return;
    }

    // Combat distance management
    const idealRange = 10 + Math.random() * 15;

    if (distToPlayer < 5 && enemy.aggression > 0.5) {
      // Back away if too close
      const retreatDir = new THREE.Vector3()
        .copy(enemy.position)
        .sub(player.position)
        .normalize();
      const retreatPos = enemy.position.clone().add(retreatDir.multiplyScalar(3));
      enemy.moveToward(retreatPos, enemy.speed * 0.5);
    } else if (distToPlayer > idealRange && Math.random() < 0.3) {
      // Move closer
      const advanceDir = new THREE.Vector3()
        .copy(player.position)
        .sub(enemy.position)
        .normalize();
      const advancePos = enemy.position.clone().add(advanceDir.multiplyScalar(2));
      enemy.moveToward(advancePos, enemy.speed);
    } else if (Math.random() < 0.3) {
      // Strafe
      const strafeDir = new THREE.Vector3()
        .copy(player.position)
        .sub(enemy.position)
        .normalize();
      const right = new THREE.Vector3(-strafeDir.z, 0, strafeDir.x);
      const strafePos = enemy.position.clone().add(right.multiplyScalar((Math.random() - 0.5) * 3));
      enemy.moveToward(strafePos, enemy.speed * 0.6);
    } else {
      enemy.velocity.set(0, 0, 0);
    }

    // Face the player
    enemy.faceTarget(player.getCameraPosition());

    // Check if should take cover
    if (enemy.health < enemy.maxHealth * 0.4 && Math.random() < 0.02) {
      enemy.state = 'take_cover';
      enemy.coverTimer = 2 + Math.random() * 3;
      enemy.coverPosition = this._findCoverPosition(enemy, player);
    }

    return null;
  }

  _updateTakeCover(enemy, delta, distToPlayer, canSee, player) {
    if (enemy.coverPosition && enemy.coverTimer > 0) {
      const reached = enemy.moveToward(enemy.coverPosition, enemy.speed * 1.2);
      enemy.faceTarget(player.getCameraPosition());

      // May occasionally peek and shoot
      if (canSee && Math.random() < 0.02) {
        // Brief fire opportunity handled by combat check in main loop
      }
    }

    enemy.coverTimer -= delta;
    if (enemy.coverTimer <= 0) {
      enemy.state = 'combat';
    }
  }

  _updateReload(enemy, delta) {
    if (this.time - enemy.reloadStartTime > enemy.reloadTime / 1000) {
      enemy.ammo = enemy.maxAmmo;
      enemy.isReloading = false;
      enemy.state = 'combat';
    }
  }

  _findCoverPosition(enemy, player) {
    // Simple cover finding: try positions perpendicular to player direction
    const dir = new THREE.Vector3()
      .copy(player.position)
      .sub(enemy.position)
      .normalize();

    const right = new THREE.Vector3(-dir.z, 0, dir.x);
    const left = new THREE.Vector3(dir.z, 0, -dir.x);

    const candidates = [
      enemy.position.clone().add(right.multiplyScalar(3)),
      enemy.position.clone().add(left.multiplyScalar(3)),
      enemy.position.clone().add(new THREE.Vector3(-dir.x, 0, -dir.z).multiplyScalar(3))
    ];

    // Pick the farthest from player
    let best = candidates[0];
    let bestDist = 0;
    candidates.forEach(c => {
      const d = c.distanceTo(player.position);
      if (d > bestDist) {
        bestDist = d;
        best = c;
      }
    });

    return best;
  }

  // Get all enemies that fired this frame
  getEnemyFireEvents(delta, player) {
    const events = [];
    for (const enemy of this.enemies) {
      if (!enemy.alive || enemy.state !== 'combat') continue;

      const now = performance.now();
      if (now - enemy.lastFireTime > enemy.fireRate && !enemy.isReloading) {
        const distToPlayer = enemy.position.distanceTo(player.position);
        const randomAccuracy = Math.random();
        const effectiveAccuracy = enemy.accuracy * (1 - Math.min(distToPlayer / 50, 1) * 0.3);

        if (randomAccuracy < effectiveAccuracy) {
          enemy.lastFireTime = now;
          events.push({
            enemy,
            origin: enemy.getHeadPosition(),
            playerPos: player.position.clone(),
            hit: true
          });
        } else {
          // Miss
          enemy.lastFireTime = now;
          events.push({
            enemy,
            origin: enemy.getHeadPosition(),
            playerPos: player.position.clone(),
            hit: false
          });
        }
      }
    }
    return events;
  }

  clear() {
    for (const enemy of this.enemies) {
      enemy.dispose();
    }
    this.enemies = [];
  }
}
