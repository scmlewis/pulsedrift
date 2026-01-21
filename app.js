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
        originalDuration: 600
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
        previewTimeout: null
    },
    settings: {
        intervalBell: 0, // minutes, 0 = off
        breathingPattern: '4-4',
        notifications: true,
        autoBreathing: false
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
    
    // Breathing
    breathingCircle: document.getElementById('breathingCircle'),
    breathText: document.getElementById('breathText'),
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
    
    // Focus Mode
    focusModeBtn: document.getElementById('focusModeBtn'),
    focusModeExit: document.getElementById('focusModeExit'),
    appContainer: document.getElementById('appContainer'),
    
    // Complete Overlay
    completeOverlay: document.getElementById('completeOverlay'),
    completeDuration: document.getElementById('completeDuration'),
    completeMessage: document.getElementById('completeMessage'),
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
    updateMiniStats();
    initParticleSystem();
    updateCharCounter();
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
        // Stop current ambient and start new one if timer is running
        stopAmbientSound();
        if (e.target.value !== 'silence') {
            if (state.timer.isRunning) {
                startAmbientSound();
            } else {
                startAmbientSound();
                state.audio.previewTimeout = setTimeout(() => {
                    if (!state.timer.isRunning) {
                        stopAmbientSound();
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
    
    // Focus mode
    DOM.focusModeBtn.addEventListener('click', toggleFocusMode);
    
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
        if (state.focusMode) {
            toggleFocusMode();
        }
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
    
    // Start ambient sound
    if (state.audio.ambientSound !== 'silence') {
        startAmbientSound();
    }
    
    // Start breathing guide if auto-start is enabled
    if (state.settings.autoBreathing) {
        startInlineBreathing();
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
    
    stopAmbientSound();
    stopInlineBreathing();
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
    
    // Stop breathing
    stopInlineBreathing();
    
    // Hide intention display
    hideIntentionDuringMeditation();
    
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
    
    // Show completion overlay with intention
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
    const circumference = 2 * Math.PI * 90; // r = 90
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
    
    // Resume context if suspended (for autoplay policy)
    if (state.audio.context.state === 'suspended') {
        state.audio.context.resume();
    }
}

function playBellSound(volumeMultiplier = 1, isCompletion = false) {
    if (state.audio.bellSound === 'silence') return;
    
    initAudioContext();
    const ctx = state.audio.context;
    const now = ctx.currentTime;
    
    switch (state.audio.bellSound) {
        case 'singing-bowl':
            playSingingBowl(ctx, now, volumeMultiplier, isCompletion);
            break;
        case 'soft-gong':
            playSoftGong(ctx, now, volumeMultiplier, isCompletion);
            break;
        case 'bell':
            playTempleBell(ctx, now, volumeMultiplier, isCompletion);
            break;
    }
}

function playSingingBowl(ctx, now, volumeMultiplier, isCompletion) {
    const duration = isCompletion ? 8 : 5;
    const frequencies = isCompletion ? [220, 330, 440, 550] : [220, 330, 440];
    
    frequencies.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, now);
        oscillator.frequency.exponentialRampToValueAtTime(freq * 0.98, now + duration);
        
        // Add slight vibrato
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

function playSoftGong(ctx, now, volumeMultiplier, isCompletion) {
    const duration = isCompletion ? 6 : 4;
    const freq = isCompletion ? 80 : 100;
    
    // Fundamental
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
    
    // Overtones
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

function playTempleBell(ctx, now, volumeMultiplier, isCompletion) {
    const duration = isCompletion ? 5 : 3;
    const baseFreq = 800;
    
    // Main tone
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
    
    // Harmonics
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

// Ambient Sounds
function startAmbientSound() {
    if (state.audio.isAmbientPlaying) return;
    
    initAudioContext();
    const ctx = state.audio.context;
    
    switch (state.audio.ambientSound) {
        case 'rain':
            createRainSound(ctx);
            break;
        case 'waves':
            createWavesSound(ctx);
            break;
        case 'forest':
            createForestSound(ctx);
            break;
        case 'wind':
            createWindSound(ctx);
            break;
        case 'zen':
            createZenMusic(ctx);
            break;
    }
    
    state.audio.isAmbientPlaying = true;
}

function stopAmbientSound() {
    if (state.audio.ambientNode) {
        try {
            state.audio.ambientNode.stop();
        } catch (e) {
            // Node already stopped
        }
        state.audio.ambientNode = null;
    }
    if (state.audio.ambientNodes.length > 0) {
        state.audio.ambientNodes.forEach(node => {
            if (!node) return;
            try {
                if (typeof node.stop === 'function') {
                    node.stop();
                }
            } catch (e) {
                // Node already stopped
            }
            try {
                if (typeof node.disconnect === 'function') {
                    node.disconnect();
                }
            } catch (e) {
                // Node already disconnected
            }
        });
        state.audio.ambientNodes = [];
    }
    state.audio.isAmbientPlaying = false;
}

function registerAmbientNode(node) {
    if (!node) return;
    state.audio.ambientNodes.push(node);
}

function createRainSound(ctx) {
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    
    // Bandpass filter for rain-like sound
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    filter.Q.value = 0.5;
    
    // Highpass to remove rumble
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 200;
    
    const gain = ctx.createGain();
    gain.gain.value = 0.15;
    
    noise.connect(filter);
    filter.connect(highpass);
    highpass.connect(gain);
    gain.connect(state.audio.masterGain);
    
    noise.start();
    state.audio.ambientNode = noise;
    registerAmbientNode(noise);
    registerAmbientNode(filter);
    registerAmbientNode(highpass);
    registerAmbientNode(gain);
}

function createWavesSound(ctx) {
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    
    // Lowpass filter for ocean-like sound
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    filter.Q.value = 0.8;
    
    // LFO to modulate volume (wave motion)
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 0.08; // Slow wave rhythm
    lfoGain.gain.value = 0.12;
    
    const gain = ctx.createGain();
    gain.gain.value = 0.32;
    
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(state.audio.masterGain);
    
    noise.start();
    lfo.start();
    state.audio.ambientNode = noise;
    registerAmbientNode(noise);
    registerAmbientNode(lfo);
    registerAmbientNode(lfoGain);
    registerAmbientNode(filter);
    registerAmbientNode(gain);
}

function createForestSound(ctx) {
    // Base ambient noise (wind through leaves)
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1600;
    filter.Q.value = 0.7;
    
    const gain = ctx.createGain();
    gain.gain.value = 0.12;
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(state.audio.masterGain);
    
    noise.start();
    state.audio.ambientNode = noise;
    registerAmbientNode(noise);
    registerAmbientNode(filter);
    registerAmbientNode(gain);
    
    // Bird chirps (occasional)
    scheduleBirdChirps(ctx);
}

function scheduleBirdChirps(ctx) {
    if (!state.audio.isAmbientPlaying || state.audio.ambientSound !== 'forest') return;
    
    const delay = 2000 + Math.random() * 5000; // Random delay between chirps
    
    setTimeout(() => {
        if (state.audio.isAmbientPlaying && state.audio.ambientSound === 'forest') {
            playBirdChirp(ctx);
            scheduleBirdChirps(ctx);
        }
    }, delay);
}

function playBirdChirp(ctx) {
    const now = ctx.currentTime;
    const baseFreq = 2000 + Math.random() * 2000;
    
    for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq + i * 200, now + i * 0.1);
        osc.frequency.exponentialRampToValueAtTime(baseFreq + i * 200 + 500, now + i * 0.1 + 0.05);
        osc.frequency.exponentialRampToValueAtTime(baseFreq + i * 200, now + i * 0.1 + 0.1);
        
        gain.gain.setValueAtTime(0, now + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.06, now + i * 0.1 + 0.02);
        gain.gain.linearRampToValueAtTime(0, now + i * 0.1 + 0.1);
        
        osc.connect(gain);
        gain.connect(state.audio.masterGain);
        
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.15);
    }
}

function createWindSound(ctx) {
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    
    // Multiple bandpass filters for wind character
    const filter1 = ctx.createBiquadFilter();
    filter1.type = 'bandpass';
    filter1.frequency.value = 240;
    filter1.Q.value = 1.4;
    
    const filter2 = ctx.createBiquadFilter();
    filter2.type = 'bandpass';
    filter2.frequency.value = 600;
    filter2.Q.value = 0.9;
    
    // LFO for wind gusts
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 0.04;
    lfoGain.gain.value = 260;
    lfo.connect(lfoGain);
    lfoGain.connect(filter1.frequency);
    
    const gain = ctx.createGain();
    gain.gain.value = 0.18;
    
    noise.connect(filter1);
    filter1.connect(filter2);
    filter2.connect(gain);
    gain.connect(state.audio.masterGain);
    
    noise.start();
    lfo.start();
    state.audio.ambientNode = noise;
    registerAmbientNode(noise);
    registerAmbientNode(lfo);
    registerAmbientNode(lfoGain);
    registerAmbientNode(filter1);
    registerAmbientNode(filter2);
    registerAmbientNode(gain);
}

function createZenMusic(ctx) {
    const now = ctx.currentTime;

    const baseGain = ctx.createGain();
    baseGain.gain.value = 0.14;
    baseGain.connect(state.audio.masterGain);

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 1200;
    lowpass.Q.value = 0.7;
    lowpass.connect(baseGain);

    const reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.35;

    // Simple delay for spaciousness
    const delay = ctx.createDelay(2.0);
    delay.delayTime.value = 0.45;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.25;
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(reverbGain);
    reverbGain.connect(baseGain);

    const chord = [220, 277.18, 329.63, 392.0];

    chord.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = index % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.0, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 2.5);
        gain.gain.linearRampToValueAtTime(0.04, now + 6);

        osc.connect(gain);
        gain.connect(lowpass);
        gain.connect(delay);

        osc.start(now);
        registerAmbientNode(osc);
        registerAmbientNode(gain);
    });

    const melodyScale = [392, 440, 494, 523.25, 587.33, 659.25];
    const melody = ctx.createOscillator();
    const melodyGain = ctx.createGain();
    melody.type = 'sine';
    melodyGain.gain.value = 0.05;
    melody.connect(melodyGain);
    melodyGain.connect(lowpass);

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.12;
    lfoGain.gain.value = 6;
    lfo.connect(lfoGain);
    lfoGain.connect(melody.frequency);

    melody.start(now);
    lfo.start(now);

    registerAmbientNode(melody);
    registerAmbientNode(melodyGain);
    registerAmbientNode(lfo);
    registerAmbientNode(lfoGain);
    registerAmbientNode(lowpass);
    registerAmbientNode(delay);
    registerAmbientNode(feedback);
    registerAmbientNode(reverbGain);
    registerAmbientNode(baseGain);

    let step = 0;
    const sequence = () => {
        if (!state.audio.isAmbientPlaying || state.audio.ambientSound !== 'zen') return;

        const target = melodyScale[step % melodyScale.length];
        melody.frequency.setValueAtTime(target, ctx.currentTime);
        step += Math.random() > 0.6 ? 2 : 1;

        setTimeout(sequence, 1800 + Math.random() * 1200);
    };

    sequence();
}

// =============================================
// Breathing System
// =============================================

function openBreathingModal() {
    DOM.breathingModal.classList.remove('hidden');
    state.breathing.pattern = DOM.breathingPatternSelect.value;
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

// Inline breathing (on main timer screen)
function startInlineBreathing() {
    if (state.breathing.isActive) return;
    
    state.breathing.isActive = true;
    state.breathing.pattern = state.settings.breathingPattern;
    DOM.breathingCircle.classList.add('active');
    runInlineBreathingCycle();
}

function stopInlineBreathing() {
    state.breathing.isActive = false;
    DOM.breathingCircle.classList.remove('active', 'inhale', 'hold', 'exhale');
    DOM.breathText.textContent = 'Breathe';
    
    if (state.breathing.intervalId) {
        clearTimeout(state.breathing.intervalId);
        state.breathing.intervalId = null;
    }
}

function runInlineBreathingCycle() {
    if (!state.breathing.isActive) return;
    
    const pattern = parseBreathingPattern(state.breathing.pattern);
    const phases = pattern.phases;
    let phaseIndex = 0;
    
    const runPhase = () => {
        if (!state.breathing.isActive) return;
        
        const phase = phases[phaseIndex];
        
        // Update inline breathing circle
        DOM.breathingCircle.className = `breathing-circle active ${phase.name}`;
        DOM.breathText.textContent = phase.label;
        
        // Move to next phase after duration
        state.breathing.intervalId = setTimeout(() => {
            phaseIndex++;
            if (phaseIndex >= phases.length) {
                phaseIndex = 0;
            }
            runPhase();
        }, phase.duration * 1000);
    };
    
    runPhase();
}

// =============================================
// Focus Mode
// =============================================

function toggleFocusMode() {
    state.focusMode = !state.focusMode;
    document.body.classList.toggle('focus-mode', state.focusMode);
    DOM.focusModeBtn.classList.toggle('active', state.focusMode);
    if (DOM.focusModeExit) {
        DOM.focusModeExit.classList.toggle('hidden', !state.focusMode);
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

// Handle visibility change (pause ambient when tab is hidden to save resources)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (state.audio.isAmbientPlaying) {
            // Store state but don't fully stop (timer continues)
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
