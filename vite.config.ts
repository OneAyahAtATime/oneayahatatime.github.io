import { createHash } from "node:crypto";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

/**
 * The built files keep stable names (assets/app.js, assets/app.css) so that each
 * rebuild overwrites the previous one instead of leaving orphaned hashed files
 * behind in the committed output folder.
 *
 * Stable names alone would let a browser serve a stale cached copy, so this
 * plugin stamps a short content fingerprint onto the references inside
 * index.html. Same content, same stamp; changed content, new stamp and an
 * immediate refetch.
 */
function stampAssetVersions(): Plugin {
  return {
    name: "stamp-asset-versions",
    enforce: "post",
    generateBundle(_options, bundle) {
      const fingerprints = new Map<string, string>();
      for (const [fileName, output] of Object.entries(bundle)) {
        const source =
          output.type === "chunk" ? output.code : (output.source as string | Uint8Array);
        const bytes = typeof source === "string" ? Buffer.from(source) : Buffer.from(source);
        fingerprints.set(fileName, createHash("sha256").update(bytes).digest("hex").slice(0, 8));
      }

      for (const output of Object.values(bundle)) {
        if (output.type !== "asset" || !output.fileName.endsWith(".html")) continue;
        let html = String(output.source);
        for (const [fileName, fingerprint] of fingerprints) {
          if (fileName.endsWith(".html")) continue;
          html = html.replaceAll(`./${fileName}"`, `./${fileName}?v=${fingerprint}"`);
        }
        output.source = html;
      }
    },
  };
}

export default defineConfig({
  // Relative base: the built site works whether it is served from the root of a
  // domain or from a subfolder such as /One-Ayah-at-a-Time/. Keeping this
  // relative means the hosting address can change without a rebuild.
  base: "./",
  plugins: [react(), stampAssetVersions()],
  build: {
    // GitHub Pages can serve straight from a /docs folder on the main branch,
    // so the built site is committed alongside the source.
    outDir: "docs",
    emptyOutDir: true,
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        entryFileNames: "assets/app.js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/app[extname]",
      },
    },
  },
});
