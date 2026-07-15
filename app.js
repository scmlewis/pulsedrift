/**
 * PulseDrift - Zen Meditation Timer
 * A mindful meditation timer with breathing exercises, ambient sounds, and session tracking
 */

// =============================================
// Application State
// =============================================

const state = {
    timer: {
        duration: 600, // seconds (10 min default)
        remaining: 600,
        isRunning: false,
        isPaused: false,
        intervalId: null,
        startTime: null,
        originalDuration: 600,
        mantraIntervalId: null
    },
    breathing: {
        isActive: false,
        pattern: '4-4', // default calm breathing
        phase: 'idle', // idle, inhale, hold, exhale, hold2
        intervalId: null,
        cycleCount: 0,
        usingSidebar: false // Track if using desktop sidebar breathing guide
    },
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
    settings: {
        intervalBell: 0, // minutes, 0 = off
        breathingPattern: '4-4',
        notifications: true,
        autoBreathing: false,
        theme: 'default'
    },
    sessions: [],
    focusMode: false
};

// =============================================
// DOM Elements
// =============================================

const DOM = {
    // Timer
    timerDisplay: document.getElementById('timerDisplay'),
    timerLabel: document.getElementById('timerLabel'),
    timerProgress: document.getElementById('timerProgress'),
    startBtn: document.getElementById('startBtn'),
    resetBtn: document.getElementById('resetBtn'),
    breathingBtn: document.getElementById('breathingBtn'),
    presets: document.getElementById('presets'),
    presetsDesktop: document.getElementById('presetsDesktop'),
    customTimeBtn: document.getElementById('customTimeBtn'),
    customTimeBtnDesktop: document.getElementById('customTimeBtnDesktop'),
    customTimeInput: document.getElementById('customTimeInput'),
    customTimeInputDesktop: document.getElementById('customTimeInputDesktop'),
    customMinutes: document.getElementById('customMinutes'),
    customMinutesDesktop: document.getElementById('customMinutesDesktop'),
    customSeconds: document.getElementById('customSeconds'),
    customSecondsDesktop: document.getElementById('customSecondsDesktop'),
    setCustomTime: document.getElementById('setCustomTime'),
    setCustomTimeDesktop: document.getElementById('setCustomTimeDesktop'),

    breathingModal: document.getElementById('breathingModal'),
    breathCircleLarge: document.getElementById('breathCircleLarge'),
    breathInstruction: document.getElementById('breathInstruction'),
    breathCounter: document.getElementById('breathCounter'),
    breathStartBtn: document.getElementById('breathStartBtn'),
    breathingPatternSelect: document.getElementById('breathingPatternSelect'),
    closeBreathingBtn: document.getElementById('closeBreathingBtn'),

    // Desktop Sidebar Breathing Guide
    breathingGuideToggle: document.getElementById('breathingGuideToggle'),
    breathingGuideContent: document.getElementById('breathingGuideContent'),
    breathCircleSmall: document.getElementById('breathCircleSmall'),
    breathInstructionSmall: document.getElementById('breathInstructionSmall'),
    breathStartBtnSmall: document.getElementById('breathStartBtnSmall'),
    breathingPatternSidebar: document.getElementById('breathingPatternSidebar'),

    // Audio
    bellSound: document.getElementById('bellSound'),
    ambientSound: document.getElementById('ambientSound'),
    volumeSlider: document.getElementById('volumeSlider'),

    // Quote & Intention
    dailyQuote: document.getElementById('dailyQuote'),
    quoteAuthor: document.getElementById('quoteAuthor'),
    intentionInput: document.getElementById('intentionInput'),
    charCounter: document.getElementById('charCounter'),
    intentionDisplay: document.getElementById('intentionDisplay'),
    intentionText: document.getElementById('intentionText'),
    completeIntention: document.getElementById('completeIntention'),
    completeIntentionText: document.getElementById('completeIntentionText'),

    // Panels & Modals
    historyPanel: document.getElementById('historyPanel'),
    historyBtn: document.getElementById('historyBtn'),
    closeHistoryBtn: document.getElementById('closeHistoryBtn'),
    historyList: document.getElementById('historyList'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),
    totalSessions: document.getElementById('totalSessions'),
    totalMinutes: document.getElementById('totalMinutes'),
    currentStreak: document.getElementById('currentStreak'),
    settingsModal: document.getElementById('settingsModal'),
    settingsBtn: document.getElementById('settingsBtn'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),

    // Settings
    intervalBell: document.getElementById('intervalBell'),
    breathingPattern: document.getElementById('breathingPattern'),
    notificationsToggle: document.getElementById('notificationsToggle'),
    autoBreathingToggle: document.getElementById('autoBreathingToggle'),
    themeSelect: document.getElementById('themeSelect'),

    // Focus Mode
    focusModeBtn: document.getElementById('focusModeBtn'),
    focusModeExit: document.getElementById('focusModeExit'),
    appContainer: document.getElementById('appContainer'),

    // Complete Overlay
    completeOverlay: document.getElementById('completeOverlay'),
    completeDuration: document.getElementById('completeDuration'),
    completeMessage: document.getElementById('completeMessage'),
    reflectionPrompt: document.getElementById('reflectionPrompt'),
    completeBtn: document.getElementById('completeBtn'),

    // Ripples
    rippleContainer: document.getElementById('rippleContainer'),

    // Mini Stats Widget
    miniStatsWidget: document.getElementById('miniStatsWidget'),
    miniStatToday: document.getElementById('miniStatToday'),
    miniStatStreak: document.getElementById('miniStatStreak'),
    miniStatsExpand: document.getElementById('miniStatsExpand'),
    miniStatsDetails: document.getElementById('miniStatsDetails'),
    miniStatTotalSessions: document.getElementById('miniStatTotalSessions'),
    miniStatTotalMinutes: document.getElementById('miniStatTotalMinutes'),

    // Accordion
    soundSettingsToggle: document.getElementById('soundSettingsToggle'),
    soundSettingsContent: document.getElementById('soundSettingsContent'),

    // Toast & Particles
    toastContainer: document.getElementById('toastContainer'),
    particleCanvas: document.getElementById('particleCanvas')
};

// =============================================
// Mindfulness Quotes
// =============================================

const quotes = [
    { text: "The mind is like water. When it's turbulent, it's difficult to see. When it's calm, everything becomes clear.", author: "Prasad Mahes" },
    { text: "Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor.", author: "Thich Nhat Hanh" },
    { text: "The present moment is filled with joy and happiness. If you are attentive, you will see it.", author: "Thich Nhat Hanh" },
    { text: "In today's rush, we all think too much, seek too much, want too much and forget about the joy of just being.", author: "Eckhart Tolle" },
    { text: "Meditation is not about stopping thoughts, but recognizing that we are more than our thoughts.", author: "Arianna Huffington" },
    { text: "Quiet the mind, and the soul will speak.", author: "Ma Jaya Sati Bhagavati" },
    { text: "Your calm mind is the ultimate weapon against your challenges.", author: "Bryant McGill" },
    { text: "Within you, there is a stillness and a sanctuary to which you can retreat at any time.", author: "Hermann Hesse" },
    { text: "Meditation is the tongue of the soul and the language of our spirit.", author: "Jeremy Taylor" },
    { text: "The thing about meditation is: You become more and more you.", author: "David Lynch" },
    { text: "Breathe in deeply to bring your mind home to your body.", author: "Thich Nhat Hanh" },
    { text: "The quieter you become, the more you can hear.", author: "Ram Dass" },
    { text: "Nature does not hurry, yet everything is accomplished.", author: "Lao Tzu" },
    { text: "Peace comes from within. Do not seek it without.", author: "Buddha" },
    { text: "Be where you are, not where you think you should be.", author: "Anonymous" },
    { text: "The greatest weapon against stress is our ability to choose one thought over another.", author: "William James" },
    { text: "Mindfulness is a way of befriending ourselves and our experience.", author: "Jon Kabat-Zinn" },
    { text: "You should sit in meditation for 20 minutes a day, unless you're too busy; then you should sit for an hour.", author: "Zen Proverb" },
    { text: "Almost everything will work again if you unplug it for a few minutes, including you.", author: "Anne Lamott" },
    { text: "Surrender to what is. Let go of what was. Have faith in what will be.", author: "Sonia Ricotti" },
    { text: "The soul always knows what to do to heal itself. The challenge is to silence the mind.", author: "Caroline Myss" },
    { text: "Every breath we take, every step we make, can be filled with peace, joy, and serenity.", author: "Thich Nhat Hanh" },
    { text: "Meditation brings wisdom; lack of meditation leaves ignorance.", author: "Buddha" },
    { text: "Life is available only in the present moment.", author: "Thich Nhat Hanh" },
    { text: "Let go of the thoughts that don't make you strong.", author: "Karen Salmansohn" },
    { text: "When you realize nothing is lacking, the whole world belongs to you.", author: "Lao Tzu" },
    { text: "Calmness is the cradle of power.", author: "Josiah Gilbert Holland" },
    { text: "The more regularly and the more deeply you meditate, the sooner you will find yourself acting from a center of peace.", author: "J. Donald Walters" },
    { text: "Don't let the behavior of others destroy your inner peace.", author: "Dalai Lama" },
    { text: "If you want to conquer the anxiety of life, live in the moment, live in the breath.", author: "Amit Ray" },
    { text: "To understand the immeasurable, the mind must be extraordinarily quiet, still.", author: "Jiddu Krishnamurti" },
    { text: "Empty your mind, be formless, shapeless — like water.", author: "Bruce Lee" },
    { text: "The best time to relax is when you don't have time for it.", author: "Sydney J. Harris" },
    { text: "In the midst of movement and chaos, keep stillness inside of you.", author: "Deepak Chopra" },
    { text: "Your vision will become clear only when you can look into your own heart.", author: "Carl Jung" },
    { text: "Silence is a source of great strength.", author: "Lao Tzu" },
    { text: "When meditation is mastered, the mind is unwavering like the flame of a candle in a windless place.", author: "Bhagavad Gita" },
    { text: "The mind can go in a thousand directions, but on this beautiful path, I walk in peace.", author: "Thich Nhat Hanh" },
    { text: "Awareness is the greatest agent for change.", author: "Eckhart Tolle" },
    { text: "Where there is peace and meditation, there is neither anxiety nor doubt.", author: "St. Francis de Sales" }
];

