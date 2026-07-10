// Player entity
// Manages player state: position, movement, health, armor

import { clamp } from './utils.js';

export class Player {
  constructor(camera) {
    this.camera = camera;

    // Position and movement
    this.position = new THREE.Vector3(0, 1.7, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.yaw = 0;
    this.pitch = 0;

    // Movement states
    this.isGrounded = true;
    this.isCrouching = false;
    this.isSprinting = false;
    this.isWalking = true;

    // Movement parameters
    this.height = 1.7;
    this.crouchHeight = 0.9;
    this.radius = 0.3;
    this.walkSpeed = 4;
    this.runSpeed = 6.5;
    this.crouchSpeed = 2;
    this.aimSpeed = 2.5;
    this.jumpForce = 5;
    this.gravity = -15;
    this.acceleration = 12;
    this.friction = 8;
    this.airFriction = 3;

    // Head bobbing
    this.bobAmount = 0.04;
    this.bobSpeed = 8;
    this.bobPhase = 0;
    this.bobOffset = new THREE.Vector3();

    // Health system
    this.health = 100;
    this.maxHealth = 100;
    this.armor = 0;
    this.maxArmor = 100;
    this.alive = true;

    // Damage tracking
    this.lastDamageTime = 0;
    this.damageDirection = 0;

    // Previous position for collision resolution
    this.prevPosition = new THREE.Vector3();
  }

  reset() {
    this.position.set(0, 1.7, 0);
    this.velocity.set(0, 0, 0);
    this.health = 100;
    this.armor = 0;
    this.alive = true;
    this.isCrouching = false;
    this.isSprinting = false;
    this.lastDamageTime = 0;
  }

  takeDamage(amount, direction = 0) {
    if (!this.alive) return 0;

    // Armor reduces damage
    if (this.armor > 0) {
      const armorAbsorb = amount * 0.5;
      const armorUsed = Math.min(this.armor, armorAbsorb);
      this.armor -= armorUsed;
      amount -= armorUsed;
    }

    this.health = clamp(this.health - amount, 0, this.maxHealth);
    this.lastDamageTime = performance.now();
    this.damageDirection = direction;

    if (this.health <= 0) {
      this.health = 0;
      this.alive = false;
    }

    return amount;
  }

  heal(amount) {
    this.health = clamp(this.health + amount, 0, this.maxHealth);
  }

  addArmor(amount) {
    this.armor = clamp(this.armor + amount, 0, this.maxArmor);
  }

  getHeight() {
    return this.isCrouching ? this.crouchHeight : this.height;
  }

  getSpeed() {
    if (this.isCrouching) return this.crouchSpeed;
    if (this.isSprinting) return this.runSpeed;
    if (!this.isWalking) return this.aimSpeed;
    return this.walkSpeed;
  }

  update(delta) {
    // Head bob
    if (this.isGrounded && (this.velocity.x !== 0 || this.velocity.z !== 0)) {
      this.bobPhase += delta * this.bobSpeed;
      const bobX = Math.sin(this.bobPhase) * this.bobAmount;
      const bobY = Math.abs(Math.cos(this.bobPhase)) * this.bobAmount;
      this.bobOffset.set(bobX, bobY, 0);
    } else {
      this.bobPhase = 0;
      this.bobOffset.lerp(new THREE.Vector3(), delta * 5);
    }
  }

  getCameraPosition() {
    const height = this.getHeight();
    return new THREE.Vector3(
      this.position.x,
      this.position.y - this.height / 2 + height,
      this.position.z
    );
  }

  getWorldPosition() {
    return this.position.clone();
  }

  // Get the Y position of the player's eyes
  getEyeY() {
    return this.position.y - this.height / 2 + this.getHeight() * 0.9;
  }
}
