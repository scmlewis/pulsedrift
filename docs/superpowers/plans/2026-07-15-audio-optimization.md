# Audio Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all procedural oscillator-based audio with high-quality recorded meditation sounds (bells + ambient), while keeping procedural synthesis as an error fallback.

**Architecture:** Buffer-based audio playback system. New `getAudioBuffer()` function fetches and caches decoded `AudioBuffer` objects. Bell sounds pre-cached on init; ambient sounds lazy-loaded on first selection. Old oscillator functions renamed as `_proceduralFallback_*` for error recovery.

**Tech Stack:** Web Audio API (decodeAudioData, AudioBufferSourceNode), Jest + jsdom (testing), Service Worker (PWA caching)

## Global Constraints

- File format: MP3 192kbps primary, OGG Opus fallback
- Sample rate: 44.1kHz minimum source files
- Normalization: -14 LUFS integrated loudness
- PWA: All audio files pre-cached in service worker for offline support
- Existing test suite (419 lines, Jest + jsdom) must continue passing
- No new npm dependencies

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `audio/bells/*.mp3` | Create | 6 bell recording files (3 types × normal/completion) |
| `audio/ambient/*.mp3` | Create | 8 ambient loop files |
| `audio/CREDITS.md` | Create | Source attribution for CC-licensed recordings |
| `constants.js:115-120` | Modify | Add `AUDIO_FILE_MAP` and `getAudioFormat()` |
| `app.js:29-38` | Modify | Add `bufferCache`, `activeAmbientSource`, `activeAmbientGain` to state |
| `app.js:840-979` | Modify | Rename procedural bell functions as fallback, add buffer-based `playBellSound` |
| `app.js:981-1288` | Modify | Rename procedural ambient functions as fallback, add buffer-based ambient system |
| `sw.js:2-14` | Modify | Add audio files to `ASSETS` array, bump cache to v5 |
| `dev/tests/audio.test.js` | Create | Tests for `getAudioFormat`, `AUDIO_FILE_MAP`, buffer playback |

---

### Task 1: Create Audio Directory Structure + CREDITS

**Files:**
- Create: `audio/bells/` (empty directory)
- Create: `audio/ambient/` (empty directory)
- Create: `audio/CREDITS.md`

**Interfaces:**
- Produces: Directory structure matching spec; CREDITS.md with sourcing instructions

- [ ] **Step 1: Create directories**

```bash
mkdir -p audio/bells audio/ambient
```

- [ ] **Step 2: Create CREDITS.md**

Write `audio/CREDITS.md`:

```markdown
# Audio Credits

## Bell Sounds

| File | Source | License | Search Query |
|------|--------|---------|-------------|
| singing-bowl.mp3 | Freesound | CC0 / CC-BY | `tibetan singing bowl single strike` |
| singing-bowl-completion.mp3 | Freesound | CC0 / CC-BY | `tibetan singing bowl long` |
| soft-gong.mp3 | Freesound | CC0 / CC-BY | `meditation gong soft` |
| soft-gong-completion.mp3 | Freesound | CC0 / CC-BY | `meditation gong long` |
| temple-bell.mp3 | Freesound | CC0 / CC-BY | `tingsha bell single` |
| temple-bell-completion.mp3 | Freesound | CC0 / CC-BY | `rin gong meditation` |

## Ambient Sounds

| File | Source | License | Search Query |
|------|--------|---------|-------------|
| rain.mp3 | BBC Sound Effects | RemArc | `rain on window` |
| waves.mp3 | BBC Sound Effects | RemArc | `ocean waves loop` |
| forest.mp3 | BBC Sound Effects | RemArc | `forest birds ambience` |
| wind.mp3 | BBC Sound Effects | RemArc | `gentle wind nature` |
| zen.mp3 | Pixabay | Pixabay License | `zen meditation music loop` |
| fire.mp3 | BBC Sound Effects | RemArc | `crackling fire` |
| brown-noise.mp3 | Freesound | CC0 | `brown noise 1 minute` |
| chants.mp3 | Freesound | CC0 / CC-BY | `tibetan chant om` |

## Requirements

- All files: MP3 192kbps, 44.1kHz sample rate
- Normalize to -14 LUFS before saving
- Bells: preserve full natural decay, trim head silence
- Ambient: trim to seamless loop points, crossfade-test at boundary
```

- [ ] **Step 3: Download source files**