const completionMessages = [
    "Well done. Carry this peace with you.",
    "Beautiful session. May this calm stay with you.",
    "Namaste. Your practice strengthens each day.",
    "Peace is always just a breath away.",
    "You've given yourself a wonderful gift today.",
    "May the stillness linger throughout your day.",
    "Your mind thanks you for this moment of peace.",
    "Each session is a step toward inner harmony.",
    "Breathe, and know that you are exactly where you need to be.",
    "This moment of calm is yours to keep."
];

// =============================================
// Initialization
// =============================================

function init() {
    // Add loading class for skeleton state
    document.body.classList.add('app-loading');
    
    loadSettings();
    loadSessions();
    setupEventListeners();
    setDailyQuote();
    updateTimerDisplay();
    updateHistoryStats();
    renderHistory();
    requestNotificationPermission();

    // Initialize new features
    initAccordions();
    if (typeof initGuidedFeatures === 'function') {
        initGuidedFeatures();
    }
    updateMiniStats();
    initParticleSystem();
    updateCharCounter();
    initCustomBreathingPatterns();
    initMoodRecommendations();
    initEmergencyCalm();
    initCustomSoundUpload();
    preloadAudioFiles().catch(() => {}); // Pre-cache bell sounds for instant playback
    
    // Remove loading state, trigger fade-in
    requestAnimationFrame(() => {
        document.body.classList.remove('app-loading');
        document.body.classList.add('app-loaded');
    });
}

function loadSettings() {
    // Load settings with error handling
    const savedSettings = safeGetItem(STORAGE_KEYS.SETTINGS, null);
    if (savedSettings) {
        Object.assign(state.settings, savedSettings);
    }

    const savedVolume = safeGetRawItem(STORAGE_KEYS.VOLUME, '');
    if (savedVolume) {
        state.audio.volume = parseFloat(savedVolume) || AUDIO_CONFIG.DEFAULT_VOLUME;
        DOM.volumeSlider.value = state.audio.volume * 100;
    }

    const savedBellSound = safeGetRawItem(STORAGE_KEYS.BELL_SOUND, '');
    if (savedBellSound) {
        state.audio.bellSound = savedBellSound;
        DOM.bellSound.value = savedBellSound;
    }

    const savedAmbientSound = safeGetRawItem(STORAGE_KEYS.AMBIENT_SOUND, '');
    if (savedAmbientSound) {
        state.audio.ambientSound = savedAmbientSound;
        DOM.ambientSound.value = savedAmbientSound;
    }

    const savedIntention = safeGetRawItem(STORAGE_KEYS.INTENTION, '');
    if (savedIntention) {
        DOM.intentionInput.value = savedIntention;
    }

    // Update settings UI
    DOM.intervalBell.value = state.settings.intervalBell;
    DOM.breathingPattern.value = state.settings.breathingPattern;
    DOM.notificationsToggle.checked = state.settings.notifications;
    DOM.autoBreathingToggle.checked = state.settings.autoBreathing;
    if (DOM.themeSelect) {
        DOM.themeSelect.value = state.settings.theme || 'default';
        applyTheme(state.settings.theme || 'default');
    }
}

function applyTheme(theme) {
    document.body.classList.remove('theme-ocean', 'theme-forest', 'theme-sunset');
    if (theme && theme !== 'default') {
        document.body.classList.add(`theme-${theme}`);
    }
}

function saveSettings() {
    safeSetItem(STORAGE_KEYS.SETTINGS, state.settings);
}

function loadSessions() {
    const savedSessions = safeGetItem(STORAGE_KEYS.SESSIONS, []);
    if (Array.isArray(savedSessions)) {
        state.sessions = savedSessions;
    }
}

function saveSessions() {
    safeSetItem(STORAGE_KEYS.SESSIONS, state.sessions);
}

// =============================================
// Event Listeners
// =============================================

function setupEventListeners() {
    // Timer controls
    DOM.startBtn.addEventListener('click', toggleTimer);
    DOM.resetBtn.addEventListener('click', resetTimer);
    DOM.breathingBtn.addEventListener('click', openBreathingModal);

    // Presets (Mobile/Sidebar)
    DOM.presets.querySelectorAll('.preset-btn:not(.custom-btn)').forEach(btn => {
        btn.addEventListener('click', () => selectPreset(btn));
    });
    DOM.customTimeBtn.addEventListener('click', toggleCustomTimeInput);
    DOM.setCustomTime.addEventListener('click', setCustomTime);

    // Presets (Desktop)
    DOM.presetsDesktop.querySelectorAll('.preset-btn:not(.custom-btn)').forEach(btn => {
        btn.addEventListener('click', () => selectPreset(btn));
    });
    DOM.customTimeBtnDesktop.addEventListener('click', toggleCustomTimeInputDesktop);
    DOM.setCustomTimeDesktop.addEventListener('click', setCustomTimeDesktop);

    // Sound controls
    DOM.bellSound.addEventListener('change', (e) => {
        state.audio.bellSound = e.target.value;
        safeSetRawItem(STORAGE_KEYS.BELL_SOUND, e.target.value);
        // Preview the sound
        if (e.target.value !== 'silence') {
            playBellSound(0.5);
        }
    });

    DOM.ambientSound.addEventListener('change', (e) => {
        state.audio.ambientSound = e.target.value;
        safeSetRawItem(STORAGE_KEYS.AMBIENT_SOUND, e.target.value);
        if (state.audio.previewTimeout) {
            clearTimeout(state.audio.previewTimeout);
            state.audio.previewTimeout = null;
        }
        // Stop current ambient and start new one
        stopAmbientSound();
        if (e.target.value !== 'silence') {
            startAmbientSound();
            if (!state.timer.isRunning) {
                if (typeof fadeInAmbientSound === 'function') {
                    fadeInAmbientSound(500); // quick fade in for preview
                } else if (state.audio.masterGain) {
                    state.audio.masterGain.gain.setValueAtTime(state.audio.volume, state.audio.context.currentTime);
                }

                state.audio.previewTimeout = setTimeout(() => {
                    if (!state.timer.isRunning) {
                        if (typeof fadeOutAmbientSound === 'function') {
                            fadeOutAmbientSound(1500);
                        } else {
                            stopAmbientSound();
                        }
                    }
                    state.audio.previewTimeout = null;
                }, UI_TIMING.AMBIENT_PREVIEW_DURATION);
            }
        }
    });

    DOM.volumeSlider.addEventListener('input', (e) => {
        state.audio.volume = e.target.value / 100;
        safeSetRawItem(STORAGE_KEYS.VOLUME, state.audio.volume.toString());
        if (state.audio.masterGain) {
            state.audio.masterGain.gain.value = state.audio.volume;
        }
    });

    // Intention
    DOM.intentionInput.addEventListener('change', (e) => {
        safeSetRawItem(STORAGE_KEYS.INTENTION, e.target.value);
    });

    DOM.intentionInput.addEventListener('input', (e) => {
        updateCharCounter();
    });

    // History panel
    DOM.historyBtn.addEventListener('click', () => DOM.historyPanel.classList.add('open'));
    DOM.closeHistoryBtn.addEventListener('click', () => DOM.historyPanel.classList.remove('open'));
    DOM.clearHistoryBtn.addEventListener('click', clearHistory);

    // Settings modal
    DOM.settingsBtn.addEventListener('click', () => DOM.settingsModal.classList.remove('hidden'));
    DOM.closeSettingsBtn.addEventListener('click', () => DOM.settingsModal.classList.add('hidden'));

    // Settings controls
    DOM.intervalBell.addEventListener('change', (e) => {
        state.settings.intervalBell = parseInt(e.target.value);
        saveSettings();
    });

    DOM.breathingPattern.addEventListener('change', (e) => {
        state.settings.breathingPattern = e.target.value;
        state.breathing.pattern = e.target.value;
        saveSettings();
    });

    DOM.notificationsToggle.addEventListener('change', (e) => {
        state.settings.notifications = e.target.checked;
        if (e.target.checked) {
            requestNotificationPermission();
        }
        saveSettings();
    });

    DOM.autoBreathingToggle.addEventListener('change', (e) => {
        state.settings.autoBreathing = e.target.checked;
        saveSettings();
    });

    if (DOM.themeSelect) {
        DOM.themeSelect.addEventListener('change', (e) => {
            state.settings.theme = e.target.value;
            applyTheme(state.settings.theme);
            saveSettings();
        });
    }

    // Focus mode
    if (DOM.focusModeBtn) {
        DOM.focusModeBtn.addEventListener('click', toggleFocusMode);
    }
    if (DOM.focusModeExit) {
        DOM.focusModeExit.addEventListener('click', toggleFocusMode);
    }
    function showFocusHint() {
        const hint = document.getElementById('focusHint');
        if (hint) hint.classList.remove('hidden');
    }
    function hideFocusHint() {
        const hint = document.getElementById('focusHint');
        if (hint) hint.classList.add('hidden');
    }

    // Breathing modal
    DOM.closeBreathingBtn.addEventListener('click', closeBreathingModal);
    DOM.breathStartBtn.addEventListener('click', toggleBreathingExercise);
    DOM.breathingPatternSelect.addEventListener('change', (e) => {
        state.breathing.pattern = e.target.value;
    });

    // Desktop Sidebar Breathing Guide
    if (DOM.breathingGuideToggle) {
        DOM.breathingGuideToggle.addEventListener('click', toggleSidebarBreathingGuide);
    }
    if (DOM.breathStartBtnSmall) {
        DOM.breathStartBtnSmall.addEventListener('click', toggleSidebarBreathingExercise);
    }
    if (DOM.breathingPatternSidebar) {
        DOM.breathingPatternSidebar.addEventListener('change', (e) => {
            state.breathing.pattern = e.target.value;
        });
    }

    // Complete overlay
    DOM.completeBtn.addEventListener('click', () => {
        DOM.completeOverlay.classList.add('hidden');
    });

    // Accordion toggles
    if (DOM.soundSettingsToggle) {
        DOM.soundSettingsToggle.addEventListener('click', () => {
            toggleAccordion('soundSettingsToggle', 'soundSettingsContent', 'soundSettings');
        });
    }

    // Mini stats expand/collapse
    if (DOM.miniStatsExpand) {
        DOM.miniStatsExpand.addEventListener('click', toggleMiniStatsExpanded);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyPress);

    // Close panels/modals on outside click
    DOM.settingsModal.addEventListener('click', (e) => {
        if (e.target === DOM.settingsModal) {
            DOM.settingsModal.classList.add('hidden');
        }
    });

    DOM.breathingModal.addEventListener('click', (e) => {
        if (e.target === DOM.breathingModal) {
            closeBreathingModal();
        }
    });
}

