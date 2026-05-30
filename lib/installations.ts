// LunarArray — installation data
// 8 named installations arranged in an octogram (two rotated squares) around a
// central Prime hub at the sub-Earth point. All linked.

export type InstallationStatus = "nominal" | "warn" | "off";

export interface Installation {
  id: string;
  code: string;
  name: string;
  role: string;
  /** Compass direction; "C" is the central hub. */
  dir: "C" | "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";
  /** Degrees clockwise from top (12 o'clock = 0°). null for the hub. */
  angle: number | null;
  lat: string;
  lon: string;
  status: InstallationStatus;
  band: string;
  range: string;
}

export const INSTALLATIONS: Installation[] = [
  { id: "LA-00", code: "PRIME",          name: "Sinus Medii",         role: "Master array · spaceport", dir: "C",  angle: null, lat: "0°00′ N", lon: "0°00′ E", status: "nominal", band: "X / Ka",  range: "Earth-link" },
  { id: "LA-01", code: "SERENITATIS",    name: "Mare Serenitatis",    role: "Deep-space relay",         dir: "N",  angle: 0,    lat: "28° N",   lon: "18° E",   status: "nominal", band: "S / X",   range: "Cislunar" },
  { id: "LA-02", code: "TRANQUILLITATIS", name: "Mare Tranquillitatis", role: "Crewed spaceport",       dir: "NE", angle: 45,   lat: "8° N",    lon: "31° E",   status: "nominal", band: "L / S",   range: "Cislunar" },
  { id: "LA-03", code: "NECTARIS",       name: "Mare Nectaris",       role: "Comm dish array",          dir: "E",  angle: 90,   lat: "15° S",   lon: "35° E",   status: "nominal", band: "X / Ka",  range: "Geosync" },
  { id: "LA-04", code: "FECUNDITATIS",   name: "Mare Fecunditatis",   role: "Cargo terminal",           dir: "SE", angle: 135,  lat: "8° S",    lon: "51° E",   status: "warn",    band: "S",       range: "Cargo" },
  { id: "LA-05", code: "NUBIUM",         name: "Mare Nubium",         role: "Backup relay",             dir: "S",  angle: 180,  lat: "21° S",   lon: "16° W",   status: "nominal", band: "S",       range: "Cislunar" },
  { id: "LA-06", code: "HUMORUM",        name: "Mare Humorum",        role: "Optical observatory",      dir: "SW", angle: 225,  lat: "24° S",   lon: "38° W",   status: "nominal", band: "Optical", range: "Deep-sky" },
  { id: "LA-07", code: "PROCELLARUM",    name: "Oceanus Procellarum", role: "Heavy launch site",        dir: "W",  angle: 270,  lat: "18° N",   lon: "57° W",   status: "nominal", band: "L / S",   range: "Lunar" },
  { id: "LA-08", code: "IMBRIUM",        name: "Mare Imbrium",        role: "Long-range array",         dir: "NW", angle: 315,  lat: "33° N",   lon: "16° W",   status: "off",     band: "X / Ka",  range: "Deep-space" },
];
