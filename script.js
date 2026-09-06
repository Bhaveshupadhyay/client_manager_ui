// --- DOM Elements ---
const chatHistory = document.getElementById('chat-history');
const chatHistoryList = document.getElementById('chat-history-list');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const newChatBtn = document.getElementById('new-chat-btn');
const attachBtn = document.getElementById('attach-btn');
const fileInput = document.getElementById('file-input');
const micBtn = document.getElementById('mic-btn');
const themeToggle = document.getElementById('theme-toggle');
const sunIcon = document.getElementById('sun-icon');
const moonIcon = document.getElementById('moon-icon');
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const mainNav = document.getElementById('main-nav');
const leftSidebar = document.getElementById('left-sidebar');
const clearChatBtn = document.getElementById('clear-chat-btn');
const filePreviewChip = document.getElementById('file-preview-chip');
const filePreviewName = document.getElementById('file-preview-name');
const removeFileBtn = document.getElementById('remove-file-btn');

// Project Summary Elements
const sumName = document.getElementById('summary-name');
const sumIndustry = document.getElementById('summary-industry');
const sumTech = document.getElementById('summary-tech');
const sumFeatures = document.getElementById('summary-features');
const sumBudget = document.getElementById('summary-budget');
const sumTimeline = document.getElementById('summary-timeline');
const sumEstimate = document.getElementById('summary-estimate');
const sumStatus = document.getElementById('summary-status');
const downloadBtn = document.getElementById('download-proposal-btn');
const scopeProgressPercent = document.getElementById('scope-progress-percent');
const scopeProgressFill = document.getElementById('scope-progress-fill');

// --- Configuration ---
const isLocalhost = typeof window !== 'undefined' && window.location && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const BASE_URL = isLocalhost ? 'http://127.0.0.1:8000' : 'https://clientmanger.tech';
const API_URL = `${BASE_URL}/api/v1/chat/`; 
const API_KEY = '1234';
const CLIENT_NAME = '';
let currentProjectId = null;
let pendingActionType = null;

// Single Conversation State Management
let currentSessionId = 'single_workspace_session';
let activeSummary = {
    name: '—',
    industry: '—',
    tech: '—',
    features: '—',
    budget: '—',
    timeline: '—',
    estimate: '—',
    status: 'Gathering Info'
};

// --- Google Analytics 4 (GA4) Custom Event Dispatcher with PII Sanitization ---
function sanitizeGAParam(val) {
    if (typeof val === 'string') {
        // Redact email addresses to comply with PII rules
        let sanitized = val.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');
        // Redact phone numbers
        sanitized = sanitized.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[REDACTED_PHONE]');
        // Truncate long text strings to max 100 chars
        if (sanitized.length > 100) {
            sanitized = sanitized.substring(0, 97) + '...';
        }
        return sanitized;
    }
    return val;
}

function trackGAEvent(eventName, eventParams = {}) {
    try {
        const sanitizedParams = {};
        for (const [key, val] of Object.entries(eventParams)) {
            sanitizedParams[key] = sanitizeGAParam(val);
        }

        const enrichedParams = {
            page_path: window.location.pathname,
            page_title: document.title,
            timestamp: new Date().toISOString(),
            ...sanitizedParams
        };
        
        console.log(`[GA4 Event] ${eventName}:`, enrichedParams);
        
        if (typeof window.gtag === 'function') {
            window.gtag('event', eventName, enrichedParams);
        }
    } catch (e) {
        console.warn('GA4 event dispatch failed:', e);
    }
}

