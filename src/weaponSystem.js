// Weapon System
// Manages weapon switching, firing, reloading, recoil, and bullet simulation

import { WEAPONS, DEFAULT_LOADOUT } from './weapons.js';
import { audio } from './audio.js';

export class WeaponSystem {
  constructor(camera, scene, collisionSystem, effects) {
    this.camera = camera;
    this.scene = scene;
    this.collision = collisionSystem;
    this.effects = effects;

    // Weapon state
    this.primaryWeapon = null;
    this.secondaryWeapon = null;
    this.currentWeapon = null;
    this.hasKnife = true;
    this.hasGrenade = false;

    // Firing state
    this.isFiring = false;
    this.isReloading = false;
    this.reloadProgress = 0;
    this.reloadStartTime = 0;

    // Recoil
    this.recoilCurrent = { x: 0, y: 0 };
    this.spreadCurrent = 0;

    // Weapon model (first person)
    this.weaponModelGroup = new THREE.Group();
    this.camera.add(this.weaponModelGroup);
    this.weaponModelGroup.position.set(0.3, -0.25, -0.5);

    this.defaultWeaponPos = new THREE.Vector3(0.3, -0.25, -0.5);
    this.aimWeaponPos = new THREE.Vector3(0.15, -0.2, -0.3);

    // Create weapon models
    this._createWeaponModels();

    // Setup default loadout
    this._setupDefaultLoadout();
  }

