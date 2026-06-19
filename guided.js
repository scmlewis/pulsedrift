/**
 * PulseDrift - Guided Meditation & TTS Module
 * Handles guided meditations with text-to-speech, breathing guidance, and mantras
 */

// =============================================
// Guided Meditation State
// =============================================

const guidedState = {
    isPlaying: false,
    currentGuidance: null,
    ttsUtterance: null,
    ttsCache: new Map(), // Cache synthesized speech: { key: ArrayBuffer }
    mantraText: 'I am calm and present',
    lastMantraTime: 0,
    mantraInterval: 5 * 60 * 1000, // Default: every 5 minutes
    breathingGuidanceEnabled: true,
    voiceURI: 'default',
    voiceRate: 1.0
};

// =============================================
// Guided Meditation Scripts
// =============================================

const guidedMeditationScripts = {
    breathingIntro: {
        segments: [
            { text: "Begin by finding a comfortable position.", duration: 3 },
            { text: "Close your eyes if it feels right for you.", duration: 3 },
            { text: "We will now practice mindful breathing together.", duration: 3 }
        ]
    },
    breathingGuidance: {
        // Called during each breathing cycle
        '4-4': [
            { phase: 'inhale', text: 'Inhale for four counts', duration: 4 },
            { phase: 'hold', text: 'Hold for four counts', duration: 4 },
            { phase: 'exhale', text: 'Exhale for four counts', duration: 4 }
        ],
        '4-7-8': [
            { phase: 'inhale', text: 'Inhale for four counts', duration: 4 },
            { phase: 'hold', text: 'Hold for seven counts', duration: 7 },
            { phase: 'exhale', text: 'Exhale for eight counts', duration: 8 }
        ],
        '4-4-4-4': [
            { phase: 'inhale', text: 'Inhale for four counts', duration: 4 },
            { phase: 'hold', text: 'Hold for four counts', duration: 4 },
            { phase: 'exhale', text: 'Exhale for four counts', duration: 4 },
            { phase: 'hold2', text: 'Hold for four counts', duration: 4 }
        ]
    },
    mantraOptions: [
        'I am calm and present',
        'With each breath, I find peace',
        'Let this moment be enough',
        'I breathe in peace, I breathe out tension',
        'This too shall pass',
        'I am exactly where I need to be'
    ],
    sessionCompletion: {
        segments: [
            { text: 'Your meditation practice is complete.', duration: 3 },
            { text: 'Take a few moments to notice how you feel.', duration: 4 },
            { text: 'Carry this peace with you throughout your day.', duration: 4 },
            { text: 'Namaste.', duration: 2 }
        ]
    }
};

// =============================================
// TTS & Voice Synthesis
// =============================================

/**
 * Speak text using Web Speech API with caching
 * @param {string} text - Text to speak
 * @param {object} options - { rate, pitch, volume, onEnd }
 */
function speakText(text, options = {}) {
    return new Promise((resolve) => {
        // Check browser support
        const SpeechSynthesisUtterance = window.SpeechSynthesisUtterance || window.webkitSpeechSynthesisUtterance;
        if (!SpeechSynthesisUtterance) {
            console.warn('Speech Synthesis API not available in this browser');
            resolve();
            return;
        }

        // Cancel any ongoing speech
        if (guidedState.ttsUtterance) {
            window.speechSynthesis.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = (options.rate || 0.95) * (guidedState.voiceRate || 1.0); // Apply custom speed multiplier
        utterance.pitch = options.pitch || 1;
        utterance.volume = options.volume || 0.8;

        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            let preferredVoice;
            if (guidedState.voiceURI && guidedState.voiceURI !== 'default') {
                preferredVoice = voices.find(v => v.voiceURI === guidedState.voiceURI);
            }
            if (!preferredVoice) {
                preferredVoice = voices.find(v => v.name.includes('Google UK Female') || v.name.includes('Samantha') || v.lang.includes('en')) || voices[0];
            }
            utterance.voice = preferredVoice;
        }

        utterance.onend = () => {
            guidedState.ttsUtterance = null;
            if (options.onEnd) options.onEnd();
            resolve();
        };

        utterance.onerror = (error) => {
            console.error('Speech synthesis error:', error);
            guidedState.ttsUtterance = null;
            resolve();
        };

        guidedState.ttsUtterance = utterance;
        window.speechSynthesis.speak(utterance);
    });
}

