// Great-circle arcs as 3D point lists, for octogram lines on the moon.

import * as THREE from "three";
import { latLonToVec3 } from "@/lib/stations";

export function arcPoints(
  latA: number,
  lonA: number,
  latB: number,
  lonB: number,
  r: number,
  n = 32,
): THREE.Vector3[] {
  const a = new THREE.Vector3(...latLonToVec3(latA, lonA, 1));
  const b = new THREE.Vector3(...latLonToVec3(latB, lonB, 1));
  const omega = Math.acos(THREE.MathUtils.clamp(a.dot(b), -1, 1));
  const pts: THREE.Vector3[] = [];
  if (omega < 1e-6) return [a.multiplyScalar(r)];
  const so = Math.sin(omega);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const s1 = Math.sin((1 - t) * omega) / so;
    const s2 = Math.sin(t * omega) / so;
    pts.push(
      new THREE.Vector3(
        s1 * a.x + s2 * b.x,
        s1 * a.y + s2 * b.y,
        s1 * a.z + s2 * b.z,
      ).multiplyScalar(r),
    );
  }
  return pts;
}

/** Small circle of angular radius `deg` around a lat/lon center. */
export function ringPoints(
  centerLat: number,
  centerLon: number,
  deg: number,
  r: number,
  n = 96,
): THREE.Vector3[] {
  const center = new THREE.Vector3(...latLonToVec3(centerLat, centerLon, 1));
  // any vector orthogonal to center
  const ref = Math.abs(center.y) < 0.99 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const u = new THREE.Vector3().crossVectors(ref, center).normalize();
  const v = new THREE.Vector3().crossVectors(center, u).normalize();
  const d = (deg * Math.PI) / 180;
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    pts.push(
      center
        .clone()
        .multiplyScalar(Math.cos(d))
        .addScaledVector(u, Math.sin(d) * Math.cos(t))
        .addScaledVector(v, Math.sin(d) * Math.sin(t))
        .multiplyScalar(r),
    );
  }
  return pts;
}