// --- Initial Setup on DOM Load ---
window.addEventListener('DOMContentLoaded', () => {
    // 1. Ping Server
    fetch(`${BASE_URL}/`)
        .then(() => console.log("Server pinged successfully."))
        .catch((e) => console.log("Ping sent (ignoring network errors)."));

    // 2. Initialize Theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.body.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
        document.body.removeAttribute('data-theme');
    }

    // 3. Load Single Conversation Session from Local Storage (Home Workspace)
    if (chatHistory) {
        loadSessionFromStorage();

        // Check for URL parameter ?prompt=...
        const urlParams = new URLSearchParams(window.location.search);
        const prefilledPrompt = urlParams.get('prompt');
        if (prefilledPrompt && chatInput) {
            chatInput.value = decodeURIComponent(prefilledPrompt);
            setTimeout(() => {
                handleSend('url_parameter');
            }, 600);
        }
    }

    // 4. Setup Filter Tabs (Services, Portfolio & Testimonials)
    setupFilterTabs('service-filter-tabs', 'services-grid');
    setupFilterTabs('portfolio-filter-tabs', 'portfolio-grid');
    setupFilterTabs('testimonial-filter-tabs', 'testimonials-grid');

    // 5. Setup Animated Stats Counters (About Page)
    setupStatsCounters();

    // 6. Setup Contact Form Handler
    setupContactForm();

    // 7. Setup Global Link & Action Trackers
    setupGlobalGATracking();
});

// --- Theme Toggle Logic ---
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark' || document.body.getAttribute('data-theme') === 'dark';
        const newTheme = isDark ? 'light' : 'dark';
        if (isDark) {
            document.documentElement.removeAttribute('data-theme');
            document.body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        }
        trackGAEvent('toggle_theme', { theme: newTheme });
    });
}

// --- Responsive Nav & Sidebar Menu Toggles ---
if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        const isOpen = mainNav && mainNav.classList.contains('open');
        if (mainNav) mainNav.classList.toggle('open');
        if (leftSidebar) leftSidebar.classList.toggle('open');
        trackGAEvent('toggle_mobile_menu', { state: !isOpen ? 'open' : 'closed' });
    });
}

if (chatHistory) {
    chatHistory.addEventListener('click', () => {
        if (leftSidebar && leftSidebar.classList.contains('open')) {
            leftSidebar.classList.remove('open');
        }
    });
}

// --- Chat Window Logic (Executes on index.html) ---
if (chatHistory) {
    if (sendBtn) sendBtn.addEventListener('click', () => handleSend('send_button'));
    
    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend('enter_key');
            }
        });

        chatInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }

    if (clearChatBtn) {
        clearChatBtn.addEventListener('click', () => {
            if (confirm("Reset current conversation and project summary?")) {
                trackGAEvent('reset_chat_session', { session_id: currentSessionId });
                resetConversation();
            }
        });
    }

    // Quick Suggestion Chips & Template Starters
    document.addEventListener('click', (e) => {
        const chipBtn = e.target.closest('.prompt-chip-btn') || e.target.closest('.template-chip');
        if (chipBtn) {
            const text = chipBtn.getAttribute('data-text') || chipBtn.getAttribute('data-prompt');
            const chipType = chipBtn.classList.contains('prompt-chip-btn') ? 'prompt_chip' : 'template_chip';
            
            trackGAEvent('click_suggestion_chip', {
                chip_text: text,
                chip_type: chipType
            });

            if (text && chatInput) {
                chatInput.value = text;
                chatInput.style.height = 'auto';
                chatInput.style.height = (chatInput.scrollHeight) + 'px';
                handleSend('suggestion_chip');
            }
        }
    });

    // File Attachment Trigger
    if (attachBtn && fileInput) {
        attachBtn.addEventListener('click', () => {
            trackGAEvent('click_attach_file', { session_id: currentSessionId });
            fileInput.click();
        });

        fileInput.addEventListener('change', handleFileUpload);
    }

    if (removeFileBtn && filePreviewChip) {
        removeFileBtn.addEventListener('click', () => {
            const filename = filePreviewName ? filePreviewName.textContent : '';
            trackGAEvent('remove_attached_file', { file_name: filename });
            if (fileInput) fileInput.value = '';
            filePreviewChip.style.display = 'none';
        });
    }

    // Microphone aesthetic trigger
    if (micBtn) {
        micBtn.addEventListener('click', () => {
            trackGAEvent('activate_voice_listener', { session_id: currentSessionId });
            micBtn.classList.toggle('active-recording');
            showToast("🎤 Voice listener active. Speak clearly...");
            setTimeout(() => {
                micBtn.classList.remove('active-recording');
            }, 3500);
        });
    }

    // Download Proposal Button
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            generateProposalPDF();
        });
    }
}

