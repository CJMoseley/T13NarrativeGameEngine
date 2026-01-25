---
description: Troubleshooting Vite import errors for files in /public
---

# Vite Public Import Gotcha

## Issue
When using Vite, attempting to dynamically import a JavaScript or MJS file located in the `/public` directory using `import('/public/file.mjs')` will fail with an error:
`[plugin:vite:import-analysis] Cannot import non-asset file /public/file.mjs which is inside /public.`

## Explanation
Vite treats files in the `/public` directory as static assets. They are served as-is and are not processed by Vite's module transformation system. Because of this, they cannot be part of the module graph via standard `import` statements or dynamic `import()` calls.

## Solution
1. **Use Package Imports**: If the file belongs to an NPM package (like `physx-js-webidl`), import it by its package name:
   ```javascript
   const module = await import('package-name');
   ```
   Vite will correctly resolve this from `node_modules`.

2. **Move to Source**: If it's a local file, move it from `/public` to a directory under your source root (e.g., `/js/lib`) and import it relatively:
   ```javascript
   const module = await import('./lib/file.mjs');
   ```

3. **URL Reference (Non-Module)**: If you only need the URL to pass to another loader (like a Web Worker or a specialized WASM loader), use the `?url` suffix:
   ```javascript
   const fileUrl = import.meta.env.BASE_URL + 'physx/physx-js-webidl.mjs?url';
   ```

## Application to PhysX 5 WASM
For `physx-js-webidl`, the correct approach is:
- Import the loader from the package: `import('physx-js-webidl')`.
- Use `locateFile` to point to the WASM binary which *should* be in `/public/physx/` as a static asset.
