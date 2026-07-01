# @arraypress/waveform-playlist-vue

Vue 3 component wrapper around [`@arraypress/waveform-playlist`](https://github.com/arraypress/waveform-playlist). Declarative `tracks` (with chapters + markers), typed props for every playlist + player option, and an exposed imperative navigation API (`selectTrack() / nextTrack() / previousTrack()`).

The core library stays a zero-dependency vanilla-JS package that works anywhere a `<script>` tag does. This package adds the framework-native ergonomics Vue developers expect.

```vue
<script setup lang="ts">
import { WaveformPlaylist } from '@arraypress/waveform-playlist-vue';

const tracks = [
  { url: '/audio/a.mp3', title: 'Track A' },
  { url: '/audio/b.mp3', title: 'Track B' },
];
</script>

<template>
  <WaveformPlaylist :tracks="tracks" />
</template>
```

## Installation

```bash
npm install @arraypress/waveform-playlist-vue @arraypress/waveform-playlist @arraypress/waveform-player vue
```

`vue` (^3.5), `@arraypress/waveform-playlist` (^1.3), and `@arraypress/waveform-player` (^1.8) are peer dependencies.

## Setup

Import both cores' CSS **once** in your app entry, and ensure the core player is loaded (the playlist instantiates `window.WaveformPlayer` for the active track):

```ts
import '@arraypress/waveform-player';                              // registers window.WaveformPlayer
import '@arraypress/waveform-player/dist/waveform-player.css';
import '@arraypress/waveform-playlist/dist/waveform-playlist.css';
```

The wrapper does **not** import CSS for you. The playlist's JS is loaded dynamically inside `onMounted`, so SSR / Nuxt environments don't trip over the browser-only audio APIs.

## Usage

### Tracks with metadata + chapters

```vue
<script setup lang="ts">
import { WaveformPlaylist } from '@arraypress/waveform-playlist-vue';

const tracks = [
  {
    url: '/audio/episode-1.mp3',
    title: 'Episode 1',
    artist: 'The Pilot',
    artwork: '/img/ep1.jpg',
    duration: '42:10',
    chapters: [
      { time: 0, label: 'Cold open' },
      { time: 90, label: 'Main topic', color: '#a855f7' },
      { time: '38:00', label: 'Wrap-up' },
    ],
  },
  { url: '/audio/episode-2.mp3', title: 'Episode 2' },
];
</script>

<template>
  <WaveformPlaylist :tracks="tracks" layout="list" continuous show-duration />
</template>
```

> **Naming note.** `class`, `style`, and `id` fall through to the host element automatically; the base class `wfp-host` is always applied. The visual style is `waveform-style`.

### Imperative navigation via ref

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { WaveformPlaylist, type WaveformPlaylistExpose } from '@arraypress/waveform-playlist-vue';
const playlist = ref<WaveformPlaylistExpose>();
</script>

<template>
  <WaveformPlaylist ref="playlist" :tracks="tracks" />
  <button @click="playlist?.previousTrack()">Prev</button>
  <button @click="playlist?.nextTrack()">Next</button>
  <button @click="playlist?.selectTrack(2)">Track 3</button>
</template>
```

The exposed methods (`selectTrack()`, `seekToChapter()`, `nextTrack()`, `previousTrack()`, `getPlayer()`, `getCurrentTrackIndex()`, `getTracks()`) pass straight through to the underlying instance. `playlist.value?.instance` exposes the raw instance.

## How it works

Tracks are rendered declaratively into the `[data-track]` / `[data-chapter]` markup the `WaveformPlaylist` constructor parses on mount — the same contract the vanilla library uses. When any construction prop changes (a serialised `tracks` change, `layout`, options, …), the wrapper destroys the instance and rebuilds it.

There are **no lifecycle emits** — the playlist owns the embedded player's callbacks internally to drive continuous playback and chapter tracking, so forwarding them would yield events that never fire (matching the React wrapper). Observe playback via the embedded player from `getPlayer()`.

## Props

Every playlist option and forwarded player option is a typed prop; absent props are not forwarded, so the cores' own defaults apply. See [`src/types.ts`](./src/types.ts). Highlights: `tracks` (required), `layout`, `continuous`, `expandChapters`, `showDuration`, `showChapterMarkers`, `chapterMarkerColor`, `showPlayState`, plus the player surface (`waveformStyle`, `height`, `samples`, `barWidth`, `colorPreset`, colours, `playbackRate`, `showControls`, `showInfo`, `showTime`, `showBPM`, `accessibleSeek`, …).

## TypeScript

```ts
import type {
  WaveformPlaylistProps,
  WaveformPlaylistExpose,
  WaveformPlaylistTrackInput,
  WaveformPlaylistChapterInput,
  WaveformPlaylistOptions,
  WaveformPlaylistTrack,
  WaveformStyle,
  ColorPreset,
} from '@arraypress/waveform-playlist-vue';
```

Types are re-exported straight from the cores, so they can never drift. The package ships `.d.ts` for both ESM and CJS consumers.

## Testing

```bash
npm test          # one-shot
npm run typecheck
npm run build     # emit dist/index.js, dist/index.cjs, dist/index.d.ts
```

The core library is mocked at the module boundary (jsdom has no Web Audio API).

## License

MIT © ArrayPress