// --- Chat Send & API Pipeline ---
async function handleSend(triggerSource = 'send_button') {
    if (!chatInput) return;
    const text = chatInput.value.trim();
    if (!text) return;

    // Track GA4 Event for user sending message (includes exact message text)
    trackGAEvent('send_chat_message', {
        message_text: text,
        message_length: text.length,
        session_id: currentSessionId,
        trigger_source: triggerSource,
        has_file_attached: !!(fileInput && fileInput.files && fileInput.files.length > 0)
    });

    // Display user message
    appendMessage(text, 'user');
    
    // Clear input
    chatInput.value = '';
    chatInput.style.height = 'auto';
    if (sendBtn) sendBtn.disabled = true;

    // Hide file preview chip if active
    if (filePreviewChip) filePreviewChip.style.display = 'none';

    // Show AI typing bubble
    const typingId = appendTypingIndicator();
    
    // Parse user input dynamically to update right sidebar details
    parseSummaryText(text, true);

    try {
        const payload = {
            message: text,
            client_name: CLIENT_NAME,
            project_id: currentProjectId
        };
        if (pendingActionType) {
            payload.action_type = pendingActionType;
        }

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'X-API-Key': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        if (data.project_id) {
            currentProjectId = data.project_id;
        }
        pendingActionType = null;

        removeTypingIndicator(typingId);
        appendMessage(data.message, 'ai', data.action);
        parseSummaryText(data.message, false);

    } catch (error) {
        console.error('Error fetching chat response:', error);
        removeTypingIndicator(typingId);
        appendMessage("I apologize, but I am having trouble connecting to the requirements engine at the moment. Please check your connection and try again.", 'ai');
    } finally {
        if (sendBtn) sendBtn.disabled = false;
        saveSessionToStorage();
    }
}

// --- Upload Requirement File Pipeline ---
async function handleFileUpload() {
    const file = fileInput.files[0];
    if (!file) return;

    trackGAEvent('upload_file_start', {
        file_name: file.name,
        file_size: file.size,
        file_type: file.type
    });

    if (filePreviewChip && filePreviewName) {
        filePreviewName.textContent = file.name;
        filePreviewChip.style.display = 'flex';
    }

    showToast(`Uploading specification: <strong>${escapeHTML(file.name)}</strong>...`);

    const formData = new FormData();
    if (currentProjectId) {
        formData.append('project_id', currentProjectId);
    }
    formData.append('overwrite', 'true');
    formData.append('file', file);

    try {
        const response = await fetch(`${BASE_URL}/api/v1/file/upload`, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'X-API-Key': API_KEY
            },
            body: formData
        });

        if (!response.ok) throw new Error(`Upload error! Status: ${response.status}`);
        const data = await response.json();

        trackGAEvent('upload_file_success', {
            file_name: file.name,
            project_id: currentProjectId
        });

        appendMessage(`Attached specification document: **${file.name}** (Indexed into project workspace).`, 'user');
        
        const typingId = appendTypingIndicator();
        setTimeout(() => {
            removeTypingIndicator(typingId);
            appendMessage(`Thank you for uploading **${file.name}**. I have indexed this specification into our analysis engine. <br><br>Let's continue: what key features or tech stack does this application require?`, 'ai');
            activeSummary.features = "Indexed Spec (" + file.name + ")";
            updateSummaryUI();
            saveSessionToStorage();
        }, 1500);

    } catch (error) {
        console.error("File upload failed:", error);
        trackGAEvent('upload_file_failure', {
            file_name: file.name,
            error_message: error.message
        });
        showToast(`⚠️ Upload failed. Please make sure the service is online.`);
    }
}

