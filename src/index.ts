/**
 * @module @arraypress/waveform-playlist-vue
 * @description
 * Public entry point for the Vue 3 wrapper around
 * `@arraypress/waveform-playlist`.
 *
 * ```vue
 * <script setup lang="ts">
 * import { WaveformPlaylist } from '@arraypress/waveform-playlist-vue';
 *
 * const tracks = [
 *   { url: '/audio/a.mp3', title: 'Track A' },
 *   { url: '/audio/b.mp3', title: 'Track B' },
 * ];
 * </script>
 *
 * <template>
 *   <WaveformPlaylist :tracks="tracks" />
 * </template>
 * ```
 *
 * ## Types
 *
 * ```ts
 * import type {
 *   WaveformPlaylistProps,
 *   WaveformPlaylistExpose,
 *   WaveformPlaylistTrackInput,
 *   WaveformPlaylistChapterInput,
 *   WaveformPlaylistOptions,
 *   WaveformPlaylistTrack,
 *   WaveformPlaylistChapter,
 *   WaveformPlaylistMarker,
 *   WaveformStyle,
 *   WaveformMarker,
 *   WaveformPeaks,
 *   ColorPreset,
 *   AudioMode,
 *   AudioPreload,
 *   ButtonAlign,
 * } from '@arraypress/waveform-playlist-vue';
 * ```
 */

export { WaveformPlaylist, default } from './WaveformPlaylist';

export type {
	WaveformPlaylistProps,
	WaveformPlaylistExpose,
	WaveformPlaylistTrackInput,
	WaveformPlaylistChapterInput,
	WaveformPlaylistOptions,
	WaveformPlaylistTrack,
	WaveformPlaylistChapter,
	WaveformPlaylistMarker,
	WaveformStyle,
	WaveformMarker,
	WaveformPeaks,
	ColorPreset,
	AudioMode,
	AudioPreload,
	ButtonAlign,
} from './types';
