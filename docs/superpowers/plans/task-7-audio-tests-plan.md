# Task 7: Add Tests for New Audio Functions — Implementation Plan

## Status: READY TO EXECUTE

## Summary
Create `dev/tests/audio.test.js` testing the new audio buffer system (Tasks 1-6 already complete). The plan file provides the exact test code. Follow the existing test patterns from `app.smoke.test.js`.

## Steps

### Step 1: Create `dev/tests/audio.test.js`
- File: `C:\Github\(Web app)\PulseDrift\dev\tests\audio.test.js`
- Content: Exactly as provided in the task description (748 lines)
- Key additions vs existing tests:
  - `createBufferSource` mock (returns `{ buffer, loop, connect, start, stop }`)
  - `decodeAudioData` mock (returns `Promise.resolve({ duration: 5 })`)
  - Mock `window.fetch` intercepting `audio/*` URLs → fake `ArrayBuffer`
  - Accessor properties for `AUDIO_FILE_MAP`, `getAudioFormat`, `playBellSound`, `startAmbientSound`, `stopAmbientSound`, `preloadAudioFiles`

### Step 2: Run new tests
```bash
npx jest --config dev/jest.config.js dev/tests/audio.test.js -v
```

### Step 3: Run full test suite
```bash
npx jest --config dev/jest.config.js
```

### Step 4: Commit
```bash
git add dev/tests/audio.test.js
git commit -m "test: add tests for audio buffer system, format detection, and file map"
```

## Test Coverage
- **Audio Format Detection**: `getAudioFormat()` returns `'mp3'` or `'ogg'`
- **Audio File Map**: Correct key→path mappings for all 11 sounds, including `brownNoise` → `brown-noise`
- **Buffer Playback**: Edge cases — silence handling (bell + ambient), `stopAmbientSound` with null source

## Key Observations
- `AUDIO_FILE_MAP` already exists in `constants.js:123`
- `getAudioBuffer`, `preloadAudioFiles`, `playBellSound`, `startAmbientSound`, `stopAmbientSound` already exist in `app.js`
- State has `bufferCache: new Map()`, `activeAmbientSource: null`, `activeAmbientGain: null` at `app.js:39-42`
- The mock `AudioContext` already handles `createGain` and `createOscillator`; the new test adds `createBufferSource` and `decodeAudioData`
- No new dependencies required
