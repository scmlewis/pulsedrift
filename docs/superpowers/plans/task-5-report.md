# Task 5 Report: Replace Ambient Sound System with Buffer-Based Playback

## Status: DONE

## Changes Made

### Step 1: Renamed Procedural Functions as Fallbacks
Renamed 8 procedural ambient functions (do NOT delete, just rename):
- `createRainSound` → `_proceduralFallback_rain`
- `createWavesSound` → `_proceduralFallback_waves`
- `createForestSound` → `_proceduralFallback_forest`
- `createWindSound` → `_proceduralFallback_wind`
- `createZenMusic` → `_proceduralFallback_zen`
- `createFireSound` → `_proceduralFallback_fire`
- `createBrownNoiseSound` → `_proceduralFallback_brownNoise`
- `createChantsSound` → `_proceduralFallback_chants`

### Step 2: Replaced startAmbientSound
Replaced the entire `startAmbientSound` function with buffer-based implementation that:
- Uses `getAudioBuffer()` to fetch and decode audio files
- Creates `AudioBufferSourceNode` with `loop: true`
- Applies fade-in via `setTargetAtTime`
- Stores `activeAmbientSource` and `activeAmbientGain` for `stopAmbientSound`
- Falls back to `_proceduralFallback_ambient` on fetch/decode failure

Added `_proceduralFallback_ambient()` dispatcher that routes to renamed procedural functions.

### Step 3: Replaced stopAmbientSound
Replaced the node-array iteration with single-source tracking:
- Checks `activeAmbientSource` exists
- Applies 2-second linear fade-out on gain
- Schedules `source.stop()` after fade
- Resets tracking properties

### Step 4: Updated Custom Ambient Sound Playback
Updated `playCustomAmbientSound()` to track active source/gain:
- Removed reference to undefined `activeAmbientSources` variable
- Sets `state.audio.activeAmbientSource` (wrapper with `stop`/`disconnect`)
- Sets `state.audio.activeAmbientGain` to `gainNode`
- Compatible with new `stopAmbientSound` fade-out logic

### Section Header Updated
Changed comment from `Ambient Sound System (Procedural)` to `Ambient Sound System (Buffer-Based + Procedural Fallback)`

## Files Modified
- `app.js` — 74 insertions, 34 deletions

## Test Results
- **71 tests passed** across 3 test suites
- No regressions introduced
- `fetch is not defined` console errors are expected jsdom limitations (gracefully caught by error handlers)

## Commit
- `85fe43e` — `feat: replace procedural ambient synthesis with buffer-based playback`

## Concerns
None. All changes follow the plan specification exactly. The procedural fallback functions are preserved intact for error recovery. The custom sound hook at line ~2760 correctly wraps the new `startAmbientSound` via closure capture.
