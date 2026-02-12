# PulseDrift Meditation & Zen Enhancements

## Overview
This document describes the meditation and zen-focused enhancements added to PulseDrift to create a more cohesive and immersive guided meditation experience.

## New Features

### 1. **Guided Breathing with TTS (Text-to-Speech)**
- **File**: `guided.js` (new module)
- **Functions**: `playBreathingPhaseGuidance()`, `playBreathingIntro()`
- **Description**: Real-time voice guidance for each breathing phase (inhale, hold, exhale)
- **How it works**:
  - When a user starts a breathing exercise, the app speaks cues synchronized to the breathing pattern
  - Supports all breathing patterns: 4-4 (calm), 4-7-8 (relaxing), 4-4-4-4 (box breathing)
  - Intro guidance plays when the breathing modal opens
  - Uses Web Speech API with fallback support for browsers
- **Settings**: Controlled via `guidedState.breathingGuidanceEnabled` (enabled by default)

### 2. **Mantra & Affirmation System**
- **Functions**: `startMantraReminders()`, `playMantra()`, `stopMantraReminders()`, `getRandomMantra()`
- **Description**: Periodic spoken affirmations during meditation sessions
- **Default mantras**:
  - "I am calm and present"
  - "With each breath, I find peace"
  - "Let this moment be enough"
  - "I breathe in peace, I breathe out tension"
  - "This too shall pass"
  - "I am exactly where I need to be"
- **Interval**: Every 5 minutes (configurable)
- **Optional chime**: Soft bell sound can precede the mantra
- **Integration**: Automatically starts when a timer session begins (if breathing guidance enabled)

### 3. **Ambient Sound Fader / Crossfader**
- **Functions**: `fadeInAmbientSound()`, `fadeOutAmbientSound()`
- **Description**: Smooth fade in/out transitions for ambient sounds to avoid abrupt audio changes
- **Fade durations**: 
  - Fade-in: 2 seconds (when session starts)
  - Fade-out: 2 seconds (when session pauses)
- **Implementation**: Uses Web Audio API gain smoothing
- **Benefit**: Creates a more polished, immersive experience

### 4. **Session Reflection Prompts**
- **Function**: `showSessionReflectionPrompt()`
- **Description**: Post-session guided reflection questions to deepen mindfulness practice
- **Reflection prompts**:
  - "How do you feel now compared to before your session?"
  - "What insights came up during your practice?"
  - "What will you take with you from this session?"
  - "Did you notice any shifts in your mind or body?"
  - "How can you extend this calm into your day?"
- **Display**: Shows on completion overlay before user clicks "Continue"
- **Integration**: Saves to journal entries in enhancements.js

### 5. **Guided Session Completion**
- **Function**: `playSessionCompletionGuidance()`
- **Description**: A calming verbal wrap-up sequence after meditation completes
- **Completion cues**:
  - "Your meditation practice is complete."
  - "Take a few moments to notice how you feel."
  - "Carry this peace with you throughout your day."
  - "Namaste."
- **Autoplay**: Plays asynchronously after the completion bell
- **Non-blocking**: Doesn't prevent user interaction

### 6. **Visual Breathing Enhancements**
- **Function**: `updateBreathingVisualsWithPhase()`
- **Description**: Synchronizes subtle visual effects with breathing phases
- **Visual effects**:
  - **Inhale**: Increased opacity (0.9) with brightness boost
  - **Hold**: Mid opacity (0.8)
  - **Exhale**: Reduced opacity (0.65)
- **Where visible**: Breathing modals and inline breathing circle during timer
- **Accessibility**: Respects `prefers-reduced-motion` media query (smooth transitions)

### 7. **Daily Micro-Reflections / Inspiring Quotes**
- **Function**: `getRandomMicroReflection()`, `showMicroReflectionToast()`
- **Description**: Brief inspiring prompts displayed as toast notifications
- **Sample reflections**:
  - "What are you grateful for today?"
  - "How can you bring more presence to this moment?"
  - "Breathe deeply. You are enough."
  - "Release what you cannot control."
  - "How can you practice self-compassion today?"
- **Display style**: Green-tinted toast (zen accent color) at bottom of screen
- **Auto-dismiss**: Disappears after 4 seconds
- **Extension point**: Can be triggered before/after sessions

## Architecture

### New Module: `guided.js`
A self-contained module for all meditation guidance features:
- TTS voice synthesis and caching
- Breathing phase scripts and guidance
- Mantra system with interval management
- Session reflection and completion flows
- Visual breathing synchronization hooks
- Storage integration for user settings

### Integration Points