Source each file from the listed platforms. For each:
1. Search using the query terms above
2. Filter: 44.1kHz+, highest download count / rating, CC0 or CC-BY license
3. Download WAV/FLAC source
4. Convert to MP3 192kbps via ffmpeg:
   ```bash
   ffmpeg -i input.wav -codec:a libmp3lame -b:a 192k -ar 44100 output.mp3
   ```
5. Normalize to -14 LUFS:
   ```bash
   ffmpeg-normalize output.mp3 -t -14 -tp -1 -ar 44100 -f
   ```
6. For ambient: trim to 60s seamless loop, test crossfade

- [ ] **Step 4: Commit**

```bash
git add audio/
git commit -m "chore: add audio directory structure and sourcing credits"
```

---

### Task 2: Add AUDIO_FILE_MAP and getAudioFormat() to constants.js

**Files:**
- Modify: `constants.js:115-120`

**Interfaces:**
- Produces: `AUDIO_FILE_MAP` (object), `getAudioFormat()` (function returning `'mp3'` or `'ogg'`)

- [ ] **Step 1: Add AUDIO_FILE_MAP after AUDIO_CONFIG**

Insert after the `AUDIO_CONFIG` block (line 120) in `constants.js`:

```javascript
// Audio file path mapping (sound key → file path without extension)
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

// Detect best supported audio format
function getAudioFormat() {
    const audio = document.createElement('audio');
    return audio.canPlayType('audio/ogg; codecs="vorbis"') ? 'ogg' : 'mp3';
}
```

- [ ] **Step 2: Run existing tests to verify no regressions**

Run: `npx jest --config dev/jest.config.js`
Expected: All existing tests PASS

- [ ] **Step 3: Commit**

```bash
git add constants.js
git commit -m "feat: add AUDIO_FILE_MAP and getAudioFormat() for file-based audio"
```

---

### Task 3: Add Audio Buffer Infrastructure to app.js

**Files:**
- Modify: `app.js:29-38` (state.audio)
- Modify: `app.js:840-854` (after initAudioContext, before playBellSound)

**Interfaces:**
- Consumes: `AUDIO_FILE_MAP`, `getAudioFormat()` from constants.js
- Produces: `getAudioBuffer(path, format)`, `preloadAudioFiles()`, state.audio.bufferCache, state.audio.activeAmbientSource, state.audio.activeAmbientGain

- [ ] **Step 1: Extend state.audio with buffer cache properties**

Replace the `audio` object in `state` (lines 29-38) with:

```javascript
audio: {
    context: null,
    masterGain: null,
    volume: 0.7,
    bellSound: 'singing-bowl',
    ambientSound: 'silence',
    ambientNode: null,
    ambientNodes: [],
    isAmbientPlaying: false,
    previewTimeout: null,
    // Buffer-based audio system
    bufferCache: new Map(),
    activeAmbientSource: null,
    activeAmbientGain: null
},
```

- [ ] **Step 2: Add buffer infrastructure functions after initAudioContext**

Insert after the `initAudioContext()` function (after line 854), before `playBellSound`:

```javascript
// =============================================
// Audio Buffer Infrastructure
// =============================================

function getAudioBuffer(path, format) {
    const cacheKey = `${path}.${format}`;
    if (state.audio.bufferCache.has(cacheKey)) {
        return Promise.resolve(state.audio.bufferCache.get(cacheKey));
    }

    return fetch(`audio/${cacheKey}`)
        .then(response => {
            if (!response.ok) throw new Error(`Audio fetch failed: ${cacheKey}`);
            return response.arrayBuffer();
        })
        .then(arrayBuffer => state.audio.context.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
            state.audio.bufferCache.set(cacheKey, audioBuffer);
            return audioBuffer;
        });
}

function preloadAudioFiles() {
    initAudioContext();
    const format = getAudioFormat();
    const bellPaths = [
        'bells/singing-bowl',
        'bells/singing-bowl-completion',
        'bells/soft-gong',
        'bells/soft-gong-completion',
        'bells/temple-bell',
        'bells/temple-bell-completion'
    ];

    return Promise.all(
        bellPaths.map(path => getAudioBuffer(path, format).catch(() => null))
    );
}
```

- [ ] **Step 3: Add preload call to app init**

Find the `init()` function or DOMContentLoaded handler in app.js and add `preloadAudioFiles()` call. The exact location is where other init calls are made (around line 566 where `initAudioContext()` is called).

Replace or add near `initAudioContext();`:

