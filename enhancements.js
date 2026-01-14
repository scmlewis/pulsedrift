/**
 * PulseDrift Enhancements
 * Additional features: Templates, Journal, Stats, Achievements, Theme Toggle
 */

// =============================================
// Enhancement State
// =============================================

const enhancementState = {
    templates: [],
    achievements: [],
    journal: [],
    currentMood: null,
    currentJournalNote: ''
};

// =============================================
// DOM Elements for Enhancements
// =============================================

const enhancementDOM = {
    // Theme Toggle
    themeToggle: document.getElementById('themeToggle'),
    sunIcon: document.querySelector('.sun-icon'),
    moonIcon: document.querySelector('.moon-icon'),
    
    // Focus Mode Exit
    focusModeExit: document.getElementById('focusModeExit'),
    
    // Templates
    templatesToggle: document.getElementById('templatesToggle'),
    templatesContent: document.getElementById('templatesContent'),
    templatesList: document.getElementById('templatesList'),
    saveTemplateBtn: document.getElementById('saveTemplateBtn'),
    saveTemplateModal: document.getElementById('saveTemplateModal'),
    closeSaveTemplateBtn: document.getElementById('closeSaveTemplateBtn'),
    templateName: document.getElementById('templateName'),
    templateSaveBtn: document.getElementById('templateSaveBtn'),
    templateCancelBtn: document.getElementById('templateCancelBtn'),
    previewDuration: document.getElementById('previewDuration'),
    previewBell: document.getElementById('previewBell'),
    previewAmbient: document.getElementById('previewAmbient'),
    previewBreathing: document.getElementById('previewBreathing'),
    
    // Calendar Heatmap
    calendarHeatmap: document.getElementById('calendarHeatmap'),
    
    // Export Data
    exportDataBtn: document.getElementById('exportDataBtn'),
    
    // Journal
    moodSelector: document.getElementById('moodSelector'),
    journalNotes: document.getElementById('journalNotes'),
    journalCharCounter: document.getElementById('journalCharCounter'),
    
    // Achievements
    achievementBadge: document.getElementById('achievementBadge'),
    achievementIcon: document.getElementById('achievementIcon'),
    achievementTitle: document.getElementById('achievementTitle'),
    achievementDesc: document.getElementById('achievementDesc')
};

// =============================================
// Feature #1: Light Theme Toggle
// =============================================

function initThemeToggle() {
    // Load saved theme preference
    const savedTheme = localStorage.getItem('pulsedrift-theme') || 'dark';
    applyTheme(savedTheme);
    
    // Auto-detect system preference if no saved theme
    if (!localStorage.getItem('pulsedrift-theme')) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(prefersDark ? 'dark' : 'light');
    }
    
    // Theme toggle button
    if (enhancementDOM.themeToggle) {
        enhancementDOM.themeToggle.addEventListener('click', toggleTheme);
    }
}

function applyTheme(theme) {
    if (theme === 'light') {
        document.body.classList.add('light-theme');
        if (enhancementDOM.sunIcon) enhancementDOM.sunIcon.classList.add('hidden');
        if (enhancementDOM.moonIcon) enhancementDOM.moonIcon.classList.remove('hidden');
    } else {
        document.body.classList.remove('light-theme');
        if (enhancementDOM.sunIcon) enhancementDOM.sunIcon.classList.remove('hidden');
        if (enhancementDOM.moonIcon) enhancementDOM.moonIcon.classList.add('hidden');
    }
    localStorage.setItem('pulsedrift-theme', theme);
}

function toggleTheme() {
    const isLight = document.body.classList.contains('light-theme');
    applyTheme(isLight ? 'dark' : 'light');
    
    // Show toast notification
    if (typeof toast !== 'undefined') {
        toast.show(`Switched to ${isLight ? 'dark' : 'light'} theme`, 'success');
    }
}

// =============================================
// Feature #9: Focus Mode Exit Button
// =============================================

