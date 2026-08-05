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
const API_URL = 'https://clientmanger.tech/api/v1/chat/'; 
const API_KEY = '1234';
const CLIENT_NAME = 'WebClient';
const PROJECT_ID = 'fi_us_2026_4528';

// State Management
let currentSessionId = 'session_' + Date.now();
let chatSessions = {};
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

// --- Initial Setup on DOM Load ---
window.addEventListener('DOMContentLoaded', () => {
    // 1. Ping Server
    fetch('https://clientmanger.tech/')
        .then(() => console.log("Server pinged successfully."))
        .catch((e) => console.log("Ping sent (ignoring network errors)."));

    // 2. Initialize Theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        if (sunIcon) sunIcon.style.display = 'block';
        if (moonIcon) moonIcon.style.display = 'none';
    } else {
        document.body.removeAttribute('data-theme');
        if (sunIcon) sunIcon.style.display = 'none';
        if (moonIcon) moonIcon.style.display = 'block';
    }

    // 3. Load Chat History from Local Storage (Home Workspace)
    if (chatHistory) {
        loadSessionsFromStorage();
        if (Object.keys(chatSessions).length === 0) {
            startNewSession();
        } else {
            const sortedSessions = Object.keys(chatSessions).sort().reverse();
            loadSession(sortedSessions[0]);
        }

        // Check for URL parameter ?prompt=...
        const urlParams = new URLSearchParams(window.location.search);
        const prefilledPrompt = urlParams.get('prompt');
        if (prefilledPrompt && chatInput) {
            chatInput.value = decodeURIComponent(prefilledPrompt);
            setTimeout(() => {
                handleSend();
            }, 600);
        }
    }

    // 4. Setup Filter Tabs (Services & Portfolio)
    setupFilterTabs('service-filter-tabs', 'services-grid');
    setupFilterTabs('portfolio-filter-tabs', 'portfolio-grid');

    // 5. Setup Animated Stats Counters (About Page)
    setupStatsCounters();

    // 6. Setup Contact Form Handler
    setupContactForm();
});

// --- Theme Toggle Logic ---
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            if (sunIcon) sunIcon.style.display = 'none';
            if (moonIcon) moonIcon.style.display = 'block';
        } else {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            if (sunIcon) sunIcon.style.display = 'block';
            if (moonIcon) moonIcon.style.display = 'none';
        }
    });
}

// --- Responsive Nav & Sidebar Menu Toggles ---
if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        if (mainNav) mainNav.classList.toggle('open');
        if (leftSidebar) leftSidebar.classList.toggle('open');
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
    if (sendBtn) sendBtn.addEventListener('click', handleSend);
    
    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        });

        chatInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }

    if (newChatBtn) {
        newChatBtn.addEventListener('click', () => {
            startNewSession();
        });
    }

    if (clearChatBtn) {
        clearChatBtn.addEventListener('click', () => {
            if (confirm("Reset current chat session and project summary?")) {
                startNewSession();
            }
        });
    }

    // Quick Suggestion Chips & Template Starters
    document.addEventListener('click', (e) => {
        const chipBtn = e.target.closest('.prompt-chip-btn') || e.target.closest('.template-chip');
        if (chipBtn) {
            const text = chipBtn.getAttribute('data-text') || chipBtn.getAttribute('data-prompt');
            if (text && chatInput) {
                chatInput.value = text;
                chatInput.style.height = 'auto';
                chatInput.style.height = (chatInput.scrollHeight) + 'px';
                handleSend();
            }
        }
    });

    // File Attachment Trigger
    if (attachBtn && fileInput) {
        attachBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', handleFileUpload);
    }

    if (removeFileBtn && filePreviewChip) {
        removeFileBtn.addEventListener('click', () => {
            fileInput.value = '';
            filePreviewChip.style.display = 'none';
        });
    }

    // Microphone aesthetic trigger
    if (micBtn) {
        micBtn.addEventListener('click', () => {
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
async function handleSend() {
    if (!chatInput) return;
    const text = chatInput.value.trim();
    if (!text) return;

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
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'X-API-Key': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: text,
                client_name: CLIENT_NAME,
                project_id: PROJECT_ID
            })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        removeTypingIndicator(typingId);
        appendMessage(data.message, 'ai');
        parseSummaryText(data.message, false);

    } catch (error) {
        console.error('Error fetching chat response:', error);
        removeTypingIndicator(typingId);
        appendMessage("I apologize, but I am having trouble connecting to the requirements engine at the moment. Please check your connection and try again.", 'ai');
    } finally {
        if (sendBtn) sendBtn.disabled = false;
        saveCurrentSessionToStorage();
    }
}