// --- Client-Side Smart Summary Metadata Parser ---
function parseSummaryText(text, isUser) {
    const textLower = text.toLowerCase();

    // 1. Identify Project Type / Name
    if (isUser) {
        if (textLower.includes('e-commerce') || textLower.includes('shop') || textLower.includes('store')) {
            activeSummary.name = 'E-commerce Platform';
            activeSummary.industry = 'Digital Commerce';
        } else if (textLower.includes('saas') || textLower.includes('software as a service') || textLower.includes('dashboard')) {
            activeSummary.name = 'SaaS Web Application';
            activeSummary.industry = 'B2B Software';
        } else if (textLower.includes('social') || textLower.includes('network') || textLower.includes('community')) {
            activeSummary.name = 'Community Network';
            activeSummary.industry = 'Social Media';
        } else if (textLower.includes('portfolio') || textLower.includes('personal site')) {
            activeSummary.name = 'Professional Showcase';
            activeSummary.industry = 'Marketing';
        } else if (textLower.includes('mobile') || textLower.includes('app') || textLower.includes('ios') || textLower.includes('android')) {
            activeSummary.name = 'Mobile Application';
            activeSummary.industry = 'Mobile Consumer';
        } else if (textLower.includes('ai') || textLower.includes('gpt') || textLower.includes('bot') || textLower.includes('llm')) {
            activeSummary.name = 'AI-Powered System';
            activeSummary.industry = 'Artificial Intelligence';
        } else if (textLower.includes('logistics') || textLower.includes('supply') || textLower.includes('tracking')) {
            activeSummary.name = 'Logistics System';
            activeSummary.industry = 'Supply Chain';
        }
    }

    // 2. Identify Budget Range
    const budgetRegex = /\$?\d+(?:,\d{3})*\s*(?:k|thousand|dollars|\$)?/gi;
    const matches = text.match(budgetRegex);
    if (matches) {
        const potentialBudgets = matches.filter(b => {
            const num = parseInt(b.replace(/[^0-9]/g, ''));
            return num > 100 || b.toLowerCase().includes('k');
        });
        if (potentialBudgets.length > 0) {
            activeSummary.budget = potentialBudgets[0];
        }
    }

    // 3. Identify Timeline Info
    const timelineRegex = /\b(\d+[-–]\d+|\d+)\s*(month|week|day)s?\b/i;
    const timelineMatch = text.match(timelineRegex);
    if (timelineMatch) {
        activeSummary.timeline = timelineMatch[0];
    }

    // 4. Identify Tech Stack
    const techStacks = ['react', 'vue', 'angular', 'nextjs', 'next.js', 'svelte', 'nodejs', 'node.js', 'fastapi', 'python', 'django', 'postgresql', 'mongodb', 'firebase', 'tailwind', 'mern', 'flutter', 'swift', 'kotlin', 'docker'];
    let detectedTech = [];
    techStacks.forEach(t => {
        if (textLower.includes(t)) {
            detectedTech.push(t.toUpperCase());
        }
    });
    if (detectedTech.length > 0) {
        activeSummary.tech = detectedTech.join(', ');
    }

    // 5. Features Extraction
    const featureWords = ['auth', 'login', 'payment', 'stripe', 'chat', 'dashboard', 'notification', 'search', 'admin', 'email', 'map', 'calendar', 'analytics', 'video', 'real-time'];
    let detectedFeatures = [];
    featureWords.forEach(f => {
        if (textLower.includes(f)) {
            detectedFeatures.push(f.charAt(0).toUpperCase() + f.slice(1));
        }
    });
    if (detectedFeatures.length > 0) {
        activeSummary.features = detectedFeatures.join(', ');
    }

    // 6. Cost Estimation and Status logic
    if (!isUser) {
        const costMatch = text.match(/\$?(\d{1,3}(,\d{3})*|\d+)\s*(k)?\s*[-–]\s*\$?(\d{1,3}(,\d{3})*|\d+)\s*(k)?/i);
        const costMatchSingle = text.match(/\b(estimate|cost|budget|total|price)\b.*?\$?(\d{1,3}(,\d{3})*|\d+)\s*(k)?/i);
        
        if (costMatch) {
            activeSummary.estimate = costMatch[0];
            activeSummary.status = 'Proposal Ready';
        } else if (costMatchSingle) {
            activeSummary.estimate = costMatchSingle[2] + (costMatchSingle[4] ? costMatchSingle[4] : '');
            activeSummary.status = 'Proposal Ready';
        } else if (textLower.includes('calculat') || textLower.includes('estimat')) {
            activeSummary.status = 'Calculating';
        }
    }

    updateSummaryUI();
}

