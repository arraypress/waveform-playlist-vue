# Changelog

All notable changes to `@arraypress/waveform-playlist-vue` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — Unreleased

Initial release.

### Added

- `<WaveformPlaylist>` Vue 3 component wrapping `@arraypress/waveform-playlist`:
  - Declarative `tracks` prop (with optional per-track `chapters` and
    `markers`), rendered into the `[data-track]` / `[data-chapter]` markup
    the playlist constructor parses on mount.
  - Playlist options as typed props: `layout` (`'list' | 'minimal'`),
    `continuous`, `expandChapters`, `showDuration`, `showChapterMarkers`,
    `chapterMarkerColor`, `showPlayState`.
  - The full pass-through player-option surface (waveform style, sizing,
    colours, playback, UI toggles, accessibility, icons) — inherited from
    the core `WaveformPlayerOptions` via `Omit<>`, minus per-track content
    fields (which come from `tracks`).
- Imperative navigation API exposed via a template `ref`
  (`WaveformPlaylistExpose`): `selectTrack()`, `seekToChapter()`,
  `nextTrack()`, `previousTrack()`, `getPlayer()`, `getCurrentTrackIndex()`,
  `getTracks()`, plus the raw `instance`.
- `class`, `style`, and `id` fall through to the host element via Vue's
  attribute inheritance; the base class `wfp-host` always applies.
- SSR / Nuxt safe: the core library is loaded via dynamic
  `import('@arraypress/waveform-playlist')` inside `onMounted`.
- Identity-prop re-mount: any construction-prop change (a serialised
  `tracks` change, layout, options, …) destroys and rebuilds the instance.
  A monotonic mount token discards a superseded in-flight import; the
  watcher uses `flush: 'post'` so the fresh markup is in the DOM before the
  constructor re-parses it.
- No lifecycle emits — the playlist owns the embedded player's callbacks
  internally (matching the React wrapper). Observe playback via the
  embedded player from `getPlayer()`.
- Public types adopted from both cores (`@arraypress/waveform-playlist` +
  `@arraypress/waveform-player`), re-exported so they can never drift.
- Dual ESM + CJS build via `tsup` with `.d.ts` for both. Vue + both cores
  are peer dependencies.
- Vitest test suite (jsdom + `@vue/test-utils`) covering host + track
  markup rendering, option mapping (tracks excluded), boolean-prop
  omission, destroy-on-unmount, identity-prop re-mount, and the exposed
  navigation API. The core is mocked at the module boundary.
