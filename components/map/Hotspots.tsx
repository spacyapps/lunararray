"use client";

// Clickable station hotspots on the moon map. Unlit accent-colored markers:
// surface ring + core dot + a short pin with a diamond tip, gently pulsing.

import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useCursor } from "@react-three/drei";
import * as THREE from "three";
import { STATIONS, Station, latLonToVec3, mapLatLon } from "@/lib/stations";
import { MOON_RADIUS } from "./Moon";

function Hotspot({
  station,
  index,
  onHover,
  onSelect,
}: {
  station: Station;
  index: number;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const pulse = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  const { position, quaternion } = useMemo(() => {
    const { lat, lon } = mapLatLon(station);
    const pos = new THREE.Vector3(...latLonToVec3(lat, lon, MOON_RADIUS * 1.006));
    const normal = pos.clone().normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      normal,
    );
    return { position: pos, quaternion: q };
  }, [station]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const target = hovered ? 1.5 : 1;
    if (group.current) {
      const s = THREE.MathUtils.lerp(group.current.scale.x, target, 0.12);
      group.current.scale.setScalar(s);
    }
    if (pulse.current) {
      const p = (t * 0.6 + index * 0.13) % 1;
      pulse.current.scale.setScalar(1 + p * 1.6);
      (pulse.current.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - p);
    }
  });

  const color = station.accent;
  const isHub = station.angle === null;
  const base = isHub ? 0.085 : 0.06;

  return (
    <group
      ref={group}
      position={position}
      quaternion={quaternion}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        onHover(station.id);
      }}
      onPointerOut={() => {
        setHovered(false);
        onHover(null);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(station.id);
      }}
    >
      {/* invisible fat hit area */}
      <mesh visible={false}>
        <sphereGeometry args={[base * 2.6, 12, 12]} />
      </mesh>
      {/* surface ring */}
      <mesh>
        <ringGeometry args={[base * 0.82, base, 40]} />
        <meshBasicMaterial color={color} transparent opacity={hovered ? 1 : 0.85} side={THREE.DoubleSide} />
      </mesh>
      {/* expanding pulse ring */}
      <mesh ref={pulse}>
        <ringGeometry args={[base * 0.95, base * 1.05, 40]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* core dot */}
      <mesh position={[0, 0, 0.004]}>
        <circleGeometry args={[base * 0.3, 20]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* pin + diamond tip */}
      <mesh position={[0, 0, base * 1.1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.0035, 0.0035, base * 2.2, 6]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} />
      </mesh>
      <mesh position={[0, 0, base * 2.4]} rotation={[Math.PI / 2, 0, 0]}>
        <octahedronGeometry args={[base * 0.32]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

export default function Hotspots({
  onHover,
  onSelect,
}: {
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <group>
      {STATIONS.map((s, i) => (
        <Hotspot key={s.id} station={s} index={i} onHover={onHover} onSelect={onSelect} />
      ))}
    </group>
  );
}