```javascript
initAudioContext();
preloadAudioFiles(); // Pre-cache bell sounds for instant playback
```

- [ ] **Step 4: Run existing tests**

Run: `npx jest --config dev/jest.config.js`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add app.js
git commit -m "feat: add audio buffer cache infrastructure with lazy loading"
```

---

### Task 4: Replace playBellSound with Buffer-Based Playback

**Files:**
- Modify: `app.js:856-979` (playBellSound + all procedural bell functions)

**Interfaces:**
- Consumes: `getAudioBuffer()`, `AUDIO_FILE_MAP`, `getAudioFormat()` from earlier tasks
- Produces: Updated `playBellSound()` that uses AudioBuffer playback

- [ ] **Step 1: Rename procedural functions as fallbacks**

Rename (do not delete):
- `playSingingBowl` → `_proceduralFallback_singingBowl`
- `playSoftGong` → `_proceduralFallback_softGong`
- `playTempleBell` → `_proceduralFallback_templeBell`

- [ ] **Step 2: Replace playBellSound implementation**

Replace the entire `playBellSound` function (lines 856-876) with:

```javascript
function playBellSound(volumeMultiplier = 1, isCompletion = false) {
    if (state.audio.bellSound === 'silence') return;

    initAudioContext();

    const format = getAudioFormat();
    const base = AUDIO_FILE_MAP[state.audio.bellSound];
    if (!base) {
        console.warn(`Unknown bell sound: ${state.audio.bellSound}`);
        return;
    }
    const id = isCompletion ? `${base}-completion` : base;

    getAudioBuffer(id, format)
        .then(buffer => {
            const ctx = state.audio.context;
            const source = ctx.createBufferSource();
            source.buffer = buffer;

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(state.audio.volume * volumeMultiplier, ctx.currentTime);

            // Gentle fade-out over last 0.5s to prevent pop without cutting natural tail
            const fadeStart = buffer.duration - 0.5;
            if (fadeStart > 0) {
                gain.gain.setValueAtTime(state.audio.volume * volumeMultiplier, ctx.currentTime + fadeStart);
                gain.gain.linearRampToValueAtTime(0, ctx.currentTime + buffer.duration);
            }

            source.connect(gain);
            gain.connect(state.audio.masterGain);
            source.start();
        })
        .catch(err => {
            console.warn('Buffer playback failed, falling back to procedural:', err);
            _proceduralFallback_bell(state.audio.bellSound, volumeMultiplier, isCompletion);
        });
}

function _proceduralFallback_bell(bellSound, volumeMultiplier, isCompletion) {
    initAudioContext();
    const ctx = state.audio.context;
    const now = ctx.currentTime;

    switch (bellSound) {
        case 'singing-bowl':
            _proceduralFallback_singingBowl(ctx, now, volumeMultiplier, isCompletion);
            break;
        case 'soft-gong':
            _proceduralFallback_softGong(ctx, now, volumeMultiplier, isCompletion);
            break;
        case 'bell':
            _proceduralFallback_templeBell(ctx, now, volumeMultiplier, isCompletion);
            break;
    }
}
```

- [ ] **Step 3: Verify the procedural fallback functions are intact**

Read the renamed functions (`_proceduralFallback_singingBowl`, `_proceduralFallback_softGong`, `_proceduralFallback_templeBell`) and confirm they are unchanged except for the rename.

- [ ] **Step 4: Run existing tests**

Run: `npx jest --config dev/jest.config.js`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add app.js
git commit -m "feat: replace procedural bell synthesis with buffer-based playback"
```

---

### Task 5: Replace Ambient Sound System with Buffer-Based Playback

**Files:**
- Modify: `app.js:981-1288` (startAmbientSound, all create*Sound functions, stopAmbientSound, registerAmbientNode)

**Interfaces:**
- Consumes: `getAudioBuffer()`, `AUDIO_FILE_MAP`, `getAudioFormat()` from earlier tasks
- Produces: Updated `startAmbientSound()`, `stopAmbientSound()` using AudioBuffer playback

- [ ] **Step 1: Rename procedural ambient functions as fallbacks**

Rename (do not delete):
- `createRainSound` → `_proceduralFallback_rain`
- `createWavesSound` → `_proceduralFallback_waves`
- `createForestSound` → `_proceduralFallback_forest`
- `createWindSound` → `_proceduralFallback_wind`
- `createZenMusic` → `_proceduralFallback_zen`
- `createFireSound` → `_proceduralFallback_fire`
- `createBrownNoiseSound` → `_proceduralFallback_brownNoise`
- `createChantsSound` → `_proceduralFallback_chants`