1. **app.js**
   - Added `mantraIntervalId` to timer state
   - Updated `init()` to call `initGuidedFeatures()`
   - Modified `startTimer()` to:
     - Fade in ambient sounds with `fadeInAmbientSound()`
     - Start mantra reminders with `startMantraReminders()`
   - Modified `pauseTimer()` to:
     - Fade out with `fadeOutAmbientSound()`
     - Stop mantras with `stopMantraReminders()`
   - Updated `completeTimer()` to:
     - Play guided completion sequence
     - Show reflection prompt
     - Stop mantras
   - Enhanced `runBreathingCycle()` to:
     - Play breathing phase guidance
     - Sync visuals with `updateBreathingVisualsWithPhase()`
   - Enhanced `openBreathingModal()` to play intro guidance

2. **index.html**
   - Added `<script src="guided.js"></script>` import
   - Added reflection prompt element: `<div class="reflection-prompt" id="reflectionPrompt">`

3. **styles.css**
   - Added `.reflection-prompt` styling with glow animation
   - Added `.zen-reflection-toast` for micro-reflection toasts
   - Added breathing phase opacity shifts (`.breath-circle-large.inhale`, etc.)
   - Added helper animations: `@keyframes glow-pulse`, `slideUp`, `fadeInUp`, `fadeOutDown`

4. **enhancements.js**
   - Existing `enhanceCompleteHandler()` integrates with reflection prompts
   - Journal saving captures mood and reflections from sessions

5. **constants.js**
   - Added `GUIDED_SETTINGS` storage key
   - Added `GUIDED_CONFIG` with TTS defaults
   - Updated `UI_TIMING` with ambient fade durations

## Settings & Persistence

All guided settings are stored in localStorage:

```javascript
{
    "pulsedrift_guided_settings": {
        "breathingGuidanceEnabled": true,      // Default: true
        "mantraEnabled": false,                // Default: false
        "mantraText": "I am calm and present", // Custom mantra
        "mantraInterval": 300000               // 5 minutes in ms
    }
}
```

Settings are loaded by `initGuidedFeatures()` and saved by `saveGuidedSettings()`.

## Accessibility

- **TTS**: Uses Web Speech API with proper voice selection and rate control
- **Fallback**: Functions gracefully degrade if TTS unavailable
- **Keyboard**: All new features accessible via existing keyboard shortcuts (Space, R, F, Escape)
- **Motion**: Respects `prefers-reduced-motion` for breathing visuals and animations
- **ARIA**: Reflection prompt marked with `role="region"` and `aria-label`

## Browser Support

- **TTS**: All modern browsers (Chrome, Firefox, Safari, Edge)
- **Web Audio API**: Desktop and mobile (with autoplay policy considerations)
- **Storage**: localStorage available in all browsers
- **Graceful degradation**: Features work even if TTS unavailable

## Performance Considerations

- **TTS caching**: Responses cached in memory (Map structure) to avoid re-synthesizing
- **Audio nodes**: Ambient sound nodes properly disposed on stop/pause
- **Animation**: CSS transitions used for visual effects (hardware-accelerated)
- **Async operations**: Completion guidance plays asynchronously without blocking UI
- **Interval cleanup**: Mantra intervals cleared when sessions pause/end

## Future Enhancement Ideas

1. **User preferences panel** for TTS rate, pitch, and voice selection
2. **Custom guided meditations** - upload audio files for longer guided sessions
3. **Scheduled reminders** - daily meditation notifications
4. **Mantra customization UI** - let users create/save custom mantras
5. **Voice recording** - record and playback user's own guided sessions
6. **Language support** - TTS in different languages for international users
7. **Ambient audio library** - expand beyond procedural to curated tracks
8. **Biofeedback integration** - sync guidance with breathing rhythm detection
9. **Community-contributed scripts** - share guided meditation scripts
10. **Progress tracking** - track consistency of mantra/breathing usage

## Testing Checklist

- [ ] Breathing guidance plays correctly for each breathing pattern
- [ ] Mantras repeat at correct intervals during sessions
- [ ] Ambient fade-in/out is smooth (no clicks or pops)
- [ ] Reflection prompts display on completion overlay
- [ ] Breathing visuals sync with phase changes
- [ ] Session completion guidance plays without blocking
- [ ] TTS gracefully handles unsupported browsers
- [ ] Settings persist across page reloads
- [ ] Keyboard shortcuts work with new features
- [ ] Mobile responsiveness maintained
- [ ] Accessibility (ARIA, keyboard, motion preferences) working

## Code Examples

### Starting a guided breathing session
```javascript
// App automatically handles this, but manually:
openBreathingModal(); // Plays intro guidance
toggleBreathingExercise(); // Starts guidance with each phase
```

### Playing a custom mantra
```javascript
guidedState.mantraText = "My breath is my anchor";
playMantra(guidedState.mantraText, true); // true = include chime
```

### Showing a reflection prompt
```javascript
const prompt = showSessionReflectionPrompt({ duration: 600 });
console.log(prompt); // "How do you feel now...?"
```

### Manual ambient fade
```javascript
fadeInAmbientSound(3000);  // 3 second fade in
// ... later ...
fadeOutAmbientSound(2000); // 2 second fade out
```
