# Changelog

All notable changes to `@arraypress/waveform-playlist-vue` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [Unreleased]

### Added

- The hero and grid layouts: `layout` now accepts `'hero'` and `'grid'`
  alongside `'list'` / `'minimal'` (both the runtime prop and the type
  said `'list' | 'minimal'` although both ship in the core), and their
  options are runtime props, forwarded to the playlist and in the remount
  watcher: `showArtist`, `coverSize`, `thumbnailSize`, `density`
  (`'comfortable' | 'compact'`), `coverPosition` (`'left' | 'top'`) and
  `barPosition` (`'top' | 'bottom'`). Exported as
  `WaveformPlaylistLayoutProps`. Types come from the playlist core's
  `index.d.ts` (1.8.0 declares them all); against an older core they fall
  back to the same 1.8.0 shapes instead of degrading to `unknown`.
- Lifecycle emits — `load`, `play`, `pause`, `end`, `timeupdate`,
  `error`, `nexttrack`, `previoustrack` — with the core player's
  arguments, the same idiom as `@arraypress/waveform-player-vue`.
  Playlist 1.8.0 runs the embedded player's callbacks after its own
  handling (before, it overwrote them, which is why this wrapper offered
  none). `emit` is stable, so a new listener never re-mounts the playlist.
- Per-track `waveform` peaks on `WaveformPlaylistTrackInput`
  (`number[] | string`), rendered as the track's `data-waveform`: an array
  is JSON-encoded, a string (e.g. a `.json` peaks URL) passed through.
  With peaks the player skips decoding that track's audio. Playlist 1.8.0
  is the first version that reads `data-waveform`.

### Fixed

- `waveformGradient`, `seekHandle`, `buttonSize`, `buttonRadius` and
  `artworkPosition` reach the embedded player. All five are core player
  options the props type inherited, but they had no runtime prop
  declaration — Vue treated them as fallthrough attributes and they never
  reached the playlist. They are now runtime props, forwarded and in the
  remount watcher.
- Changing only the fall-through `class` no longer strips the playlist's
  own host classes (`waveform-playlist`, `wp-hero-layout`, `wp-grid-layout`,
  `wp-density-compact`, `wp-cover-top`, `wp-no-artist`, `wp-minimal`). A
  class-only change (correctly) doesn't remount, so when Vue re-patched the
  `class` attribute those were gone until some other prop changed —
  hero/grid layouts collapsed and density/artist styling reverted. The
  component now renders `class` once (server markup and hydration are
  unchanged) and applies later changes with `classList`, adding and removing
  only the user's tokens. To keep `class` out of Vue's patching it sets
  `inheritAttrs: false` and forwards every other attribute (`id`, `style`,
  listeners, `data-*`) itself — same result on the element. The DOM
  structure is unchanged — the tracks and the playlist UI still live
  directly in the one host `<div>`. (Mounting the playlist into an inner
  element was considered and rejected: it would break
  `.your-class.waveform-playlist` selectors and push CSS variables set via
  `style` / `class` onto a parent, where the core's defaults shadow them.)

### Changed

- **Requires `@arraypress/waveform-playlist@^1.8.0`** (was `^1.7.2`) —
  the upcoming release that makes these props work. Before it, the
  playlist ignored the constructor options this wrapper passes
  (`expandChapters`, `showDuration`, `showPlayState`, `showChapterMarkers`,
  `chapterMarkerColor`), leaked `layout` into the embedded player (fixed
  in 1.7.4), overwrote the player callbacks the new emits ride on, never
  read `data-waveform`, and its `destroy()` wiped the rendered tracks, so
  any prop change re-mounted an empty playlist. With 1.8.0 a re-mount
  keeps the tracks (now covered by a test).
- **Requires `@arraypress/waveform-player@^1.24.5`** (was `^1.23.0`), the
  playlist core's own floor.

### Removed

- The `audioMode` prop. The playlist always owns its audio, and an
  `'external'` embedded player dispatches request-play events nobody
  answers — a playlist that never plays. It was forwarded to the
  constructor; `@arraypress/waveform-playlist@1.8.0` ignores it, and the
  wrapper no longer declares or forwards it.

## [0.4.0] — 2026-08-07

### Added

- Forward the core player's `crossOrigin` option to the embedded player.
  Added as a runtime `props` declaration (`PropType<AudioCrossOrigin>`),
  set in the options builder, and added to the remount watcher.
  This option shipped across the rest of the waveform family in
  `@arraypress/waveform-player@1.23.0` but was missed in the playlist
  wrappers, so it was previously accepted by the types and silently
  dropped at runtime. Requires `@arraypress/waveform-player@^1.23.0`
  and `@arraypress/waveform-playlist@^1.7.2` (the version that began
  forwarding it to each track's player).

## [0.3.0] — 2026-07-05

### Added

- Forward the core player's new localizable UI-string options —
  `seekValueText`, `playPauseLabel`, `speedLabel`, `artworkAlt`, and
  `unknownTrackText` — through to the underlying player. Requires
  `@arraypress/waveform-player@^1.20.0`.

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