/**
 * Stop current TTS playback
 */
function stopTTS() {
    if (guidedState.ttsUtterance) {
        window.speechSynthesis.cancel();
        guidedState.ttsUtterance = null;
    }
    guidedState.isPlaying = false;
}

// =============================================
// Breathing Guidance Integration
// =============================================

/**
 * Play spoken guidance for breathing phase
 * Called during breathing exercise to voice each phase
 * @param {string} pattern - Breathing pattern (e.g., '4-4', '4-7-8')
 * @param {string} phase - Current phase ('inhale', 'hold', 'exhale', 'hold2')
 */
async function playBreathingPhaseGuidance(pattern, phase) {
    if (!guidedState.breathingGuidanceEnabled) return;

    const phaseGuide = guidedMeditationScripts.breathingGuidance[pattern];
    if (!phaseGuide) return;

    const segment = phaseGuide.find(s => s.phase === phase);
    if (segment) {
        try {
            await speakText(segment.text, { rate: 0.85, volume: 0.6 });
        } catch (error) {
            console.error('Error playing breathing guidance:', error);
        }
    }
}

/**
 * Play intro guidance before breathing exercise starts
 */
async function playBreathingIntro() {
    if (!guidedState.breathingGuidanceEnabled) return;

    const intro = guidedMeditationScripts.breathingIntro;
    for (const segment of intro.segments) {
        if (!guidedState.isPlaying) break;
        await speakText(segment.text, { rate: 0.9, volume: 0.7 });
        await new Promise(resolve => setTimeout(resolve, segment.duration * 250)); // Slight pause between segments
    }
}

// =============================================
// Mantra & Affirmation System
// =============================================

/**
 * Start periodic mantra reminders during session
 * @param {string} mantra - Mantra text (uses default if not provided)
 * @param {number} intervalMs - Interval between repetitions in milliseconds
 */
function startMantraReminders(mantra = null, intervalMs = null) {
    if (mantra) {
        guidedState.mantraText = mantra;
    }
    if (intervalMs) {
        guidedState.mantraInterval = intervalMs;
    }

    guidedState.lastMantraTime = Date.now();

    // Use recursive setTimeout instead of setInterval for efficiency
    const scheduleNext = () => {
        if (!state.timer.isRunning) return;

        const elapsed = Date.now() - guidedState.lastMantraTime;
        const remaining = guidedState.mantraInterval - elapsed;

        if (remaining <= 0) {
            playMantra(guidedState.mantraText);
            guidedState.lastMantraTime = Date.now();
            state.timer.mantraIntervalId = setTimeout(scheduleNext, guidedState.mantraInterval);
        } else {
            state.timer.mantraIntervalId = setTimeout(scheduleNext, remaining);
        }
    };

    state.timer.mantraIntervalId = setTimeout(scheduleNext, guidedState.mantraInterval);
}

/**
 * Play a mantra or affirmation
 * Can be text-to-speech or a soft chime + visual
 * @param {string} mantra - Mantra text
 * @param {boolean} useChime - Whether to include a soft bell chime
 */
async function playMantra(mantra, useChime = false) {
    if (useChime && typeof playBellSound === 'function') {
        playBellSound(0.3); // Soft chime
        await new Promise(resolve => setTimeout(resolve, 800));
    }

    try {
        await speakText(mantra, { rate: 0.85, volume: 0.5, pitch: 0.95 });
    } catch (error) {
        console.error('Error playing mantra:', error);
    }
}

/**
 * Stop mantra reminders
 */
function stopMantraReminders() {
    if (state.timer.mantraIntervalId) {
        clearInterval(state.timer.mantraIntervalId);
        state.timer.mantraIntervalId = null;
    }
}

/**
 * Get random mantra option
 */
