/**
 * @module types
 * @description
 * Public TypeScript types for `@arraypress/waveform-playlist-vue`.
 *
 * The shared option surface is owned by two core libraries and
 * re-exported / derived here rather than re-declared:
 *
 *   - `@arraypress/waveform-playlist` owns the playlist-level options
 *     ({@link WaveformPlaylistOptions}) and the parsed track / chapter /
 *     marker shapes ({@link WaveformPlaylistTrack},
 *     {@link WaveformPlaylistChapter}, {@link WaveformPlaylistMarker}).
 *   - `@arraypress/waveform-player` owns the per-player visualisation
 *     options ({@link WaveformPlayerOptions}) the playlist forwards to the
 *     embedded player (e.g. `height`, `waveformStyle`, `colorPreset`).
 *
 * Both cores ship hand-authored `index.d.ts` files, so this wrapper can
 * never drift out of sync with them.
 *
 * This module only adds the Vue-specific surface:
 *
 *   - A declarative `tracks` array ({@link WaveformPlaylistTrackInput})
 *     the component renders into the `[data-track]` markup the playlist
 *     constructor parses.
 *   - `WaveformPlaylistProps` — the option surface accepted as component
 *     props.
 *   - `WaveformPlaylistExpose` — the imperative navigation API exposed
 *     through a template `ref` (`selectTrack`, `nextTrack`,
 *     `previousTrack`, …).
 *
 * `class`, `style`, and `id` are intentionally NOT props: Vue's
 * attribute fall-through applies them to the host element automatically.
 *
 * @see {@link https://github.com/arraypress/waveform-playlist} — core library
 */
import type {
	WaveformPlaylist,
	WaveformPlaylistOptions,
	WaveformPlaylistTrack,
	WaveformPlaylistMarker,
} from '@arraypress/waveform-playlist';
import type { WaveformPlayerOptions } from '@arraypress/waveform-player';

/**
 * Playlist option / parsed-shape types re-exported from
 * `@arraypress/waveform-playlist` so consumers importing them from this
 * package keep working. These are the single-source-of-truth definitions
 * shipped by the core — not local copies.
 */
export type {
	WaveformPlaylistOptions,
	WaveformPlaylistTrack,
	WaveformPlaylistChapter,
	WaveformPlaylistMarker,
} from '@arraypress/waveform-playlist';

/**
 * Shared player option types re-exported from
 * `@arraypress/waveform-player` (these flow through to the embedded
 * player the playlist drives).
 */
export type {
	WaveformStyle,
	ColorPreset,
	AudioMode,
	AudioPreload,
	ButtonAlign,
	WaveformMarker,
	WaveformPeaks,
} from '@arraypress/waveform-player';

/**
 * A chapter on a {@link WaveformPlaylistTrackInput}. Rendered as a
 * `[data-chapter]` child of its track's `[data-track]` element.
 */
export interface WaveformPlaylistChapterInput {
	/**
	 * Chapter start time. A number of seconds (e.g. `90`) or a timestamp
	 * string (e.g. `'1:30'`). Both are stringified into `data-time`, which
	 * the playlist parses (`"M:SS"` / `"MM:SS"`, or a bare seconds count).
	 */
	time: number | string;
	/** Chapter label text. Rendered as the element's text content. */
	label: string;
	/** Optional marker colour for this chapter (`data-color`). */
	color?: string;
}

/**
 * A track supplied to `<WaveformPlaylist>` via the `tracks` prop.
 *
 * This is the *input* shape — distinct from the core's parsed
 * {@link WaveformPlaylistTrack} (which also carries the source `element`
 * and resolved `index`). The component renders each track into the
 * `[data-track]` markup the playlist constructor reads on mount.
 */
export interface WaveformPlaylistTrackInput {
	/** Audio file URL (required). Rendered as `data-url`. */
	url: string;
	/** Track title (`data-title`). Falls back to the filename if omitted. */
	title?: string;
	/** Artist or description shown as the subtitle (`data-subtitle`). */
	subtitle?: string;
	/** Album artwork URL (`data-artwork`). */
	artwork?: string;
	/** Album name, forwarded to the Media Session API (`data-album`). */
	album?: string;
	/** Human-readable display duration, e.g. `'3:45'` (`data-duration`). */
	duration?: string;
	/**
	 * Explicit waveform markers (separate from chapters). JSON-encoded into
	 * `data-markers`, which the playlist parses for this track.
	 */
	markers?: WaveformPlaylistMarker[];
	/** Chapters rendered as `[data-chapter]` children of this track. */
	chapters?: WaveformPlaylistChapterInput[];
}