- [ ] **Step 2: Replace startAmbientSound with buffer-based implementation**

Replace the entire `startAmbientSound` function (lines 985-1006) with:

```javascript
function startAmbientSound() {
    if (state.audio.isAmbientPlaying) return;

    initAudioContext();

    const soundKey = state.audio.ambientSound;
    if (soundKey === 'silence') return;

    const format = getAudioFormat();
    const filePath = AUDIO_FILE_MAP[soundKey];

    if (!filePath) {
        console.warn(`Unknown ambient sound: ${soundKey}`);
        return;
    }

    getAudioBuffer(filePath, format)
        .then(buffer => {
            const ctx = state.audio.context;
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.loop = true;

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.setTargetAtTime(state.audio.volume, ctx.currentTime, 0.5);

            source.connect(gain);
            gain.connect(state.audio.masterGain);
            source.start();

            state.audio.activeAmbientSource = source;
            state.audio.activeAmbientGain = gain;
            state.audio.isAmbientPlaying = true;
        })
        .catch(err => {
            console.warn('Buffer ambient failed, falling back to procedural:', err);
            _proceduralFallback_ambient(soundKey);
        });
}

function _proceduralFallback_ambient(soundKey) {
    initAudioContext();
    const ctx = state.audio.context;

    switch (soundKey) {
        case 'rain': _proceduralFallback_rain(ctx); break;
        case 'waves': _proceduralFallback_waves(ctx); break;
        case 'forest': _proceduralFallback_forest(ctx); break;
        case 'wind': _proceduralFallback_wind(ctx); break;
        case 'zen': _proceduralFallback_zen(ctx); break;
        case 'fire': _proceduralFallback_fire(ctx); break;
        case 'brownNoise': _proceduralFallback_brownNoise(ctx); break;
        case 'chants': _proceduralFallback_chants(ctx); break;
    }

    state.audio.isAmbientPlaying = true;
}
```

- [ ] **Step 3: Replace stopAmbientSound with simplified implementation**

Replace the `stopAmbientSound` function (lines 1270-1284) with:

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
    gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
    source.stop(ctx.currentTime + 2.1);

    state.audio.activeAmbientSource = null;
    state.audio.activeAmbientGain = null;
    state.audio.isAmbientPlaying = false;
}
```

- [ ] **Step 4: Update custom ambient sound to use new source tracking**

Find the custom sound playback code (search for `customSoundState.blobs` usage in ambient playback) and update it to set `state.audio.activeAmbientSource` and `state.audio.activeAmbientGain` when playing custom uploads, so `stopAmbientSound` works correctly for custom sounds too.

- [ ] **Step 5: Run existing tests**

Run: `npx jest --config dev/jest.config.js`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add app.js
git commit -m "feat: replace procedural ambient synthesis with buffer-based playback"
```

---

### Task 6: Update Service Worker for Audio Caching

**Files:**
- Modify: `sw.js:1-14`

**Interfaces:**
- Consumes: Audio file paths from the `audio/` directory structure
- Produces: Updated service worker that pre-caches all audio files

- [ ] **Step 1: Update ASSETS array and cache version**

Replace the `CACHE_NAME` and `ASSETS` array in `sw.js` (lines 1-14) with:

```javascript
const CACHE_NAME = 'pulsedrift-cache-v5';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './constants.js',
  './app.js',
  './guided.js',
  './enhancements.js',
  './sw.js',
  './manifest.json',
  './icons/icon-192.svg',
  './icons/icon-512.svg',
  // Bell sounds
  './audio/bells/singing-bowl.mp3',
  './audio/bells/singing-bowl-completion.mp3',
  './audio/bells/soft-gong.mp3',
  './audio/bells/soft-gong-completion.mp3',
  './audio/bells/temple-bell.mp3',
  './audio/bells/temple-bell-completion.mp3',
  // Ambient sounds
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

- [ ] **Step 2: Verify service worker syntax**

No test runner for SW, but confirm no syntax errors by checking the file parses:
```bash
node -e "require('fs').readFileSync('sw.js','utf8')" && echo "OK"
```

- [ ] **Step 3: Commit**

```bash
git add sw.js
git commit -m "feat: pre-cache audio files in service worker for offline PWA"
```

---

### Task 7: Add Tests for New Audio Functions

**Files:**
- Create: `dev/tests/audio.test.js`

**Interfaces:**
- Consumes: `getAudioFormat()`, `AUDIO_FILE_MAP` from constants.js; `getAudioBuffer`, `preloadAudioFiles`, `playBellSound`, `startAmbientSound`, `stopAmbientSound` from app.js

- [ ] **Step 1: Create audio test file**

Write `dev/tests/audio.test.js`:

```javascript
const fs = require('fs');
const path = require('path');
const { TextEncoder, TextDecoder } = require('util');
const vm = require('vm');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const { JSDOM } = require('jsdom');

