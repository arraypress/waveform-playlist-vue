/**
 * test/types.typecheck.ts
 * -----------------------
 *
 * Type-level assertions, checked by `npm run typecheck` (not vitest).
 *
 * The playlist's layout options are typed through `PlaylistOption`, which
 * reads the installed playlist core and falls back to the 1.8.0 declaration
 * for keys an older core leaves to its `unknown` index signature. These
 * assertions hold against both, so the props never silently degrade to
 * `unknown` (or narrow back to `'list' | 'minimal'`) whichever core is
 * installed — for the exported props type AND the component's runtime
 * prop declarations, whose `PropType`s derive from it.
 */
import type { WaveformPlaylist } from '../src/WaveformPlaylist';
import type { WaveformPlaylistProps } from '../src/types';

type Equal<A, B> =
	(<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const assert = <T extends true>(): T => true as T;

assert<Equal<WaveformPlaylistProps['layout'], 'list' | 'minimal' | 'hero' | 'grid' | undefined>>();
assert<Equal<WaveformPlaylistProps['showArtist'], boolean | undefined>>();
assert<Equal<WaveformPlaylistProps['coverSize'], number | undefined>>();
assert<Equal<WaveformPlaylistProps['thumbnailSize'], number | undefined>>();
assert<Equal<WaveformPlaylistProps['density'], 'comfortable' | 'compact' | undefined>>();
assert<Equal<WaveformPlaylistProps['coverPosition'], 'left' | 'top' | undefined>>();
assert<Equal<WaveformPlaylistProps['barPosition'], 'top' | 'bottom' | undefined>>();

/** The component's public props, as a template / `h()` call sees them. */
type RuntimeProps = InstanceType<typeof WaveformPlaylist>['$props'];

assert<Equal<RuntimeProps['layout'], 'list' | 'minimal' | 'hero' | 'grid' | undefined>>();
assert<Equal<RuntimeProps['density'], 'comfortable' | 'compact' | undefined>>();
assert<Equal<RuntimeProps['coverPosition'], 'left' | 'top' | undefined>>();
assert<Equal<RuntimeProps['barPosition'], 'top' | 'bottom' | undefined>>();
