# Task 3: Add Audio Buffer Infrastructure — Report

**Status:** DONE
**Commit:** `f974f59` feat: add audio buffer cache infrastructure with lazy loading

## Changes Made

### Step 1: Extended `state.audio` with buffer cache properties (app.js:29-43)
Added three new properties to the `audio` state object:
- `bufferCache: new Map()` — caches decoded AudioBuffer objects by `path.format` key
- `activeAmbientSource: null` — tracks the current ambient AudioBufferSourceNode for clean stop
- `activeAmbientGain: null` — tracks the current ambient gain node for fade-out

### Step 2: Added buffer infrastructure functions (app.js:861-898)
Inserted after `initAudioContext()` and before `playBellSound()`:
- `getAudioBuffer(path, format)` — fetches audio file, decodes via Web Audio API, caches in `bufferCache` Map, returns cached buffer on repeat calls
- `preloadAudioFiles()` — initializes audio context, then pre-fetches all 6 bell sound files in parallel (errors silently caught with `.catch(() => null)`)

### Step 3: Added preload call to app init (app.js:253)
Called `preloadAudioFiles()` in the `init()` function after `initCustomSoundUpload()`. The function handles its own `initAudioContext()` call internally.

## Test Results
**71 tests passed, 0 failed** (3 test suites)

The `fetch is not defined` console errors in jsdom are expected — `preloadAudioFiles` catches these gracefully via `.catch(() => null)` so all existing tests continue passing.

## Notes
- The old oscillator-based `playBellSound` and ambient functions remain untouched (Tasks 4-5 will replace them)
- `AUDIO_FILE_MAP` and `getAudioFormat()` from Task 2 are referenced globally
- Buffer cache uses a simple `Map` with `path.format` keys (e.g., `bells/singing-bowl.mp3`)