function initFocusModeExit() {
    if (enhancementDOM.focusModeExit) {
        enhancementDOM.focusModeExit.addEventListener('click', () => {
            if (typeof toggleFocusMode !== 'undefined') {
                toggleFocusMode();
            } else {
                // Fallback
                state.focusMode = false;
                document.body.classList.remove('focus-mode');
                enhancementDOM.focusModeExit.classList.add('hidden');
            }
        });
    }
}

// =============================================
// Feature #2: Session Templates
// =============================================

function initSessionTemplates() {
    loadTemplates();
    renderTemplates();
    
    // Save template button
    if (enhancementDOM.saveTemplateBtn) {
        enhancementDOM.saveTemplateBtn.addEventListener('click', openSaveTemplateModal);
    }
    
    // Modal close
    if (enhancementDOM.closeSaveTemplateBtn) {
        enhancementDOM.closeSaveTemplateBtn.addEventListener('click', closeSaveTemplateModal);
    }
    
    if (enhancementDOM.templateCancelBtn) {
        enhancementDOM.templateCancelBtn.addEventListener('click', closeSaveTemplateModal);
    }
    
    // Save button
    if (enhancementDOM.templateSaveBtn) {
        enhancementDOM.templateSaveBtn.addEventListener('click', saveTemplate);
    }
    
    // Modal overlay click
    if (enhancementDOM.saveTemplateModal) {
        enhancementDOM.saveTemplateModal.addEventListener('click', (e) => {
            if (e.target === enhancementDOM.saveTemplateModal) {
                closeSaveTemplateModal();
            }
        });
    }
}

function loadTemplates() {
    const saved = localStorage.getItem('pulsedrift-templates');
    enhancementState.templates = saved ? JSON.parse(saved) : [];
}

function saveTemplates() {
    localStorage.setItem('pulsedrift-templates', JSON.stringify(enhancementState.templates));
}

function openSaveTemplateModal() {
    if (!enhancementDOM.saveTemplateModal) return;
    
    // Update preview with current settings
    updateTemplatePreview();
    
    // Clear name input
    if (enhancementDOM.templateName) {
        enhancementDOM.templateName.value = '';
    }
    
    // Show modal
    enhancementDOM.saveTemplateModal.classList.remove('hidden');
}

function closeSaveTemplateModal() {
    if (enhancementDOM.saveTemplateModal) {
        enhancementDOM.saveTemplateModal.classList.add('hidden');
    }
}

function updateTemplatePreview() {
    const duration = state.timer.duration;
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    const durationText = seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes} min`;
    
    if (enhancementDOM.previewDuration) {
        enhancementDOM.previewDuration.textContent = durationText;
    }
    
    if (enhancementDOM.previewBell) {
        const bellOptions = {
            'singing-bowl': 'Tibetan Singing Bowl',
            'soft-gong': 'Soft Gong',
            'bell': 'Temple Bell',
            'silence': 'Silence'
        };
        enhancementDOM.previewBell.textContent = bellOptions[state.audio.bellSound] || 'Singing Bowl';
    }
    
    if (enhancementDOM.previewAmbient) {
        const ambientOptions = {
            'silence': 'Silence',
            'rain': 'Rain',
            'waves': 'Ocean Waves',
            'forest': 'Forest Birds',
            'wind': 'Gentle Wind'
        };
        enhancementDOM.previewAmbient.textContent = ambientOptions[state.audio.ambientSound] || 'Silence';
    }
    
    if (enhancementDOM.previewBreathing) {
        const breathingOptions = {
            '4-4': 'Calm (4-4)',
            '4-7-8': 'Relaxing (4-7-8)',
            '4-4-4-4': 'Box Breathing (4-4-4-4)'
        };
        enhancementDOM.previewBreathing.textContent = breathingOptions[state.settings.breathingPattern] || 'Calm (4-4)';
    }
}

function saveTemplate() {
    const name = enhancementDOM.templateName?.value.trim();
    
    if (!name) {
        if (typeof toast !== 'undefined') {
            toast.show('Please enter a template name', 'warning');
        }
        return;
    }
    
    const template = {
        id: Date.now().toString(),
        name: name,
        duration: state.timer.duration,
        bellSound: state.audio.bellSound,
        ambientSound: state.audio.ambientSound,
        breathingPattern: state.settings.breathingPattern,
        createdAt: new Date().toISOString()
    };
    
    enhancementState.templates.push(template);
    saveTemplates();
    renderTemplates();
    closeSaveTemplateModal();
    
    if (typeof toast !== 'undefined') {
        toast.show(`Template "${name}" saved!`, 'success');
    }
}

function renderTemplates() {
    if (!enhancementDOM.templatesList) return;
    
    if (enhancementState.templates.length === 0) {
        enhancementDOM.templatesList.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: var(--space-md);">No templates saved yet</p>';
        return;
    }
    
    enhancementDOM.templatesList.innerHTML = enhancementState.templates.map(template => {
        const minutes = Math.floor(template.duration / 60);
        return `
            <div class="template-item" data-id="${template.id}">
                <div class="template-info">
                    <div class="template-name">${template.name}</div>
                    <div class="template-details">${minutes} min • ${template.bellSound} • ${template.ambientSound}</div>
                </div>
                <div class="template-actions-group">
                    <button class="template-load-btn" onclick="loadTemplate('${template.id}')">Load</button>
                    <button class="template-delete-btn" onclick="deleteTemplate('${template.id}')">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