// --- Update Right Sidebar UI & Scope Completeness ---
function updateSummaryUI() {
    if (!chatHistory) return;

    if (sumName) sumName.textContent = activeSummary.name;
    if (sumIndustry) sumIndustry.textContent = activeSummary.industry;
    if (sumTech) sumTech.textContent = activeSummary.tech;
    if (sumFeatures) sumFeatures.textContent = activeSummary.features;
    if (sumBudget) sumBudget.textContent = activeSummary.budget;
    if (sumTimeline) sumTimeline.textContent = activeSummary.timeline;
    if (sumEstimate) sumEstimate.textContent = activeSummary.estimate;

    // Calculate Scope Completeness Percentage
    const fields = [
        activeSummary.name,
        activeSummary.industry,
        activeSummary.tech,
        activeSummary.features,
        activeSummary.budget,
        activeSummary.timeline,
        activeSummary.estimate
    ];

    const filled = fields.filter(f => f !== '—' && f !== '').length;
    const percent = Math.round((filled / fields.length) * 100);

    if (scopeProgressPercent) scopeProgressPercent.textContent = `${percent}%`;
    if (scopeProgressFill) scopeProgressFill.style.width = `${percent}%`;

    // Status Badges
    if (sumStatus) {
        if (activeSummary.status === 'Gathering Info') {
            sumStatus.innerHTML = `<span class="badge-status status-gathering">Gathering Info</span>`;
            if (downloadBtn) downloadBtn.disabled = true;
        } else if (activeSummary.status === 'Calculating') {
            sumStatus.innerHTML = `<span class="badge-status status-calculating">Calculating...</span>`;
            if (downloadBtn) downloadBtn.disabled = true;
        } else if (activeSummary.status === 'Proposal Ready') {
            sumStatus.innerHTML = `<span class="badge-status status-ready">Proposal Ready</span>`;
            if (downloadBtn) downloadBtn.disabled = false;
        }
    }
}

// --- Render Chat Bubbles ---
function triggerStartNewProject(btn) {
    if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0.6';
        btn.style.cursor = 'not-allowed';
    }
    pendingActionType = 'start_new_project';
    currentProjectId = null;
    
    appendMessage("Let's build your new project from scratch.\n\nWhat type of application are you looking to build (e.g., SaaS platform, mobile app, AI system), and what are the key features or tech stack you have in mind?", 'ai');
    
    saveSessionToStorage();
    if (chatInput) {
        chatInput.focus();
    }
}