function getRandomMantra() {
    const mantras = guidedMeditationScripts.mantraOptions;
    return mantras[Math.floor(Math.random() * mantras.length)];
}

// =============================================
// Session Completion Guidance
// =============================================

/**
 * Play completion guidance sequence
 */
async function playSessionCompletionGuidance() {
    const completion = guidedMeditationScripts.sessionCompletion;
    for (const segment of completion.segments) {
        await speakText(segment.text, { rate: 0.9, volume: 0.7 });
        await new Promise(resolve => setTimeout(resolve, segment.duration * 250));
    }
}

// =============================================
// Ambient Sound Fader / Crossfader
// =============================================

/**
 * Smoothly fade in ambient sound when starting meditation
 * @param {number} duration - Fade-in duration in milliseconds
 */
function fadeInAmbientSound(duration = 2000) {
    if (!state.audio.masterGain) return;

    const startGain = state.audio.masterGain.gain.value;
    const startTime = state.audio.context.currentTime;
    const endTime = startTime + (duration / 1000);

    state.audio.masterGain.gain.setTargetAtTime(state.audio.volume, startTime, duration / 5000);
}

/**
 * Smoothly fade out ambient sound when stopping meditation
 * @param {number} duration - Fade-out duration in milliseconds
 */
function fadeOutAmbientSound(duration = 2000) {
    if (!state.audio.masterGain) return;

    const startTime = state.audio.context.currentTime;
    // Safely ramp strictly to 0 to eliminate any residual noise that causes popping or trailing sound
    state.audio.masterGain.gain.setValueAtTime(state.audio.masterGain.gain.value, startTime);
    state.audio.masterGain.gain.linearRampToValueAtTime(0.001, startTime + (duration / 1000) * 0.9);
    state.audio.masterGain.gain.linearRampToValueAtTime(0, startTime + (duration / 1000));

    // Fully tear down generators and reset state flag so recursive calls stop
    setTimeout(() => {
        if (!state.timer.isRunning && typeof stopAmbientSound === 'function') {
            stopAmbientSound();
        }
    }, duration + 50);
}

// =============================================
// Visual Breathing Enhancer (Particle System)
// =============================================

/**
 * Sync subtle particle animation with breathing phases
 * Called each breathing cycle for visual enhancement
 * @param {string} phase - Current breathing phase
 * @param {number} intensity - Intensity multiplier (0-1)
 */
function updateBreathingVisualsWithPhase(phase, intensity = 1) {
    // This can trigger particle emission in the canvas-based breathing visualization
    // The actual particle logic lives in app.js (initParticleSystem)
    // We expose this hook for synchronized animations

    const breathCircles = [
        document.getElementById('breathCircleLarge'),
        document.getElementById('breathCircleSmall')
    ];

    breathCircles.forEach(circle => {
        if (!circle) return;

        // Add a subtle glow/opacity shift based on phase
        switch (phase) {
            case 'inhale':
                circle.style.opacity = 0.8 + (0.2 * intensity);
                break;
            case 'exhale':
                circle.style.opacity = 0.6 + (0.1 * intensity);
                break;
            case 'hold':
            case 'hold2':
                circle.style.opacity = 0.7;
                break;
            default:
                circle.style.opacity = 0.7;
        }
    });
}

// =============================================
// Daily Zen Quote / Micro-Reflections
// =============================================

/**
 * Get a random micro-reflection for daily inspiration
 */
function getRandomMicroReflection() {
    const reflections = [
        'What are you grateful for today?',
        'How can you bring more presence to this moment?',
        'What intention would serve you best right now?',
        'Breathe deeply. You are enough.',
        'What small act of kindness can you do today?',
        'Release what you cannot control.',
        'How can you practice self-compassion today?'
    ];
    return reflections[Math.floor(Math.random() * reflections.length)];
}

/**
 * Display a micro-reflection or quote in a toast/notification style
 * @param {string} text - Text to display
 * @param {number} duration - Display duration in milliseconds
 */
