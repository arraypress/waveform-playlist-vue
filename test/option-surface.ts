/**
 * test/option-surface.ts
 * ----------------------
 *
 * The option surface this wrapper has to cover, read from the two cores'
 * hand-written `index.d.ts` files as installed in `node_modules`:
 *
 *   - every key of the playlist core's `WaveformPlaylistOptions`, and
 *   - every key of the player core's `WaveformPlayerOptions` (the playlist
 *     passes unknown options through to its embedded player).
 *
 * The forwarding-drift test checks each key is either forwarded at runtime
 * or listed in its `NOT_FORWARDED` map with a reason, so a core option the
 * wrapper hasn't wired up fails a test instead of typechecking and being
 * silently dropped.
 */
// The installed cores' declaration files, as text. Relative paths (not the
// package specifiers) because neither core exports `./index.d.ts`.
import playerDts from '../node_modules/@arraypress/waveform-player/index.d.ts?raw';
import playlistDts from '../node_modules/@arraypress/waveform-playlist/index.d.ts?raw';

/**
 * The playlist options 1.8.0 declares. Unioned with whatever the installed
 * core declares, because the 1.7.x `index.d.ts` still in `node_modules`
 * until 1.8.0 is published only lists seven of them. Once 1.8.0 is
 * installed this list is redundant (but harmless).
 */
const PLAYLIST_1_8_OPTIONS = [
	'layout',
	'continuous',
	'expandChapters',
	'showDuration',
	'showChapterMarkers',
	'chapterMarkerColor',
	'showPlayState',
	'showArtist',
	'coverSize',
	'thumbnailSize',
	'density',
	'coverPosition',
	'barPosition',
];

/**
 * The property names declared directly on `export interface <name>` —
 * comments stripped, nested `{…}` / `(…)` collapsed so parameter names and
 * inline object members don't count, index signatures skipped.
 */
export function interfaceKeys(dts: string, name: string): string[] {
	const start = dts.indexOf(`export interface ${name}`);
	if (start < 0) throw new Error(`interface ${name} not found`);
	const open = dts.indexOf('{', start);
	let depth = 0;
	let end = open;
	for (; end < dts.length; end++) {
		if (dts[end] === '{') depth++;
		else if (dts[end] === '}' && --depth === 0) break;
	}

	let body = dts
		.slice(open + 1, end)
		.replace(/\/\*[\s\S]*?\*\//g, '')
		.replace(/\/\/.*$/gm, '');
	let previous: string;
	do {
		previous = body;
		body = body.replace(/\{[^{}]*\}/g, '{}').replace(/\([^()]*\)/g, '()');
	} while (body !== previous);

	return [...body.matchAll(/(?:^|[;\n])\s*(?:readonly\s+)?([A-Za-z_$][\w$]*)\??\s*:/g)].map(
		(m) => m[1]
	);
}

/** Every `WaveformPlayerOptions` key the installed player core declares. */
export const PLAYER_OPTIONS = interfaceKeys(playerDts, 'WaveformPlayerOptions');

/** Every playlist-own option (installed core ∪ 1.8.0). */
export const PLAYLIST_OPTIONS = [
	...new Set([
		...interfaceKeys(playlistDts, 'WaveformPlaylistOptions'),
		...PLAYLIST_1_8_OPTIONS,
	]),
];

/** The whole surface: playlist-own options plus forwarded player options. */
export const ALL_OPTIONS = [...new Set([...PLAYLIST_OPTIONS, ...PLAYER_OPTIONS])];

/** Core callback options (`onPlay`, `onTimeUpdate`, …). */
export const isCallback = (key: string): boolean => /^on[A-Z]/.test(key);
