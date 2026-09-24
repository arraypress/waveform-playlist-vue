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
	/** Artist or description shown below the title (`data-artist`). */
	artist?: string;
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
	/**
	 * Pre-computed peaks, so the player skips decoding this track's audio.
	 * An array is JSON-encoded into `data-waveform`; a string (e.g. a
	 * `.json` peaks URL) is passed through for the player to resolve.
	 */
	waveform?: number[] | string;
	/** Chapters rendered as `[data-chapter]` children of this track. */
	chapters?: WaveformPlaylistChapterInput[];
}

/**
 * A playlist option's type, read from the installed playlist core.
 *
 * `@arraypress/waveform-playlist` before 1.8.0 declared only seven of its
 * options; the hero / grid ones below reached its `[option: string]: unknown`
 * index signature, which would type these props as `unknown`. For such a key
 * the `Fallback` — copied from 1.8.0's `index.d.ts` — is used instead. With
 * the peer range (`^1.8.0`) installed every key is declared, so this is
 * exactly the core's own type and the fallback is inert.
 */
type PlaylistOption<K extends string, Fallback> =
	unknown extends WaveformPlaylistOptions[K] ? Fallback : WaveformPlaylistOptions[K];

/**
 * The playlist's layout options — `layout` and the hero / grid / density
 * options that ship with it. Typed from the playlist core (see
 * {@link PlaylistOption}); `layout` overrides the player's own `layout`.
 * The component's runtime `PropType`s derive from these, since the core
 * exports no named unions for them.
 */
export interface WaveformPlaylistLayoutProps {
	/**
	 * Playlist layout. `'list'` shows the full track list; `'minimal'` a
	 * compact button switcher; `'hero'` a now-playing unit (cover +
	 * waveform) over a track queue; `'grid'` a cover-art grid with a
	 * now-playing bar. (The union is written out so `'hero'` / `'grid'`
	 * typecheck against a pre-1.8.0 core; with 1.8.0 it equals the core's.)
	 * @default 'list'
	 */
	layout?: WaveformPlaylistOptions['layout'] | 'hero' | 'grid';
	/**
	 * Show the now-playing / per-row artist. Turn off for single-artist
	 * albums where it would only repeat.
	 * @default true
	 */
	showArtist?: PlaylistOption<'showArtist', boolean>;
	/**
	 * Hero cover size in px. Defaults to the waveform height plus the time
	 * row, so the cover sits flush with the waveform column.
	 */
	coverSize?: PlaylistOption<'coverSize', number>;
	/** Hero queue thumbnail / grid cover size in px. Defaults to the CSS value. */
	thumbnailSize?: PlaylistOption<'thumbnailSize', number>;
	/** Row density for every layout. @default 'comfortable' */
	density?: PlaylistOption<'density', 'comfortable' | 'compact'>;
	/** Hero / grid cover position relative to the waveform. @default 'left' */
	coverPosition?: PlaylistOption<'coverPosition', 'left' | 'top'>;
	/** Grid layout: now-playing bar above or below the covers. @default 'bottom' */
	barPosition?: PlaylistOption<'barPosition', 'top' | 'bottom'>;
}

/**
 * The option surface accepted by `<WaveformPlaylist>` as props.
 *
 * Combines three groups:
 *
 *   1. **Playlist options** — `continuous`, `expandChapters`,
 *      `showDuration`, `showChapterMarkers`, `chapterMarkerColor`,
 *      `showPlayState`, plus the layout options
 *      ({@link WaveformPlaylistLayoutProps}: `layout` — `'list' |
 *      'minimal' | 'hero' | 'grid'`, overriding the player's own `layout` —
 *      `showArtist`, `coverSize`, `thumbnailSize`, `density`,
 *      `coverPosition`, `barPosition`).
 *   2. **Pass-through player options** — every visualisation / colour /
 *      behaviour option from the core `WaveformPlayerOptions`, minus the
 *      per-track content fields (`url`, `title`, `artist`, `artwork`,
 *      `album`, `markers`, `waveform`) which come from `tracks`, the
 *      `style`/`src` aliases, the player's `layout` (overridden above),
 *      `audioMode` (the playlist always owns its audio), and the player
 *      callbacks — those surface as emits instead (`@load`, `@play`,
 *      `@pause`, `@end`, `@timeupdate`, `@error`, `@nexttrack`,
 *      `@previoustrack`), which the playlist (1.8.0+) fires after its own
 *      handling.
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
	extends WaveformPlaylistLayoutProps,
		Pick<
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
			| 'artist'
			| 'artwork'
			| 'album'
			| 'markers'
			| 'waveform'
			| 'audioMode'
			| 'onLoad'
			| 'onPlay'
			| 'onPause'
			| 'onEnd'
			| 'onError'
			| 'onTimeUpdate'
			| 'onNextTrack'
			| 'onPreviousTrack'
		> {
	/**
	 * The playlist's tracks. Each is rendered into the `[data-track]`
	 * markup the playlist constructor parses on mount. At least one track
	 * is expected; an empty array renders an empty playlist (the core
	 * skips init when there are no tracks).
	 */
	tracks: WaveformPlaylistTrackInput[];
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
