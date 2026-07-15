# Audio Optimization Design Spec

**Date:** 2026-07-15
**Status:** Approved
**Scope:** Replace procedural oscillator-based audio with high-quality recorded meditation sounds

---

## Problem

The current bell and ambient sounds are synthesized using Web Audio API oscillators (sine waves, noise buffers + filters). This produces a "blurry" and "cheap" sounding experience. A previous attempt to use WAV recordings was reverted because the files themselves were low quality — not a technical limitation.

## Goal

Replace all procedural audio with curated, high-fidelity recorded meditation sounds. The upgrade should be transparent to users (same UI, same options) with dramatically improved audio quality.

---

## Section 1: Audio File Architecture

### File Format

- **Primary:** MP3 at 192kbps — universal browser support, good compression
- **Fallback:** OGG Opus for non-Safari browsers where supported
- Both formats served; browser picks via `<audio>` or `fetch` accept headers

### Directory Structure

```
audio/
├── bells/
│   ├── singing-bowl.mp3              (~200KB, ~8s natural decay)
│   ├── singing-bowl-completion.mp3   (~350KB, ~12s extended decay)
│   ├── soft-gong.mp3                 (~250KB, ~6s)
│   ├── soft-gong-completion.mp3      (~400KB, ~10s)
│   ├── temple-bell.mp3               (~200KB, ~5s)
│   └── temple-bell-completion.mp3    (~300KB, ~8s)
├── ambient/
│   ├── rain.mp3                      (~1.5MB, seamless loop)
│   ├── waves.mp3                     (~1.5MB, seamless loop)
│   ├── forest.mp3                    (~1.5MB, seamless loop)
│   ├── wind.mp3                      (~1.5MB, seamless loop)
│   ├── zen.mp3                       (~1.5MB, seamless loop)
│   ├── fire.mp3                      (~1.5MB, seamless loop)
│   ├── brown-noise.mp3               (~1.5MB, seamless loop)
│   └── chants.mp3                    (~1.5MB, seamless loop)
└── CREDITS.md                        (attribution for CC-licensed sources)
```

### Sourcing Strategy

| Sound | Primary Source | Search Terms | Requirements |
|-------|---------------|--------------|--------------|
| Singing bowl | Freesound | `tibetan singing bowl single strike` | 44.1kHz+, CC0/CC-BY, top downloads |
| Soft gong | Freesound | `meditation gong` | Same filters |
| Temple bell | Freesound | `tingsha` or `rin gong` | Same filters |
| Rain | BBC Sound Effects / Pixabay | `rain on window seamless` | Loopable, no reverb tail |
| Waves | BBC Sound Effects | `ocean waves loop` | Seamless crossfade point |
| Forest | BBC Sound Effects | `forest birds ambience` | Loopable |
| Wind | BBC Sound Effects | `gentle wind nature` | Loopable |
| Zen | Freesound / Pixabay | `zen meditation music loop` | Seamless |
| Fire | BBC Sound Effects | `crackling fire` | Seamless |
| Brown noise | Generated or Freesound | `brown noise 1 minute` | Seamless |
| Chants | Freesound | `tibetan chant om` | Seamless |

### Audio Quality Requirements

- Sample rate: 44.1kHz minimum
- Bit depth: 16-bit (from source), encoded to 192kbps MP3
- Normalization: -14 LUFS integrated loudness (consistent across all files)
- Bells: Natural decay, no abrupt cutoffs. Trim silence from head, preserve full tail.
- Ambient: Trimmed to seamless loop points. Crossfade-tested (no clicks/pops at loop boundary)

### Total Bundle Size

~12-15MB added to PWA. Acceptable for offline-cached meditation app.

---

## Section 2: Playback System

### Core Infrastructure

Replace oscillator nodes with `AudioBuffer`-based playback.

**New state properties:**
```javascript
state.audio.bufferCache = new Map();  // id -> AudioBuffer
state.audio.activeAmbientSource = null;  // current BufferSourceNode
```

**New functions:**

- `getAudioFormat()` — Returns `'mp3'` or `'ogg'` based on browser support:
  ```javascript
  function getAudioFormat() {
      const audio = document.createElement('audio');
      return audio.canPlayType('audio/ogg; codecs="vorbis"') ? 'ogg' : 'mp3';
  }
  ```
- `preloadAudioFiles()` — Called on app init. Fetches + decodes all 6 bell sounds (~2MB total). Returns a Promise. Ambient NOT preloaded (lazy).
- `getAudioBuffer(id)` — Returns cached `AudioBuffer`. On cache miss: fetches `audio/{category}/{id}.{format}`, decodes via `ctx.decodeAudioData()`, caches, returns.

**Sound key mapping** (accounts for camelCase-to-kebab-case):
```javascript
const AUDIO_FILE_MAP = {
    'singing-bowl': 'bells/singing-bowl',
    'soft-gong': 'bells/soft-gong',
    'bell': 'bells/temple-bell',
    'rain': 'ambient/rain',
    'waves': 'ambient/waves',
    'forest': 'ambient/forest',
    'wind': 'ambient/wind',
    'zen': 'ambient/zen',
    'fire': 'ambient/fire',
    'brownNoise': 'ambient/brown-noise',
    'chants': 'ambient/chants'
};
```

### Bell Playback

Replace `playSingingBowl()`, `playSoftGong()`, `playTempleBell()` with a single unified function:

