// Main Game class
// Manages the game loop, coordinates all systems, handles state transitions

import * as THREE from 'three';
import { Player } from './player.js';
import { Controls } from './controls.js';
import { WeaponSystem } from './weaponSystem.js';
import { Enemy } from './enemy.js';
import { EnemyAI } from './enemyAI.js';
import { CollisionSystem } from './collision.js';
import { Effects } from './effects.js';
import { AudioManager, audio } from './audio.js';
import { UIManager } from './ui.js';
import { BuyMenu } from './buyMenu.js';
import { RoundSystem } from './roundSystem.js';
import { GameMap } from './map.js';
import { clamp, isMobileDevice } from './utils.js';

export class Game {
  constructor() {
    // Three.js setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Systems
    this.collision = new CollisionSystem();
    this.player = new Player(this.camera);
    this.controls = new Controls(this.camera, this.renderer.domElement);
    this.effects = new Effects(this.scene, this.camera);
    this.weaponSystem = new WeaponSystem(this.camera, this.scene, this.collision, this.effects);
    this.enemyAI = new EnemyAI(this.scene, this.collision);
    this.map = new GameMap(this.scene, this.collision);
    this.ui = new UIManager();
    this.roundSystem = new RoundSystem(this);
    this.buyMenu = new BuyMenu(this);

    // Game state
    this.isRunning = false;
    this.isPaused = false;
    this.money = 800;
    this.grenades = 0;
    this.clock = new THREE.Clock();

    // Mobile detection
    this.isMobile = isMobileDevice();

    // Window resize
    window.addEventListener('resize', () => this._onResize());

    // Setup renderer DOM
    const container = document.getElementById('game-container');
    container.appendChild(this.renderer.domElement);

    // Initial camera position
    this.camera.position.set(0, 1.7, 10);
  }

  async init() {
    // Build map
    this.map.build();

    // Setup enemy waypoints
    this.enemyAI.setWaypoints(this.map.getWaypoints());

    // Setup audio
    audio.init();

    // Start game
    this.isRunning = true;
    this.clock.start();

    // Start first round
    setTimeout(() => {
      this.roundSystem.startNewRound();
    }, 500);

    // Game loop
    this._gameLoop();

    console.log('Tactical FPS initialized');
  }

  _gameLoop() {
    if (!this.isRunning) return;

    requestAnimationFrame(() => this._gameLoop());

    const delta = Math.min(this.clock.getDelta(), 0.05); // Cap delta at 50ms

    // Update
    this._update(delta);

    // Render
    this.renderer.render(this.scene, this.camera);
  }

  _update(delta) {
    if (this.isPaused) return;

    // Handle inputs
    this._handleInput(delta);

    // Update systems
    this.roundSystem.update(delta);
    this.player.update(delta);
    this.weaponSystem.update(delta, this.player);
    this.enemyAI.update(delta, this.player, this.collision.getColliderMeshes());
    this.effects.update(delta);

    // Update camera
    this._updateCamera(delta);

    // Handle enemy fire
    this._handleEnemyFire(delta);

    // Update UI
    this._updateUI();
  }

  _handleInput(delta) {
    // Pointer lock on click
    if (!this.controls.isLocked && !this.isMobile && !this.buyMenu.isOpen) {
      // Show click to play message
    }

    // Pause
    if (this.controls.consumeAction('pause')) {
      if (this.buyMenu.isOpen) {
        this.buyMenu.close();
      } else {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
          this.controls.unlock();
          this.ui.showPause();
        } else {
          this.controls.lock();
          this.ui.hidePause();
        }
      }
    }

    // Scoreboard
    if (this.controls.actions.scoreboard && !this.buyMenu.isOpen) {
      this.ui.showScoreboard();
      this.ui.updateScoreboard(
        this.roundSystem.playerKills,
        this.roundSystem.playerDeaths,
        this.roundSystem.playerScore
      );
    } else {
      this.ui.hideScoreboard();
    }

    // Buy menu toggle
    if (this.controls.consumeAction('buy') && this.roundSystem.phase === 'buy') {
      this.buyMenu.toggle();
    }