function handleKeyPress(e) {
    // Space to start/pause timer
    if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        toggleTimer();
    }

    // R to reset
    if (e.code === 'KeyR' && e.target.tagName !== 'INPUT') {
        resetTimer();
    }

    // F for focus mode
    if (e.code === 'KeyF' && e.target.tagName !== 'INPUT') {
        toggleFocusMode();
    }

    // Escape to close modals
    if (e.code === 'Escape') {
        DOM.settingsModal.classList.add('hidden');
        DOM.historyPanel.classList.remove('open');
        closeBreathingModal();
        closeCalmModal();
        if (state.focusMode) {
            toggleFocusMode();
        }
    }

    // C for emergency calm
    if (e.code === 'KeyC' && e.target.tagName !== 'INPUT') {
        startGroundingExercise();
    }
}

// =============================================
// Timer Functions
// =============================================

function toggleTimer() {
    if (state.timer.isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
}

function startTimer() {
    if (state.timer.remaining <= 0) {
        resetTimer();
    }

    initAudioContext();
    if (state.audio.previewTimeout) {
        clearTimeout(state.audio.previewTimeout);
        state.audio.previewTimeout = null;
    }

    state.timer.isRunning = true;
    state.timer.isPaused = false;
    state.timer.startTime = Date.now();

    // Play start bell
    playBellSound();

    // Start ambient sound with fade-in
    if (state.audio.ambientSound !== 'silence') {
        startAmbientSound();
        if (typeof fadeInAmbientSound === 'function') {
            fadeInAmbientSound(UI_TIMING.AMBIENT_FADE_IN);
        }
    }

    // Start mantra reminders if enabled
    if (typeof guidedState !== 'undefined' && (guidedState.breathingGuidanceEnabled || guidedState.mantraText)) {
        if (typeof startMantraReminders === 'function') {
            startMantraReminders();
        }
    }

    // Show intention during meditation
    showIntentionDuringMeditation();

    updateTimerUI();

    // Store original duration for session tracking
    if (!state.timer.isPaused) {
        state.timer.originalDuration = state.timer.duration;
    }

    // Timer interval
    state.timer.intervalId = setInterval(() => {
        state.timer.remaining--;
        updateTimerDisplay();
        updateTimerProgress();

        // Check for interval bell
        if (state.settings.intervalBell > 0 && state.timer.remaining > 0) {
            const elapsed = state.timer.duration - state.timer.remaining;
            if (elapsed > 0 && elapsed % (state.settings.intervalBell * 60) === 0) {
                playBellSound(0.4); // Softer interval bell
            }
        }

        if (state.timer.remaining <= 0) {
            completeTimer();
        }
    }, 1000);
}

function pauseTimer() {
    state.timer.isRunning = false;
    state.timer.isPaused = true;

    if (state.timer.intervalId) {
        clearInterval(state.timer.intervalId);
        state.timer.intervalId = null;
    }

    if (typeof fadeOutAmbientSound === 'function') {
        fadeOutAmbientSound(UI_TIMING.AMBIENT_FADE_OUT);
    }
    if (typeof stopMantraReminders === 'function') {
        stopMantraReminders();
    }
    hideIntentionDuringMeditation();
    updateTimerUI();
}

function resetTimer() {
    pauseTimer();
    state.timer.isPaused = false;
    state.timer.remaining = state.timer.duration;
    updateTimerDisplay();
    updateTimerProgress();
    DOM.timerLabel.textContent = 'Ready';
}

function completeTimer() {
    pauseTimer();
    state.timer.isPaused = false;

    // Play completion bell
    playBellSound(1, true);

    // Stop mantra
    if (typeof stopMantraReminders === 'function') {
        stopMantraReminders();
    }

    // Hide intention display
    hideIntentionDuringMeditation();

    // Play guided completion sequence asynchronously
    if (typeof guidedState !== 'undefined' && guidedState.breathingGuidanceEnabled) {
        if (typeof playSessionCompletionGuidance === 'function') {
            playSessionCompletionGuidance().catch(e => console.log('Completion guidance error:', e));
        }
    }

    // Get current intention
    const intention = DOM.intentionInput.value.trim();

    // Record session with intention
    const session = {
        id: Date.now(),
        date: new Date().toISOString(),
        duration: state.timer.originalDuration,
        completed: true,
        intention: intention || null
    };
    state.sessions.unshift(session);
    saveSessions();
    updateHistoryStats();
    renderHistory();

    // Show reflection prompt and completion overlay
    if (typeof showSessionReflectionPrompt === 'function') {
        showSessionReflectionPrompt(session);
    }
    showCompletionOverlay(intention);

    // Send notification
    sendNotification('Meditation Complete', `You completed ${formatTime(state.timer.originalDuration)} of mindfulness.`);

    // Reset timer
    state.timer.remaining = state.timer.duration;
    updateTimerDisplay();
    updateTimerProgress();
    DOM.timerLabel.textContent = 'Complete';
}

function updateTimerDisplay() {
    const minutes = Math.floor(state.timer.remaining / 60);
    const seconds = state.timer.remaining % 60;
    // No padding for minutes to allow 1-3 digits naturally, pad seconds to 2 digits
    DOM.timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function updateTimerProgress() {
    const circumference = 2 * Math.PI * TIMER.PROGRESS_RADIUS;
    const progress = state.timer.remaining / state.timer.duration;
    const offset = circumference * (1 - progress);
    DOM.timerProgress.style.strokeDashoffset = offset;

    // Change color as timer progresses
    if (progress < 0.25) {
        DOM.timerProgress.style.stroke = 'var(--accent-lotus)';
    } else if (progress < 0.5) {
        DOM.timerProgress.style.stroke = 'var(--accent-warm)';
    } else {
        DOM.timerProgress.style.stroke = 'var(--accent-zen)';
    }
}

function updateTimerUI() {
    const playIcon = DOM.startBtn.querySelector('.play-icon');
    const pauseIcon = DOM.startBtn.querySelector('.pause-icon');

    if (state.timer.isRunning) {
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
        DOM.timerLabel.textContent = 'Meditating';
    } else {
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
        DOM.timerLabel.textContent = state.timer.isPaused ? 'Paused' : 'Ready';
    }
}

function selectPreset(btn) {
    // Update UI - Remove active from both preset containers
    DOM.presets.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
    DOM.presetsDesktop.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));

    // Add active to clicked button
    btn.classList.add('active');

    // Also sync the corresponding button in the other container
    const minutes = btn.dataset.minutes;
    const otherBtn = btn.closest('#presets')
        ? DOM.presetsDesktop.querySelector(`[data-minutes="${minutes}"]`)
        : DOM.presets.querySelector(`[data-minutes="${minutes}"]`);
    if (otherBtn) {
        otherBtn.classList.add('active');
    }

    // Set duration
    state.timer.duration = parseInt(minutes) * 60;
    state.timer.remaining = state.timer.duration;

    // Hide both custom inputs
    DOM.customTimeInput.classList.add('hidden');
    DOM.customTimeInputDesktop.classList.add('hidden');

    updateTimerDisplay();
    updateTimerProgress();
}

function toggleCustomTimeInput() {
    DOM.customTimeInput.classList.toggle('hidden');
    if (!DOM.customTimeInput.classList.contains('hidden')) {
        DOM.customMinutes.focus();
    }
}

function toggleCustomTimeInputDesktop() {
    DOM.customTimeInputDesktop.classList.toggle('hidden');
    if (!DOM.customTimeInputDesktop.classList.contains('hidden')) {
        DOM.customMinutesDesktop.focus();
    }
}

function setCustomTime() {
    const minutes = parseInt(DOM.customMinutes.value) || 0;
    const seconds = parseInt(DOM.customSeconds.value) || 0;
    const totalSeconds = (minutes * 60) + seconds;

    if (totalSeconds > 0 && totalSeconds <= 59940) { // Max 999 minutes
        state.timer.duration = totalSeconds;
        state.timer.remaining = totalSeconds;

        // Update UI - both containers
        DOM.presets.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        DOM.presetsDesktop.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        DOM.customTimeBtn.classList.add('active');
        DOM.customTimeBtnDesktop.classList.add('active');
        DOM.customTimeInput.classList.add('hidden');
        DOM.customTimeInputDesktop.classList.add('hidden');

        // Sync values
        DOM.customMinutesDesktop.value = DOM.customMinutes.value;
        DOM.customSecondsDesktop.value = DOM.customSeconds.value;

        updateTimerDisplay();
        updateTimerProgress();
    }
}

