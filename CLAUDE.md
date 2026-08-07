# CLAUDE.md — @arraypress/waveform-playlist-vue

Vue 3 wrapper for `@arraypress/waveform-playlist`. Renders a declarative `tracks`
array into the `data-*` markup the playlist parses.

## Commands
- `npm test` — vitest + jsdom (run before committing).
- `npm run build` — bundles to `dist/`. `prepublishOnly` runs it. `dist/` is gitignored.

## The rule that matters: three edits per option

`src/WaveformPlaylist.ts`. **This follows the player-wrapper pattern, not the bar's
verbatim pass-through.** A new option needs **all three**:
1. A **runtime** prop declaration in the `props` object (~line 266+):
   ```ts
   <key>: { type: String as PropType<AudioCrossOrigin>, default: undefined },
   ```
2. `set('<key>', p.<key>)` in the options builder.
3. `props.<key>,` in the `watch(...)` remount array (~line 409).

Step 1 is the trap: **Vue registers props at runtime, so a TS type alone is not a
prop.** Without it Vue treats the value as a fallthrough attribute and it never
reaches the options builder.

`PropType<...>` needs a **named** union imported from a core's hand-written
`index.d.ts` (`AudioMode`, `AudioPreload`, `WaveformStyle`, …). If the core only has
an inline union, export a named one there first — that's a core edit.

## Conventions
- Types derive from **both** cores — `waveform-playlist` owns playlist options,
  `waveform-player` owns the visualisation options forwarded to embedded players.
- Forward a new *player* option only if the playlist should pass it to its embedded
  players — usually yes (`preload`, `audioMode`, `waveformStyle`, `height` all do).
- Add a test in `test/WaveformPlaylist.test.ts` + a `CHANGELOG.md` entry.

## Known gap
`crossOrigin` shipped across the rest of the family (2026-07-22) but was **never
added to any of the four playlist wrappers**, including this one. Fix it when
next touching this file.

## Cross-repo
One of 15 packages that must change together — load the `waveform-release` skill.