function appendMessage(text, sender, action = null) {
    if (!chatHistory) return;

    const time = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const isUser = sender === 'user';
    const rowClass = isUser ? 'user-message-row' : 'ai-message-row';
    const avatarClass = isUser ? 'user-avatar' : 'ai-avatar';
    const bubbleClass = isUser ? 'user-bubble' : 'ai-bubble';
    const senderName = isUser ? 'You' : 'Bhavesh AI';

    let actionBtnHtml = '';
    if (action === 'start_new_project') {
        actionBtnHtml = `
            <div class="chat-action-wrapper" style="margin-top: 12px;">
                <button class="start-new-project-btn" onclick="triggerStartNewProject(this)">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="margin-right: 6px;"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                    Start a New Project
                </button>
            </div>
        `;
    }

    const avatarSvg = isUser 
        ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`
        : `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>`;

    const bubbleContent = formatMessageMarkdown(text) + actionBtnHtml;

    const html = `
        <div class="message-row ${rowClass}">
            <div class="message-avatar ${avatarClass}">
                ${avatarSvg}
            </div>
            <div class="bubble-container">
                <span class="message-sender">${senderName}</span>
                <div class="chat-bubble ${bubbleClass}">${bubbleContent}</div>
                <span class="message-time">${time}</span>
            </div>
        </div>
    `;

    chatHistory.insertAdjacentHTML('beforeend', html);
    scrollToBottom();
}

function appendTypingIndicator() {
    const id = 'typing_' + Date.now();
    const html = `
        <div class="message-row ai-message-row" id="${id}">
            <div class="message-avatar ai-avatar">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
            </div>
            <div class="bubble-container">
                <span class="message-sender">Bhavesh AI</span>
                <div class="chat-bubble ai-bubble typing-bubble">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        </div>
    `;
    chatHistory.insertAdjacentHTML('beforeend', html);
    scrollToBottom();
    return id;
}

function removeTypingIndicator(id) {
    const element = document.getElementById(id);
    if (element) element.remove();
}

function scrollToBottom() {
    if (chatHistory) {
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }
}

// Markdown formatting helper
function formatMessageMarkdown(text) {
    if (!text) return '';
    let cleaned = text.replace(/<br\s*[\/]?>/gi, '\n');
    let formatted = escapeHTML(cleaned);
    formatted = formatted.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
    return formatted;
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

// Toast helper
function showToast(htmlMsg) {
    const toast = document.createElement('div');
    toast.className = 'upload-toast';
    toast.innerHTML = htmlMsg;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3500);
}

// Proposal PDF Generator
function generateProposalPDF() {
    trackGAEvent('download_proposal_pdf', {
        project_name: activeSummary.name,
        industry: activeSummary.industry,
        tech_stack: activeSummary.tech,
        budget: activeSummary.budget,
        timeline: activeSummary.timeline,
        estimate: activeSummary.estimate
    });

    const rawName = activeSummary.name;
    const cleanName = (!rawName || rawName === '—') ? 'Project' : rawName.replace(/\s+/g, '_');
    const filename = `Proposal_${cleanName}.pdf`;
    const element = document.createElement('a');
    const mockContent = `
========================================
AI PROJECT PROPOSAL & ESTIMATE REPORT
========================================
Project Name: ${activeSummary.name}
Industry Category: ${activeSummary.industry}
Key Features: ${activeSummary.features}
Target Technologies: ${activeSummary.tech}
----------------------------------------
Target Budget: ${activeSummary.budget}
Timeline Estimate: ${activeSummary.timeline}
Final Quote Estimate: ${activeSummary.estimate}
----------------------------------------
Status: Proposal Authorized & Ready
Generated on: ${new Date().toLocaleDateString()}
Contact: bhaveshupadhyay929@gmail.com
========================================
`;
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(mockContent));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

// Single Conversation Storage Manager
function resetConversation() {
    currentProjectId = null;
    pendingActionType = null;
    activeSummary = {
        name: '—',
        industry: '—',
        tech: '—',
        features: '—',
        budget: '—',
        timeline: '—',
        estimate: '—',
        status: 'Gathering Info'
    };

    if (chatHistory) {
        chatHistory.innerHTML = `
            <div class="message-row ai-message-row">
                <div class="message-avatar ai-avatar">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
                </div>
                <div class="bubble-container">
                    <span class="message-sender">Bhavesh AI</span>
                    <div class="chat-bubble ai-bubble">
                        Hello! 👋 I'm <strong>Bhavesh</strong>, your AI Project Scope Architect.
                        <br><br>
                        I'll guide you through quick questions to uncover your app's core requirements, target stack, features, and budget—and generate a real-time proposal and cost estimate.
                        <br><br>
                        To get started, <strong>what type of project are you looking to build?</strong> (e.g. SaaS web app, mobile product, AI engine, or enterprise portal)
                    </div>
                    <span class="message-time">Just now</span>
                </div>
            </div>
        `;
    }

    updateSummaryUI();
    saveSessionToStorage();
}

function saveSessionToStorage() {
    if (!chatHistory) return;
    
    const messages = [];
    const messageRows = chatHistory.querySelectorAll('.message-row');
    
    messageRows.forEach(row => {
        const isUser = row.classList.contains('user-message-row');
        const bubble = row.querySelector('.chat-bubble');
        if (bubble && !bubble.classList.contains('typing-bubble')) {
            messages.push({
                sender: isUser ? 'user' : 'ai',
                text: bubble.innerHTML
            });
        }
    });

    const sessionData = {
        messages: messages,
        summary: { ...activeSummary },
        projectId: currentProjectId,
        pendingActionType: pendingActionType
    };

    localStorage.setItem('ai_single_chat_session', JSON.stringify(sessionData));
}

function loadSessionFromStorage() {
    try {
        const stored = localStorage.getItem('ai_single_chat_session');
        if (!stored) {
            resetConversation();
            return;
        }

        const session = JSON.parse(stored);
        if (!session || !session.messages || session.messages.length === 0) {
            resetConversation();
            return;
        }

        if (chatHistory) chatHistory.innerHTML = '';
        activeSummary = session.summary ? { ...session.summary } : { ...activeSummary };
        currentProjectId = session.projectId || null;
        pendingActionType = session.pendingActionType || null;

        session.messages.forEach(msg => {
            const time = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
            const isUser = msg.sender === 'user';
            const rowClass = isUser ? 'user-message-row' : 'ai-message-row';
            const avatarClass = isUser ? 'user-avatar' : 'ai-avatar';
            const bubbleClass = isUser ? 'user-bubble' : 'ai-bubble';
            const senderName = isUser ? 'You' : 'Bhavesh AI';
            
            const avatarSvg = isUser 
                ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`
                : `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>`;

            const html = `
                <div class="message-row ${rowClass}">
                    <div class="message-avatar ${avatarClass}">
                        ${avatarSvg}
                    </div>
                    <div class="bubble-container">
                        <span class="message-sender">${senderName}</span>
                        <div class="chat-bubble ${bubbleClass}">${msg.text}</div>
                        <span class="message-time">${time}</span>
                    </div>
                </div>
            `;
            if (chatHistory) chatHistory.insertAdjacentHTML('beforeend', html);
        });

        updateSummaryUI();
        scrollToBottom();

    } catch (e) {
        console.error("Error reading chat session:", e);
        resetConversation();
    }
}

