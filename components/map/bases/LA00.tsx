"use client";

// LA-00 Sinus Medii — Primary spaceport & deep-space communications relay.
// The flagship beauty shot: a leaning teardrop control spire rising out of a
// warm glass terminal lens, a heavy deep-space dish standing apart, and an
// asymmetric arc of landing pads fed by swept boarding tubes. One shuttle
// parked, one pad live.

import BaseEnvironment from "./BaseEnvironment";
import { Beacon, Dish, LensDome, Pad, SweepTube, Teardrop, WindowBand, teardropRadiusAt } from "./parts";

const ACCENT = "#5cd6ff";
const HULL = "#eef2f7";
const WARM = "#ffd9a0";

function Shuttle(props: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group {...props}>
      {/* lying teardrop fuselage */}
      <group rotation={[0, 0, -Math.PI / 2]} position={[-2.6, 0.9, 0]}>
        <Teardrop height={5.2} radius={0.9} color={HULL} />
      </group>
      {/* canted tail fins */}
      <mesh position={[-2.2, 1.4, 0.5]} rotation={[0.5, 0, -0.4]} scale={[0.1, 1.4, 0.5]}>
        <boxGeometry />
        <meshToonMaterial color={ACCENT} />
      </mesh>
      <mesh position={[-2.2, 1.4, -0.5]} rotation={[-0.5, 0, -0.4]} scale={[0.1, 1.4, 0.5]}>
        <boxGeometry />
        <meshToonMaterial color={ACCENT} />
      </mesh>
      <Beacon color={ACCENT} size={0.12} speed={3} position={[2.4, 0.95, 0]} />
    </group>
  );
}

export default function LA00() {
  return (
    <group>
      {/* dramatic key low from the west, cyan rim from behind */}
      <directionalLight position={[-40, 14, 22]} intensity={2.6} color="#ffe6c4" />
      <directionalLight position={[30, 10, -38]} intensity={1.6} color={ACCENT} />
      <pointLight position={[0, 6, 0]} intensity={60} color={WARM} distance={30} />

      <BaseEnvironment groundColor="#82869a" rockTint="#6e7284" seed={0} />

      {/* terminal lens — warm lit glass heart of the port */}
      <LensDome r={9} squash={0.38} color="#cfeaff" opacity={0.5} emissive={WARM} />
      <WindowBand radius={8.2} position={[0, 1.6, 0]} color={WARM} thickness={0.1} />

      {/* control spire — tall teardrop, leaning just off vertical */}
      <group rotation={[0, 0, -0.07]}>
        <Teardrop height={19} radius={3.4} color={HULL} imageMap="/textures/la00-spire-hull.jpg" />
        <WindowBand radius={teardropRadiusAt(19, 3.4, 6.2)} position={[0, 6.2, 0]} color={WARM} />
        <WindowBand radius={teardropRadiusAt(19, 3.4, 9.4)} position={[0, 9.4, 0]} color={WARM} />
        <WindowBand radius={teardropRadiusAt(19, 3.4, 12.4)} position={[0, 12.4, 0]} color={ACCENT} thickness={0.06} />
        <Beacon color={ACCENT} size={0.3} position={[-1.35, 19.2, 0]} />
      </group>

      {/* deep-space dish — stands apart, aimed at the stars */}
      <Dish r={5.2} mast={5} tilt={-0.7} accent={ACCENT} position={[-19, 0, -8]} rotation={[0, 0.9, 0]} />
      <Dish r={2.2} mast={2.6} tilt={-1} accent={ACCENT} position={[-13, 0, -15]} rotation={[0, 0.4, 0]} />

      {/* landing pads — asymmetric arc east of the terminal */}
      <Pad r={4.5} accent={ACCENT} position={[16, 0, 4]} />
      <Pad r={3.4} accent={ACCENT} position={[13, 0, 15]} />
      <Pad r={3.4} accent={ACCENT} position={[20, 0, -7]} />
      <Shuttle position={[16, 0.3, 4]} rotation={[0, 0.5, 0]} />

      {/* swept boarding tubes from the lens out to each pad */}
      <SweepTube pts={[[6, 1.5, 2], [11, 2.6, 3], [16, 1.2, 4]]} r={0.55} color={HULL} />
      <SweepTube pts={[[5, 1.5, 6], [9, 2.8, 11], [13, 1.2, 15]]} r={0.55} color={HULL} />
      <SweepTube pts={[[7, 1.5, -3], [14, 3, -5.5], [20, 1.2, -7]]} r={0.55} color={HULL} />
      {/* service line to the dish farm */}
      <SweepTube pts={[[-8, 1.2, -2], [-14, 2, -5], [-19, 0.8, -8]]} r={0.4} color={HULL} emissive={ACCENT} />

      {/* relay pylon trio — the "array" identity, echoing the map hotspots */}
      {([[-6, 14], [-2, 17], [3, 15.5]] as const).map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 2.6, 0]}>
            <cylinderGeometry args={[0.1, 0.22, 5.2, 8]} />
            <meshToonMaterial color={HULL} />
          </mesh>
          <Beacon color={ACCENT} size={0.18} speed={2 + i * 0.7} position={[0, 5.5, 0]} />
        </group>
      ))}
    </group>
  );
}
