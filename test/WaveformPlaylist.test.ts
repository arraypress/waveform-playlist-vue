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

	it('omits absent boolean props so the core defaults win', async () => {
		mount(WaveformPlaylist, { props: { tracks: tracksA } });
		await flushPromises();
		expect('continuous' in instances[0].opts).toBe(false);
		expect('showControls' in instances[0].opts).toBe(false);
	});

	it('forwards explicit boolean props (including false)', async () => {
		mount(WaveformPlaylist, { props: { tracks: tracksA, continuous: false, showDuration: true } });
		await flushPromises();
		expect(instances[0].opts.continuous).toBe(false);
		expect(instances[0].opts.showDuration).toBe(true);
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