function loadTemplate(templateId) {
    const template = enhancementState.templates.find(t => t.id === templateId);
    if (!template) return;
    
    // Apply template settings
    state.timer.duration = template.duration;
    state.timer.remaining = template.duration;
    state.timer.originalDuration = template.duration;
    state.audio.bellSound = template.bellSound;
    state.audio.ambientSound = template.ambientSound;
    state.settings.breathingPattern = template.breathingPattern;
    
    // Update UI
    if (typeof updateTimerDisplay !== 'undefined') {
        updateTimerDisplay();
    }
    
    // Update dropdowns
    if (DOM.bellSound) DOM.bellSound.value = template.bellSound;
    if (DOM.ambientSound) DOM.ambientSound.value = template.ambientSound;
    if (DOM.breathingPattern) DOM.breathingPattern.value = template.breathingPattern;
    
    // Update presets
    updatePresetButtons();
    
    if (typeof toast !== 'undefined') {
        toast.show(`Loaded template: ${template.name}`, 'success');
    }
}

function deleteTemplate(templateId) {
    const template = enhancementState.templates.find(t => t.id === templateId);
    if (!template) return;
    
    if (confirm(`Delete template "${template.name}"?`)) {
        enhancementState.templates = enhancementState.templates.filter(t => t.id !== templateId);
        saveTemplates();
        renderTemplates();
        
        if (typeof toast !== 'undefined') {
            toast.show('Template deleted', 'success');
        }
    }
}

function updatePresetButtons() {
    const duration = state.timer.duration;
    const minutes = Math.floor(duration / 60);
    
    // Remove active from all preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.classList.remove('active');
        const btnMinutes = parseInt(btn.getAttribute('data-minutes'));
        if (btnMinutes === minutes) {
            btn.classList.add('active');
        }
    });
}

// =============================================
// Feature #4: Enhanced Stats Dashboard
// =============================================

function initEnhancedStats() {
    renderCalendarHeatmap();
}

function renderCalendarHeatmap() {
    if (!enhancementDOM.calendarHeatmap) return;
    
    const sessions = state.sessions || [];
    const today = new Date();
    const daysToShow = 84; // 12 weeks
    
    // Create a map of dates to session counts/minutes
    const dateMap = {};
    sessions.forEach(session => {
        const date = new Date(session.timestamp).toDateString();
        if (!dateMap[date]) {
            dateMap[date] = { count: 0, minutes: 0 };
        }
        dateMap[date].count++;
        dateMap[date].minutes += Math.floor(session.duration / 60);
    });
    
    // Generate heatmap grid
    let html = '';
    for (let i = daysToShow - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toDateString();
        const data = dateMap[dateStr] || { count: 0, minutes: 0 };
        
        // Determine level (0-4) based on minutes
        let level = 0;
        if (data.minutes > 0) level = 1;
        if (data.minutes >= 10) level = 2;
        if (data.minutes >= 20) level = 3;
        if (data.minutes >= 30) level = 4;
        
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dateDisplay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        html += `<div class="heatmap-day" 
                     data-level="${level}" 
                     data-date="${dateStr}"
                     title="${dateDisplay} (${dayName}): ${data.minutes} min, ${data.count} session(s)"></div>`;
    }
    
    enhancementDOM.calendarHeatmap.innerHTML = html;
}