```javascript
function playBellSound(volumeMultiplier = 1, isCompletion = false) {
    if (state.audio.bellSound === 'silence') return;
    initAudioContext();

    const id = isCompletion
        ? `${state.audio.bellSound}-completion`
        : state.audio.bellSound;

    const format = getAudioFormat();
    const base = AUDIO_FILE_MAP[state.audio.bellSound];
    const id = isCompletion ? `${base}-completion` : base;
    getAudioBuffer(id, format).then(buffer => {
        const ctx = state.audio.context;
        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(state.audio.volume * volumeMultiplier, ctx.currentTime);

        // Gentle fade-out over last 0.5s to prevent pop without cutting natural tail
        const fadeStart = buffer.duration - 0.5;
        gain.gain.setValueAtTime(state.audio.volume * volumeMultiplier, ctx.currentTime + fadeStart);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + buffer.duration);

        source.connect(gain);
        gain.connect(state.audio.masterGain);
        source.start();
    });
}
```

### Ambient Playback

Replace `createRainSound()`, `createWavesSound()`, etc. with a single unified function:

```javascript
function startAmbientSound() {
    if (state.audio.isAmbientPlaying) return;
    if (state.audio.ambientSound === 'silence') return;

    initAudioContext();
    const ctx = state.audio.context;

    const format = getAudioFormat();
    const filePath = AUDIO_FILE_MAP[state.audio.ambientSound];
    getAudioBuffer(filePath, format).then(buffer => {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        // Fade in
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.setTargetAtTime(state.audio.volume, ctx.currentTime, 0.5);

        source.connect(gain);
        gain.connect(state.audio.masterGain);
        source.start();

        state.audio.activeAmbientSource = source;
        state.audio.activeAmbientGain = gain;
        state.audio.isAmbientPlaying = true;
    });
}
```

### Stop Ambient

Simplified — single source node instead of array of nodes:

```javascript
function stopAmbientSound() {
    if (!state.audio.activeAmbientSource) {
        state.audio.isAmbientPlaying = false;
        return;
    }

    const ctx = state.audio.context;
    const gain = state.audio.activeAmbientGain;
    const source = state.audio.activeAmbientSource;

    // Fade out then stop
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
    source.stop(ctx.currentTime + 2.1);

    state.audio.activeAmbientSource = null;
    state.audio.activeAmbientGain = null;
    state.audio.isAmbientPlaying = false;
}
```

### Custom Upload Integration

Keep existing blob URL system unchanged. Custom sounds bypass the buffer cache, decoded on-demand from the blob via `ctx.decodeAudioData(blob.arrayBuffer())`.

### Removed Code

- `createNoiseBuffer()` — no longer needed
- `createRainSound()`, `createWavesSound()`, `createForestSound()`, `createWindSound()`, `createZenMusic()`, `createFireSound()`, `createBrownNoiseSound()`, `createChantsSound()` — all removed
- `playSingingBowl()`, `playSoftGong()`, `playTempleBell()` — all removed
- `registerAmbientNode()` — replaced by single source tracking
- `state.audio.ambientNodes` array — replaced by `activeAmbientSource`

---

## Section 3: Service Worker Update

### Changes to `sw.js`

```javascript
const CACHE_NAME = 'pulsedrift-cache-v5';  // bump from v4

const ASSETS = [
  // ... existing static assets ...
  './audio/bells/singing-bowl.mp3',
  './audio/bells/singing-bowl-completion.mp3',
  './audio/bells/soft-gong.mp3',
  './audio/bells/soft-gong-completion.mp3',
  './audio/bells/temple-bell.mp3',
  './audio/bells/temple-bell-completion.mp3',
  './audio/ambient/rain.mp3',
  './audio/ambient/waves.mp3',
  './audio/ambient/forest.mp3',
  './audio/ambient/wind.mp3',
  './audio/ambient/zen.mp3',
  './audio/ambient/fire.mp3',
  './audio/ambient/brown-noise.mp3',
  './audio/ambient/chants.mp3'
];
```

All audio files pre-cached on service worker install. Works offline immediately after first load.

---

## Section 4: UI & Error Handling

### UI Changes

None. Same dropdown options, same labels, same custom upload section. The upgrade is purely in audio quality.

### Loading Behavior

- **Bells:** Pre-cached on init — instant playback, no loading indicator
- **Ambient:** Lazy-loaded on first selection. ~100-200ms decode delay on first play, then cached. No spinner needed.

### Error Fallback

If file fetch/decode fails:
1. Log console warning with the failed sound ID
2. Fall back to current procedural synthesis (keep the old functions as `_procedural` fallbacks)
3. User hears *something* rather than silence

### Migration Path

1. Add `audio/` directory with all files
2. Rewrite `playBellSound()` and ambient functions to use buffer system
3. Keep old procedural functions renamed as `_proceduralFallback_*`
4. Update `sw.js` with audio files + cache bump
5. Add `CREDITS.md` with source attribution
6. Test: bells play correctly, ambient loops seamlessly, custom upload still works, offline works, error fallback works

---

## Success Criteria

- [ ] All 3 bell types play real recorded sounds (normal + completion variants)
- [ ] All 8 ambient types play real recorded loops
- [ ] Audio quality is noticeably richer than current oscillator synthesis
- [ ] Custom upload still works
- [ ] PWA works offline (audio pre-cached)
- [ ] Volume control works
- [ ] Fade-in/fade-out on ambient works
- [ ] No pops/clicks at loop boundaries or sound start/end
- [ ] Error fallback to procedural synthesis works
- [ ] `CREDITS.md` present with attribution