// --- Filter Tabs Helper ---
function setupFilterTabs(tabsId, gridId) {
    const tabsContainer = document.getElementById(tabsId);
    const gridContainer = document.getElementById(gridId);
    if (!tabsContainer || !gridContainer) return;

    const tabs = tabsContainer.querySelectorAll('.filter-tab');
    const cards = gridContainer.querySelectorAll('.service-card, .portfolio-card, .testimonial-card');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const category = tab.getAttribute('data-category');
            const pageContext = tabsId.includes('service') ? 'services' : (tabsId.includes('testimonial') ? 'testimonials' : 'portfolio');

            trackGAEvent('filter_category_click', {
                category: category,
                page_context: pageContext
            });

            cards.forEach(card => {
                const cardCat = card.getAttribute('data-category');
                if (category === 'all' || cardCat === category) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

// --- Stats Counters Helper (About Page) ---
function setupStatsCounters() {
    const statNums = document.querySelectorAll('.stat-num[data-target]');
    if (statNums.length === 0) return;

    statNums.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'), 10);
        if (isNaN(target) || !isFinite(target) || target <= 0) return;

        const suffix = counter.getAttribute('data-suffix') || '+';
        let current = 0;
        const increment = Math.max(1, Math.ceil(target / 40));

        const updateCounter = () => {
            current += increment;
            if (current >= target) {
                counter.textContent = target + suffix;
            } else {
                counter.textContent = current + suffix;
                requestAnimationFrame(updateCounter);
            }
        };
        updateCounter();
    });
}

// --- Contact Form Submission Helper ---
function setupContactForm() {
    const form = document.getElementById('contact-inquiry-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('contact-name');
        const emailInput = document.getElementById('contact-email');
        const categoryInput = document.getElementById('contact-category');
        const budgetInput = document.getElementById('contact-budget');
        const messageInput = document.getElementById('contact-message');

        const name = nameInput ? nameInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim() : '';
        const category = categoryInput ? categoryInput.value : '';
        const budget = budgetInput ? budgetInput.value : '';
        const message = messageInput ? messageInput.value.trim() : '';

        const emailDomain = email.includes('@') ? '@' + email.split('@')[1] : 'unknown';
        trackGAEvent('submit_contact_form', {
            has_name: !!name,
            email_domain: emailDomain,
            inquiry_category: category,
            target_budget: budget,
            message_length: message.length
        });

        const subject = encodeURIComponent(`Project Inquiry from ${name || 'Client'} [${category}]`);
        const body = encodeURIComponent(
            `Name: ${name}\nEmail: ${email}\nCategory: ${category}\nTarget Budget: ${budget}\n\nProject Requirements:\n${message}`
        );

        window.location.href = `mailto:bhaveshupadhyay929@gmail.com?subject=${subject}&body=${body}`;

        showToast(`✅ Thank you <strong>${escapeHTML(name || 'there')}</strong>! Opening your mail client to deliver inquiry...`);
        form.reset();
    });
}

