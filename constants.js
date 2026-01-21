/**
 * PulseDrift - Application Constants
 * Centralized configuration for magic numbers and storage keys
 */

// =============================================
// Timer Configuration
// =============================================

const TIMER = {
    DEFAULT_DURATION: 600,        // 10 minutes in seconds
    MIN_SECONDS: 1,               // Minimum timer duration
    MAX_SECONDS: 59940,           // Maximum timer duration (999 min)
    PROGRESS_RADIUS: 90           // SVG circle radius for progress ring
};

// =============================================
// Calendar & Analytics
// =============================================

const CALENDAR = {
    WEEKS_TO_SHOW: 12,
    DAYS_TO_SHOW: 84,             // 12 weeks * 7 days
    ANALYTICS_DAYS: 7             // Days for weekly analytics
};

// =============================================
// Heatmap Levels (minutes thresholds)
// =============================================

const HEATMAP_LEVELS = {
    LEVEL_0: 0,                   // No practice
    LEVEL_1: 1,                   // Any practice
    LEVEL_2: 10,                  // 10+ minutes
    LEVEL_3: 20,                  // 20+ minutes
    LEVEL_4: 30                   // 30+ minutes
};

// =============================================
// UI Timing
// =============================================

const UI_TIMING = {
    ENHANCEMENT_INIT_DELAY: 500,  // Delay before initializing enhancements
    COMPLETE_HANDLER_DELAY: 1000, // Delay before enhancing complete handler
    AMBIENT_PREVIEW_DURATION: 4000, // Preview ambient sound duration
    TOAST_DURATION: 3000,         // Toast notification display time
    RIPPLE_INTERVAL: 3000,        // Background ripple animation interval
    BREATHING_MODAL_CLOSE_DELAY: 500 // Delay when closing breathing modal
};

// =============================================
// Input Limits
// =============================================

const INPUT_LIMITS = {
    INTENTION_MAX_CHARS: 100,     // Max characters for intention input
    JOURNAL_MAX_CHARS: 500,       // Max characters for journal entry
    TEMPLATE_NAME_MAX: 50         // Max characters for template name
};

// =============================================
// Storage Keys
// =============================================

const STORAGE_KEYS = {
    SETTINGS: 'pulsedrift_settings',
    SESSIONS: 'pulsedrift_sessions',
    VOLUME: 'pulsedrift_volume',
    BELL_SOUND: 'pulsedrift_bell',
    AMBIENT_SOUND: 'pulsedrift_ambient',
    INTENTION: 'pulsedrift_intention',
    TEMPLATES: 'pulsedrift-templates',
    JOURNAL: 'pulsedrift-journal',
    ACHIEVEMENTS: 'pulsedrift-achievements',
    ACCORDION_PREFIX: 'accordion_'
};

// =============================================
// Error Messages
// =============================================

const ERROR_MESSAGES = {
    STORAGE_LOAD_FAILED: 'Unable to load saved data. Starting fresh.',
    STORAGE_SAVE_FAILED: 'Unable to save data. Changes may be lost.',
    STORAGE_QUOTA_EXCEEDED: 'Storage limit reached. Consider exporting your data.',
    IMPORT_INVALID_FILE: 'Invalid import file. Please select a valid PulseDrift export.',
    IMPORT_INVALID_FORMAT: 'Import failed: invalid data format.',
    NOTIFICATION_DENIED: 'Notifications blocked. Enable in browser settings.'
};

// =============================================
// Success Messages
// =============================================

const SUCCESS_MESSAGES = {
    TEMPLATE_SAVED: 'Template saved!',
    TEMPLATE_DELETED: 'Template deleted',
    TEMPLATE_LOADED: 'Loaded template:',
    DATA_EXPORTED: 'Data exported successfully!',
    DATA_IMPORTED: 'Data imported successfully!',
    HISTORY_CLEARED: 'History cleared'
};

// =============================================
// Audio Configuration
// =============================================

const AUDIO_CONFIG = {
    DEFAULT_VOLUME: 0.7,
    FADE_DURATION: 2,             // Ambient fade in/out duration in seconds
    BELL_DURATION_NORMAL: 5,      // Normal bell sound duration
    BELL_DURATION_COMPLETION: 8   // Completion bell sound duration
};

// =============================================
// Achievement Thresholds
// =============================================

const ACHIEVEMENT_THRESHOLDS = {
    FIRST_SESSION: 1,
    SESSIONS_5: 5,
    SESSIONS_10: 10,
    SESSIONS_25: 25,
    SESSIONS_50: 50,
    SESSIONS_100: 100,
    MINUTES_60: 60,
    MINUTES_300: 300,
    MINUTES_600: 600,
    STREAK_3: 3,
    STREAK_7: 7,
    STREAK_30: 30,
    LONG_SESSION_MINUTES: 30
};

// =============================================
// Export Version
// =============================================

const DATA_EXPORT_VERSION = '1.0';

// =============================================
// Storage Utilities
// =============================================

/**
 * Safely get item from localStorage with error handling
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if retrieval fails
 * @returns {*} Parsed value or default
 */
function safeGetItem(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        if (item === null) return defaultValue;
        return JSON.parse(item);
    } catch (error) {
        console.warn(`Failed to load ${key}:`, error);
        return defaultValue;
    }
}

/**
 * Safely set item in localStorage with error handling
 * @param {string} key - Storage key
 * @param {*} value - Value to store (will be JSON.stringify'd)
 * @returns {boolean} Success status
 */
function safeSetItem(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.warn(`Failed to save ${key}:`, error);
        if (error.name === 'QuotaExceededError') {
            if (typeof toast !== 'undefined') {
                toast.show(ERROR_MESSAGES.STORAGE_QUOTA_EXCEEDED, 'warning');
            }
        }
        return false;
    }
}

/**
 * Safely get raw string from localStorage (no JSON parsing)
 * @param {string} key - Storage key
 * @param {string} defaultValue - Default value if retrieval fails
 * @returns {string} Raw string value or default
 */
function safeGetRawItem(key, defaultValue = '') {
    try {
        return localStorage.getItem(key) || defaultValue;
    } catch (error) {
        console.warn(`Failed to load ${key}:`, error);
        return defaultValue;
    }
}

/**
 * Safely set raw string in localStorage (no JSON stringify)
 * @param {string} key - Storage key
 * @param {string} value - String value to store
 * @returns {boolean} Success status
 */
function safeSetRawItem(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (error) {
        console.warn(`Failed to save ${key}:`, error);
        return false;
    }
}

// Expose constants and utilities for testing
if (typeof window !== 'undefined') {
    window.TIMER = TIMER;
    window.CALENDAR = CALENDAR;
    window.HEATMAP_LEVELS = HEATMAP_LEVELS;
    window.UI_TIMING = UI_TIMING;
    window.INPUT_LIMITS = INPUT_LIMITS;
    window.STORAGE_KEYS = STORAGE_KEYS;
    window.ERROR_MESSAGES = ERROR_MESSAGES;
    window.SUCCESS_MESSAGES = SUCCESS_MESSAGES;
    window.AUDIO_CONFIG = AUDIO_CONFIG;
    window.ACHIEVEMENT_THRESHOLDS = ACHIEVEMENT_THRESHOLDS;
    window.DATA_EXPORT_VERSION = DATA_EXPORT_VERSION;
    window.safeGetItem = safeGetItem;
    window.safeSetItem = safeSetItem;
    window.safeGetRawItem = safeGetRawItem;
    window.safeSetRawItem = safeSetRawItem;
}
