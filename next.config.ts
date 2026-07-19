import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Godot 4 Web (WASM threads) needs COOP/COEP for SharedArrayBuffer.
  async headers() {
    return [
      {
        source: "/godot/:path*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
};

export default nextConfig;