    // Weapon switching
    const slot = this.controls.consumeWeaponSlot();
    if (slot && !this.buyMenu.isOpen) {
      this.weaponSystem.switchWeapon(slot);
    }

    // Reload
    if (this.controls.consumeKey('reload') && !this.buyMenu.isOpen) {
      this.weaponSystem.startReload();
    }

    // Movement
    const moveInput = this.controls.getMovementInput();
    this._handleMovement(moveInput, delta);

    // Jump
    if (this.controls.keys.jump && this.player.isGrounded) {
      this.player.velocity.y = this.player.jumpForce;
      this.player.isGrounded = false;
    }

    // Crouch
    this.player.isCrouching = this.controls.keys.crouch;

    // Sprint
    this.player.isSprinting = this.controls.keys.sprint && !this.controls.isAiming();

    // Aiming
    this.weaponSystem.setAiming(this.controls.isAiming());

    // Shooting
    if (this.controls.isShooting() && this.roundSystem.roundActive && !this.buyMenu.isOpen) {
      this._handleShooting();
    }

    // Mouse look
    const mouseDelta = this.controls.getMouseDelta();
    const mobileLook = this.controls.getMobileLook();

    this.player.yaw -= (mouseDelta.x + mobileLook.x);
    this.player.pitch -= (mouseDelta.y + mobileLook.y);
    this.player.pitch = clamp(this.player.pitch, -Math.PI / 2.2, Math.PI / 2.2);
  }

  _handleMovement(input, delta) {
    const speed = this.player.getSpeed();
    const isMoving = input.forward || input.backward || input.left || input.right;

    // Movement direction
    const forward = new THREE.Vector3(
      -Math.sin(this.player.yaw),
      0,
      -Math.cos(this.player.yaw)
    );
    const right = new THREE.Vector3(
      Math.cos(this.player.yaw),
      0,
      -Math.sin(this.player.yaw)
    );

    const moveDir = new THREE.Vector3();
    if (input.forward) moveDir.add(forward);
    if (input.backward) moveDir.sub(forward);
    if (input.left) moveDir.sub(right);
    if (input.right) moveDir.add(right);

    if (moveDir.length() > 0) {
      moveDir.normalize();
    }

    // Apply acceleration
    const accel = this.player.isGrounded ? this.player.acceleration : this.player.airFriction;
    const targetVel = moveDir.multiplyScalar(speed);
    this.player.velocity.x += (targetVel.x - this.player.velocity.x) * Math.min(1, accel * delta);
    this.player.velocity.z += (targetVel.z - this.player.velocity.z) * Math.min(1, accel * delta);

    // Apply friction on ground
    if (this.player.isGrounded && !isMoving) {
      this.player.velocity.x *= (1 - this.player.friction * delta);
      this.player.velocity.z *= (1 - this.player.friction * delta);
    }

    // Gravity
    this.player.velocity.y += this.player.gravity * delta;

    // Save previous position
    this.player.prevPosition.copy(this.player.position);

    // Apply velocity
    this.player.position.x += this.player.velocity.x * delta;
    this.player.position.z += this.player.velocity.z * delta;

    // Collision resolution on XZ
    const radius = this.player.radius;
    const height = this.player.getHeight();
    this.collision.resolveCollision(this.player.position, radius, height, this.player.prevPosition);

    // Vertical movement
    this.player.position.y += this.player.velocity.y * delta;

    // Ground check
    const groundY = this.collision.isOnGround(this.player.position, radius, height);
    if (groundY !== null && this.player.velocity.y <= 0) {
      this.player.position.y = groundY + height / 2;
      this.player.velocity.y = 0;
      this.player.isGrounded = true;
    } else {
      this.player.isGrounded = false;
    }

    // Update walk state
    this.player.isWalking = !this.player.isSprinting;
  }

  _handleShooting() {
    if (!this.player.alive) return;

    // Get enemy targets for bullet detection
    const enemyTargets = [];
    for (const enemy of this.enemyAI.enemies) {
      if (enemy.alive) {
        enemyTargets.push(enemy.mesh);
      }
    }

    const hits = this.weaponSystem.fire(this.player, enemyTargets);
    if (hits) {
      for (const hit of hits) {
        if (!hit) continue;

        // Check if we hit an enemy
        let hitEnemy = null;
        for (const enemy of this.enemyAI.enemies) {
          if (!enemy.alive) continue;
          if (hit.hitMesh === enemy.mesh ||
              enemy.mesh.children.indexOf(hit.hitMesh) !== -1 ||
              this._isMeshChildOf(hit.hitMesh, enemy.mesh)) {
            hitEnemy = enemy;
            break;
          }
        }

        if (hitEnemy) {
          // Determine hit location
          const bodyPos = hitEnemy.getBodyPosition();
          const headPos = hitEnemy.getHeadPosition();
          const distToHead = hit.point.distanceTo(headPos);
          const isHeadshot = distToHead < 0.3;

          const damage = this.weaponSystem.currentWeapon.data.damage;
          const killed = hitEnemy.takeDamage(damage, isHeadshot);

          // Visual feedback
          this.effects.bloodEffect(hit.point, isHeadshot);
          this.ui.showHitMarker(isHeadshot);

          if (killed) {
            this.roundSystem.onEnemyKilled(isHeadshot);
            this.roundSystem.addKillFeed('You', `Enemy ${isHeadshot ? '(HEADSHOT)' : ''}`, isHeadshot);
            this.money += this.roundSystem.killReward + (isHeadshot ? this.roundSystem.headshotBonus : 0);
            audio.play('headshot', 0.5, 1.2);
          } else {
            audio.play('impact', 0.3);
          }
        } else {
          // Hit wall
          this.effects.bulletImpact(hit.point, hit.normal);
          audio.play('impact', 0.2);
        }
      }
    }
  }

  _isMeshChildOf(mesh, parent) {
    let current = mesh;
    while (current) {
      if (current === parent) return true;
      current = current.parent;
    }
    return false;
  }

  _handleEnemyFire(delta) {
    const events = this.enemyAI.getEnemyFireEvents(delta, this.player);
    for (const event of events) {
      // Visual: muzzle flash at enemy position
      this.effects.muzzleFlash(event.origin, new THREE.Vector3(0, 0, -1));

      // Tracer toward player
      this.effects.addTracer(event.origin, event.playerPos, 0xff6644);

      // Sound
      audio.play('enemyFire', 0.3);

      if (event.hit && this.player.alive) {
        // Calculate damage based on difficulty
        const baseDamage = event.enemy.difficulty === 'easy' ? 15 :
                           event.enemy.difficulty === 'normal' ? 25 :
                           event.enemy.difficulty === 'hard' ? 35 : 45;

        // Distance falloff
        const dist = event.origin.distanceTo(event.playerPos);
        const falloff = 1 - Math.min(dist / 50, 0.5);
        const damage = baseDamage * falloff;

        // Apply damage
        const actualDmg = this.player.takeDamage(damage);
        this.ui.showDamageIndicator(this.player.damageDirection);

        if (!this.player.alive) {
          this.roundSystem.onPlayerDied();
          this.roundSystem.addKillFeed('Enemy', 'You', false);
        }
      }
    }
  }

  _updateCamera(delta) {
    // Apply yaw and pitch
    const euler = new THREE.Euler(this.player.pitch, this.player.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);

    // Apply recoil
    this.camera.rotation.x -= this.weaponSystem.recoilCurrent.x * 0.01;
    this.camera.rotation.y -= this.weaponSystem.recoilCurrent.y * 0.01;

    // Apply head bobbing
    const bobOffset = this.player.bobOffset;
    this.camera.position.set(
      this.player.position.x + bobOffset.x,
      this.player.getEyeY() + bobOffset.y,
      this.player.position.z
    );
  }

  _updateUI() {
    if (this.weaponSystem.currentWeapon) {
      this.ui.updateHUD(this.player, this.weaponSystem.currentWeapon);
      this.ui.updateCrosshair(this.weaponSystem.getCurrentSpread());
    }
    this.ui.updateMoney(this.money);
  }

  spawnEnemy(position, difficulty) {
    const enemy = new Enemy(this.scene, position, difficulty);
    this.enemyAI.addEnemy(enemy);
    return enemy;
  }

  _onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}