/**
 * The option surface accepted by `<WaveformPlaylist>` as props.
 *
 * Combines three groups:
 *
 *   1. **Playlist options** — `continuous`, `expandChapters`,
 *      `showDuration`, `showChapterMarkers`, `chapterMarkerColor`,
 *      `showPlayState`, plus a playlist-specific `layout`
 *      (`'list' | 'minimal'`, which overrides the player's own `layout`).
 *   2. **Pass-through player options** — every visualisation / colour /
 *      behaviour option from the core `WaveformPlayerOptions`, minus the
 *      per-track content fields (`url`, `title`, `subtitle`, `artwork`,
 *      `album`, `markers`, `waveform`) which come from `tracks`, the
 *      `style`/`src` aliases, the player's `layout` (overridden above), and
 *      the lifecycle callbacks (the playlist owns the embedded player's
 *      callbacks internally, so they are not surfaced as emits).
 *   3. **Vue extra** — the required `tracks` array.
 *
 * `class`, `style`, and `id` are intentionally not listed: Vue's
 * attribute fall-through applies them to the host element automatically
 * (the base class `wfp-host` is always present and merges with any
 * consumer `class`).
 *
 * Because the option surface is inherited rather than hand-copied,
 * anything the cores add in future is exposed here without a manual edit.
 */
export interface WaveformPlaylistProps
	extends Pick<
			WaveformPlaylistOptions,
			| 'continuous'
			| 'expandChapters'
			| 'showDuration'
			| 'showChapterMarkers'
			| 'chapterMarkerColor'
			| 'showPlayState'
		>,
		Omit<
			WaveformPlayerOptions,
			| 'url'
			| 'src'
			| 'style'
			| 'layout'
			| 'title'
			| 'subtitle'
			| 'artwork'
			| 'album'
			| 'markers'
			| 'waveform'
			| 'onLoad'
			| 'onPlay'
			| 'onPause'
			| 'onEnd'
			| 'onError'
			| 'onTimeUpdate'
		> {
	/**
	 * The playlist's tracks. Each is rendered into the `[data-track]`
	 * markup the playlist constructor parses on mount. At least one track
	 * is expected; an empty array renders an empty playlist (the core
	 * skips init when there are no tracks).
	 */
	tracks: WaveformPlaylistTrackInput[];

	/**
	 * Playlist layout. `'list'` shows the full track list; `'minimal'`
	 * shows a compact button switcher.
	 * @default 'list'
	 */
	layout?: 'list' | 'minimal';
}

/**
 * Imperative navigation API exposed through a template `ref`. Lets
 * consumers drive the playlist directly — useful for "play track N" /
 * "next" / "previous" flows where wiring everything through props is
 * awkward.
 *
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue';
 * import { WaveformPlaylist, type WaveformPlaylistExpose } from '@arraypress/waveform-playlist-vue';
 * const playlist = ref<WaveformPlaylistExpose>();
 * </script>
 * <template>
 *   <WaveformPlaylist ref="playlist" :tracks="tracks" />
 *   <button @click="playlist?.nextTrack()">Next</button>
 * </template>
 * ```
 *
 * Each method is a thin pass-through to the underlying
 * {@link WaveformPlaylist} instance; refer to the core library's docs for
 * exact behaviour. Calls before the instance has mounted (it loads
 * asynchronously) are no-ops.
 */
export interface WaveformPlaylistExpose {
	/** Select and load a track by index. */
	selectTrack(index: number): void;
	/**
	 * Seek to a chapter within a track. If the chapter lives on a different
	 * track, that track is loaded first and the seek runs once it is ready.
	 */
	seekToChapter(trackIndex: number, time: number): void;
	/** Navigate to the next track (if any). */
	nextTrack(): void;
	/** Navigate to the previous track (if any). */
	previousTrack(): void;
	/**
	 * The embedded `WaveformPlayer` instance, or `null` before init. Exposes
	 * the full player API (`play`, `pause`, `seekTo`, …) for the rare cases
	 * the playlist handle doesn't surface.
	 */
	getPlayer(): unknown | null;
	/** The index of the currently selected track. */
	getCurrentTrackIndex(): number;
	/** All parsed tracks (the core's resolved shape, with `element`/`index`). */
	getTracks(): WaveformPlaylistTrack[];
	/**
	 * Underlying `WaveformPlaylist` instance, or `null` before it mounts.
	 * Escape hatch for anything the methods above don't cover.
	 */
	readonly instance: WaveformPlaylist | null;
}
