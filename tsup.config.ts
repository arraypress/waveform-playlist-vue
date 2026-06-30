/**
 * tsup.config.ts
 * --------------
 *
 * Build configuration for `@arraypress/waveform-playlist-vue`.
 *
 * Outputs:
 *   - dist/index.js   (ESM)   — for modern bundlers and Node `import`
 *   - dist/index.cjs  (CJS)   — for older toolchains and Node `require`
 *   - dist/index.d.ts         — TypeScript declarations
 *
 * Externalises `vue` and both `@arraypress/waveform-*` cores so they
 * resolve to the consumer's installed copies, never bundled in.
 */
import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['esm', 'cjs'],
	dts: true,
	sourcemap: true,
	clean: true,
	treeshake: true,
	external: ['vue', '@arraypress/waveform-playlist', '@arraypress/waveform-player'],
});
