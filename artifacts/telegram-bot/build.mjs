import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { rm, mkdir } from "node:fs/promises";

const dir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(dir, "dist");

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

await build({
  entryPoints: [path.join(dir, "src/index.ts")],
  platform: "node",
  bundle: true,
  format: "esm",
  outfile: path.join(distDir, "index.mjs"),
  logLevel: "info",
  external: ["*.node", "pg-native"],
  sourcemap: "linked",
  banner: {
    js: `
import { createRequire as __cr } from 'node:module';
import __path from 'node:path';
import __url from 'node:url';
globalThis.require = __cr(import.meta.url);
globalThis.__filename = __url.fileURLToPath(import.meta.url);
globalThis.__dirname = __path.dirname(globalThis.__filename);
`.trim(),
  },
});
