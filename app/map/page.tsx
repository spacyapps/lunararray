// LunarArray — 3D network map
// Server Component shell; the WebGL canvas is client-only (MapRoot).

import type { Metadata } from "next";
import MapRoot from "@/components/map/MapRoot";

export const metadata: Metadata = {
  title: "LunarArray — Network Map",
  description:
    "Interactive 3D map of the LunarArray station network — nine nodes on the lunar near side.",
};

export default function MapPage() {
  return <MapRoot />;
}
