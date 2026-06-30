/**
 * WaveformPlaylist.ts
 * -------------------
 *
 * Vue 3 wrapper around `@arraypress/waveform-playlist`. Renders a host
 * `<div>` containing the playlist's tracks as `[data-track]` /
 * `[data-chapter]` child markup, then — on mount — constructs a
 * `WaveformPlaylist` over that host. The library's constructor parses the
 * track markup, hides it, and renders the interactive playlist + embedded
 * player into the host. On unmount (or identity-prop change) the instance
 * is destroyed and rebuilt.
 *
 * Authored as a `defineComponent` with a render function (rather than an
 * SFC) so the package builds with `tsup` — the same dual ESM/CJS +
 * `.d.ts` toolchain as the React wrapper — and ships no `.vue` compile
 * step for consumers to worry about.
 *
 * ## Why child markup instead of an options array?
 *
 * The `WaveformPlaylist` constructor reads its tracks from `[data-track]`
 * child elements (the same contract the vanilla library uses), then
 * auto-initialises. So this wrapper renders that markup declaratively from
 * the `tracks` prop and lets the constructor consume it. The host
 * deliberately does **not** carry `data-waveform-playlist` — that
 * attribute drives the library's *global* auto-init, which would
 * double-mount on top of the instance we create explicitly.
 *
 * ## No lifecycle emits
 *
 * Unlike `@arraypress/waveform-player-vue`, this wrapper exposes no
 * playback emits. The playlist owns the embedded player's lifecycle
 * callbacks internally — it overwrites `onPlay` / `onPause` / `onEnd` /
 * `onTimeUpdate` on every track it loads to drive continuous playback,
 * the play-state indicator and chapter tracking. Forwarding them as emits
 * would yield events that silently never fire, so (matching the React
 * wrapper) they are deliberately omitted. Use the imperative `ref` and the
 * embedded player from `getPlayer()` if you need to observe playback.
 *
 * ## Identity-prop re-mount
 *
 * Like the `@arraypress/waveform-player-vue` template, this component
 * re-creates the instance when any construction-time prop changes rather
 * than diffing options against the live instance. `tracks` (serialised)
 * and `layout` are the primary identity inputs; the full pass-through
 * option set is listed exhaustively in the watcher below. The watcher uses
 * `flush: 'post'` so the freshly-rendered track markup is in the DOM
 * before the constructor re-parses it.
 *
 * ## Library setup
 *
 * This component does **not** load CSS for you. Import both cores'
 * stylesheets once at your app entry:
 *
 * ```ts
 * import '@arraypress/waveform-player/dist/waveform-player.css';
 * import '@arraypress/waveform-playlist/dist/waveform-playlist.css';
 * ```
 *
 * The playlist depends on the **core player** being present as
 * `window.WaveformPlayer` at construction time (it instantiates a
 * `new window.WaveformPlayer(...)` for the active track). Load the player
 * core's script — or import it for its global side effect — before the
 * playlist mounts:
 *
 * ```ts
 * import '@arraypress/waveform-player'; // registers window.WaveformPlayer
 * ```
 *
 * The playlist's JS is imported dynamically inside `onMounted` so it only
 * loads on the client (SSR / Nuxt safe).
 *
 * @module WaveformPlaylist
 */
import {
	defineComponent,
	h,
	onBeforeUnmount,
	onMounted,
	ref,
	watch,
	type PropType,
	type VNode,
} from 'vue';
// Aliased to avoid colliding with this file's own `WaveformPlaylist`
// component export. This is the core library's playlist class type.
import type { WaveformPlaylist as WaveformPlaylistInstance } from '@arraypress/waveform-playlist';
import type {
	AudioMode,
	AudioPreload,
	ButtonAlign,
	ColorPreset,
	WaveformStyle,
} from '@arraypress/waveform-player';
import type {
	WaveformPlaylistChapterInput,
	WaveformPlaylistTrack,
	WaveformPlaylistTrackInput,
} from './types';

/** Minimal structural view of the methods the wrapper calls. */
type PlaylistInstance = {
	destroy?: () => void;
	selectTrack?: (index: number) => void;
	seekToChapter?: (trackIndex: number, time: number) => void;
	nextTrack?: () => void;
	previousTrack?: () => void;
	getPlayer?: () => unknown | null;
	getCurrentTrackIndex?: () => number;
	getTracks?: () => WaveformPlaylistTrack[];
};

