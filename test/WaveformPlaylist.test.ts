/**
 * WaveformPlaylist.test.ts
 * ------------------------
 *
 * The core `@arraypress/waveform-playlist` library is mocked at the
 * module boundary (jsdom has no Web Audio / Canvas). These tests cover
 * the wrapper's own responsibilities: rendering the host element + the
 * `[data-track]` / `[data-chapter]` markup, constructing the instance
 * with mapped options (tracks come from markup, NOT options),
 * boolean-prop omission, destroy-on-unmount, identity-prop re-mount,
 * and the exposed imperative navigation API.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';

/** Captures every constructed instance so assertions can inspect them. */
const instances: MockPlaylist[] = [];

class MockPlaylist {
	el: HTMLElement;
	opts: Record<string, unknown>;
	selectTrack = vi.fn();
	seekToChapter = vi.fn();
	nextTrack = vi.fn();
	previousTrack = vi.fn();
	getPlayer = vi.fn(() => null);
	getCurrentTrackIndex = vi.fn(() => 0);
	getTracks = vi.fn(() => []);
	destroy = vi.fn();
	constructor(el: HTMLElement, opts: Record<string, unknown>) {
		this.el = el;
		this.opts = opts;
		instances.push(this);
	}
}

vi.mock('@arraypress/waveform-playlist', () => ({
	default: MockPlaylist,
	WaveformPlaylist: MockPlaylist,
}));

import { WaveformPlaylist } from '../src';

const tracksA = [
	{ url: '/a.mp3', title: 'Track A' },
	{ url: '/b.mp3', title: 'Track B', chapters: [{ time: 30, label: 'Verse', color: '#fff' }] },
];

beforeEach(() => {
	instances.length = 0;
});

