import * as THREE from 'three';

// Collision detection system
// Uses AABB (Axis-Aligned Bounding Box) for all collision checks

export class CollisionSystem {
  constructor() {
    this.colliders = []; // Static environment colliders
    this.dynamicColliders = []; // Moving objects
  }

  // Add a static collider (walls, floors, crates)
  addCollider(mesh, options = {}) {
    const box = new THREE.Box3().setFromObject(mesh);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    this.colliders.push({
      mesh,
      box,
      center,
      size,
      isWall: options.isWall !== false,
      isFloor: options.isFloor || false,
      isStairs: options.isStairs || false
    });
    return this.colliders[this.colliders.length - 1];
  }

  // Add a dynamic collider
  addDynamic(entity) {
    this.dynamicColliders.push(entity);
  }

  // Remove a dynamic collider
  removeDynamic(entity) {
    const idx = this.dynamicColliders.indexOf(entity);
    if (idx !== -1) this.dynamicColliders.splice(idx, 1);
  }

  // Check if a position is inside any collider
  isColliding(position, radius, height, excludeMesh = null) {
    const playerHalfHeight = height / 2;
    const playerMin = new THREE.Vector3(
      position.x - radius,
      position.y - playerHalfHeight,
      position.z - radius
    );
    const playerMax = new THREE.Vector3(
      position.x + radius,
      position.y + playerHalfHeight,
      position.z + radius
    );

    for (const collider of this.colliders) {
      if (excludeMesh && collider.mesh === excludeMesh) continue;
      if (!collider.isWall) continue;

      const c = collider.center;
      const s = collider.size;
      const cMin = new THREE.Vector3(c.x - s.x / 2, c.y - s.y / 2, c.z - s.z / 2);
      const cMax = new THREE.Vector3(c.x + s.x / 2, c.y + s.y / 2, c.z + s.z / 2);

      if (
        playerMin.x < cMax.x && playerMax.x > cMin.x &&
        playerMin.y < cMax.y && playerMax.y > cMin.y &&
        playerMin.z < cMax.z && playerMax.z > cMin.z
      ) {
        return collider;
      }
    }
    return null;
  }

  // Resolve collision - push player out of overlapping collider
  resolveCollision(position, radius, height, prevPosition) {
    const collided = this.isColliding(position, radius, height);
    if (!collided) return false;

    const c = collided.center;
    const s = collided.size;
    const halfW = s.x / 2 + radius;
    const halfD = s.z / 2 + radius;

    // Determine which axis to push back
    const overlapX = halfW - Math.abs(position.x - c.x);
    const overlapZ = halfD - Math.abs(position.z - c.z);

    if (overlapX < overlapZ) {
      position.x = position.x > c.x ? c.x + halfW : c.x - halfW;
    } else {
      position.z = position.z > c.z ? c.z + halfD : c.z - halfD;
    }

    return true;
  }

  // Check if player is on the ground (standing on any floor/object)
  isOnGround(position, radius, height) {
    const feetY = position.y - height / 2;
    const checkPos = new THREE.Vector3(position.x, feetY - 0.1, position.z);

    for (const collider of this.colliders) {
      if (!collider.isFloor) continue;
      const c = collider.center;
      const s = collider.size;
      const cMin = new THREE.Vector3(c.x - s.x / 2, c.y - s.y / 2, c.z - s.z / 2);
      const cMax = new THREE.Vector3(c.x + s.x / 2, c.y + s.y / 2, c.z + s.z / 2);

      // Check if feet are within the floor bounds
      if (
        position.x - radius < cMax.x && position.x + radius > cMin.x &&
        position.z - radius < cMax.z && position.z + radius > cMin.z &&
        Math.abs(feetY - (c.y + s.y / 2)) < 0.3
      ) {
        return c.y + s.y / 2; // Return ground Y level
      }
    }
    return null;
  }

  // Raycast for bullets
  raycastBullet(origin, direction, range, targets) {
    const raycaster = new THREE.Raycaster(origin, direction, 0, range);
    const allTargets = [...targets, ...this.colliders.map(c => c.mesh)];
    const intersects = raycaster.intersectObjects(allTargets, true);

    if (intersects.length > 0) {
      return {
        hit: intersects[0],
        point: intersects[0].point,
        normal: intersects[0].face ? intersects[0].face.normal : new THREE.Vector3(0, 1, 0),
        distance: intersects[0].distance
      };
    }
    return null;
  }

  // Get all collider meshes (for raycasting)
  getColliderMeshes() {
    return this.colliders.map(c => c.mesh);
  }

  // Clear all colliders
  clear() {
    this.colliders = [];
    this.dynamicColliders = [];
  }
}
