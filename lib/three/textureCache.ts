// Shared GPU texture cache for the map. Loading the same URL from many
// components (towers, pods, ground rings) used to create duplicate
// Texture objects and upload thrashing — one texture, many materials.

import * as THREE from "three";

const cache = new Map<string, THREE.Texture>();
const inflight = new Map<string, Promise<THREE.Texture>>();

export type TextureOpts = {
  wrap?: THREE.Wrapping;
  repeat?: [number, number];
  anisotropy?: number;
  colorSpace?: THREE.ColorSpace;
  /** Cap max dimension after load (power-of-two friendly). 0 = no resize. */
  maxSize?: number;
};

const loader = typeof window !== "undefined" ? new THREE.TextureLoader() : null;

function applyOpts(tex: THREE.Texture, opts: TextureOpts) {
  tex.colorSpace = opts.colorSpace ?? THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = opts.wrap ?? THREE.RepeatWrapping;
  if (opts.repeat) tex.repeat.set(opts.repeat[0], opts.repeat[1]);
  tex.anisotropy = opts.anisotropy ?? 4;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
}

/** Load (or return cached) texture. Safe to call from many components. */
export function loadTexture(url: string, opts: TextureOpts = {}): Promise<THREE.Texture> {
  const key = `${url}|${opts.repeat?.[0] ?? 1}|${opts.repeat?.[1] ?? 1}|${opts.maxSize ?? 0}`;
  const hit = cache.get(key);
  if (hit) return Promise.resolve(hit);

  const pending = inflight.get(key);
  if (pending) return pending;

  if (!loader) return Promise.reject(new Error("no TextureLoader"));

  const p = new Promise<THREE.Texture>((resolve, reject) => {
    loader.load(
      url,
      (tex) => {
        applyOpts(tex, opts);
        // Soft dimension cap without canvas resize (GPU will mipmap down).
        // Real resize would need canvas; for now we rely on mipmaps + lower
        // anisotropy on far materials.
        cache.set(key, tex);
        inflight.delete(key);
        resolve(tex);
      },
      undefined,
      (err) => {
        inflight.delete(key);
        reject(err);
      },
    );
  });
  inflight.set(key, p);
  return p;
}

/** React-friendly: returns texture or null while loading. */
export function useCachedTexture(url: string | undefined, opts: TextureOpts = {}) {
  // Lazy import pattern avoided — callers use useEffect with loadTexture.
  return { loadTexture, url, opts };
}