// --- Upload Requirement File Pipeline ---
async function handleFileUpload() {
    const file = fileInput.files[0];
    if (!file) return;

    if (filePreviewChip && filePreviewName) {
        filePreviewName.textContent = file.name;
        filePreviewChip.style.display = 'flex';
    }

    showToast(`Uploading specification: <strong>${escapeHTML(file.name)}</strong>...`);

    const formData = new FormData();
    formData.append('project_id', PROJECT_ID);
    formData.append('overwrite', 'true');
    formData.append('file', file);

    try {
        const response = await fetch('https://clientmanger.tech/api/v1/file/upload', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'X-API-Key': API_KEY
            },
            body: formData
        });

        if (!response.ok) throw new Error(`Upload error! Status: ${response.status}`);
        const data = await response.json();

        appendMessage(`Attached specification document: **${file.name}** (Indexed into project workspace).`, 'user');
        
        const typingId = appendTypingIndicator();
        setTimeout(() => {
            removeTypingIndicator(typingId);
            appendMessage(`Thank you for uploading **${file.name}**. I have indexed this specification into our analysis engine. <br><br>Let's continue: what key features or tech stack does this application require?`, 'ai');
            activeSummary.features = "Indexed Spec (" + file.name + ")";
            updateSummaryUI();
            saveCurrentSessionToStorage();
        }, 1500);

    } catch (error) {
        console.error("File upload failed:", error);
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
    const budgetRegex = /\$?\d{1,3}(?:,\d{3})*\s*(?:k|thousand|dollars|\$)?/gi;
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
function appendMessage(text, sender) {
    if (!chatHistory) return;

    const time = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const isUser = sender === 'user';
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
                <div class="chat-bubble ${bubbleClass}">${formatMessageMarkdown(text)}</div>
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
    let formatted = escapeHTML(text);
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
    const filename = `Proposal_${activeSummary.name.replace(/\s+/g, '_') || 'Project'}.pdf`;
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

// LocalStorage Multi-Session Manager
function startNewSession() {
    currentSessionId = 'session_' + Date.now();
    
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
    saveCurrentSessionToStorage();
    renderSessionList();
}

function saveCurrentSessionToStorage() {
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

    chatSessions[currentSessionId] = {
        messages: messages,
        summary: { ...activeSummary }
    };

    localStorage.setItem('ai_chat_sessions', JSON.stringify(chatSessions));
    renderSessionList();
}

function loadSessionsFromStorage() {
    try {
        const stored = localStorage.getItem('ai_chat_sessions');
        if (stored) {
            chatSessions = JSON.parse(stored);
        }
    } catch (e) {
        console.error("Error reading chat history sessions:", e);
        chatSessions = {};
    }
}

function loadSession(id) {
    if (!chatSessions[id]) return;
    currentSessionId = id;
    
    if (chatHistory) chatHistory.innerHTML = '';
    
    const session = chatSessions[id];
    activeSummary = { ...session.summary };
    
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
    renderSessionList();
}

function renderSessionList() {
    if (!chatHistoryList) return;
    
    chatHistoryList.innerHTML = '';
    const sortedKeys = Object.keys(chatSessions).sort().reverse();
    
    sortedKeys.forEach((key, index) => {
        const session = chatSessions[key];
        const displayTitle = session.summary.name !== '—' 
            ? session.summary.name 
            : (session.messages && session.messages[1] ? session.messages[1].text.substring(0, 22) + '...' : `Chat Session ${index + 1}`);

        const isActive = key === currentSessionId;
        const activeClass = isActive ? 'active' : '';

        const itemHTML = `
            <div class="history-item ${activeClass}" data-id="${key}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                <span class="history-text">${escapeHTML(displayTitle)}</span>
            </div>
        `;
        chatHistoryList.insertAdjacentHTML('beforeend', itemHTML);
    });

    const items = chatHistoryList.querySelectorAll('.history-item');
    items.forEach(item => {
        item.addEventListener('click', () => {
            const sid = item.getAttribute('data-id');
            loadSession(sid);
        });
    });
}

// --- Filter Tabs Helper ---
function setupFilterTabs(tabsId, gridId) {
    const tabsContainer = document.getElementById(tabsId);
    const gridContainer = document.getElementById(gridId);
    if (!tabsContainer || !gridContainer) return;

    const tabs = tabsContainer.querySelectorAll('.filter-tab');
    const cards = gridContainer.querySelectorAll('.service-card, .portfolio-card');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const category = tab.getAttribute('data-category');
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
        const target = parseInt(counter.getAttribute('data-target'));
        let current = 0;
        const increment = Math.ceil(target / 40);

        const updateCounter = () => {
            current += increment;
            if (current >= target) {
                counter.textContent = target + (counter.getAttribute('data-target') === '99' ? '%' : '+');
            } else {
                counter.textContent = current + '+';
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
        const name = document.getElementById('contact-name').value;
        showToast(`✅ Thank you <strong>${escapeHTML(name)}</strong>! Your inquiry has been logged. Our lead architect will reach out shortly.`);
        form.reset();
    });
}