function setCustomTimeDesktop() {
    const minutes = parseInt(DOM.customMinutesDesktop.value) || 0;
    const seconds = parseInt(DOM.customSecondsDesktop.value) || 0;
    const totalSeconds = (minutes * 60) + seconds;

    if (totalSeconds > 0 && totalSeconds <= 59940) { // Max 999 minutes
        state.timer.duration = totalSeconds;
        state.timer.remaining = totalSeconds;

        // Update UI - both containers
        DOM.presets.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        DOM.presetsDesktop.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        DOM.customTimeBtn.classList.add('active');
        DOM.customTimeBtnDesktop.classList.add('active');
        DOM.customTimeInput.classList.add('hidden');
        DOM.customTimeInputDesktop.classList.add('hidden');

        // Sync values
        DOM.customMinutes.value = DOM.customMinutesDesktop.value;
        DOM.customSeconds.value = DOM.customSecondsDesktop.value;

        updateTimerDisplay();
        updateTimerProgress();
    }
}

// =============================================
// Audio System (Web Audio API)
// =============================================

function initAudioContext() {
    if (!state.audio.context) {
        state.audio.context = new (window.AudioContext || window.webkitAudioContext)();
        state.audio.masterGain = state.audio.context.createGain();
        state.audio.masterGain.gain.value = state.audio.volume;
        state.audio.masterGain.connect(state.audio.context.destination);
    }

    if (state.audio.context.state === 'suspended') {
        state.audio.context.resume();
    }
}

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

// =============================================
// Procedural Bell Synthesis
// =============================================

function _proceduralFallback_singingBowl(ctx, now, volumeMultiplier, isCompletion) {
    const duration = isCompletion ? 8 : 5;
    const frequencies = isCompletion ? [220, 330, 440, 550] : [220, 330, 440];

    frequencies.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, now);
        oscillator.frequency.exponentialRampToValueAtTime(freq * 0.98, now + duration);

        const vibrato = ctx.createOscillator();
        const vibratoGain = ctx.createGain();
        vibrato.frequency.value = 4 + i;
        vibratoGain.gain.value = 2;
        vibrato.connect(vibratoGain);
        vibratoGain.connect(oscillator.frequency);
        vibrato.start(now);
        vibrato.stop(now + duration);

        const baseVolume = 0.15 * volumeMultiplier * (1 - i * 0.2);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(baseVolume, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

        oscillator.connect(gainNode);
        gainNode.connect(state.audio.masterGain);

        oscillator.start(now);
        oscillator.stop(now + duration);
    });
}

function _proceduralFallback_softGong(ctx, now, volumeMultiplier, isCompletion) {
    const duration = isCompletion ? 6 : 4;
    const freq = isCompletion ? 80 : 100;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.3 * volumeMultiplier, now + 0.01);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc1.connect(gain1);
    gain1.connect(state.audio.masterGain);
    osc1.start(now);
    osc1.stop(now + duration);

    [2, 3, 4.5].forEach((mult, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * mult, now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.1 * volumeMultiplier / (i + 1), now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.7);
        osc.connect(gain);
        gain.connect(state.audio.masterGain);
        osc.start(now);
        osc.stop(now + duration);
    });
}

function _proceduralFallback_templeBell(ctx, now, volumeMultiplier, isCompletion) {
    const duration = isCompletion ? 5 : 3;
    const baseFreq = 800;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.95, now + duration);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2 * volumeMultiplier, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(state.audio.masterGain);
    osc.start(now);
    osc.stop(now + duration);

    [2, 2.4, 3].forEach((mult, i) => {
        const oscH = ctx.createOscillator();
        const gainH = ctx.createGain();
        oscH.type = 'sine';
        oscH.frequency.value = baseFreq * mult;
        gainH.gain.setValueAtTime(0, now);
        gainH.gain.linearRampToValueAtTime(0.08 * volumeMultiplier / (i + 1), now + 0.002);
        gainH.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.5);
        oscH.connect(gainH);
        gainH.connect(state.audio.masterGain);
        oscH.start(now);
        oscH.stop(now + duration);
    });
}

// =============================================
// Ambient Sound System (Buffer-Based + Procedural Fallback)
// =============================================

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

function createNoiseBuffer(ctx, type) {
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (type === 'brown') {
            data[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = data[i];
            data[i] *= 3.5;
        } else if (type === 'pink') {
            // Simplified pink noise
            data[i] = (lastOut + (0.05 * white)) / 1.05;
            lastOut = data[i];
            data[i] *= 2;
        } else {
            data[i] = white;
        }
    }
    return buffer;
}

function _proceduralFallback_rain(ctx) {
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 'pink');
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1200;

    const gain = ctx.createGain();
    gain.gain.value = 0.8;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(state.audio.masterGain);

    noise.start();
    registerAmbientNode(noise);
    registerAmbientNode(filter);
    registerAmbientNode(gain);
}

function _proceduralFallback_waves(ctx) {
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 'pink');
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.1;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 300;

    const gain = ctx.createGain();
    gain.gain.value = 0.8;

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(state.audio.masterGain);

    noise.start();
    lfo.start();
    registerAmbientNode(noise);
    registerAmbientNode(lfo);
    registerAmbientNode(lfoGain);
    registerAmbientNode(filter);
    registerAmbientNode(gain);
}

function _proceduralFallback_forest(ctx) {
    // Gentle pink noise for wind
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 'pink');
    noise.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    const gain = ctx.createGain();
    gain.gain.value = 0.3;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(state.audio.masterGain);
    noise.start();
    registerAmbientNode(noise);
    registerAmbientNode(filter);
    registerAmbientNode(gain);

    // Realistic bird chirps
    const scheduleBird = () => {
        if (!state.audio.isAmbientPlaying || state.audio.ambientSound !== 'forest') return;
        const now = ctx.currentTime;
        const baseFreq = 3000 + Math.random() * 2000;

        for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) {
            const osc = ctx.createOscillator();
            const oscGain = ctx.createGain();
            osc.type = 'sine';

            osc.frequency.setValueAtTime(baseFreq, now + i * 0.2);
            osc.frequency.exponentialRampToValueAtTime(baseFreq + 800, now + i * 0.2 + 0.05);
            osc.frequency.exponentialRampToValueAtTime(baseFreq, now + i * 0.2 + 0.15);

            oscGain.gain.setValueAtTime(0, now + i * 0.2);
            oscGain.gain.linearRampToValueAtTime(0.5, now + i * 0.2 + 0.05); // increased volume
            oscGain.gain.linearRampToValueAtTime(0, now + i * 0.2 + 0.15);

            osc.connect(oscGain);
            oscGain.connect(state.audio.masterGain);

            osc.start(now + i * 0.2);
            osc.stop(now + i * 0.2 + 0.2);
        }
        setTimeout(scheduleBird, 3000 + Math.random() * 6000);
    };
    scheduleBird();
}

function _proceduralFallback_wind(ctx) {
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 'pink');
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.05;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 400; // Strong swept filter sound

    const gain = ctx.createGain();
    gain.gain.value = 0.6;

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(state.audio.masterGain);

    noise.start();
    lfo.start();
    registerAmbientNode(noise);
    registerAmbientNode(lfo);
    registerAmbientNode(lfoGain);
    registerAmbientNode(filter);
    registerAmbientNode(gain);
}

function _proceduralFallback_zen(ctx) {
    const now = ctx.currentTime;
    const baseGain = ctx.createGain();
    baseGain.gain.value = 0.6; // Increased from 0.14
    baseGain.connect(state.audio.masterGain);

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 1500;
    lowpass.Q.value = 1.0;
    lowpass.connect(baseGain);

    const chord = [261.63, 329.63, 392.0, 523.25]; // C Major

    chord.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = index % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 3); // LOUDER!
        gain.gain.linearRampToValueAtTime(0.05, now + 6);

        osc.connect(gain);
        gain.connect(lowpass);

        osc.start(now);
        registerAmbientNode(osc);
        registerAmbientNode(gain);
    });

    registerAmbientNode(lowpass);
    registerAmbientNode(baseGain);
}

function _proceduralFallback_fire(ctx) {
    // Smoother fire sound
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 'brown'); // Less harsh white noise
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300; // Muffled base

    const gain = ctx.createGain();
    gain.gain.value = 1.0;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(state.audio.masterGain);

    noise.start();
    registerAmbientNode(noise);
    registerAmbientNode(filter);
    registerAmbientNode(gain);
}

function _proceduralFallback_brownNoise(ctx) {
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 'brown');
    noise.loop = true;

    const gain = ctx.createGain();
    gain.gain.value = 0.8;

    noise.connect(gain);
    gain.connect(state.audio.masterGain);

    noise.start();
    registerAmbientNode(noise);
    registerAmbientNode(gain);
}

function _proceduralFallback_chants(ctx) {
    const now = ctx.currentTime;
    const baseGain = ctx.createGain();
    baseGain.gain.value = 0.5; // Louder chants
    baseGain.connect(state.audio.masterGain);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800; // Let more through
    filter.connect(baseGain);

    const drone = ctx.createOscillator();
    drone.type = 'sawtooth';
    drone.frequency.value = 65.41; // C2 drone

    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.3;

    drone.connect(droneGain);
    droneGain.connect(filter);
    drone.start(now);

    registerAmbientNode(drone);
    registerAmbientNode(droneGain);
    registerAmbientNode(filter);
    registerAmbientNode(baseGain);
}

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