/**
 * Convert resolved props into the option shape the `WaveformPlaylist`
 * constructor accepts. Tracks are intentionally excluded — the
 * constructor reads them from the `[data-track]` child markup this
 * component renders, not from options. Only values that are present
 * (`!== undefined && !== null`) are forwarded, so the cores' own defaults
 * win for everything the consumer omitted.
 *
 * @param p - The component's resolved props.
 * @returns An options object to pass into `new WaveformPlaylist(el, …)`.
 */
function buildPlaylistOptions(p: Record<string, unknown>): Record<string, unknown> {
	const opts: Record<string, unknown> = {};
	const set = (key: string, value: unknown) => {
		if (value !== undefined && value !== null) opts[key] = value;
	};

	/* Playlist-level options */
	set('layout', p.layout);
	set('continuous', p.continuous);
	set('expandChapters', p.expandChapters);
	set('showDuration', p.showDuration);
	set('showChapterMarkers', p.showChapterMarkers);
	set('chapterMarkerColor', p.chapterMarkerColor);
	set('showPlayState', p.showPlayState);

	/* Pass-through player options — forwarded to the embedded player the
	 * playlist drives. Per-track content (url/title/subtitle/artwork/album/
	 * markers/waveform) is NOT here; it comes from the rendered markup. */
	set('audioMode', p.audioMode);
	set('preload', p.preload);

	/* Waveform visualisation */
	set('waveformStyle', p.waveformStyle);
	set('height', p.height);
	set('samples', p.samples);
	set('barWidth', p.barWidth);
	set('barSpacing', p.barSpacing);
	set('barRadius', p.barRadius);

	/* Colours */
	set('colorPreset', p.colorPreset);
	set('waveformColor', p.waveformColor);
	set('progressColor', p.progressColor);
	set('buttonColor', p.buttonColor);
	set('buttonHoverColor', p.buttonHoverColor);
	set('textColor', p.textColor);
	set('textSecondaryColor', p.textSecondaryColor);
	set('backgroundColor', p.backgroundColor);
	set('borderColor', p.borderColor);

	/* Playback controls */
	set('playbackRate', p.playbackRate);
	set('showPlaybackSpeed', p.showPlaybackSpeed);
	set('playbackRates', p.playbackRates);

	/* UI toggles */
	set('showControls', p.showControls);
	set('showInfo', p.showInfo);
	set('showTime', p.showTime);
	set('showHoverTime', p.showHoverTime);
	set('showBPM', p.showBPM);
	set('bpm', p.bpm);
	set('buttonAlign', p.buttonAlign);
	set('buttonStyle', p.buttonStyle);

	/* Accessibility */
	set('accessibleSeek', p.accessibleSeek);
	set('seekLabel', p.seekLabel);

	/* Error UI */
	set('errorText', p.errorText);

	/* Markers (the per-player render toggle; per-track marker data comes
	 * from each track's `markers`, rendered into `data-markers`). */
	set('showMarkers', p.showMarkers);

	/* Behaviour */
	set('autoplay', p.autoplay);
	set('singlePlay', p.singlePlay);
	set('playOnSeek', p.playOnSeek);
	set('enableMediaSession', p.enableMediaSession);

	/* Icons */
	set('playIcon', p.playIcon);
	set('pauseIcon', p.pauseIcon);

	return opts;
}

/**
 * Render the `tracks` prop into the `[data-track]` / `[data-chapter]`
 * markup the playlist constructor parses. `undefined` attribute values
 * are dropped by Vue, so omitted track fields produce no `data-*`
 * attribute (matching the vanilla library's "absent = default" contract).
 *
 * @param tracks - The declarative track inputs.
 * @returns An array of track `<div>` vnodes.
 */
function renderTracks(tracks: WaveformPlaylistTrackInput[]): VNode[] {
	return tracks.map((track, i) =>
		h(
			'div',
			{
				key: i,
				'data-track': '',
				'data-url': track.url,
				'data-title': track.title,
				'data-subtitle': track.subtitle,
				'data-artwork': track.artwork,
				'data-album': track.album,
				'data-duration': track.duration,
				'data-markers': track.markers ? JSON.stringify(track.markers) : undefined,
			},
			(track.chapters ?? []).map((chapter: WaveformPlaylistChapterInput, ci: number) =>
				h(
					'div',
					{
						key: ci,
						'data-chapter': '',
						'data-time': String(chapter.time),
						'data-color': chapter.color,
					},
					chapter.label
				)
			)
		)
	);
}