// =============================================
// Feature #7: Export Data
// =============================================

function initExportData() {
    if (enhancementDOM.exportDataBtn) {
        enhancementDOM.exportDataBtn.addEventListener('click', exportSessionData);
    }
}

function exportSessionData() {
    const exportData = {
        sessions: state.sessions || [],
        templates: enhancementState.templates || [],
        journal: enhancementState.journal || [],
        achievements: enhancementState.achievements || [],
        settings: state.settings,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `pulsedrift-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    if (typeof toast !== 'undefined') {
        toast.show('Data exported successfully!', 'success');
    }
}

// =============================================
// Feature #5: Meditation Journal
// =============================================

function initJournal() {
    // Mood selector
    if (enhancementDOM.moodSelector) {
        enhancementDOM.moodSelector.addEventListener('click', (e) => {
            if (e.target.classList.contains('mood-btn')) {
                // Remove selected from all
                document.querySelectorAll('.mood-btn').forEach(btn => {
                    btn.classList.remove('selected');
                });
                // Add selected to clicked
                e.target.classList.add('selected');
                enhancementState.currentMood = e.target.getAttribute('data-mood');
            }
        });
    }
    
    // Journal notes character counter
    if (enhancementDOM.journalNotes) {
        enhancementDOM.journalNotes.addEventListener('input', () => {
            const length = enhancementDOM.journalNotes.value.length;
            const maxLength = enhancementDOM.journalNotes.maxLength;
            if (enhancementDOM.journalCharCounter) {
                enhancementDOM.journalCharCounter.textContent = `${length}/${maxLength}`;
            }
        });
    }
}

function saveJournalEntry(sessionData) {
    const mood = enhancementState.currentMood;
    const notes = enhancementDOM.journalNotes?.value.trim() || '';
    
    if (mood || notes) {
        const entry = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            mood: mood,
            notes: notes,
            sessionDuration: sessionData.duration,
            intention: sessionData.intention || ''
        };
        
        enhancementState.journal.push(entry);
        localStorage.setItem('pulsedrift-journal', JSON.stringify(enhancementState.journal));
    }
    
    // Reset journal inputs
    enhancementState.currentMood = null;
    if (enhancementDOM.journalNotes) enhancementDOM.journalNotes.value = '';
    if (enhancementDOM.journalCharCounter) enhancementDOM.journalCharCounter.textContent = '0/500';
    document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('selected'));
}

// =============================================
// Feature #6: Achievement System
// =============================================

const achievementsList = [
    { id: 'first_session', title: 'First Step', desc: 'Complete your first meditation', icon: '🌱', checkFn: (stats) => stats.totalSessions >= 1 },
    { id: 'sessions_10', title: 'Building Habit', desc: 'Complete 10 meditation sessions', icon: '🌿', checkFn: (stats) => stats.totalSessions >= 10 },
    { id: 'sessions_50', title: 'Dedicated Practice', desc: 'Complete 50 meditation sessions', icon: '🌳', checkFn: (stats) => stats.totalSessions >= 50 },
    { id: 'sessions_100', title: 'Century Club', desc: 'Complete 100 meditation sessions', icon: '🏆', checkFn: (stats) => stats.totalSessions >= 100 },
    { id: 'minutes_60', title: 'One Hour', desc: 'Meditate for 60 minutes total', icon: '⏰', checkFn: (stats) => stats.totalMinutes >= 60 },
    { id: 'minutes_300', title: 'Five Hours', desc: 'Meditate for 5 hours total', icon: '⏱️', checkFn: (stats) => stats.totalMinutes >= 300 },
    { id: 'minutes_600', title: 'Ten Hours', desc: 'Meditate for 10 hours total', icon: '🕐', checkFn: (stats) => stats.totalMinutes >= 600 },
    { id: 'streak_3', title: 'Momentum', desc: '3-day meditation streak', icon: '🔥', checkFn: (stats) => stats.currentStreak >= 3 },
    { id: 'streak_7', title: 'Week Warrior', desc: '7-day meditation streak', icon: '💪', checkFn: (stats) => stats.currentStreak >= 7 },
    { id: 'streak_30', title: 'Month Master', desc: '30-day meditation streak', icon: '🌟', checkFn: (stats) => stats.currentStreak >= 30 },
    { id: 'long_session', title: 'Deep Dive', desc: 'Complete a 30-minute session', icon: '🧘', checkFn: (stats, lastSession) => lastSession && lastSession.duration >= 1800 },
    { id: 'early_bird', title: 'Early Bird', desc: 'Meditate before 7 AM', icon: '🌅', checkFn: (stats, lastSession) => {
        if (!lastSession) return false;
        const hour = new Date(lastSession.timestamp).getHours();
        return hour < 7;
    }},
    { id: 'night_owl', title: 'Night Owl', desc: 'Meditate after 10 PM', icon: '🌙', checkFn: (stats, lastSession) => {
        if (!lastSession) return false;
        const hour = new Date(lastSession.timestamp).getHours();
        return hour >= 22;
    }}
];

function initAchievements() {
    // Load saved achievements
    const saved = localStorage.getItem('pulsedrift-achievements');
    enhancementState.achievements = saved ? JSON.parse(saved) : [];
}

function checkAchievements(sessionData) {
    const stats = {
        totalSessions: state.sessions.length,
        totalMinutes: Math.floor(state.sessions.reduce((sum, s) => sum + s.duration, 0) / 60),
        currentStreak: calculateCurrentStreak()
    };
    
    const newAchievements = [];
    
    achievementsList.forEach(achievement => {
        // Skip if already unlocked
        if (enhancementState.achievements.includes(achievement.id)) return;
        
        // Check if unlocked
        if (achievement.checkFn(stats, sessionData)) {
            enhancementState.achievements.push(achievement.id);
            newAchievements.push(achievement);
        }
    });
    
    // Save achievements
    if (newAchievements.length > 0) {
        localStorage.setItem('pulsedrift-achievements', JSON.stringify(enhancementState.achievements));
        
        // Show the first new achievement
        showAchievement(newAchievements[0]);
    }
}

function showAchievement(achievement) {
    if (!enhancementDOM.achievementBadge) return;
    
    if (enhancementDOM.achievementIcon) {
        enhancementDOM.achievementIcon.textContent = achievement.icon;
    }
    if (enhancementDOM.achievementTitle) {
        enhancementDOM.achievementTitle.textContent = achievement.title;
    }
    if (enhancementDOM.achievementDesc) {
        enhancementDOM.achievementDesc.textContent = achievement.desc;
    }
    
    enhancementDOM.achievementBadge.classList.remove('hidden');
    
    // Play a subtle sound if available
    if (typeof playBellSound !== 'undefined') {
        setTimeout(() => playBellSound('short'), 300);
    }
}

function calculateCurrentStreak() {
    if (!state.sessions || state.sessions.length === 0) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    let checkDate = new Date(today);
    
    while (true) {
        const hasSession = state.sessions.some(session => {
            const sessionDate = new Date(session.timestamp);
            sessionDate.setHours(0, 0, 0, 0);
            return sessionDate.getTime() === checkDate.getTime();
        });
        
        if (hasSession) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }
    
    return streak;
}

// =============================================
// Feature #10: Auto-focus Input
// =============================================

function initAutoFocusInput() {
    // Auto-focus intention input when page loads (if not on mobile)
    if (window.innerWidth >= 768 && DOM.intentionInput) {
        setTimeout(() => {
            DOM.intentionInput.focus();
        }, 500);
    }
    
    // Auto-focus when starting a session
    if (DOM.startBtn) {
        DOM.startBtn.addEventListener('click', () => {
            if (!state.timer.isRunning && DOM.intentionInput && !DOM.intentionInput.value.trim()) {
                setTimeout(() => {
                    if (window.innerWidth >= 768) {
                        DOM.intentionInput.focus();
                    }
                }, 100);
            }
        });
    }
}

// =============================================
// Feature #7: Timer Fade-in for Ambient Sounds
// =============================================

function fadeInAmbientSound() {
    if (!state.audio.masterGain) return;
    
    // Start at 0 volume
    state.audio.masterGain.gain.setValueAtTime(0, state.audio.context.currentTime);
    
    // Fade in over 3 seconds
    state.audio.masterGain.gain.linearRampToValueAtTime(
        state.audio.volume,
        state.audio.context.currentTime + 3
    );
}

// =============================================
// Feature #6: Completion Sound Variety
// =============================================

function playMilestoneCompletionSound(sessionData) {
    const duration = sessionData.duration;
    const totalSessions = state.sessions.length;
    
    // Different sounds for milestones
    if (totalSessions === 1) {
        // First session - extra special
        if (typeof playBellSound !== 'undefined') {
            playBellSound('long');
            setTimeout(() => playBellSound('long'), 800);
        }
    } else if (duration >= 1800) {
        // 30+ minute session
        if (typeof playBellSound !== 'undefined') {
            playBellSound('long');
        }
    } else if (totalSessions % 10 === 0) {
        // Every 10th session
        if (typeof playBellSound !== 'undefined') {
            playBellSound('long');
            setTimeout(() => playBellSound('short'), 600);
        }
    } else {
        // Regular completion
        if (typeof playBellSound !== 'undefined') {
            playBellSound('long');
        }
    }
}

// =============================================
// Integration with Existing Complete Handler
// =============================================

// Override the existing complete button handler to include journal and achievements
function enhanceCompleteHandler() {
    const originalCompleteBtn = DOM.completeBtn;
    if (!originalCompleteBtn) return;
    
    // Remove existing listeners (hacky but necessary)
    const newCompleteBtn = originalCompleteBtn.cloneNode(true);
    originalCompleteBtn.parentNode.replaceChild(newCompleteBtn, originalCompleteBtn);
    DOM.completeBtn = newCompleteBtn;
    
    newCompleteBtn.addEventListener('click', () => {
        // Get the last session data
        const lastSession = state.sessions[state.sessions.length - 1];
        
        if (lastSession) {
            // Save journal entry
            saveJournalEntry(lastSession);
            
            // Check for achievements
            checkAchievements(lastSession);
        }
        
        // Hide achievement badge
        if (enhancementDOM.achievementBadge) {
            enhancementDOM.achievementBadge.classList.add('hidden');
        }
        
        // Hide complete overlay
        if (DOM.completeOverlay) {
            DOM.completeOverlay.classList.add('hidden');
        }
        
        // Update heatmap
        renderCalendarHeatmap();
    });
}

// =============================================
// Initialization
// =============================================

function initEnhancements() {
    console.log('🚀 Initializing PulseDrift Enhancements...');
    
    initThemeToggle();
    initFocusModeExit();
    initSessionTemplates();
    initEnhancedStats();
    initExportData();
    initJournal();
    initAchievements();
    initAutoFocusInput();
    
    // Enhance complete handler
    setTimeout(enhanceCompleteHandler, 1000);
    
    console.log('✅ Enhancements initialized!');
}

// Wait for DOM and existing app.js to load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initEnhancements, 500);
    });
} else {
    setTimeout(initEnhancements, 500);
}

// Make functions globally available
window.loadTemplate = loadTemplate;
window.deleteTemplate = deleteTemplate;
window.toggleTheme = toggleTheme;
window.fadeInAmbientSound = fadeInAmbientSound;
window.playMilestoneCompletionSound = playMilestoneCompletionSound;