describe('WaveformPlaylist (Vue)', () => {
	it('renders a div.wfp-host with [data-track] children', () => {
		const wrapper = mount(WaveformPlaylist, { props: { tracks: tracksA } });
		const host = wrapper.find('div.wfp-host');
		expect(host.exists()).toBe(true);
		const trackEls = host.element.querySelectorAll('[data-track]');
		expect(trackEls).toHaveLength(2);
		expect(trackEls[0].getAttribute('data-url')).toBe('/a.mp3');
		expect(trackEls[0].getAttribute('data-title')).toBe('Track A');
	});

	it('renders [data-chapter] markup for a track with chapters', () => {
		const wrapper = mount(WaveformPlaylist, { props: { tracks: tracksA } });
		const chapter = wrapper.find('[data-track]:nth-child(2) [data-chapter]');
		expect(chapter.exists()).toBe(true);
		expect(chapter.attributes('data-time')).toBe('30');
		expect(chapter.text()).toBe('Verse');
	});

	it('renders per-track waveform peaks as data-waveform (JSON array, or a URL verbatim)', () => {
		const peaks = [0.1, 0.5, 0.9];
		const wrapper = mount(WaveformPlaylist, {
			props: {
				tracks: [
					{ url: '/a.mp3', waveform: peaks },
					{ url: '/b.mp3', waveform: '/peaks/b.json' },
					{ url: '/c.mp3' },
				],
			},
		});
		const [a, b, c] = Array.from(
			(wrapper.element as HTMLElement).querySelectorAll('[data-track]')
		);
		expect(a.getAttribute('data-waveform')).toBe(JSON.stringify(peaks));
		expect(b.getAttribute('data-waveform')).toBe('/peaks/b.json');
		expect(c.hasAttribute('data-waveform')).toBe(false);
	});

	it('constructs the core instance over the host', async () => {
		const wrapper = mount(WaveformPlaylist, { props: { tracks: tracksA } });
		await flushPromises();
		expect(instances).toHaveLength(1);
		expect(instances[0].el).toBe(wrapper.find('div.wfp-host').element);
	});

	it('maps playlist + player options (but NOT tracks) into the constructor', async () => {
		mount(WaveformPlaylist, {
			props: { tracks: tracksA, layout: 'minimal', continuous: true, waveformStyle: 'bars', height: 64 },
		});
		await flushPromises();
		expect(instances[0].opts).toMatchObject({
			layout: 'minimal',
			continuous: true,
			waveformStyle: 'bars',
			height: 64,
		});
		expect('tracks' in instances[0].opts).toBe(false);
	});

	it('forwards the audio-loading options (preload, crossOrigin)', async () => {
		// crossOrigin needs a runtime `props` declaration, not just a TS type —
		// without one Vue treats it as a fallthrough attr and it never lands here.
		mount(WaveformPlaylist, {
			props: { tracks: tracksA, preload: 'metadata', crossOrigin: 'anonymous' },
		});
		await flushPromises();
		expect(instances[0].opts).toMatchObject({
			preload: 'metadata',
			crossOrigin: 'anonymous',
		});
	});

	it('forwards the hero / grid layouts and their options', async () => {
		mount(WaveformPlaylist, {
			props: {
				tracks: tracksA,
				layout: 'grid',
				showArtist: false,
				coverSize: 120,
				thumbnailSize: 64,
				density: 'compact',
				coverPosition: 'top',
				barPosition: 'top',
			},
		});
		await flushPromises();
		expect(instances[0].opts).toMatchObject({
			layout: 'grid',
			showArtist: false,
			coverSize: 120,
			thumbnailSize: 64,
			density: 'compact',
			coverPosition: 'top',
			barPosition: 'top',
		});
	});

	it('forwards waveformGradient, seekHandle, buttonSize, buttonRadius, artworkPosition', async () => {
		// Each needs a runtime `props` declaration — without one Vue treats it
		// as a fallthrough attr and it never reaches the options builder.
		mount(WaveformPlaylist, {
			props: {
				tracks: tracksA,
				waveformGradient: 'diagonal',
				seekHandle: true,
				buttonSize: '4rem',
				buttonRadius: 0,
				artworkPosition: 'button',
			},
		});
		await flushPromises();
		const { opts } = instances[0];
		expect(opts.waveformGradient).toBe('diagonal');
		expect(opts.seekHandle).toBe(true);
		expect(opts.buttonSize).toBe('4rem');
		// 0 is a real value (a square button), not "unset".
		expect(opts.buttonRadius).toBe(0);
		expect(opts.artworkPosition).toBe('button');
	});

	it('forwards a numeric buttonSize as a number', async () => {
		mount(WaveformPlaylist, { props: { tracks: tracksA, buttonSize: 48 } });
		await flushPromises();
		expect(instances[0].opts.buttonSize).toBe(48);
	});

	it('accepts layout="hero"', async () => {
		mount(WaveformPlaylist, { props: { tracks: tracksA, layout: 'hero' } });
		await flushPromises();
		expect(instances[0].opts.layout).toBe('hero');
	});

	it('does not forward audioMode (the playlist always owns its audio)', async () => {
		// An `'external'` player inside a playlist dispatches request-play
		// events nobody answers; playlist 1.8.0 ignores the option, and the
		// wrapper no longer declares or forwards it.
		mount(WaveformPlaylist, {
			props: { tracks: tracksA },
			attrs: { audioMode: 'external' },
		});
		await flushPromises();
		expect('audioMode' in instances[0].opts).toBe(false);
	});

	it('omits absent boolean props so the core defaults win', async () => {
		mount(WaveformPlaylist, { props: { tracks: tracksA } });
		await flushPromises();
		expect('continuous' in instances[0].opts).toBe(false);
		expect('showControls' in instances[0].opts).toBe(false);
		expect('crossOrigin' in instances[0].opts).toBe(false);
	});

	it('forwards explicit boolean props (including false)', async () => {
		mount(WaveformPlaylist, { props: { tracks: tracksA, continuous: false, showDuration: true } });
		await flushPromises();
		expect(instances[0].opts.continuous).toBe(false);
		expect(instances[0].opts.showDuration).toBe(true);
	});

	it('emits the player lifecycle events with the core arguments', async () => {
		// The playlist (1.8.0+) runs each forwarded callback after its own
		// handling; the wrapper surfaces them as emits.
		const wrapper = mount(WaveformPlaylist, { props: { tracks: tracksA } });
		await flushPromises();
		const call = (name: string, ...args: unknown[]) =>
			(instances[0].opts[name] as (...a: unknown[]) => void)(...args);

		call('onLoad', 'player');
		call('onPlay', 'player');
		call('onPause', 'player');
		call('onEnd', 'player');
		call('onTimeUpdate', 1.5, 30, 'player');
		call('onError', 'boom', 'player');
		call('onNextTrack', 'player');
		call('onPreviousTrack', 'player');

		expect(wrapper.emitted('load')).toEqual([['player']]);
		expect(wrapper.emitted('play')).toEqual([['player']]);
		expect(wrapper.emitted('pause')).toEqual([['player']]);
		expect(wrapper.emitted('end')).toEqual([['player']]);
		expect(wrapper.emitted('timeupdate')).toEqual([[1.5, 30, 'player']]);
		expect(wrapper.emitted('error')).toEqual([['boom', 'player']]);
		expect(wrapper.emitted('nexttrack')).toEqual([['player']]);
		expect(wrapper.emitted('previoustrack')).toEqual([['player']]);
	});

	it('reaches a swapped listener without re-mounting', async () => {
		const first = vi.fn();
		const second = vi.fn();
		const wrapper = mount(WaveformPlaylist, { props: { tracks: tracksA, onPlay: first } });
		await flushPromises();

		await wrapper.setProps({ onPlay: second });
		await flushPromises();
		expect(instances).toHaveLength(1);

		(instances[0].opts.onPlay as (p: unknown) => void)('player');
		expect(first).not.toHaveBeenCalled();
		expect(second).toHaveBeenCalledWith('player');
	});

	it('destroys the instance on unmount', async () => {
		const wrapper = mount(WaveformPlaylist, { props: { tracks: tracksA } });
		await flushPromises();
		const inst = instances[0];
		wrapper.unmount();
		expect(inst.destroy).toHaveBeenCalledTimes(1);
	});

	it('re-mounts when the tracks change', async () => {
		const wrapper = mount(WaveformPlaylist, { props: { tracks: tracksA } });
		await flushPromises();
		const first = instances[0];
		await wrapper.setProps({ tracks: [{ url: '/c.mp3', title: 'Track C' }] });
		await flushPromises();
		expect(first.destroy).toHaveBeenCalledTimes(1);
		expect(instances).toHaveLength(2);
		expect(wrapper.find('[data-track]').attributes('data-url')).toBe('/c.mp3');
	});

	it('exposes the imperative navigation API via the component ref', async () => {
		const wrapper = mount(WaveformPlaylist, { props: { tracks: tracksA } });
		await flushPromises();
		const vm = wrapper.vm as unknown as {
			nextTrack: () => void;
			selectTrack: (i: number) => void;
			getCurrentTrackIndex: () => number;
			instance: MockPlaylist | null;
		};
		vm.nextTrack();
		vm.selectTrack(1);
		expect(instances[0].nextTrack).toHaveBeenCalledTimes(1);
		expect(instances[0].selectTrack).toHaveBeenCalledWith(1);
		expect(vm.getCurrentTrackIndex()).toBe(0);
		expect(vm.instance).toBe(instances[0]);
	});

	it('merges fall-through class + id with the base wfp-host class', () => {
		const wrapper = mount(WaveformPlaylist, {
			props: { tracks: tracksA },
			attrs: { class: 'custom', id: 'pl-1' },
		});
		const el = wrapper.find('div.wfp-host').element;
		expect(el.classList.contains('custom')).toBe(true);
		expect(el.id).toBe('pl-1');
	});
});