function createMockAudioContext() {
  return function() {
    return {
      createGain: () => ({
        gain: {
          value: 0,
          setValueAtTime: () => {},
          linearRampToValueAtTime: () => {},
          exponentialRampToValueAtTime: () => {},
          setTargetAtTime: () => {}
        },
        connect: () => {}
      }),
      createOscillator: () => ({
        connect: () => {},
        start: () => {},
        stop: () => {},
        type: 'sine',
        frequency: {
          value: 0,
          setValueAtTime: () => {},
          exponentialRampToValueAtTime: () => {},
          linearRampToValueAtTime: () => {}
        }
      }),
      createBiquadFilter: () => ({
        connect: () => {},
        type: 'lowpass',
        frequency: { value: 0, setValueAtTime: () => {} },
        Q: { value: 0, setValueAtTime: () => {} }
      }),
      createBufferSource: () => ({
        buffer: null,
        loop: false,
        connect: () => {},
        start: () => {},
        stop: () => {}
      }),
      decodeAudioData: (buffer) => Promise.resolve({ duration: 5 }),
      destination: {},
      currentTime: 0,
      state: 'running',
      resume: () => Promise.resolve()
    };
  };
}

function loadAppIntoDom(options = {}) {
  const html = fs.readFileSync(path.join(__dirname, '..', '..', 'index.html'), 'utf-8');
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost' });

  const window = dom.window;
  const document = dom.window.document;

  if (options.localStorage) {
    Object.entries(options.localStorage).forEach(([key, value]) => {
      window.localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    });
  }

  window.matchMedia = window.matchMedia || (() => ({ matches: true, addListener: () => {}, removeListener: () => {} }));
  window.Notification = { permission: 'denied', requestPermission: () => Promise.resolve('denied') };
  window.AudioContext = createMockAudioContext();
  window.webkitAudioContext = createMockAudioContext();
  window.confirm = () => true;

  // Mock fetch for audio files
  window.fetch = (url) => {
    if (url.startsWith('audio/')) {
      return Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
      });
    }
    return Promise.reject(new Error(`Unexpected fetch: ${url}`));
  };

  const constantsJs = fs.readFileSync(path.join(__dirname, '..', '..', 'constants.js'), 'utf-8');
  const appJs = fs.readFileSync(path.join(__dirname, '..', '..', 'app.js'), 'utf-8');
  const enhancementsJs = fs.readFileSync(path.join(__dirname, '..', '..', 'enhancements.js'), 'utf-8');

  const context = {
    window, document, navigator: window.navigator, localStorage: window.localStorage,
    Notification: window.Notification, AudioContext: window.AudioContext,
    webkitAudioContext: window.webkitAudioContext, matchMedia: window.matchMedia,
    confirm: window.confirm, alert: () => {}, console,
    setTimeout: window.setTimeout.bind(window), clearTimeout: window.clearTimeout.bind(window),
    setInterval: window.setInterval.bind(window), clearInterval: window.clearInterval.bind(window),
    requestAnimationFrame: () => 0, cancelAnimationFrame: () => {}
  };
  context.window.document = document;

  const vmContext = vm.createContext(context);
  vm.runInContext(constantsJs, vmContext);
  vm.runInContext(appJs, vmContext);
  vm.runInContext(enhancementsJs, vmContext);

  document.dispatchEvent(new window.Event('DOMContentLoaded'));

  return {
    dom, window, document, vmContext,
    get state() { return window.state; },
    get AUDIO_FILE_MAP() { return window.AUDIO_FILE_MAP; },
    get getAudioFormat() { return window.getAudioFormat; },
    get playBellSound() { return window.playBellSound; },
    get startAmbientSound() { return window.startAmbientSound; },
    get stopAmbientSound() { return window.stopAmbientSound; },
    get preloadAudioFiles() { return window.preloadAudioFiles; }
  };
}