/**
 * `WaveformPlaylist` — Vue 3 component wrapping
 * `@arraypress/waveform-playlist`.
 *
 * Every playlist option and every forwarded player option is accepted as
 * a typed prop. Tracks (with optional chapters/markers) are supplied
 * declaratively via the `tracks` prop. An imperative navigation API
 * (`selectTrack`, `nextTrack`, `previousTrack`, `seekToChapter`, …) is
 * exposed through a template `ref`.
 *
 * `class`, `style`, and `id` fall through to the host element via Vue's
 * attribute inheritance — the base class `wfp-host` is always applied.
 */
export const WaveformPlaylist = defineComponent({
	name: 'WaveformPlaylist',
	props: {
		// ── Tracks (required) ──────────────────────────────────────────
		/** The playlist's tracks, rendered into `[data-track]` markup. */
		tracks: {
			type: Array as PropType<WaveformPlaylistTrackInput[]>,
			default: () => [],
		},

		// ── Playlist layout + options ──────────────────────────────────
		/** Playlist layout: `'list'` (full list) or `'minimal'` (switcher). */
		layout: { type: String as PropType<'list' | 'minimal'>, default: undefined },
		/** Auto-advance to the next track when one ends. */
		continuous: { type: Boolean, default: undefined },
		/** Show chapters under each track. */
		expandChapters: { type: Boolean, default: undefined },
		/** Display per-track durations. */
		showDuration: { type: Boolean, default: undefined },
		/** Show chapters as waveform markers (`null` lets the playlist decide). */
		showChapterMarkers: { type: Boolean, default: undefined },
		/** Default colour for chapter markers. */
		chapterMarkerColor: { type: String, default: undefined },
		/** Show a play/pause icon on the active track artwork. */
		showPlayState: { type: Boolean, default: undefined },

		// ── Audio source behaviour (forwarded to the embedded player) ──
		audioMode: { type: String as PropType<AudioMode>, default: undefined },
		preload: { type: String as PropType<AudioPreload>, default: undefined },

		// ── Waveform visualisation ─────────────────────────────────────
		waveformStyle: { type: String as PropType<WaveformStyle>, default: undefined },
		height: { type: Number, default: undefined },
		samples: { type: Number, default: undefined },
		barWidth: { type: Number, default: undefined },
		barSpacing: { type: Number, default: undefined },
		barRadius: { type: Number, default: undefined },

		// ── Colours (string, or string[] for gradients) ────────────────
		colorPreset: { type: String as PropType<ColorPreset>, default: undefined },
		waveformColor: { type: [String, Array] as PropType<string | string[]>, default: undefined },
		progressColor: { type: [String, Array] as PropType<string | string[]>, default: undefined },
		buttonColor: { type: String, default: undefined },
		buttonHoverColor: { type: String, default: undefined },
		textColor: { type: String, default: undefined },
		textSecondaryColor: { type: String, default: undefined },
		backgroundColor: { type: String, default: undefined },
		borderColor: { type: String, default: undefined },

		// ── Playback controls ──────────────────────────────────────────
		playbackRate: { type: Number, default: undefined },
		showPlaybackSpeed: { type: Boolean, default: undefined },
		playbackRates: { type: Array as PropType<number[]>, default: undefined },

		// ── UI toggles ─────────────────────────────────────────────────
		showControls: { type: Boolean, default: undefined },
		showInfo: { type: Boolean, default: undefined },
		showTime: { type: Boolean, default: undefined },
		showHoverTime: { type: Boolean, default: undefined },
		showBPM: { type: Boolean, default: undefined },
		bpm: { type: Number, default: undefined },
		buttonAlign: { type: String as PropType<ButtonAlign>, default: undefined },
		buttonStyle: { type: String, default: undefined },

		// ── Accessibility ──────────────────────────────────────────────
		accessibleSeek: { type: Boolean, default: undefined },
		seekLabel: { type: String, default: undefined },

		// ── Error UI ───────────────────────────────────────────────────
		errorText: { type: String, default: undefined },

		// ── Markers (per-player render toggle) ─────────────────────────
		showMarkers: { type: Boolean, default: undefined },

		// ── Behaviour ──────────────────────────────────────────────────
		autoplay: { type: Boolean, default: undefined },
		singlePlay: { type: Boolean, default: undefined },
		playOnSeek: { type: Boolean, default: undefined },
		enableMediaSession: { type: Boolean, default: undefined },

		// ── Icons ──────────────────────────────────────────────────────
		playIcon: { type: String, default: undefined },
		pauseIcon: { type: String, default: undefined },
	},
	setup(props, { expose }) {
		const container = ref<HTMLDivElement | null>(null);
		let instance: PlaylistInstance | null = null;
		/* Monotonic token: every (re)mount bumps it; an in-flight async
		 * import whose token is stale (superseded by a newer mount or by
		 * unmount) bails instead of attaching a zombie instance. */
		let mountToken = 0;

		function teardown() {
			if (instance && typeof instance.destroy === 'function') {
				try {
					instance.destroy();
				} catch (err) {
					console.warn('[WaveformPlaylistVue] destroy() threw:', err);
				}
			}
			instance = null;
		}

		function mount() {
			const myToken = ++mountToken;
			const el = container.value;
			if (!el) return;

			/* Browser-only library — defer the import to the client so SSR
			 * doesn't evaluate the audio + canvas + fetch surface. */
			void import('@arraypress/waveform-playlist')
				.then((mod) => {
					if (myToken !== mountToken) return; // superseded
					const target = container.value;
					if (!target) return;

					const Ctor = (mod.default ??
						(mod as { WaveformPlaylist?: unknown }).WaveformPlaylist) as {
						new (el: HTMLElement, opts: Record<string, unknown>): PlaylistInstance;
					};
					if (typeof Ctor !== 'function') {
						console.error(
							'[WaveformPlaylistVue] Failed to resolve WaveformPlaylist constructor from module.'
						);
						return;
					}

					try {
						instance = new Ctor(
							target,
							buildPlaylistOptions(props as unknown as Record<string, unknown>)
						);
					} catch (err) {
						/* The most common cause is a missing core player —
						 * `window.WaveformPlayer` must be present before the
						 * playlist constructs. Surface it clearly. */
						console.error('[WaveformPlaylistVue] Failed to construct playlist:', err);
					}
				})
				.catch((err) => {
					console.error('[WaveformPlaylistVue] Failed to load library:', err);
				});
		}

		onMounted(mount);
		onBeforeUnmount(() => {
			mountToken++; // invalidate any in-flight import
			teardown();
		});

		/* Re-mount on any construction-prop change. Listed exhaustively
		 * (mirrors the React wrapper's dep array) so the intent is explicit.
		 * `JSON.stringify(props.tracks)` stands in for the tracks array, so a
		 * changed track set tears down and rebuilds the playlist. `flush:
		 * 'post'` runs after Vue has patched the (new) track markup into the
		 * DOM, so the constructor re-parses the up-to-date children. */
		watch(
			() => [
				JSON.stringify(props.tracks),
				props.layout,
				props.continuous,
				props.expandChapters,
				props.showDuration,
				props.showChapterMarkers,
				props.chapterMarkerColor,
				props.showPlayState,
				props.audioMode,
				props.preload,
				props.waveformStyle,
				props.height,
				props.samples,
				props.barWidth,
				props.barSpacing,
				props.barRadius,
				props.colorPreset,
				props.waveformColor,
				props.progressColor,
				props.buttonColor,
				props.buttonHoverColor,
				props.textColor,
				props.textSecondaryColor,
				props.backgroundColor,
				props.borderColor,
				props.playbackRate,
				props.showPlaybackSpeed,
				props.playbackRates,
				props.showControls,
				props.showInfo,
				props.showTime,
				props.showHoverTime,
				props.showBPM,
				props.bpm,
				props.buttonAlign,
				props.buttonStyle,
				props.accessibleSeek,
				props.seekLabel,
				props.errorText,
				props.showMarkers,
				props.autoplay,
				props.singlePlay,
				props.playOnSeek,
				props.enableMediaSession,
				props.playIcon,
				props.pauseIcon,
			],
			() => {
				teardown();
				mount();
			},
			{ flush: 'post' }
		);

		/* Imperative navigation API on a template ref. Each method is a thin
		 * pass-through; calls before the async instance mounts are no-ops,
		 * and the getters return sensible fallbacks. */
		expose({
			selectTrack(index: number) {
				instance?.selectTrack?.(index);
			},
			seekToChapter(trackIndex: number, time: number) {
				instance?.seekToChapter?.(trackIndex, time);
			},
			nextTrack() {
				instance?.nextTrack?.();
			},
			previousTrack() {
				instance?.previousTrack?.();
			},
			getPlayer() {
				return instance?.getPlayer?.() ?? null;
			},
			getCurrentTrackIndex() {
				return instance?.getCurrentTrackIndex?.() ?? 0;
			},
			getTracks() {
				return instance?.getTracks?.() ?? [];
			},
			get instance() {
				return instance as unknown as WaveformPlaylistInstance | null;
			},
		});

		return () => h('div', { ref: container, class: 'wfp-host' }, renderTracks(props.tracks));
	},
});

export default WaveformPlaylist;