function showMicroReflectionToast(text, duration = 4000) {
    // Try to use existing toast/notification system or create a simple one
    const toast = document.createElement('div');
    toast.className = 'zen-reflection-toast';
    toast.textContent = text;

    // Use CSS classes instead of inline styles to respect theme
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '8px';
    toast.style.fontSize = '14px';
    toast.style.zIndex = '9999';
    toast.style.fontFamily = '"Quicksand", sans-serif';
    toast.style.animation = 'fadeInUp 0.3s ease-out';
    // Theme-aware colors using CSS custom properties
    toast.style.background = 'var(--zen-water, rgba(126, 231, 135, 0.2))';
    toast.style.border = '1px solid var(--accent-zen, rgba(126, 231, 135, 0.4))';
    toast.style.color = 'var(--accent-zen, #7ee787)';

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOutDown 0.3s ease-in';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// =============================================
// Session Reflection Prompt
// =============================================

/**
 * Show a post-session reflection prompt
 * Intended to hook into enhancements.js completion flow
 * @param {object} data - Session data (duration, etc.)
 */
function showSessionReflectionPrompt(data = {}) {
    const reflectionPrompts = [
        'How do you feel now compared to before your session?',
        'What insights came up during your practice?',
        'What will you take with you from this session?',
        'Did you notice any shifts in your mind or body?',
        'How can you extend this calm into your day?'
    ];

    const prompt = reflectionPrompts[Math.floor(Math.random() * reflectionPrompts.length)];

    // Update the reflection prompt in the completion overlay if it exists
    const reflectionElement = document.getElementById('reflectionPrompt');
    if (reflectionElement) {
        reflectionElement.textContent = prompt;
        reflectionElement.style.display = 'block';
    }

    return prompt;
}

// =============================================
// Initialize Guided Features
// =============================================

function initGuidedFeatures() {
    const voiceSelect = document.getElementById('voiceSelect');
    const voiceRateSlider = document.getElementById('voiceRateSlider');

    const populateVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0 && voiceSelect) {
            const currentVal = voiceSelect.value;
            voiceSelect.innerHTML = '<option value="default">Default System Voice</option>';
            voices.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.voiceURI;
                option.textContent = `${voice.name} (${voice.lang})`;
                voiceSelect.appendChild(option);
            });
            if (guidedState.voiceURI) {
                voiceSelect.value = guidedState.voiceURI;
            }
        }
    };

    // Ensure voices are loaded for TTS
    populateVoices();
    window.speechSynthesis.onvoiceschanged = () => {
        populateVoices();
    };

    // Load guided settings from storage
    const guidedSettings = safeGetItem(STORAGE_KEYS.GUIDED_SETTINGS, {
        breathingGuidanceEnabled: true,
        mantraEnabled: false,
        mantraText: 'I am calm and present',
        mantraInterval: 5 * 60 * 1000,
        voiceURI: 'default',
        voiceRate: 1.0
    });

    Object.assign(guidedState, guidedSettings);

    if (voiceSelect) {
        voiceSelect.value = guidedState.voiceURI || 'default';
        voiceSelect.addEventListener('change', (e) => {
            guidedState.voiceURI = e.target.value;
            saveGuidedSettings();
            speakText("Here is my new voice.", { volume: 0.6 });
        });
    }

    if (voiceRateSlider) {
        voiceRateSlider.value = (guidedState.voiceRate || 1.0) * 100;
        voiceRateSlider.addEventListener('input', (e) => {
            guidedState.voiceRate = parseInt(e.target.value) / 100;
            saveGuidedSettings();
        });
        voiceRateSlider.addEventListener('change', () => {
            speakText("Guidance speed updated.", { volume: 0.6 });
        });
    }
}

/**
 * Save guided settings to storage
 */
function saveGuidedSettings() {
    const settings = {
        breathingGuidanceEnabled: guidedState.breathingGuidanceEnabled,
        mantraEnabled: !!(typeof state !== 'undefined' && state.timer && state.timer.mantraIntervalId),
        mantraText: guidedState.mantraText,
        mantraInterval: guidedState.mantraInterval,
        voiceURI: guidedState.voiceURI,
        voiceRate: guidedState.voiceRate
    };
    safeSetItem(STORAGE_KEYS.GUIDED_SETTINGS, settings);
}
