/**
 * test/forwarding-drift.test.ts
 * -----------------------------
 *
 * Forwarding-drift guard. The props type inherits every option from the
 * two cores, but Vue registers props at runtime, and the runtime `props`
 * declarations, the options builder and the remount watcher are all
 * hand-written — so an option a core adds typechecks here and is silently
 * dropped (as a fallthrough attribute) unless someone wires it. That is
 * exactly how `crossOrigin`, `waveformGradient`, `seekHandle`,
 * `buttonSize`, `buttonRadius` and `artworkPosition` went missing.
 *
 * Every key of `WaveformPlaylistOptions` and `WaveformPlayerOptions` (read
 * from the installed cores' `index.d.ts`, see `option-surface.ts`) must
 * either be forwarded — and re-mount the playlist when it changes;
 * callbacks must surface as emits — or be listed in `NOT_FORWARDED` with
 * the reason. Adding an option to a core without deciding which fails
 * this file.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { ALL_OPTIONS, PLAYER_OPTIONS, PLAYLIST_OPTIONS, isCallback } from './option-surface';

/**
 * Options deliberately NOT forwarded to the playlist constructor.
 * `layout` is absent on purpose: it exists on both surfaces, and the
 * wrapper forwards the playlist's (which the playlist keeps from its
 * embedded player).
 */
const NOT_FORWARDED: Record<string, string> = {
	// Per-track content — rendered on each [data-track] from `tracks`.
	url: "per-track: the track element's data-url",
	src: 'alias of url; per-track',
	title: 'per-track: data-title',
	artist: 'per-track: data-artist',
	artwork: 'per-track: data-artwork',
	album: 'per-track: data-album',
	markers: 'per-track: data-markers',
	waveform: 'per-track: data-waveform',
	// Aliases / collisions.
	style: "alias of waveformStyle; `style` falls through to the host div's inline CSS here",
	// Owned by the playlist.
	audioMode: 'the playlist always owns its audio (1.8.0 ignores the option)',
};

const FORWARDED = ALL_OPTIONS.filter((key) => !(key in NOT_FORWARDED));
const VALUES = FORWARDED.filter((key) => !isCallback(key));
const CALLBACKS = FORWARDED.filter(isCallback);

const ctorCalls: Array<Record<string, unknown>> = [];

vi.mock('@arraypress/waveform-playlist', () => {
	class Ctor {
		destroy = () => {};
		constructor(_el: HTMLElement, opts: Record<string, unknown>) {
			ctorCalls.push(opts);
		}
	}
	return { default: Ctor, WaveformPlaylist: Ctor };
});

import { WaveformPlaylist } from '../src';

beforeEach(() => {
	ctorCalls.length = 0;
});

const TRACKS = [{ url: '/a.mp3' }];

/** Mount with arbitrary (untyped) option props; sentinel values trip Vue's
 *  prop-type validation, so its warnings are silenced. */
const mountWith = (props: Record<string, unknown>) =>
	mount(WaveformPlaylist, {
		props: { tracks: TRACKS, ...props } as never,
		global: { config: { warnHandler: () => {} } },
	});

describe('forwarding drift', () => {
	it('reads a plausible option surface from both cores', () => {
		expect(PLAYER_OPTIONS.length).toBeGreaterThan(40);
		expect(PLAYER_OPTIONS).toContain('crossOrigin');
		expect(PLAYER_OPTIONS).toContain('onTimeUpdate');
		expect(PLAYLIST_OPTIONS).toContain('continuous');
		expect(PLAYLIST_OPTIONS).toContain('barPosition');
	});

	it('NOT_FORWARDED lists only real options (no stale entries)', () => {
		expect(Object.keys(NOT_FORWARDED).filter((key) => !ALL_OPTIONS.includes(key))).toEqual([]);
	});

	it('forwards every other option into the constructor options', async () => {
		mountWith(Object.fromEntries(VALUES.map((key) => [key, `__${key}__`])));
		await flushPromises();
		expect(ctorCalls).toHaveLength(1);

		const dropped = VALUES.filter((key) => ctorCalls[0][key] !== `__${key}__`);
		expect(dropped, 'options neither forwarded nor in NOT_FORWARDED').toEqual([]);
	});

	it('re-mounts when any forwarded option changes', async () => {
		const props: Record<string, unknown> = Object.fromEntries(
			VALUES.map((key) => [key, `__${key}__`])
		);
		const wrapper = mountWith(props);
		await flushPromises();
		expect(ctorCalls).toHaveLength(1);

		const stale: string[] = [];
		for (const key of VALUES) {
			const before = ctorCalls.length;
			await wrapper.setProps({ [key]: `__${key}__changed` } as never);
			await flushPromises();
			if (ctorCalls.length === before) stale.push(key);
		}
		expect(stale, 'forwarded options missing from the remount watcher').toEqual([]);
	});

	it('surfaces every callback option as an emit', async () => {
		const wrapper = mountWith({});
		await flushPromises();

		const dropped = CALLBACKS.filter((key) => {
			const fn = ctorCalls[0][key];
			if (typeof fn !== 'function') return true;
			fn('x');
			return !wrapper.emitted(key.slice(2).toLowerCase())?.length;
		});
		expect(dropped, 'callbacks neither emitted nor in NOT_FORWARDED').toEqual([]);
	});
});
