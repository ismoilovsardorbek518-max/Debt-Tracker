---
name: esbuild + fontkit/pdfkit bundling
description: Why @swc/* must not be externalized in an api-server esbuild config that bundles pdfkit
---

`pdfkit` transitively depends on `fontkit`, which directly `require()`s `@swc/helpers/cjs/*.cjs` helper files (from its own compiled dist). If the esbuild config for the api-server externalizes `@swc/*` (a common defensive default in generated `build.mjs` templates), those `require()` calls survive into the bundled output unresolved. At runtime, Node's `createRequire` resolves them relative to the bundled file's location, but pnpm's strict per-package `node_modules` linking means `@swc/helpers` isn't reachable from there even though it exists elsewhere in the store — this throws `MODULE_NOT_FOUND` at server startup.

**Why:** `@swc/helpers` is pure JS with no native bindings, so bundling it is always safe. It only needs to stay external for packages that dynamically resolve their own sibling files by path (unrelated concern) — that's not the case here.

**How to apply:** If an api-server's `build.mjs` has `"@swc/*"` in its esbuild `external` array and the app uses `pdfkit` (or anything else pulling in `fontkit`), remove that entry so `@swc/helpers` gets bundled normally.
