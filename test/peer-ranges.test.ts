/**
 * test/peer-ranges.test.ts
 * ------------------------
 *
 * The peer floors are load-bearing, not cosmetic. Below
 * `@arraypress/waveform-playlist@1.8.0` the playlist ignored the
 * constructor options this wrapper passes (`showDuration`, `expandChapters`,
 * …), overwrote the forwarded player callbacks, never read `data-waveform`,
 * and wiped the rendered tracks in `destroy()` — so every prop change
 * re-mounted an empty playlist. 1.8.0 in turn needs
 * `@arraypress/waveform-player@1.24.5`.
 */
import { describe, it, expect } from 'vitest';
import pkg from '../package.json';

/** The lowest version a `^x.y.z` range admits, as comparable numbers. */
const floor = (range: string): number[] => {
	const m = /^\^(\d+)\.(\d+)\.(\d+)$/.exec(range);
	if (!m) throw new Error(`expected a ^x.y.z range, got ${range}`);
	return m.slice(1).map(Number);
};
const atLeast = (range: string, min: string): boolean => {
	const [a, b] = [floor(range), floor(`^${min}`)];
	for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
	return true;
};

describe('peer dependency floors', () => {
	it('requires waveform-playlist >= 1.8.0 (the release that makes these props work)', () => {
		expect(atLeast(pkg.peerDependencies['@arraypress/waveform-playlist'], '1.8.0')).toBe(true);
	});

	it('requires waveform-player >= 1.24.5 (the playlist core\'s own floor)', () => {
		expect(atLeast(pkg.peerDependencies['@arraypress/waveform-player'], '1.24.5')).toBe(true);
	});
});