// --- Global GA Event Delegation for Links & CTAs ---
function setupGlobalGATracking() {
    document.addEventListener('click', (e) => {
        // 1. Navigation Links
        const navLink = e.target.closest('.main-nav a');
        if (navLink) {
            trackGAEvent('navigation_click', {
                nav_label: navLink.textContent.trim(),
                target_href: navLink.getAttribute('href')
            });
        }

        // 2. Direct Email Anchors
        const mailLink = e.target.closest('a[href^="mailto:"]');
        if (mailLink) {
            const rawEmail = mailLink.getAttribute('href').replace('mailto:', '');
            const emailDomain = rawEmail.includes('@') ? '@' + rawEmail.split('@')[1] : 'unknown';
            trackGAEvent('click_contact_email', {
                email_domain: emailDomain,
                link_text: mailLink.textContent.trim(),
                page_location: window.location.pathname
            });
        }

        // 3. Service Cards CTAs
        const serviceCta = e.target.closest('.service-cta-btn');
        if (serviceCta) {
            const card = serviceCta.closest('.service-card');
            const serviceTitle = card ? card.querySelector('h3')?.textContent : 'Service';
            trackGAEvent('click_service_cta', {
                service_title: serviceTitle,
                target_url: serviceCta.getAttribute('href')
            });
        }

        // 4. Portfolio Card Buttons
        const portfolioBtn = e.target.closest('.portfolio-btn');
        if (portfolioBtn) {
            const card = portfolioBtn.closest('.portfolio-card');
            const projectTitle = card ? card.querySelector('h3')?.textContent : 'Project';
            const isGithub = portfolioBtn.getAttribute('href')?.includes('github');
            trackGAEvent('click_portfolio_link', {
                project_title: projectTitle,
                link_type: isGithub ? 'github' : 'estimate',
                target_url: portfolioBtn.getAttribute('href')
            });
        }
    });
}