function registerAmbientNode(node) {
    if (!node) return;
    state.audio.ambientNodes.push(node);
}

// =============================================
// Breathing System
// =============================================

function openBreathingModal() {
    DOM.breathingModal.classList.remove('hidden');
    state.breathing.pattern = DOM.breathingPatternSelect.value;

    // Optionally play breathing intro guidance
    if (typeof guidedState !== 'undefined' && guidedState.breathingGuidanceEnabled) {
        if (typeof playBreathingIntro === 'function') {
            playBreathingIntro().catch(e => console.log('Intro guidance error:', e));
        }
    }
}

function closeBreathingModal() {
    DOM.breathingModal.classList.add('hidden');
    stopBreathingExercise();
}

function toggleBreathingExercise() {
    if (state.breathing.isActive) {
        stopBreathingExercise();
    } else {
        startBreathingExercise();
    }
}

function startBreathingExercise() {
    state.breathing.isActive = true;
    state.breathing.cycleCount = 0;
    DOM.breathStartBtn.textContent = 'Stop';
    runBreathingCycle();
}

function stopBreathingExercise() {
    state.breathing.isActive = false;
    state.breathing.phase = 'idle';
    DOM.breathStartBtn.textContent = 'Start';
    DOM.breathCircleLarge.className = 'breath-circle-large';
    DOM.breathInstruction.textContent = 'Ready';
    DOM.breathCounter.textContent = '';

    if (state.breathing.intervalId) {
        clearTimeout(state.breathing.intervalId);
        state.breathing.intervalId = null;
    }
}

function runBreathingCycle() {
    if (!state.breathing.isActive) return;

    const pattern = parseBreathingPattern(state.breathing.pattern);
    const phases = pattern.phases;
    let phaseIndex = 0;

    const runPhase = () => {
        if (!state.breathing.isActive) return;

        const phase = phases[phaseIndex];
        state.breathing.phase = phase.name;

        // Update UI
        DOM.breathCircleLarge.className = `breath-circle-large ${phase.name}`;
        DOM.breathInstruction.textContent = phase.label;

        // Update visual breathing with phase sync
        if (typeof updateBreathingVisualsWithPhase === 'function') {
            updateBreathingVisualsWithPhase(phase.name, 0.5);
        }

        // Play guided phase cue
        if (typeof playBreathingPhaseGuidance === 'function') {
            playBreathingPhaseGuidance(state.breathing.pattern, phase.name).catch(e => console.log('Guidance error:', e));
        }

        // Countdown
        let count = phase.duration;
        DOM.breathCounter.textContent = count;

        // Update transition duration
        DOM.breathCircleLarge.style.transitionDuration = `${phase.duration}s`;

        const countDown = () => {
            if (!state.breathing.isActive) return;

            count--;
            if (count > 0) {
                DOM.breathCounter.textContent = count;
                state.breathing.intervalId = setTimeout(countDown, 1000);
            } else {
                // Move to next phase
                phaseIndex++;
                if (phaseIndex >= phases.length) {
                    phaseIndex = 0;
                    state.breathing.cycleCount++;
                }
                state.breathing.intervalId = setTimeout(runPhase, 100);
            }
        };

        state.breathing.intervalId = setTimeout(countDown, 1000);
    };

    runPhase();
}

function parseBreathingPattern(pattern) {
    const parts = pattern.split('-').map(Number);

    if (parts.length === 2) {
        // Simple pattern: inhale-exhale
        return {
            phases: [
                { name: 'inhale', label: 'Inhale', duration: parts[0] },
                { name: 'exhale', label: 'Exhale', duration: parts[1] }
            ]
        };
    } else if (parts.length === 3) {
        // 4-7-8 pattern: inhale-hold-exhale
        return {
            phases: [
                { name: 'inhale', label: 'Inhale', duration: parts[0] },
                { name: 'hold', label: 'Hold', duration: parts[1] },
                { name: 'exhale', label: 'Exhale', duration: parts[2] }
            ]
        };
    } else if (parts.length === 4) {
        // Box breathing: inhale-hold-exhale-hold
        return {
            phases: [
                { name: 'inhale', label: 'Inhale', duration: parts[0] },
                { name: 'hold', label: 'Hold', duration: parts[1] },
                { name: 'exhale', label: 'Exhale', duration: parts[2] },
                { name: 'hold', label: 'Hold', duration: parts[3] }
            ]
        };
    }

    // Default fallback
    return {
        phases: [
            { name: 'inhale', label: 'Inhale', duration: 4 },
            { name: 'exhale', label: 'Exhale', duration: 4 }
        ]
    };
}

// =============================================
// Focus Mode
// =============================================

function toggleFocusMode() {
    state.focusMode = !state.focusMode;
    document.body.classList.toggle('focus-mode', state.focusMode);
    DOM.focusModeBtn.classList.toggle('active', state.focusMode);

    const focusHint = document.getElementById('focusHint');
    if (state.focusMode) {
        if (focusHint) focusHint.style.opacity = '1';
        // Auto-hide the hint after 4 seconds
        setTimeout(() => {
            if (focusHint && state.focusMode) {
                focusHint.style.opacity = '0';
            }
        }, 4000);
    } else {
        if (focusHint) focusHint.style.opacity = '0';
    }
}

// =============================================
// Session History
// =============================================

function updateHistoryStats() {
    const totalSessions = state.sessions.length;
    const totalMinutes = Math.floor(state.sessions.reduce((sum, s) => sum + s.duration, 0) / 60);
    const streak = calculateStreak();

    DOM.totalSessions.textContent = totalSessions;
    DOM.totalMinutes.textContent = totalMinutes;
    DOM.currentStreak.textContent = streak;

    // Also update mini stats widget
    updateMiniStats();

    // Refresh enhanced analytics if available
    if (typeof window.refreshEnhancedStats === 'function') {
        window.refreshEnhancedStats();
    }
}

function calculateStreak() {
    if (state.sessions.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Group sessions by date
    const sessionDates = new Set();
    state.sessions.forEach(s => {
        const date = new Date(s.date);
        date.setHours(0, 0, 0, 0);
        sessionDates.add(date.toDateString());
    });

    // Count consecutive days
    let checkDate = new Date(today);

    // First check if there's a session today or yesterday
    if (!sessionDates.has(checkDate.toDateString())) {
        checkDate.setDate(checkDate.getDate() - 1);
        if (!sessionDates.has(checkDate.toDateString())) {
            return 0;
        }
    }

    // Count backwards
    while (sessionDates.has(checkDate.toDateString())) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
    }

    return streak;
}

function renderHistory() {
    if (state.sessions.length === 0) {
        DOM.historyList.innerHTML = '<p class="history-empty">No sessions yet. Start meditating!</p>';
        return;
    }

    DOM.historyList.innerHTML = state.sessions.slice(0, 50).map(session => {
        const date = new Date(session.date);
        const dateStr = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        const durationStr = formatTime(session.duration);

        return `
            <div class="history-item">
                <div>
                    <div class="history-item-date">${dateStr}</div>
                </div>
                <div class="history-item-duration">${durationStr}</div>
                <span class="history-item-status ${session.completed ? 'completed' : ''}">${session.completed ? 'Complete' : 'Partial'}</span>
            </div>
        `;
    }).join('');
}

function clearHistory() {
    // Show confirmation toast with custom buttons
    const confirmed = confirm('Are you sure you want to clear all session history?');

    if (confirmed) {
        state.sessions = [];
        saveSessions();
        updateHistoryStats();
        renderHistory();
        toast.show('Session history cleared', 'success');
    }
}

// =============================================
// Quotes
// =============================================

function setDailyQuote() {
    // Use date to get consistent daily quote
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
    const quoteIndex = dayOfYear % quotes.length;
    const quote = quotes[quoteIndex];

    DOM.dailyQuote.textContent = `"${quote.text}"`;
    DOM.quoteAuthor.textContent = `— ${quote.author}`;
}

// =============================================
// Notifications
// =============================================

function requestNotificationPermission() {
    if (state.settings.notifications && 'Notification' in window) {
        Notification.requestPermission();
    }
}

function sendNotification(title, body) {
    if (!state.settings.notifications) return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    try {
        new Notification(title, {
            body,
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%23d2a8ff"/></svg>',
            silent: true
        });
    } catch (e) {
        // Notification failed (possibly on mobile)
        console.log('Notification not supported');
    }
}

// =============================================
// Completion Overlay
// =============================================

function showCompletionOverlay(intention) {
    const duration = state.timer.originalDuration;
    const minutes = Math.floor(duration / 60);
    const message = completionMessages[Math.floor(Math.random() * completionMessages.length)];

    DOM.completeDuration.textContent = `${minutes} minute${minutes !== 1 ? 's' : ''} of mindfulness`;
    DOM.completeMessage.textContent = message;

    // Show intention if it exists
    if (intention && DOM.completeIntention && DOM.completeIntentionText) {
        DOM.completeIntentionText.textContent = `"${intention}"`;
        DOM.completeIntention.classList.remove('hidden');
    } else if (DOM.completeIntention) {
        DOM.completeIntention.classList.add('hidden');
    }

    DOM.completeOverlay.classList.remove('hidden');
}

// =============================================
// Desktop Sidebar Breathing Guide Functions
// =============================================

function toggleSidebarBreathingGuide() {
    const content = DOM.breathingGuideContent;
    const toggle = DOM.breathingGuideToggle;

    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        toggle.classList.add('active');
    } else {
        content.classList.add('hidden');
        toggle.classList.remove('active');
        // Stop breathing if active
        if (state.breathing.isActive && state.breathing.usingSidebar) {
            stopSidebarBreathingExercise();
        }
    }
}

