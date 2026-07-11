"use client";

// Dispatches a station id to its detailed local scene. Scenes land here one
// by one (build steps 4–12); anything unbuilt gets the survey-marker
// placeholder so the fly-to loop works end to end.

import { Station } from "@/lib/stations";
import BaseEnvironment from "./BaseEnvironment";
import LA00 from "./LA00";
import LA01 from "./LA01";
import LA02 from "./LA02";
import LA03 from "./LA03";

function PlaceholderBase({ station }: { station: Station }) {
  return (
    <group>
      <directionalLight position={[-30, 24, 18]} intensity={2} color="#fff4e0" />
      <directionalLight position={[40, 8, -30]} intensity={0.8} color="#5cd6ff" />
      <BaseEnvironment seed={station.angle ?? 9} />
      {/* survey marker — a simple beacon where the base will stand */}
      <mesh position={[0, 2.2, 0]}>
        <cylinderGeometry args={[0.12, 0.3, 4.4, 8]} />
        <meshStandardMaterial color="#3a3e4a" roughness={0.8} />
      </mesh>
      <mesh position={[0, 4.8, 0]}>
        <octahedronGeometry args={[0.7]} />
        <meshStandardMaterial
          color={station.accent}
          emissive={station.accent}
          emissiveIntensity={1.6}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <ringGeometry args={[3.4, 3.7, 48]} />
        <meshBasicMaterial color={station.accent} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

export default function BaseScene({ station }: { station: Station }) {
  switch (station.id) {
    case "LA-00":
      return <LA00 />;
    case "LA-01":
      return <LA01 />;
    case "LA-02":
      return <LA02 />;
    case "LA-03":
      return <LA03 />;
    default:
      return <PlaceholderBase station={station} />;
  }
}
