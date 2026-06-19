/**
 * PulseDrift Enhancements
 * Additional features: Templates, Journal, Stats, Achievements
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
    importDataBtn: document.getElementById('importDataBtn'),
    importDataInput: document.getElementById('importDataInput'),

    // Advanced Analytics
    analyticsWeeklyMinutes: document.getElementById('analyticsWeeklyMinutes'),
    analyticsAverageSession: document.getElementById('analyticsAverageSession'),
    analyticsBestDay: document.getElementById('analyticsBestDay'),
    analyticsWeekBars: document.getElementById('analyticsWeekBars'),
    analyticsEmpty: document.getElementById('analyticsEmpty'),
    
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
    
    // Event delegation for template list actions (replaces inline onclick handlers)
    if (enhancementDOM.templatesList) {
        enhancementDOM.templatesList.addEventListener('click', (e) => {
            const target = e.target;
            const action = target.dataset.action;
            const templateId = target.dataset.templateId;
            
            if (!action || !templateId) return;
            
            if (action === 'load') {
                loadTemplate(templateId);
            } else if (action === 'delete') {
                deleteTemplate(templateId);
            }
        });
    }
}

function loadTemplates() {
    const saved = safeGetItem(STORAGE_KEYS.TEMPLATES, []);
    enhancementState.templates = Array.isArray(saved) ? saved : [];
}

function saveTemplates() {
    safeSetItem(STORAGE_KEYS.TEMPLATES, enhancementState.templates);
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
    
    // Focus trap: focus the name input and capture tab
    if (enhancementDOM.templateName) {
        enhancementDOM.templateName.focus();
    }
    
    // Store previously focused element to restore later
    enhancementDOM.saveTemplateModal._previousFocus = document.activeElement;
    
    // Add keydown handler for focus trap and Escape
    enhancementDOM.saveTemplateModal._trapHandler = (e) => {
        if (e.key === 'Escape') {
            closeSaveTemplateModal();
            return;
        }
        if (e.key !== 'Tab') return;
        
        const modal = enhancementDOM.saveTemplateModal.querySelector('.modal');
        if (!modal) return;
        
        const focusable = modal.querySelectorAll('input, button, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable.length === 0) return;
        
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        
        if (e.shiftKey) {
            if (document.activeElement === first) {
                e.preventDefault();
                last.focus();
            }
        } else {
            if (document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    };
    
    enhancementDOM.saveTemplateModal.addEventListener('keydown', enhancementDOM.saveTemplateModal._trapHandler);
}

function closeSaveTemplateModal() {
    if (enhancementDOM.saveTemplateModal) {
        enhancementDOM.saveTemplateModal.classList.add('hidden');
        
        // Remove focus trap handler
        if (enhancementDOM.saveTemplateModal._trapHandler) {
            enhancementDOM.saveTemplateModal.removeEventListener('keydown', enhancementDOM.saveTemplateModal._trapHandler);
            enhancementDOM.saveTemplateModal._trapHandler = null;
        }
        
        // Restore focus to previously focused element
        if (enhancementDOM.saveTemplateModal._previousFocus) {
            enhancementDOM.saveTemplateModal._previousFocus.focus();
            enhancementDOM.saveTemplateModal._previousFocus = null;
        }
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
                    <div class="template-name">${escapeHtml(template.name)}</div>
                    <div class="template-details">${minutes} min • ${template.bellSound} • ${template.ambientSound}</div>
                </div>
                <div class="template-actions-group">
                    <button class="template-load-btn" data-action="load" data-template-id="${template.id}">Load</button>
                    <button class="template-delete-btn" data-action="delete" data-template-id="${template.id}">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Escape HTML to prevent XSS when displaying user input
 * @param {string} text - User input text
 * @returns {string} Escaped safe HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
    renderAdvancedAnalytics();
}

function renderCalendarHeatmap() {
    if (!enhancementDOM.calendarHeatmap) return;
    
    const sessions = state.sessions || [];
    const today = new Date();
    const daysToShow = 84; // 12 weeks
    
    // Create a map of dates to session counts/minutes
    const dateMap = {};
    sessions.forEach(session => {
        const date = getSessionDate(session).toDateString();
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

function renderAdvancedAnalytics() {
    if (!enhancementDOM.analyticsWeekBars) return;

    const sessions = state.sessions || [];
    if (enhancementDOM.analyticsEmpty) {
        enhancementDOM.analyticsEmpty.classList.toggle('hidden', sessions.length > 0);
    }
    if (sessions.length === 0) {
        enhancementDOM.analyticsWeekBars.innerHTML = '';
        if (enhancementDOM.analyticsWeeklyMinutes) enhancementDOM.analyticsWeeklyMinutes.textContent = '0';
        if (enhancementDOM.analyticsAverageSession) enhancementDOM.analyticsAverageSession.textContent = '0';
        if (enhancementDOM.analyticsBestDay) enhancementDOM.analyticsBestDay.textContent = '—';
        return;
    }
    const today = new Date();
    const days = 7;
    const dailyMinutes = Array.from({ length: days }, () => 0);
    const dailySessions = Array.from({ length: days }, () => 0);

    for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (days - 1 - i));
        date.setHours(0, 0, 0, 0);
        const dateKey = date.toDateString();

        sessions.forEach(session => {
            const sessionDate = getSessionDate(session);
            sessionDate.setHours(0, 0, 0, 0);
            if (sessionDate.toDateString() === dateKey) {
                dailyMinutes[i] += Math.floor(session.duration / 60);
                dailySessions[i] += 1;
            }
        });
    }

    const totalWeekMinutes = dailyMinutes.reduce((sum, minutes) => sum + minutes, 0);
    const totalSessionMinutes = Math.floor(
        sessions.reduce((sum, session) => sum + (session.duration || 0), 0) / 60
    );
    const totalSessions = sessions.length;
    const averageSession = totalSessions > 0 ? Math.round(totalSessionMinutes / totalSessions) : 0;

    let bestDayIndex = -1;
    let bestDayMinutes = 0;
    dailyMinutes.forEach((minutes, index) => {
        if (minutes > bestDayMinutes) {
            bestDayMinutes = minutes;
            bestDayIndex = index;
        }
    });

    const bestDayLabel = bestDayIndex >= 0
        ? new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1 - bestDayIndex))
            .toLocaleDateString('en-US', { weekday: 'short' })
        : '—';

    if (enhancementDOM.analyticsWeeklyMinutes) {
        enhancementDOM.analyticsWeeklyMinutes.textContent = totalWeekMinutes.toString();
    }
    if (enhancementDOM.analyticsAverageSession) {
        enhancementDOM.analyticsAverageSession.textContent = averageSession.toString();
    }
    if (enhancementDOM.analyticsBestDay) {
        enhancementDOM.analyticsBestDay.textContent = bestDayLabel;
    }

    const maxMinutes = Math.max(10, ...dailyMinutes);
    const barsHtml = dailyMinutes.map((minutes, index) => {
        const height = Math.max(6, Math.round((minutes / maxMinutes) * 90));
        const dayLabel = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1 - index))
            .toLocaleDateString('en-US', { weekday: 'short' });
        return `
            <div class="analytics-bar" title="${dayLabel}: ${minutes} min">
                <div class="analytics-bar-fill" style="height: ${height}px;"></div>
                <div class="analytics-bar-value">${minutes}</div>
                <div class="analytics-bar-label">${dayLabel}</div>
            </div>
        `;
    }).join('');

    enhancementDOM.analyticsWeekBars.innerHTML = barsHtml;
}

function refreshEnhancedStats() {
    renderCalendarHeatmap();
    renderAdvancedAnalytics();
}

// =============================================
// Feature #7: Export Data
// =============================================

function initExportData() {
    if (enhancementDOM.exportDataBtn) {
        enhancementDOM.exportDataBtn.addEventListener('click', exportSessionData);
    }
}

function initImportData() {
    if (!enhancementDOM.importDataBtn || !enhancementDOM.importDataInput) return;

    enhancementDOM.importDataBtn.addEventListener('click', () => {
        enhancementDOM.importDataInput.value = '';
        enhancementDOM.importDataInput.click();
    });

    enhancementDOM.importDataInput.addEventListener('change', async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);
            importSessionData(data);
        } catch (error) {
            if (typeof toast !== 'undefined') {
                toast.show('Invalid import file. Please select a valid PulseDrift export.', 'error');
            }
        }
    });
}

function importSessionData(data) {
    if (!data || typeof data !== 'object') {
        if (typeof toast !== 'undefined') {
            toast.show('Import failed: invalid data format.', 'error');
        }
        return;
    }

    const shouldMerge = confirm('Merge imported data with existing data? Click Cancel to replace.');

    const importedSessions = Array.isArray(data.sessions)
        ? data.sessions.map(normalizeSession).filter(Boolean)
        : [];
    const importedTemplates = Array.isArray(data.templates) ? data.templates : [];
    const importedJournal = Array.isArray(data.journal) ? data.journal : [];
    const importedAchievements = Array.isArray(data.achievements) ? data.achievements : [];
    const importedSettings = data.settings || null;

    if (shouldMerge) {
        state.sessions = mergeSessions(state.sessions || [], importedSessions);
        enhancementState.templates = mergeById(enhancementState.templates || [], importedTemplates, 'id');
        enhancementState.journal = mergeById(enhancementState.journal || [], importedJournal, 'id');
        enhancementState.achievements = mergeUniqueValues(enhancementState.achievements || [], importedAchievements);
    } else {
        state.sessions = importedSessions;
        enhancementState.templates = importedTemplates;
        enhancementState.journal = importedJournal;
        enhancementState.achievements = importedAchievements;
    }

    saveSessions();
    updateHistoryStats();
    renderHistory();

    saveTemplates();
    renderTemplates();

    safeSetItem(STORAGE_KEYS.JOURNAL, enhancementState.journal);
    safeSetItem(STORAGE_KEYS.ACHIEVEMENTS, enhancementState.achievements);

    if (importedSettings && typeof importedSettings === 'object') {
        Object.assign(state.settings, importedSettings);
        if (typeof saveSettings !== 'undefined') {
            saveSettings();
        }
        if (DOM.intervalBell) DOM.intervalBell.value = state.settings.intervalBell;
        if (DOM.breathingPattern) DOM.breathingPattern.value = state.settings.breathingPattern;
        if (DOM.notificationsToggle) DOM.notificationsToggle.checked = !!state.settings.notifications;
        if (DOM.autoBreathingToggle) DOM.autoBreathingToggle.checked = !!state.settings.autoBreathing;
    }

    refreshEnhancedStats();

    if (typeof toast !== 'undefined') {
        toast.show('Data imported successfully!', 'success');
    }
}

function normalizeSession(session) {
    if (!session || typeof session !== 'object') return null;
    const normalized = {
        id: session.id || Date.now() + Math.random(),
        date: session.date || session.timestamp || new Date().toISOString(),
        duration: session.duration || 0,
        completed: typeof session.completed === 'boolean' ? session.completed : true,
        intention: session.intention || null
    };
    return normalized;
}

function mergeSessions(existing, imported) {
    const all = [...existing, ...imported].filter(Boolean);
    const uniqueMap = new Map();
    all.forEach(session => {
        const key = `${session.id}-${session.date}`;
        if (!uniqueMap.has(key)) {
            uniqueMap.set(key, session);
        }
    });
    return Array.from(uniqueMap.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
}

function mergeById(existing, incoming, idKey) {
    const map = new Map();
    [...existing, ...incoming].forEach(item => {
        if (!item || typeof item !== 'object') return;
        const key = item[idKey] || JSON.stringify(item);
        if (!map.has(key)) {
            map.set(key, item);
        }
    });
    return Array.from(map.values());
}

function mergeUniqueValues(existing, incoming) {
    return Array.from(new Set([...(existing || []), ...(incoming || [])]));
}

function getSessionDate(session) {
    const dateValue = session?.date || session?.timestamp || session?.createdAt || session?.time;
    return dateValue ? new Date(dateValue) : new Date();
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
            const button = e.target.closest('.mood-btn');
            if (button) {
                // Remove selected from all
                document.querySelectorAll('.mood-btn').forEach(btn => {
                    btn.classList.remove('selected');
                });
                // Add selected to clicked
                button.classList.add('selected');
                enhancementState.currentMood = button.getAttribute('data-mood');
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
        safeSetItem(STORAGE_KEYS.JOURNAL, enhancementState.journal);
    }
    
    // Reset journal inputs
    enhancementState.currentMood = null;
    if (enhancementDOM.journalNotes) enhancementDOM.journalNotes.value = '';
    if (enhancementDOM.journalCharCounter) enhancementDOM.journalCharCounter.textContent = '0/' + INPUT_LIMITS.JOURNAL_MAX_CHARS;
    document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('selected'));
}

// =============================================
// Feature #6: Achievement System
// =============================================

const achievementsList = [
    { id: 'first_session', title: 'First Step', desc: 'Complete your first meditation', icon: 'seedling', checkFn: (stats) => stats.totalSessions >= 1 },
    { id: 'sessions_10', title: 'Building Habit', desc: 'Complete 10 meditation sessions', icon: 'leaf', checkFn: (stats) => stats.totalSessions >= 10 },
    { id: 'sessions_50', title: 'Dedicated Practice', desc: 'Complete 50 meditation sessions', icon: 'tree', checkFn: (stats) => stats.totalSessions >= 50 },
    { id: 'sessions_100', title: 'Century Club', desc: 'Complete 100 meditation sessions', icon: 'trophy', checkFn: (stats) => stats.totalSessions >= 100 },
    { id: 'minutes_60', title: 'One Hour', desc: 'Meditate for 60 minutes total', icon: 'clock', checkFn: (stats) => stats.totalMinutes >= 60 },
    { id: 'minutes_300', title: 'Five Hours', desc: 'Meditate for 5 hours total', icon: 'timer', checkFn: (stats) => stats.totalMinutes >= 300 },
    { id: 'minutes_600', title: 'Ten Hours', desc: 'Meditate for 10 hours total', icon: 'time', checkFn: (stats) => stats.totalMinutes >= 600 },
    { id: 'streak_3', title: 'Momentum', desc: '3-day meditation streak', icon: 'flame', checkFn: (stats) => stats.currentStreak >= 3 },
    { id: 'streak_7', title: 'Week Warrior', desc: '7-day meditation streak', icon: 'strength', checkFn: (stats) => stats.currentStreak >= 7 },
    { id: 'streak_30', title: 'Month Master', desc: '30-day meditation streak', icon: 'star', checkFn: (stats) => stats.currentStreak >= 30 },
    { id: 'long_session', title: 'Deep Dive', desc: 'Complete a 30-minute session', icon: 'lotus', checkFn: (stats, lastSession) => lastSession && lastSession.duration >= 1800 },
    { id: 'early_bird', title: 'Early Bird', desc: 'Meditate before 7 AM', icon: 'sunrise', checkFn: (stats, lastSession) => {
        if (!lastSession) return false;
        const hour = new Date(lastSession.timestamp).getHours();
        return hour < 7;
    }},
    { id: 'night_owl', title: 'Night Owl', desc: 'Meditate after 10 PM', icon: 'moon', checkFn: (stats, lastSession) => {
        if (!lastSession) return false;
        const hour = new Date(lastSession.timestamp).getHours();
        return hour >= 22;
    }}
];

const achievementIcons = {
    seedling: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20v-6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M12 14c-3 0-5-2.2-5-5 3 0 5 2.2 5 5Z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 14c3 0 5-2.2 5-5-3 0-5 2.2-5 5Z" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    leaf: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19c8-1 13-6 14-14-8 1-13 6-14 14Z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M6 15c2-1 4-2 7-5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    tree: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c3 2 5 5 5 8H7c0-3 2-6 5-8Z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M6 11h12l-2 4H8l-2-4Z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 15v6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    trophy: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5 5H3v2a4 4 0 0 0 4 4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M19 5h2v2a4 4 0 0 1-4 4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M9 18h6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M10 18v2h4v-2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 8v4l3 2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    timer: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="7" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M9 3h6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M12 13l3-2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    time: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 9v4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M12 13h3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    flame: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c3 3 4 5 4 8a4 4 0 1 1-8 0c0-2 1-4 4-8Z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 12c1 1 2 2 2 3a2 2 0 1 1-4 0c0-1 1-2 2-3Z" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    strength: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10h10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M5 8v8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M19 8v8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M9 8v8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M15 8v8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8L12 3Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    lotus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4c2 2 3 4 3 6-2-1-3-3-3-6Z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 4c-2 2-3 4-3 6 2-1 3-3 3-6Z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M6 12c2 0 4 1 6 3 2-2 4-3 6-3-2 3-4 5-6 5s-4-2-6-5Z" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    sunrise: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18h18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M6 18a6 6 0 1 1 12 0" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 6v3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M5 10l2 1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M19 10l-2 1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    moon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4a7 7 0 1 0 5 12 8 8 0 1 1-5-12Z" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>'
};

function initAchievements() {
    // Load saved achievements with error handling
    const saved = safeGetItem(STORAGE_KEYS.ACHIEVEMENTS, []);
    enhancementState.achievements = Array.isArray(saved) ? saved : [];
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
        safeSetItem(STORAGE_KEYS.ACHIEVEMENTS, enhancementState.achievements);
        
        // Show the first new achievement
        showAchievement(newAchievements[0]);
    }
}

function showAchievement(achievement) {
    if (!enhancementDOM.achievementBadge) return;
    
    if (enhancementDOM.achievementIcon) {
        const iconSvg = achievementIcons[achievement.icon] || achievementIcons.star;
        enhancementDOM.achievementIcon.innerHTML = iconSvg;
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
    
    // Allow today or yesterday as streak start
    if (!state.sessions.some(session => {
        const d = new Date(session.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === checkDate.getTime();
    })) {
        checkDate.setDate(checkDate.getDate() - 1);
        if (!state.sessions.some(session => {
            const d = new Date(session.date);
            d.setHours(0, 0, 0, 0);
            return d.getTime() === checkDate.getTime();
        })) {
            return 0;
        }
    }
    
    while (true) {
        const hasSession = state.sessions.some(session => {
            const d = new Date(session.date);
            d.setHours(0, 0, 0, 0);
            return d.getTime() === checkDate.getTime();
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
// Feature #6: Completion Sound Variety
// =============================================

function playMilestoneCompletionSound(sessionData) {
    const duration = sessionData.duration;
    const totalSessions = state.sessions.length;
    
    // Different sounds for milestones
    if (totalSessions === 1) {
        if (typeof playBellSound !== 'undefined') {
            playBellSound(1, true);
            setTimeout(() => playBellSound(1, true), 800);
        }
    } else if (duration >= 1800) {
        if (typeof playBellSound !== 'undefined') {
            playBellSound(1, true);
        }
    } else if (totalSessions % 10 === 0) {
        if (typeof playBellSound !== 'undefined') {
            playBellSound(1, true);
            setTimeout(() => playBellSound(0.5), 600);
        }
    } else {
        if (typeof playBellSound !== 'undefined') {
            playBellSound(1, true);
        }
    }
}

// =============================================
// Integration with Existing Complete Handler
// =============================================

// Enhance the complete handler by extending the overlay close behavior
// instead of cloning the button (which is fragile and race-condition prone)
function enhanceCompleteHandler() {
    if (!DOM.completeOverlay) return;
    
    DOM.completeOverlay.addEventListener('click', (e) => {
        if (e.target !== DOM.completeOverlay) return;
        
        const lastSession = state.sessions[state.sessions.length - 1];
        if (lastSession) {
            saveJournalEntry(lastSession);
            checkAchievements(lastSession);
        }
        
        if (enhancementDOM.achievementBadge) {
            enhancementDOM.achievementBadge.classList.add('hidden');
        }
        
        refreshEnhancedStats();
    });
}

// =============================================
// Initialization
// =============================================

function initEnhancements() {
    initFocusModeExit();
    initSessionTemplates();
    initEnhancedStats();
    initExportData();
    initImportData();
    initJournal();
    initAchievements();
    initAutoFocusInput();
    
    // Enhance complete handler
    setTimeout(enhanceCompleteHandler, UI_TIMING.COMPLETE_HANDLER_DELAY);
}

// Wait for DOM and existing app.js to load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initEnhancements, UI_TIMING.ENHANCEMENT_INIT_DELAY);
    });
} else {
    setTimeout(initEnhancements, UI_TIMING.ENHANCEMENT_INIT_DELAY);
}

// Make functions globally available (only those needed externally)
window.playMilestoneCompletionSound = playMilestoneCompletionSound;
window.refreshEnhancedStats = refreshEnhancedStats;
window.enhancementState = enhancementState;
window.enhancementDOM = enhancementDOM;
