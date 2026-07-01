<div align="center">

# Waveform Playlist for Vue

**Vue 3 component wrapper for `@arraypress/waveform-playlist`.** A declarative multi-track playlist player with chapters, markers, and an exposed imperative navigation API.

[![npm version](https://img.shields.io/npm/v/@arraypress/waveform-playlist-vue?style=flat-square&labelColor=09090b&color=3f3f46)](https://www.npmjs.com/package/@arraypress/waveform-playlist-vue)
[![license](https://img.shields.io/npm/l/@arraypress/waveform-playlist-vue?style=flat-square&labelColor=09090b&color=3f3f46)](https://github.com/arraypress)

**[Documentation](https://docs.waveformplayer.com/)** · [npm](https://www.npmjs.com/package/@arraypress/waveform-playlist-vue)

</div>

---

## Install

```bash
npm install @arraypress/waveform-playlist-vue @arraypress/waveform-playlist @arraypress/waveform-player vue
```

```vue
<script setup lang="ts">
import { WaveformPlaylist } from '@arraypress/waveform-playlist-vue';
</script>

<template>
  <WaveformPlaylist :tracks="[{ url: '/a.mp3', title: 'A', artist: 'Artist' }]" />
</template>
```

## Documentation

Full props, the imperative API, and SSR notes live in the docs.

### -> [docs.waveformplayer.com](https://docs.waveformplayer.com/)

[Vue guide](https://docs.waveformplayer.com/frameworks/vue/) — install, props, the imperative API, and SSR notes. All four Vue wrappers (player / bar / playlist) are on that page.

## License

MIT © [ArrayPress](https://github.com/arraypress)