  _createWeaponModels() {
    // We'll create the visible weapon model dynamically based on current weapon
    this.weaponMeshes = {};
    const matBlack = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.4, metalness: 0.7 });
    const matDarkGray = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5, metalness: 0.5 });
    const matWood = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.8, metalness: 0.0 });
    const matSilver = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.3, metalness: 0.8 });

    // Rifle model
    const rifleGroup = new THREE.Group();
    const rifleBody = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.5), matBlack);
    rifleBody.position.z = -0.25;
    rifleGroup.add(rifleBody);
    const rifleBarrel = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.2), matDarkGray);
    rifleBarrel.position.z = -0.5;
    rifleGroup.add(rifleBarrel);
    const rifleStock = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.12), matWood);
    rifleStock.position.set(0, -0.02, 0.05);
    rifleGroup.add(rifleStock);
    const rifleMag = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.08, 0.08), matDarkGray);
    rifleMag.position.set(0, -0.06, -0.2);
    rifleGroup.add(rifleMag);
    const rifleHandle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, 0.04), matDarkGray);
    rifleHandle.position.set(0, -0.02, 0);
    rifleGroup.add(rifleHandle);
    rifleGroup.visible = false;
    this.weaponModelGroup.add(rifleGroup);
    this.weaponMeshes.rifle = rifleGroup;

    // Pistol model
    const pistolGroup = new THREE.Group();
    const pistolBody = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.2), matBlack);
    pistolBody.position.z = -0.1;
    pistolGroup.add(pistolBody);
    const pistolBarrel = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, 0.12), matDarkGray);
    pistolBarrel.position.z = -0.25;
    pistolGroup.add(pistolBarrel);
    const pistolGrip = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.07, 0.04), matWood);
    pistolGrip.position.set(0, -0.05, 0.02);
    pistolGroup.add(pistolGrip);
    const pistolSlide = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.16), matSilver);
    pistolSlide.position.set(0, 0.03, -0.1);
    pistolGroup.add(pistolSlide);
    pistolGroup.visible = false;
    this.weaponModelGroup.add(pistolGroup);
    this.weaponMeshes.pistol = pistolGroup;

    // SMG model
    const smgGroup = new THREE.Group();
    const smgBody = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.35), matBlack);
    smgBody.position.z = -0.18;
    smgGroup.add(smgBody);
    const smgBarrel = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, 0.15), matDarkGray);
    smgBarrel.position.z = -0.4;
    smgGroup.add(smgBarrel);
    const smgStock = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, 0.08), matDarkGray);
    smgStock.position.set(0, -0.01, 0.05);
    smgGroup.add(smgStock);
    const smgMag = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.1, 0.06), matDarkGray);
    smgMag.position.set(0, -0.07, -0.15);
    smgGroup.add(smgMag);
    smgGroup.visible = false;
    this.weaponModelGroup.add(smgGroup);
    this.weaponMeshes.smg = smgGroup;

    // Shotgun model
    const shotgunGroup = new THREE.Group();
    const shotBody = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.4), matBlack);
    shotBody.position.z = -0.2;
    shotgunGroup.add(shotBody);
    const shotBarrel = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.25), matDarkGray);
    shotBarrel.position.z = -0.5;
    shotgunGroup.add(shotBarrel);
    const shotStock = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.09, 0.15), matWood);
    shotStock.position.set(0, -0.02, 0.05);
    shotgunGroup.add(shotStock);
    const shotPump = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.06), matSilver);
    shotPump.position.set(0, 0, -0.35);
    shotgunGroup.add(shotPump);
    shotgunGroup.visible = false;
    this.weaponModelGroup.add(shotgunGroup);
    this.weaponMeshes.shotgun = shotgunGroup;

    // Sniper model
    const sniperGroup = new THREE.Group();
    const sniperBody = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.6), matBlack);
    sniperBody.position.z = -0.3;
    sniperGroup.add(sniperBody);
    const sniperBarrel = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.25), matDarkGray);
    sniperBarrel.position.z = -0.65;
    sniperGroup.add(sniperBarrel);
    const sniperScope = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.06), matBlack);
    sniperScope.position.set(0, 0.05, -0.25);
    sniperGroup.add(sniperScope);
    const sniperStock = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.12), matWood);
    sniperStock.position.set(0, -0.02, 0.1);
    sniperGroup.add(sniperStock);
    const sniperMag2 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, 0.06), matDarkGray);
    sniperMag2.position.set(0, -0.05, -0.3);
    sniperGroup.add(sniperMag2);
    sniperGroup.visible = false;
    this.weaponModelGroup.add(sniperGroup);
    this.weaponMeshes.sniper = sniperGroup;
  }

  _setupDefaultLoadout() {
    if (DEFAULT_LOADOUT.secondary) {
      this.secondaryWeapon = this._createWeaponInstance(DEFAULT_LOADOUT.secondary);
    }
    this.currentWeapon = this.secondaryWeapon;
    this._showWeaponModel();
  }

  _createWeaponInstance(weaponId) {
    const data = WEAPONS[weaponId];
    if (!data) return null;
    return {
      data: data,
      ammo: data.magazineSize,
      reserveAmmo: data.reserveAmmo,
      lastFireTime: 0
    };
  }

  buyWeapon(weaponId) {
    const data = WEAPONS[weaponId];
    if (!data) return;

    const weapon = this._createWeaponInstance(weaponId);
    if (!weapon) return;

    if (data.type === 'primary') {
      this.primaryWeapon = weapon;
    } else {
      this.secondaryWeapon = weapon;
    }

    this.currentWeapon = weapon;
    this._showWeaponModel();
  }

  switchWeapon(slot) {
    if (this.isReloading) return;

    let weapon = null;
    switch (slot) {
      case 1: weapon = this.primaryWeapon; break;
      case 2: weapon = this.secondaryWeapon; break;
      case 3:
        // Knife - simple melee, not fully implemented
        return;
    }

    if (weapon && weapon !== this.currentWeapon) {
      this.currentWeapon = weapon;
      this._showWeaponModel();
      this.spreadCurrent = 0;
      this.recoilCurrent = { x: 0, y: 0 };
      audio.play('reload', 0.3);
    }
  }

  _showWeaponModel() {
    // Hide all weapon models
    Object.values(this.weaponMeshes).forEach(m => m.visible = false);

    if (!this.currentWeapon) return;

    const model = this.weaponMeshes[this.currentWeapon.data.id];
    if (model) {
      model.visible = true;
    }
  }

  fire(player, targets) {
    if (!this.currentWeapon) return null;
    if (this.isReloading) return null;

    const weapon = this.currentWeapon;
    const data = weapon.data;
    const now = performance.now();

    // Check fire rate
    if (now - weapon.lastFireTime < data.fireRate) return null;

    // Check ammo
    if (weapon.ammo <= 0) {
      this.startReload();
      return null;
    }

    // Fire!
    weapon.lastFireTime = now;
    weapon.ammo--;

    // Calculate spread
    const isMoving = player.velocity.length() > 0.1;
    const isCrouching = player.isCrouching;
    const isAiming = this.isAiming;

    let baseSpread = data.spread;
    if (isMoving) baseSpread = data.spreadRunning;
    if (player.isSprinting) baseSpread = data.spreadJumping;
    if (isCrouching) baseSpread = data.spreadCrouching;
    if (isAiming) baseSpread = data.spreadAiming;

    this.spreadCurrent = Math.min(
      this.spreadCurrent + data.spreadIncreasePerShot,
      data.maxSpread
    );
    const totalSpread = baseSpread + this.spreadCurrent;

    // Calculate recoil
    this.recoilCurrent.x += data.recoilPerShot.x * (isAiming ? 0.7 : 1);
    this.recoilCurrent.y += data.recoilPerShot.y * (isAiming ? 0.7 : 1);

    // Spread direction
    const spreadAngle = Math.random() * Math.PI * 2;
    const spreadAmount = totalSpread * Math.random();

    // Get camera direction
    const cameraDir = new THREE.Vector3(0, 0, -1);
    cameraDir.applyQuaternion(this.camera.quaternion);

    // Apply spread
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(cameraDir, up).normalize();
    const spreadDir = cameraDir.clone()
      .add(right.multiplyScalar(Math.cos(spreadAngle) * spreadAmount))
      .add(up.clone().multiplyScalar(Math.sin(spreadAngle) * spreadAmount))
      .normalize();

    // Shotgun: multiple pellets
    const hits = [];
    const pelletCount = data.pellets || 1;

    for (let i = 0; i < pelletCount; i++) {
      // Slightly vary each pellet
      const pSpread = totalSpread * (0.5 + Math.random() * 0.5);
      const pAngle = Math.random() * Math.PI * 2;
      const pDir = cameraDir.clone()
        .add(right.clone().multiplyScalar(Math.cos(pAngle) * pSpread))
        .add(up.clone().multiplyScalar(Math.sin(pAngle) * pSpread))
        .normalize();

      const result = this._traceBullet(player.getCameraPosition(), pDir, data.range, targets);
      if (result) hits.push(result);
    }

    // Visual effects
    const muzzlePos = player.getCameraPosition().clone().add(cameraDir.clone().multiplyScalar(0.5));
    this.effects.muzzleFlash(muzzlePos, cameraDir);

    const tracerEnd = cameraDir.clone().multiplyScalar(30).add(muzzlePos);
    this.effects.addTracer(muzzlePos, tracerEnd);

    // Recoil animation
    this._applyRecoilAnim();

    // Audio
    audio.playGunshot(data.id);

    // Screen shake
    const shakeIntensity = data.id === 'shotgun' ? 0.08 : data.id === 'sniper' ? 0.1 : 0.03;
    this.effects.screenShake(shakeIntensity, 0.05);

    // Auto-reload when empty
    if (weapon.ammo <= 0) {
      this.startReload();
    }

    return hits.length > 0 ? hits : null;
  }

  _traceBullet(origin, direction, range, targets) {
    const result = this.collision.raycastBullet(origin, direction, range, targets);
    if (!result) return null;

    return {
      point: result.point,
      normal: result.normal,
      distance: result.distance,
      hitMesh: result.hit.object,
      hit: result.hit
    };
  }

  startReload() {
    if (!this.currentWeapon || this.isReloading) return;
    const weapon = this.currentWeapon;
    if (weapon.ammo >= weapon.data.magazineSize) return;
    if (weapon.reserveAmmo <= 0) return;

    this.isReloading = true;
    this.reloadStartTime = performance.now();
    this.reloadProgress = 0;
    audio.play('reload', 0.5);
  }

  updateReload() {
    if (!this.isReloading || !this.currentWeapon) return;

    const weapon = this.currentWeapon;
    const elapsed = performance.now() - this.reloadStartTime;
    this.reloadProgress = elapsed / weapon.data.reloadTime;

    if (elapsed >= weapon.data.reloadTime) {
      // Reload complete
      const needed = weapon.data.magazineSize - weapon.ammo;
      const available = Math.min(needed, weapon.reserveAmmo);
      weapon.ammo += available;
      weapon.reserveAmmo -= available;
      this.isReloading = false;
      this.reloadProgress = 0;
    }
  }

  _applyRecoilAnim() {
    // Animate weapon model kick
    if (this.weaponModelGroup) {
      this.weaponModelGroup.position.z = this.defaultWeaponPos.z + 0.05;
      this.weaponModelGroup.rotation.x = -0.05;
    }
  }

  update(delta, player) {
    // Recover weapon position
    if (this.weaponModelGroup) {
      const targetPos = this.isAiming ? this.aimWeaponPos : this.defaultWeaponPos;
      this.weaponModelGroup.position.lerp(targetPos, delta * 10);
      this.weaponModelGroup.rotation.x *= 0.9;
    }

    // Recoil recovery
    this.recoilCurrent.x *= 0.85;
    this.recoilCurrent.y *= 0.85;
    this.spreadCurrent = Math.max(0, this.spreadCurrent - delta * 2);

    // Head bob on weapon
    if (player && player.bobOffset) {
      this.weaponModelGroup.position.x = this.defaultWeaponPos.x + player.bobOffset.x * 0.5;
      this.weaponModelGroup.position.y = this.defaultWeaponPos.y + player.bobOffset.y * 0.5;
    }

    // Reload progress
    if (this.isReloading) {
      this.updateReload();
      // Reload animation (rotate weapon)
      if (this.weaponModelGroup) {
        const progress = this.reloadProgress;
        this.weaponModelGroup.rotation.z = Math.sin(progress * Math.PI * 2) * 0.2;
      }
    } else if (this.weaponModelGroup) {
      this.weaponModelGroup.rotation.z *= 0.9;
    }
  }

  getCurrentSpread() {
    if (!this.currentWeapon) return 0;
    return this.currentWeapon.data.spread + this.spreadCurrent;
  }

  setAiming(aiming) {
    this.isAiming = aiming;
  }

  reset() {
    this.primaryWeapon = null;
    this.secondaryWeapon = null;
    this.currentWeapon = null;
    this.isReloading = false;
    this.spreadCurrent = 0;
    this.recoilCurrent = { x: 0, y: 0 };
    this._setupDefaultLoadout();
    this._showWeaponModel();
  }
}
