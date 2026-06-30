/**
 * vitest.config.ts
 * ----------------
 *
 * Vitest configuration for the Vue wrapper. Uses `jsdom` so we get a
 * fake DOM to mount components into; the actual
 * `@arraypress/waveform-playlist` library is mocked at the module
 * boundary (it constructs a `WaveformPlayer` that relies on Web Audio +
 * Canvas + Fetch which jsdom does not implement). Tests therefore
 * verify the wrapper's responsibilities — track-markup rendering,
 * option pass-through, mount lifecycle, and the exposed imperative
 * navigation API — without needing a real audio runtime.
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['test/**/*.test.ts'],
		environment: 'jsdom',
		globals: false,
	},
});
