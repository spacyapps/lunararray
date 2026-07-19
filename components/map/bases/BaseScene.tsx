"use client";

// Dispatches a station id to its detailed local scene. When the view is
// "interior", enterable stations swap to their residential bay instead of
// the exterior (exterior unmount avoids double light/cost while inside).

import { Station } from "@/lib/stations";
import BaseEnvironment from "./BaseEnvironment";
import LA00 from "./LA00";
import LA01 from "./LA01";
import LA02 from "./LA02";
import LA03 from "./LA03";
import LA04 from "./LA04";
import LA05 from "./LA05";
import LA06 from "./LA06";
import LA07 from "./LA07";
import LA08 from "./LA08";
import ResidentialInterior from "./interiors/ResidentialInterior";
import BaseLighting, { RendererQuality } from "./BaseLighting";
import { canEnter } from "../view";

function PlaceholderBase({ station }: { station: Station }) {
  return (
    <group>
      <RendererQuality shadows />
      <BaseLighting keyIntensity={2.8} />
      <BaseEnvironment seed={station.angle ?? 9} />
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

export default function BaseScene({
  station,
  interior = false,
}: {
  station: Station;
  /** Mount residential interior instead of exterior (enterable stations only). */
  interior?: boolean;
}) {
  if (interior && canEnter(station.id)) {
    if (station.id === "LA-08") return <ResidentialInterior />;
  }

  // LA-08 owns its full lighting kit; others get shared PBR key + soft shadows
  // layered under their scene-specific practicals.
  const body = (() => {
    switch (station.id) {
      case "LA-00":
        return <LA00 />;
      case "LA-01":
        return <LA01 />;
      case "LA-02":
        return <LA02 />;
      case "LA-03":
        return <LA03 />;
      case "LA-04":
        return <LA04 />;
      case "LA-05":
        return <LA05 />;
      case "LA-06":
        return <LA06 />;
      case "LA-07":
        return <LA07 />;
      case "LA-08":
        return <LA08 />;
      default:
        return <PlaceholderBase station={station} />;
    }
  })();

  if (station.id === "LA-08") return body;

  return (
    <group>
      <RendererQuality shadows />
      <BaseLighting
        keyIntensity={station.tone === "military" ? 3.6 : 3.1}
        keyColor={station.tone === "military" ? "#e8f0ff" : "#fff1dc"}
        fillIntensity={station.tone === "military" ? 0.55 : 1.1}
        godRays={station.tone !== "military"}
      />
      {body}
    </group>
  );
}
