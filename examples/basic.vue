<!--
  examples/basic.vue
  ------------------

  Reference Vue 3 component demonstrating <WaveformPlaylist> usage.
  Copy/paste into your own Vue app (Vite, Nuxt, anywhere).

  Library setup (do this ONCE in your app entry — e.g. `main.ts`):

    import '@arraypress/waveform-player';                              // registers window.WaveformPlayer
    import '@arraypress/waveform-player/dist/waveform-player.css';
    import '@arraypress/waveform-playlist/dist/waveform-playlist.css';

  The wrapper does NOT auto-import CSS, and the playlist needs the core
  player present as window.WaveformPlayer at construction time.
-->
<script setup lang="ts">
import { ref } from 'vue';
import {
	WaveformPlaylist,
	type WaveformPlaylistExpose,
	type WaveformPlaylistTrackInput,
} from '@arraypress/waveform-playlist-vue';

/* Imperative navigation via a template ref. */
const playlist = ref<WaveformPlaylistExpose>();

/* Tracks with metadata + chapters. */
const tracks: WaveformPlaylistTrackInput[] = [
	{
		url: '/audio/episode-1.mp3',
		title: 'Episode 1',
		subtitle: 'The Pilot',
		artwork: '/img/ep1.jpg',
		duration: '42:10',
		chapters: [
			{ time: 0, label: 'Cold open' },
			{ time: 90, label: 'Main topic', color: '#a855f7' },
			{ time: '38:00', label: 'Wrap-up' },
		],
	},
	{ url: '/audio/episode-2.mp3', title: 'Episode 2', subtitle: 'Deep dive' },
];
</script>

<template>
	<!-- 1 — Minimal -->
	<WaveformPlaylist :tracks="tracks" />

	<!-- 2 — Full list, continuous playback, durations, chosen waveform style -->
	<WaveformPlaylist
		:tracks="tracks"
		layout="list"
		continuous
		show-duration
		waveform-style="bars"
		:height="72"
	/>

	<!-- 3 — Compact switcher layout -->
	<WaveformPlaylist :tracks="tracks" layout="minimal" />

	<!-- 4 — Imperative navigation via ref -->
	<WaveformPlaylist ref="playlist" :tracks="tracks" />
	<div style="display: flex; gap: 0.5rem; margin-top: 1rem">
		<button @click="playlist?.previousTrack()">Prev</button>
		<button @click="playlist?.nextTrack()">Next</button>
		<button @click="playlist?.selectTrack(1)">Track 2</button>
	</div>
</template>