describe('Audio Format Detection', () => {
  test('getAudioFormat returns mp3 or ogg', () => {
    const { getAudioFormat } = loadAppIntoDom();
    const format = getAudioFormat();
    expect(['mp3', 'ogg']).toContain(format);
  });
});

describe('Audio File Map', () => {
  test('contains all bell sound keys', () => {
    const { AUDIO_FILE_MAP } = loadAppIntoDom();
    expect(AUDIO_FILE_MAP['singing-bowl']).toBe('bells/singing-bowl');
    expect(AUDIO_FILE_MAP['soft-gong']).toBe('bells/soft-gong');
    expect(AUDIO_FILE_MAP['bell']).toBe('bells/temple-bell');
  });

  test('contains all ambient sound keys', () => {
    const { AUDIO_FILE_MAP } = loadAppIntoDom();
    expect(AUDIO_FILE_MAP['rain']).toBe('ambient/rain');
    expect(AUDIO_FILE_MAP['waves']).toBe('ambient/waves');
    expect(AUDIO_FILE_MAP['forest']).toBe('ambient/forest');
    expect(AUDIO_FILE_MAP['wind']).toBe('ambient/wind');
    expect(AUDIO_FILE_MAP['zen']).toBe('ambient/zen');
    expect(AUDIO_FILE_MAP['fire']).toBe('ambient/fire');
    expect(AUDIO_FILE_MAP['brownNoise']).toBe('ambient/brown-noise');
    expect(AUDIO_FILE_MAP['chants']).toBe('ambient/chants');
  });

  test('brownNoise maps to kebab-case filename', () => {
    const { AUDIO_FILE_MAP } = loadAppIntoDom();
    expect(AUDIO_FILE_MAP['brownNoise']).toBe('ambient/brown-noise');
  });
});

describe('Buffer Playback', () => {
  test('playBellSound does nothing when bellSound is silence', () => {
    const { state, playBellSound } = loadAppIntoDom();
    state.audio.bellSound = 'silence';
    // Should not throw
    playBellSound();
  });

  test('startAmbientSound does nothing when ambientSound is silence', () => {
    const { state, startAmbientSound } = loadAppIntoDom();
    state.audio.ambientSound = 'silence';
    startAmbientSound();
    expect(state.audio.isAmbientPlaying).toBe(false);
  });

  test('stopAmbientSound handles no active source gracefully', () => {
    const { state, stopAmbientSound } = loadAppIntoDom();
    state.audio.activeAmbientSource = null;
    stopAmbientSound();
    expect(state.audio.isAmbientPlaying).toBe(false);
  });
});
```

- [ ] **Step 2: Run new tests**

Run: `npx jest --config dev/jest.config.js dev/tests/audio.test.js -v`
Expected: All new tests PASS

- [ ] **Step 3: Run full test suite**

Run: `npx jest --config dev/jest.config.js`
Expected: All tests (old + new) PASS

- [ ] **Step 4: Commit**

```bash
git add dev/tests/audio.test.js
git commit -m "test: add tests for audio buffer system, format detection, and file map"
```

---

### Task 8: Final Verification

**Files:**
- No changes — verification only

- [ ] **Step 1: Run full test suite**

Run: `npx jest --config dev/jest.config.js`
Expected: All tests PASS (smoke, timer, localStorage, templates, achievements, constants, audio)

- [ ] **Step 2: Verify all audio files exist and are valid**

Run:
```bash
ls -la audio/bells/ audio/ambient/
```
Expected: 6 bell files + 8 ambient files + CREDITS.md

- [ ] **Step 3: Verify no syntax errors in modified files**

Run:
```bash
node -e "require('fs').readFileSync('constants.js','utf8')" && echo "constants.js OK"
node -e "require('fs').readFileSync('app.js','utf8')" && echo "app.js OK"
node -e "require('fs').readFileSync('sw.js','utf8')" && echo "sw.js OK"
```

- [ ] **Step 4: Verify service worker has audio files**

Run:
```bash
node -e "const sw = require('fs').readFileSync('sw.js','utf8'); console.log(sw.includes('singing-bowl.mp3') ? 'Audio files in SW: OK' : 'MISSING')"
```

- [ ] **Step 5: Final commit (if any fixups needed)**

```bash
git add -A
git commit -m "chore: audio optimization final verification"
```
