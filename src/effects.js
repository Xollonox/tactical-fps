import * as THREE from 'three';

// Visual effects system
// Muzzle flash, bullet impacts, blood, tracers, particles, screen shake

export class Effects {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.particles = [];
    this.bulletHoles = [];
    this.tracers = [];
    this.maxParticles = 200;
    this.maxBulletHoles = 50;
  }

  // Muzzle flash - bright sprite that disappears quickly
  muzzleFlash(position, direction) {
    const flashGeo = new THREE.PlaneGeometry(0.3, 0.3);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffffaa,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const flash = new THREE.Mesh(flashGeo, flashMat);
    flash.position.copy(position);
    flash.lookAt(position.clone().add(direction));
    flash.userData.life = 0.05;
    flash.userData.maxLife = 0.05;
    this.scene.add(flash);
    this.particles.push(flash);
  }

  // Bullet tracer
  addTracer(start, end, color = 0xffcc44) {
    const points = [start.clone(), end.clone()];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.6,
      linewidth: 1
    });
    const line = new THREE.Line(geo, mat);
    line.userData.life = 0.08;
    line.userData.maxLife = 0.08;
    this.scene.add(line);
    this.tracers.push(line);
  }

  // Bullet impact effect - spark particles
  bulletImpact(position, normal) {
    // Impact mark
    this._addBulletHole(position, normal);

    // Sparks
    const sparkCount = 4 + Math.floor(Math.random() * 4);
    for (let i = 0; i < sparkCount; i++) {
      this._createSpark(position, normal);
    }
  }

  // Blood effect on enemy hit
  bloodEffect(position, isHeadshot = false) {
    const count = isHeadshot ? 15 : 8;
    for (let i = 0; i < count; i++) {
      const blood = new THREE.Mesh(
        new THREE.SphereGeometry(0.02 + Math.random() * 0.03, 4, 4),
        new THREE.MeshBasicMaterial({
          color: isHeadshot ? 0xcc0000 : 0x880000,
          transparent: true,
          opacity: 0.8
        })
      );
      blood.position.copy(position);
      const spread = 0.3;
      blood.position.x += (Math.random() - 0.5) * spread;
      blood.position.y += (Math.random() - 0.5) * spread;
      blood.position.z += (Math.random() - 0.5) * spread;
      blood.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 3,
        (Math.random() - 0.5) * 2
      );
      blood.userData.life = 0.5 + Math.random() * 0.5;
      blood.userData.maxLife = blood.userData.life;
      this.scene.add(blood);
      this.particles.push(blood);
    }
  }

  _addBulletHole(position, normal) {
    if (this.bulletHoles.length >= this.maxBulletHoles) {
      const old = this.bulletHoles.shift();
      this.scene.remove(old);
    }

    const holeGeo = new THREE.CircleGeometry(0.03, 8);
    const holeMat = new THREE.MeshBasicMaterial({
      color: 0x333333,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const hole = new THREE.Mesh(holeGeo, holeMat);
    hole.position.copy(position);
    // Orient towards hit normal
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, normal);
    hole.quaternion.copy(quat);
    // Slightly offset from surface
    hole.position.add(normal.clone().multiplyScalar(0.005));

    this.scene.add(hole);
    this.bulletHoles.push(hole);
  }

  _createSpark(position, normal) {
    const spark = new THREE.Mesh(
      new THREE.BoxGeometry(0.01, 0.01, 0.03),
      new THREE.MeshBasicMaterial({
        color: 0xffcc44,
        transparent: true,
        opacity: 0.9
      })
    );
    spark.position.copy(position);
    spark.position.add(normal.clone().multiplyScalar(0.02));

    const vel = normal.clone().multiplyScalar(-1);
    vel.x += (Math.random() - 0.5) * 3;
    vel.y += Math.random() * 2;
    vel.z += (Math.random() - 0.5) * 3;
    vel.normalize().multiplyScalar(2 + Math.random() * 3);

    spark.userData.velocity = vel;
    spark.userData.life = 0.3 + Math.random() * 0.3;
    spark.userData.maxLife = spark.userData.life;
    this.scene.add(spark);
    this.particles.push(spark);
  }

  // Screen shake
  screenShake(intensity, duration) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTime = duration;
  }

  // Smoke puff
  smokePuff(position, size = 0.5) {
    const count = 8;
    for (let i = 0; i < count; i++) {
      const smoke = new THREE.Mesh(
        new THREE.SphereGeometry(size * (0.3 + Math.random() * 0.5), 6, 6),
        new THREE.MeshBasicMaterial({
          color: 0x888888,
          transparent: true,
          opacity: 0.3
        })
      );
      smoke.position.copy(position);
      smoke.position.x += (Math.random() - 0.5) * size;
      smoke.position.z += (Math.random() - 0.5) * size;
      smoke.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        0.5 + Math.random(),
        (Math.random() - 0.5) * 0.5
      );
      smoke.userData.life = 0.8 + Math.random() * 0.4;
      smoke.userData.maxLife = smoke.userData.life;
      this.scene.add(smoke);
      this.particles.push(smoke);
    }
  }

  // Explosion effect
  explosion(position) {
    this.screenShake(0.3, 0.15);

    // Flash
    const flashGeo = new THREE.SphereGeometry(1.5, 8, 8);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xff8800,
      transparent: true,
      opacity: 0.6
    });
    const flash = new THREE.Mesh(flashGeo, flashMat);
    flash.position.copy(position);
    flash.userData.life = 0.15;
    flash.userData.maxLife = 0.15;
    this.scene.add(flash);
    this.particles.push(flash);

    // Smoke
    this.smokePuff(position, 1.5);

    // Sparks
    for (let i = 0; i < 12; i++) {
      this._createSpark(position, new THREE.Vector3(
        (Math.random() - 0.5),
        Math.random(),
        (Math.random() - 0.5)
      ).normalize());
    }
  }

  update(delta) {
    const now = performance.now();

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.userData.life -= delta;

      if (p.userData.life <= 0) {
        this.scene.remove(p);
        if (p.geometry) p.geometry.dispose();
        if (p.material) p.material.dispose();
        this.particles.splice(i, 1);
        continue;
      }

      const lifeRatio = p.userData.life / p.userData.maxLife;

      if (p.material) {
        p.material.opacity = lifeRatio;
      }

      if (p.userData.velocity) {
        p.position.add(p.userData.velocity.clone().multiplyScalar(delta));
        p.userData.velocity.y -= 4 * delta; // gravity on particles
      }

      if (p.type === 'Mesh') {
        const scale = 1 + (1 - lifeRatio) * 0.5;
        p.scale.set(scale, scale, scale);
      }
    }

    // Update tracers
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.userData.life -= delta;
      if (t.userData.life <= 0) {
        this.scene.remove(t);
        t.geometry.dispose();
        t.material.dispose();
        this.tracers.splice(i, 1);
      } else {
        t.material.opacity = t.userData.life / t.userData.maxLife;
      }
    }

    // Screen shake
    if (this.shakeTime > 0) {
      this.shakeTime -= delta;
      const progress = this.shakeTime / this.shakeDuration;
      const intensity = this.shakeIntensity * progress;
      this.camera.position.x += (Math.random() - 0.5) * intensity;
      this.camera.position.y += (Math.random() - 0.5) * intensity;
    }
  }

  cleanup() {
    for (const p of this.particles) {
      this.scene.remove(p);
      if (p.geometry) p.geometry.dispose();
      if (p.material) p.material.dispose();
    }
    for (const t of this.tracers) {
      this.scene.remove(t);
      if (t.geometry) t.geometry.dispose();
      if (t.material) t.material.dispose();
    }
    for (const h of this.bulletHoles) {
      this.scene.remove(h);
      if (h.geometry) h.geometry.dispose();
      if (h.material) h.material.dispose();
    }
    this.particles = [];
    this.tracers = [];
    this.bulletHoles = [];
  }
}