function toggleSidebarBreathingExercise() {
    if (state.breathing.isActive && state.breathing.usingSidebar) {
        stopSidebarBreathingExercise();
    } else {
        startSidebarBreathingExercise();
    }
}

function startSidebarBreathingExercise() {
    state.breathing.isActive = true;
    state.breathing.usingSidebar = true;
    state.breathing.cycleCount = 0;
    state.breathing.pattern = DOM.breathingPatternSidebar.value;
    DOM.breathStartBtnSmall.textContent = 'Stop';
    runSidebarBreathingCycle();
}

function stopSidebarBreathingExercise() {
    state.breathing.isActive = false;
    state.breathing.usingSidebar = false;
    state.breathing.phase = 'idle';
    DOM.breathStartBtnSmall.textContent = 'Start';
    DOM.breathCircleSmall.className = 'breath-circle-small';
    DOM.breathInstructionSmall.textContent = 'Ready';

    if (state.breathing.intervalId) {
        clearTimeout(state.breathing.intervalId);
        state.breathing.intervalId = null;
    }
}

function runSidebarBreathingCycle() {
    if (!state.breathing.isActive || !state.breathing.usingSidebar) return;

    const pattern = parseBreathingPattern(state.breathing.pattern);
    const phases = pattern.phases;
    let phaseIndex = 0;

    const runPhase = () => {
        if (!state.breathing.isActive || !state.breathing.usingSidebar) return;

        const phase = phases[phaseIndex];
        state.breathing.phase = phase.name;

        // Update UI
        DOM.breathCircleSmall.className = `breath-circle-small ${phase.name}`;
        DOM.breathInstructionSmall.textContent = phase.label;

        // Update transition duration
        DOM.breathCircleSmall.style.transitionDuration = `${phase.duration}s`;

        // Move to next phase after duration
        state.breathing.intervalId = setTimeout(() => {
            phaseIndex++;
            if (phaseIndex >= phases.length) {
                phaseIndex = 0;
                state.breathing.cycleCount++;
            }
            runPhase();
        }, phase.duration * 1000);
    };

    runPhase();
}

// =============================================
// Utility Functions
// =============================================

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// =============================================
// Initialize App
// =============================================

document.addEventListener('DOMContentLoaded', init);

// Handle visibility change (pause ambient and particles when tab is hidden)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (particleSystem) {
            particleSystem.stop();
        }
    } else {
        if (particleSystem) {
            particleSystem.start();
        }
    }
});

// Service Worker Registration (for PWA support)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch((error) => {
            console.warn('Service worker registration failed:', error);
        });
    });
}

// =============================================
// Accordion System
// =============================================

function initAccordions() {
    // Load accordion states from localStorage
    const soundSettingsState = safeGetRawItem(STORAGE_KEYS.ACCORDION_PREFIX + 'soundSettings', '');

    // Sound settings accordion starts collapsed by default
    if (soundSettingsState === 'open') {
        openAccordion('soundSettingsToggle', 'soundSettingsContent');
    }
}

function toggleAccordion(toggleId, contentId, storageKey) {
    const toggle = document.getElementById(toggleId);
    const content = document.getElementById(contentId);

    if (!toggle || !content) return;

    const isOpen = toggle.classList.contains('open');

    if (isOpen) {
        closeAccordion(toggleId, contentId);
        safeSetRawItem(STORAGE_KEYS.ACCORDION_PREFIX + storageKey, 'closed');
    } else {
        openAccordion(toggleId, contentId);
        safeSetRawItem(STORAGE_KEYS.ACCORDION_PREFIX + storageKey, 'open');
    }
}

function openAccordion(toggleId, contentId) {
    const toggle = document.getElementById(toggleId);
    const content = document.getElementById(contentId);

    if (!toggle || !content) return;

    toggle.classList.add('open');
    content.classList.remove('hidden');
}

function closeAccordion(toggleId, contentId) {
    const toggle = document.getElementById(toggleId);
    const content = document.getElementById(contentId);

    if (!toggle || !content) return;

    toggle.classList.remove('open');
    content.classList.add('hidden');
}

// =============================================
// Mini Stats Widget
// =============================================

function updateMiniStats() {
    if (!DOM.miniStatsWidget) return;

    const todayMinutes = getTodayMinutes();
    const streak = calculateStreak();
    const totalSessions = state.sessions.length;
    const totalMinutes = Math.floor(
        state.sessions.reduce((sum, s) => sum + s.duration, 0) / 60
    );

    // Update mini stats display
    if (DOM.miniStatToday) DOM.miniStatToday.textContent = todayMinutes;
    if (DOM.miniStatStreak) DOM.miniStatStreak.textContent = streak;
    if (DOM.miniStatTotalSessions) DOM.miniStatTotalSessions.textContent = totalSessions;
    if (DOM.miniStatTotalMinutes) DOM.miniStatTotalMinutes.textContent = totalMinutes;

    // Show/hide widget based on whether there are sessions
    if (totalSessions > 0) {
        DOM.miniStatsWidget.style.display = 'block';
    } else {
        DOM.miniStatsWidget.style.display = 'none';
    }
}

function getTodayMinutes() {
    const today = new Date().toDateString();
    return Math.floor(
        state.sessions
            .filter(s => new Date(s.date).toDateString() === today)
            .reduce((sum, s) => sum + s.duration, 0) / 60
    );
}

function toggleMiniStatsExpanded() {
    if (!DOM.miniStatsWidget) return;

    const isExpanded = DOM.miniStatsWidget.classList.contains('expanded');

    if (isExpanded) {
        DOM.miniStatsWidget.classList.remove('expanded');
        if (DOM.miniStatsDetails) {
            DOM.miniStatsDetails.classList.add('hidden');
        }
    } else {
        DOM.miniStatsWidget.classList.add('expanded');
        if (DOM.miniStatsDetails) {
            DOM.miniStatsDetails.classList.remove('hidden');
        }
    }
}

// =============================================
// Toast Notification System
// =============================================

class ToastManager {
    constructor() {
        this.container = document.getElementById('toastContainer');
        this.toasts = [];
    }

    show(message, type = 'info', duration = 4000) {
        if (!this.container) return null;

        const toast = this.createToast(message, type, duration);
        this.container.appendChild(toast);
        this.toasts.push(toast);

        // Trigger entrance animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // Auto-remove if duration specified
        if (duration > 0) {
            setTimeout(() => this.remove(toast), duration);
        }

        return toast;
    }

