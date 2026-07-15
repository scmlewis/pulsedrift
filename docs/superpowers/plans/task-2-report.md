# Task 2 Report: Add AUDIO_FILE_MAP and getAudioFormat()

## Status: DONE

## What was done
- Inserted `AUDIO_FILE_MAP` (11 sound key → file path mappings) after `AUDIO_CONFIG` block in `constants.js`
- Inserted `getAudioFormat()` function that detects ogg vs mp3 support via `document.createElement('audio')`
- Added exports for both to the `window` block at the end of the file

## Files modified
- `constants.js` — 23 lines added (AUDIO_FILE_MAP block + getAudioFormat function + window exports)

## Commit
- `be1275a` — `feat: add AUDIO_FILE_MAP and getAudioFormat() for file-based audio`

## Test results
- 3 suites, 71 tests — all passing

## Concerns
- None. The insertion is clean, follows existing code style, and all tests pass.
