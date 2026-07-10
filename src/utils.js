import * as THREE from 'three';

// Utility functions for the tactical FPS

// Geometry creation helpers
export function createBox(w, h, d, color, pos = { x: 0, y: 0, z: 0 }) {
  const geometry = new THREE.BoxGeometry(w, h, d);
  const material = new THREE.MeshStandardMaterial({ color });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(pos.x, pos.y, pos.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// Simple AABB collision detection
export function aabbCollision(pos1, size1, pos2, size2) {
  return (
    pos1.x - size1.x / 2 < pos2.x + size2.x / 2 &&
    pos1.x + size1.x / 2 > pos2.x - size2.x / 2 &&
    pos1.y - size1.y / 2 < pos2.y + size2.y / 2 &&
    pos1.y + size1.y / 2 > pos2.y - size2.y / 2 &&
    pos1.z - size1.z / 2 < pos2.z + size2.z / 2 &&
    pos1.z + size1.z / 2 > pos2.z - size2.z / 2
  );
}

// Line of sight check with obstacle raycasting
export function hasLineOfSight(scene, start, end, obstacles = []) {
  const dir = new THREE.Vector3().copy(end).sub(start);
  const dist = dir.length();
  dir.normalize();

  const raycaster = new THREE.Raycaster(start, dir, 0, dist);
  const intersects = raycaster.intersectObjects(obstacles, true);

  return intersects.length === 0;
}

// Smooth lerp
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Clamp value
export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// Random range
export function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

// Random integer
export function randomInt(min, max) {
  return Math.floor(randomRange(min, max + 1));
}

// Convert degrees to radians
export function degToRad(deg) {
  return deg * (Math.PI / 180);
}

// Get direction from angles
export function anglesToDirection(yaw, pitch) {
  const dir = new THREE.Vector3();
  dir.x = -Math.sin(yaw) * Math.cos(pitch);
  dir.y = -Math.sin(pitch);
  dir.z = -Math.cos(yaw) * Math.cos(pitch);
  return dir.normalize();
}

// Check if a point is inside an AABB
export function pointInAABB(point, boxPos, boxSize) {
  const half = boxSize.clone().multiplyScalar(0.5);
  return (
    point.x >= boxPos.x - half.x && point.x <= boxPos.x + half.x &&
    point.y >= boxPos.y - half.y && point.y <= boxPos.y + half.y &&
    point.z >= boxPos.z - half.z && point.z <= boxPos.z + half.z
  );
}

// Closest point on AABB to point
export function closestPointOnAABB(point, boxPos, boxSize) {
  const half = boxSize.clone().multiplyScalar(0.5);
  const min = new THREE.Vector3().copy(boxPos).sub(half);
  const max = new THREE.Vector3().copy(boxPos).add(half);
  return new THREE.Vector3(
    Math.max(min.x, Math.min(point.x, max.x)),
    Math.max(min.y, Math.min(point.y, max.y)),
    Math.max(min.z, Math.min(point.z, max.z))
  );
}

// Check if mobile device
export function isMobileDevice() {
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);
}