    createToast(message, type, duration) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: '✓',
            error: '✕',
            info: 'ⓘ',
            warning: '⚠'
        };

        const icon = icons[type] || icons.info;

        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-message">${message}</div>
            ${duration > 0 ? '<div class="toast-progress"></div>' : ''}
        `;

        // Add click to dismiss
        toast.addEventListener('click', () => this.remove(toast));

        // Set progress bar animation duration to match dismiss timing
        const progressBar = toast.querySelector('.toast-progress');
        if (progressBar && duration > 0) {
            progressBar.style.animationDuration = `${duration}ms`;
        }

        return toast;
    }

    remove(toast) {
        if (!toast || !toast.parentNode) return;

        toast.classList.add('removing');
        toast.classList.remove('show');

        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
            this.toasts = this.toasts.filter(t => t !== toast);
        }, 300);
    }

    clear() {
        this.toasts.forEach(toast => this.remove(toast));
    }
}

// Initialize toast manager globally
const toast = new ToastManager();

// =============================================
// Organic Blob Particle System
// =============================================

class OrganicParticleSystem {
    constructor(canvas) {
        if (!canvas) return;

        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.animationFrame = null;

        this.options = {
            count: 15,
            minSize: 3,
            maxSize: 8,
            minSpeed: 0.2,
            maxSpeed: 0.5,
            colors: ['#7ee787', '#58a6ff', '#d2a8ff'],
            minOpacity: 0.1,
            maxOpacity: 0.3
        };

        this.resize();
        this.init();

        // Bind resize handler
        this.resizeHandler = () => this.resize();
        window.addEventListener('resize', this.resizeHandler);
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    init() {
        this.particles = [];
        for (let i = 0; i < this.options.count; i++) {
            this.particles.push(this.createParticle());
        }
    }

    createParticle() {
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            size: this.random(this.options.minSize, this.options.maxSize),
            speedX: this.random(-this.options.maxSpeed, this.options.maxSpeed),
            speedY: this.random(-this.options.maxSpeed, this.options.maxSpeed),
            color: this.options.colors[Math.floor(Math.random() * this.options.colors.length)],
            opacity: this.random(this.options.minOpacity, this.options.maxOpacity),
            blobPoints: 8,
            blobVariation: this.random(0.3, 0.7),
            rotationSpeed: this.random(-0.005, 0.005),
            rotation: 0,
            offset: Array.from({ length: 8 }, () => Math.random() * Math.PI * 2)
        };
    }

    random(min, max) {
        return Math.random() * (max - min) + min;
    }

    drawBlobParticle(particle) {
        const ctx = this.ctx;
        const points = particle.blobPoints;
        const radius = particle.size;

        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);

        ctx.beginPath();

        for (let i = 0; i <= points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const nextAngle = ((i + 1) / points) * Math.PI * 2;

            // Add organic variation to radius
            const variation = Math.sin(particle.offset[i % 8] + Date.now() * 0.001) * particle.blobVariation;
            const r = radius + variation;
            const nextR = radius + Math.sin(particle.offset[(i + 1) % 8] + Date.now() * 0.001) * particle.blobVariation;

            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            const nextX = Math.cos(nextAngle) * nextR;
            const nextY = Math.sin(nextAngle) * nextR;

            if (i === 0) {
                ctx.moveTo(x, y);
            }

            // Use quadratic curves for smooth organic shapes
            const cpX = (x + nextX) / 2;
            const cpY = (y + nextY) / 2;
            ctx.quadraticCurveTo(x, y, cpX, cpY);
        }

        ctx.closePath();

        // Apply color and opacity
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.opacity;
        ctx.fill();

        ctx.restore();
    }

    update() {
        this.particles.forEach(particle => {
            // Update position
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            particle.rotation += particle.rotationSpeed;

            // Wrap around screen edges
            if (particle.x < -particle.size * 2) {
                particle.x = this.canvas.width + particle.size * 2;
            }
            if (particle.x > this.canvas.width + particle.size * 2) {
                particle.x = -particle.size * 2;
            }
            if (particle.y < -particle.size * 2) {
                particle.y = this.canvas.height + particle.size * 2;
            }
            if (particle.y > this.canvas.height + particle.size * 2) {
                particle.y = -particle.size * 2;
            }
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.particles.forEach(particle => this.drawBlobParticle(particle));
    }

    animate() {
        this.update();
        this.draw();
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    start() {
        if (!this.animationFrame) {
            this.animate();
        }
    }

    stop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    destroy() {
        this.stop();
        window.removeEventListener('resize', this.resizeHandler);
    }
}

// Initialize particle system (respect reduced motion preference)
let particleSystem = null;

function initParticleSystem() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion && DOM.particleCanvas) {
        particleSystem = new OrganicParticleSystem(DOM.particleCanvas);
        particleSystem.start();
    }
}

// =============================================
// Intention Feature Functions
// =============================================

function updateCharCounter() {
    if (!DOM.intentionInput || !DOM.charCounter) return;

    const length = DOM.intentionInput.value.length;
    const maxLength = DOM.intentionInput.maxLength;

    DOM.charCounter.textContent = `${length}/${maxLength}`;

    // Warning color when near limit
    if (length >= maxLength * 0.9) {
        DOM.charCounter.classList.add('warning');
    } else {
        DOM.charCounter.classList.remove('warning');
    }
}

function showIntentionDuringMeditation() {
    if (!DOM.intentionDisplay || !DOM.intentionText) return;

    const intention = DOM.intentionInput.value.trim();

    if (intention) {
        DOM.intentionText.textContent = `"${intention}"`;
        DOM.intentionDisplay.classList.remove('hidden');
    }
}

function hideIntentionDuringMeditation() {
    if (!DOM.intentionDisplay) return;
    DOM.intentionDisplay.classList.add('hidden');
}

// =============================================
// Feature: Custom Breathing Patterns
// =============================================

function initCustomBreathingPatterns() {
    refreshBreathingDropdowns();

    const addBtn = document.getElementById('addCustomPatternBtn');
    if (addBtn) {
        addBtn.addEventListener('click', addCustomBreathingPattern);
    }

    // Also allow Enter key in custom pattern inputs
    ['customInhale', 'customHold1', 'customExhale', 'customHold2'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') addCustomBreathingPattern();
            });
        }
    });
}

function loadCustomBreathingPatterns() {
    return safeGetItem(STORAGE_KEYS.CUSTOM_PATTERNS, []);
}

function saveCustomBreathingPatterns(patterns) {
    safeSetItem(STORAGE_KEYS.CUSTOM_PATTERNS, patterns);
}

function addCustomBreathingPattern() {
    const inhaleRaw = parseInt(document.getElementById('customInhale')?.value);
    const hold1Raw = parseInt(document.getElementById('customHold1')?.value);
    const exhaleRaw = parseInt(document.getElementById('customExhale')?.value);
    const hold2Raw = parseInt(document.getElementById('customHold2')?.value);
    const inhale = Number.isFinite(inhaleRaw) ? inhaleRaw : 4;
    const hold1 = Number.isFinite(hold1Raw) ? hold1Raw : 0;
    const exhale = Number.isFinite(exhaleRaw) ? exhaleRaw : 4;
    const hold2 = Number.isFinite(hold2Raw) ? hold2Raw : 0;

    if (inhale < 1 || exhale < 1) {
        toast.show('Inhale and exhale must be at least 1 second', 'warning');
        return;
    }
    if (inhale + hold1 + exhale + hold2 > 60) {
        toast.show('Total cycle must be 60 seconds or less', 'warning');
        return;
    }

    const parts = [inhale, hold1, exhale, hold2];
    // Remove trailing zeros, but always keep at least inhale and exhale
    let patternParts = parts;
    while (patternParts.length > 2 && patternParts[patternParts.length - 1] === 0) {
        patternParts = patternParts.slice(0, -1);
    }
    // If 3 parts and hold is 0, simplify to 2 parts
    if (patternParts.length === 3 && patternParts[1] === 0) {
        patternParts = [patternParts[0], patternParts[2]];
    }
    const patternStr = patternParts.join('-');

    const patterns = loadCustomBreathingPatterns();
    if (patterns.includes(patternStr)) {
        toast.show('Pattern already exists', 'warning');
        return;
    }

    patterns.push(patternStr);
    saveCustomBreathingPatterns(patterns);
    refreshBreathingDropdowns();
    toast.show(`Pattern ${patternStr} added!`, 'success');

    // Clear inputs
    ['customInhale', 'customHold1', 'customExhale', 'customHold2'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
}

function removeCustomBreathingPattern(patternStr) {
    let patterns = loadCustomBreathingPatterns();
    patterns = patterns.filter(p => p !== patternStr);
    saveCustomBreathingPatterns(patterns);
    refreshBreathingDropdowns();
    toast.show('Pattern removed', 'success');
}

function refreshBreathingDropdowns() {
    const patterns = loadCustomBreathingPatterns();
    const selects = [
        document.getElementById('breathingPattern'),
        document.getElementById('breathingPatternSelect'),
        document.getElementById('breathingPatternSidebar')
    ];

    selects.forEach(select => {
        if (!select) return;
        // Remove existing custom options
        select.querySelectorAll('.custom-pattern-option').forEach(opt => opt.remove());
        // Add custom patterns
        patterns.forEach(p => {
            const option = document.createElement('option');
            option.value = p;
            option.textContent = `Custom (${p})`;
            option.className = 'custom-pattern-option';
            select.appendChild(option);
        });
    });

    // Update custom patterns list display in settings
    renderCustomPatternsList();
}

function renderCustomPatternsList() {
    const list = document.getElementById('customPatternsList');
    if (!list) return;

    const patterns = loadCustomBreathingPatterns();
    if (patterns.length === 0) {
        list.innerHTML = '';
        return;
    }

    list.innerHTML = patterns.map(p => `
        <div class="custom-pattern-item">
            <span class="pattern-value">${p}</span>
            <button class="pattern-remove-btn" data-pattern="${p}" title="Remove pattern">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>
    `).join('');

    // Event delegation for remove buttons
    list.querySelectorAll('.pattern-remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            removeCustomBreathingPattern(btn.dataset.pattern);
        });
    });
}

// =============================================
// Feature: Mood-Based Recommendations
// =============================================

function initMoodRecommendations() {
    const grid = document.getElementById('moodRecommendGrid');
    if (!grid) return;

    grid.addEventListener('click', (e) => {
        const btn = e.target.closest('.mood-rec-btn');
        if (!btn) return;

        const mood = btn.dataset.mood;
        applyMoodRecommendation(mood);

        // Visual feedback
        grid.querySelectorAll('.mood-rec-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');

        // Clear selection after 3 seconds
        setTimeout(() => btn.classList.remove('selected'), 3000);
    });
}

function applyMoodRecommendation(mood) {
    const rec = MOOD_RECOMMENDATIONS[mood];
    if (!rec) return;

    // Apply breathing pattern
    state.settings.breathingPattern = rec.pattern;
    state.breathing.pattern = rec.pattern;
    const breathingSelect = document.getElementById('breathingPattern');
    if (breathingSelect) breathingSelect.value = rec.pattern;

    // Apply ambient sound
    state.audio.ambientSound = rec.ambient;
    DOM.ambientSound.value = rec.ambient;
    safeSetRawItem(STORAGE_KEYS.AMBIENT_SOUND, rec.ambient);

    // Apply mantra
    if (typeof guidedState !== 'undefined') {
        guidedState.mantraText = rec.mantra;
    }

    // Apply duration
    state.timer.duration = rec.duration;
    state.timer.remaining = rec.duration;
    updateTimerDisplay();
    updateTimerProgress();

    // Update preset button active state
    updateMoodPresetButtons(rec.duration);

    saveSettings();
    toast.show(`${mood.charAt(0).toUpperCase() + mood.slice(1)}: ${rec.pattern} breathing, ${rec.ambient}`, 'info');
}

function updateMoodPresetButtons(durationMinutes) {
    const minutes = durationMinutes / 60;
    DOM.presets.querySelectorAll('.preset-btn').forEach(b => {
        b.classList.remove('active');
        if (parseInt(b.dataset.minutes) === minutes) b.classList.add('active');
    });
    DOM.presetsDesktop.querySelectorAll('.preset-btn').forEach(b => {
        b.classList.remove('active');
        if (parseInt(b.dataset.minutes) === minutes) b.classList.add('active');
    });
}

// =============================================
// Feature: Emergency Calm / Grounding
// =============================================

let groundingState = {
    isActive: false,
    currentStep: 0,
    timeoutId: null,
    audio: null
};

const calmGroundingScript = [
    { phase: 'intro', text: 'Take a deep breath. You are safe.', duration: GROUNDING_CONFIG.INTRO_DURATION },
    { phase: '5', text: 'Name five things you can see around you.', visual: 'Look around you slowly.', duration: GROUNDING_CONFIG.STEP_DURATION },
    { phase: '4', text: 'Name four things you can touch right now.', visual: 'Feel the surface beneath your hands.', duration: GROUNDING_CONFIG.STEP_DURATION },
    { phase: '3', text: 'Name three things you can hear.', visual: 'Listen to the sounds around you.', duration: GROUNDING_CONFIG.STEP_DURATION },
    { phase: '2', text: 'Name two things you can smell.', visual: 'Notice the scents in the air.', duration: GROUNDING_CONFIG.STEP_DURATION },
    { phase: '1', text: 'Name one thing you can taste.', visual: 'Notice the taste in your mouth.', duration: GROUNDING_CONFIG.STEP_DURATION },
    { phase: 'close', text: 'You are grounded. You are present. You are safe.', duration: GROUNDING_CONFIG.CLOSE_DURATION }
];

function initEmergencyCalm() {
    const calmBtn = document.getElementById('emergencyCalmBtn');
    const calmCloseBtn = document.getElementById('calmCloseBtn');

    if (calmBtn) {
        calmBtn.addEventListener('click', startGroundingExercise);
    }
    if (calmCloseBtn) {
        calmCloseBtn.addEventListener('click', stopGroundingExercise);
    }

    // Close on overlay click
    const calmModal = document.getElementById('calmModal');
    if (calmModal) {
        calmModal.addEventListener('click', (e) => {
            if (e.target === calmModal) stopGroundingExercise();
        });
    }
}

async function startGroundingExercise() {
    if (groundingState.isActive) return;

    groundingState.isActive = true;
    groundingState.currentStep = 0;

    const calmModal = document.getElementById('calmModal');
    if (calmModal) calmModal.classList.remove('hidden');

    // Start ambient rain for calming effect
    initAudioContext();
    const prevAmbient = state.audio.ambientSound;
    state.audio.ambientSound = 'rain';
    startAmbientSound();
    if (typeof fadeInAmbientSound === 'function') {
        fadeInAmbientSound(1000);
    }

    // Play grounding steps
    for (let i = 0; i < calmGroundingScript.length; i++) {
        if (!groundingState.isActive) break;

        groundingState.currentStep = i;
        const step = calmGroundingScript[i];

        // Update visual
        updateCalmVisual(step);

        // Speak the instruction
        if (typeof speakText === 'function') {
            await speakText(step.text, { rate: 0.8, volume: 0.7 });
        }

        // Wait for step duration
        await new Promise(resolve => {
            groundingState.timeoutId = setTimeout(resolve, step.duration);
        });
    }

    // Restore ambient
    state.audio.ambientSound = prevAmbient;
    if (typeof fadeOutAmbientSound === 'function') {
        fadeOutAmbientSound(1000);
    }
    setTimeout(() => {
        stopAmbientSound();
        state.audio.ambientSound = prevAmbient;
    }, 1100);

    stopGroundingExercise();
}

function updateCalmVisual(step) {
    const circle = document.getElementById('calmCircle');
    const instruction = document.getElementById('calmInstruction');
    const stepEl = document.getElementById('calmStep');

    if (instruction) instruction.textContent = step.visual || step.text;
    if (stepEl) {
        if (step.phase === 'intro' || step.phase === 'close') {
            stepEl.textContent = '';
        } else {
            stepEl.textContent = step.phase;
        }
    }
    if (circle) {
        circle.className = 'calm-circle';
        if (step.phase !== 'intro' && step.phase !== 'close') {
            circle.classList.add(`step-${step.phase}`);
        }
    }
}

function stopGroundingExercise() {
    groundingState.isActive = false;
    if (groundingState.timeoutId) {
        clearTimeout(groundingState.timeoutId);
        groundingState.timeoutId = null;
    }

    if (typeof stopTTS === 'function') {
        stopTTS();
    }

    const calmModal = document.getElementById('calmModal');
    if (calmModal) calmModal.classList.add('hidden');

    const circle = document.getElementById('calmCircle');
    if (circle) circle.className = 'calm-circle';
}

function closeCalmModal() {
    if (groundingState.isActive) {
        stopGroundingExercise();
    }
}

// =============================================
// Feature: Custom Sound Upload
// =============================================

const customSoundState = {
    blobs: {},
    files: {}
};

function initCustomSoundUpload() {
    const input = document.getElementById('customSoundInput');
    const btn = document.getElementById('customSoundBtn');
    const filename = document.getElementById('uploadFilename');

    if (!input || !btn) return;

    btn.addEventListener('click', () => input.click());

    input.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('audio/')) {
            toast.show('Please select an audio file', 'warning');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.show('File too large (max 10MB)', 'warning');
            return;
        }

        const blobUrl = URL.createObjectURL(file);
        const soundName = file.name.replace(/\.[^.]+$/, '');

        customSoundState.blobs[soundName] = blobUrl;
        customSoundState.files[soundName] = {
            name: soundName,
            size: file.size,
            type: file.type,
            blobUrl
        };

        addCustomSoundToDropdown(soundName);

        if (filename) filename.textContent = file.name;
        toast.show(`"${soundName}" added to ambient sounds!`, 'success');

        input.value = '';
    });

    renderCustomSoundsList();
}

function addCustomSoundToDropdown(name) {
    const selects = [DOM.ambientSound];
    selects.forEach(select => {
        if (!select) return;
        // Check if already exists
        if (select.querySelector(`option[value="custom_${name}"]`)) return;
        const option = document.createElement('option');
        option.value = `custom_${name}`;
        option.textContent = `${name} (custom)`;
        option.className = 'custom-sound-option';
        select.appendChild(option);
    });
}

function playCustomAmbientSound(name) {
    const blobUrl = customSoundState.blobs[name];
    if (!blobUrl) return false;

    initAudioContext();
    const ctx = state.audio.context;

    const audio = new Audio(blobUrl);
    audio.loop = true;
    audio.crossOrigin = 'anonymous';

    const source = ctx.createMediaElementSource(audio);
    const gainNode = ctx.createGain();
    gainNode.gain.value = state.audio.volume;

    source.connect(gainNode);
    gainNode.connect(state.audio.masterGain);

    audio.play().catch(e => console.warn('Custom audio play failed:', e));

    // Track for stopAmbientSound compatibility
    state.audio.activeAmbientSource = {
        stop: () => { audio.pause(); audio.currentTime = 0; },
        disconnect: () => { try { source.disconnect(); gainNode.disconnect(); } catch(e) {} }
    };
    state.audio.activeAmbientGain = gainNode;
    state.audio.isAmbientPlaying = true;

    return true;
}

function renderCustomSoundsList() {
    const list = document.getElementById('customSoundsList');
    if (!list) return;

    const sounds = Object.values(customSoundState.files);
    if (sounds.length === 0) {
        list.innerHTML = '';
        return;
    }

    list.innerHTML = sounds.map(sound => `
        <div class="custom-sound-item">
            <span class="sound-name">${escapeHtml(sound.name)}</span>
            <span class="sound-size">${(sound.size / 1024).toFixed(0)}KB</span>
            <button class="sound-remove-btn" data-name="${escapeHtml(sound.name)}" title="Remove">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>
    `).join('');

    list.querySelectorAll('.sound-remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const name = btn.dataset.name;
            if (customSoundState.blobs[name]) {
                URL.revokeObjectURL(customSoundState.blobs[name]);
                delete customSoundState.blobs[name];
                delete customSoundState.files[name];
            }
            // Remove from dropdown
            const option = DOM.ambientSound.querySelector(`option[value="custom_${name}"]`);
            if (option) option.remove();
            // Reset to silence if this was active
            if (state.audio.ambientSound === `custom_${name}`) {
                state.audio.ambientSound = 'silence';
                DOM.ambientSound.value = 'silence';
            }
            renderCustomSoundsList();
            toast.show('Custom sound removed', 'success');
        });
    });
}

// Hook into ambient sound system for custom sounds
const originalStartAmbientSound = startAmbientSound;
startAmbientSound = function() {
    const soundKey = state.audio.ambientSound;
    if (soundKey.startsWith('custom_')) {
        const name = soundKey.replace('custom_', '');
        if (playCustomAmbientSound(name)) return;
    }
    originalStartAmbientSound();
};

// =============================================
// Ambient Sound Diagnostics (Manual Test Helper)
// =============================================

async function runAmbientSoundTests() {
    if (state.timer.isRunning) {
        return {
            ok: false,
            message: 'Stop the timer before running ambient sound tests.'
        };
    }

    initAudioContext();

    const results = [];
    const soundsToTest = ['rain', 'waves', 'forest', 'wind'];
    const previousAmbient = state.audio.ambientSound;

    if (state.audio.previewTimeout) {
        clearTimeout(state.audio.previewTimeout);
        state.audio.previewTimeout = null;
    }

    stopAmbientSound();

    for (const sound of soundsToTest) {
        state.audio.ambientSound = sound;
        startAmbientSound();

        await new Promise(resolve => setTimeout(resolve, 150));

        const hasNode = Boolean(state.audio.ambientNode) || state.audio.ambientNodes.length > 0;
        const isPlaying = state.audio.isAmbientPlaying === true;

        results.push({
            sound,
            ok: hasNode && isPlaying,
            details: {
                hasNode,
                isPlaying,
                audioState: state.audio.context ? state.audio.context.state : 'no-context'
            }
        });

        stopAmbientSound();
    }

    state.audio.ambientSound = previousAmbient;

    return {
        ok: results.every(result => result.ok),
        results
    };
}

// Expose for testing and debugging
window.runAmbientSoundTests = runAmbientSoundTests;
window.state = state;
window.DOM = DOM;
window.groundingState = groundingState;
window.calmGroundingScript = calmGroundingScript;
window.customSoundState = customSoundState;
window.stopGroundingExercise = stopGroundingExercise;
