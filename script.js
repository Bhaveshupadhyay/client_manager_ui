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
    // 1. Wake the server (Ping)
    fetch('https://clientmanger.tech/')
        .then(() => console.log("Server pinged successfully."))
        .catch((e) => console.log("Ping sent (ignoring network errors during server wake-up)."));

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

    // 3. Load Chat History from Local Storage (Home Page only)
    if (chatHistory) {
        loadSessionsFromStorage();
        // Start a fresh session if none exists
        if (Object.keys(chatSessions).length === 0) {
            startNewSession();
        } else {
            // Load the most recent session
            const sortedSessions = Object.keys(chatSessions).sort().reverse();
            loadSession(sortedSessions[0]);
        }
    }
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

// Close sidebar on tapping main chat area in mobile view
if (chatHistory) {
    chatHistory.addEventListener('click', () => {
        if (leftSidebar && leftSidebar.classList.contains('open')) {
            leftSidebar.classList.remove('open');
        }
    });
}

// --- Chat Window Logic (Executes only on index.html) ---
if (chatHistory) {

    // Event Listeners for Chat Interaction
    sendBtn.addEventListener('click', handleSend);
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

    if (newChatBtn) {
        newChatBtn.addEventListener('click', () => {
            startNewSession();
        });
    }

    // Attachment Trigger
    if (attachBtn && fileInput) {
        attachBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', handleFileUpload);
    }

    // Microphone aesthetic trigger
    if (micBtn) {
        micBtn.addEventListener('click', () => {
            alert("Voice input is currently a placeholder feature and will be fully integrated soon!");
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
    const text = chatInput.value.trim();
    if (!text) return;

    // Display user's message
    appendMessage(text, 'user');
    
    // Clear input
    chatInput.value = '';
    chatInput.style.height = 'auto';
    sendBtn.disabled = true;

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
        
        // Remove typing indicator & display response
        removeTypingIndicator(typingId);
        appendMessage(data.message, 'ai');

        // Parse AI response for metadata
        parseSummaryText(data.message, false);

    } catch (error) {
        console.error('Error fetching chat response:', error);
        removeTypingIndicator(typingId);
        appendMessage("I apologize, but I am having trouble connecting to the requirements engine at the moment. Please check your connection and try again.", 'ai');
    } finally {
        sendBtn.disabled = false;
        saveCurrentSessionToStorage();
    }
}

// --- Upload Requirement File Pipeline ---
async function handleFileUpload() {
    const file = fileInput.files[0];
    if (!file) return;

    // Create toast notification for uploading state
    const toast = document.createElement('div');
    toast.className = 'upload-toast';
    toast.innerHTML = `
        <span class="typing-dot" style="width:10px;height:10px;animation-duration:1s"></span>
        <span>Uploading requirement document: <strong>${escapeHTML(file.name)}</strong>...</span>
    `;
    document.body.appendChild(toast);

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

        // Remove toast
        toast.remove();

        // Display confirmation in chat history
        appendMessage(`Attached specification document: **${file.name}** (Successfully processed by indexing service).`, 'user');
        
        // Inform AI about file receipt
        appendTypingIndicator();
        setTimeout(() => {
            removeTypingIndicator(document.querySelector('.ai-message-row:last-child').id);
            appendMessage(`Thank you for uploading **${file.name}**. I have indexed this specification into our analysis workspace. <br><br>Let's continue: what key features does this application require?`, 'ai');
            activeSummary.features = "Indexed Specification (" + file.name + ")";
            updateSummaryUI();
            saveCurrentSessionToStorage();
        }, 1500);

    } catch (error) {
        console.error("File upload failed:", error);
        toast.innerHTML = `<span style="color:red">⚠️ Upload failed. Please make sure the service is online.</span>`;
        setTimeout(() => toast.remove(), 4000);
    }
}

// --- Client-Side Smart Summary Metadata Parser ---
function parseSummaryText(text, isUser) {
    const textLower = text.toLowerCase();

    // 1. Identify Project Type / Name
    if (isUser) {
        if (textLower.includes('e-commerce') || textLower.includes('shop') || textLower.includes('store')) {
            activeSummary.name = 'E-commerce Platform';
            activeSummary.industry = 'Retail / Digital Commerce';
        } else if (textLower.includes('saas') || textLower.includes('software as a service') || textLower.includes('dashboard')) {
            activeSummary.name = 'SaaS Web Application';
            activeSummary.industry = 'Technology B2B';
        } else if (textLower.includes('social') || textLower.includes('network') || textLower.includes('community')) {
            activeSummary.name = 'Community Network';
            activeSummary.industry = 'Social Media';
        } else if (textLower.includes('portfolio') || textLower.includes('personal site')) {
            activeSummary.name = 'Professional Showcase';
            activeSummary.industry = 'Marketing / Personal';
        } else if (textLower.includes('mobile') || textLower.includes('app') || textLower.includes('ios') || textLower.includes('android')) {
            activeSummary.name = 'Mobile Application';
            activeSummary.industry = 'Mobile Consumer';
        } else if (textLower.includes('ai') || textLower.includes('gpt') || textLower.includes('artificial intelligence') || textLower.includes('bot')) {
            activeSummary.name = 'AI-Powered System';
            activeSummary.industry = 'Artificial Intelligence';
        }
    }

    // 2. Identify Budget Range
    // Regex matching structures like: $10,000, 10k, 50,000, 50k, etc.
    const budgetMatch = text.match(/\$?(\d{1,3}(,\d{3})*|\d+)\s*(k|thousand|million)?\b/gi);
    if (budgetMatch) {
        // Filter out very small numbers that represent days/weeks/months
        const potentialBudgets = budgetMatch.filter(b => {
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
    const techStacks = ['react', 'vue', 'angular', 'nextjs', 'next.js', 'svelte', 'nodejs', 'node.js', 'fastapi', 'python', 'django', 'postgresql', 'postgresql', 'mongodb', 'firebase', 'tailwind', 'mern', 'flutter', 'react native', 'swift', 'kotlin'];
    let detectedTech = [];
    techStacks.forEach(t => {
        if (textLower.includes(t)) {
            // Capitalize match
            detectedTech.push(t.toUpperCase());
        }
    });
    if (detectedTech.length > 0) {
        activeSummary.tech = detectedTech.join(', ');
    }

    // 5. Features Extraction
    const featureWords = ['auth', 'login', 'payment', 'stripe', 'chat', 'dashboard', 'notification', 'search', 'admin', 'email', 'map', 'calendar'];
    let detectedFeatures = [];
    featureWords.forEach(f => {
        if (textLower.includes(f)) {
            detectedFeatures.push(f.charAt(0).toUpperCase() + f.slice(1));
        }
    });
    if (detectedFeatures.length > 0) {
        activeSummary.features = detectedFeatures.join(', ');
    }

    // 6. Cost Estimation and Status logic from AI response
    if (!isUser) {
        // Check if cost estimate details are contained
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

// --- Update Right Sidebar UI ---
function updateSummaryUI() {
    if (!chatHistory) return; // Guard for static pages

    sumName.textContent = activeSummary.name;
    sumIndustry.textContent = activeSummary.industry;
    sumTech.textContent = activeSummary.tech;
    sumFeatures.textContent = activeSummary.features;
    sumBudget.textContent = activeSummary.budget;
    sumTimeline.textContent = activeSummary.timeline;
    sumEstimate.textContent = activeSummary.estimate;

    // Apply color-coded Status Badges
    if (activeSummary.status === 'Gathering Info') {
        sumStatus.innerHTML = `<span class="badge-status status-gathering">Gathering Info</span>`;
        downloadBtn.disabled = true;
    } else if (activeSummary.status === 'Calculating') {
        sumStatus.innerHTML = `<span class="badge-status status-calculating">Calculating Estimate</span>`;
        downloadBtn.disabled = true;
    } else if (activeSummary.status === 'Proposal Ready') {
        sumStatus.innerHTML = `<span class="badge-status status-ready">Proposal Ready</span>`;
        downloadBtn.disabled = false;
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
    const senderName = isUser ? 'You' : 'Bhavesh';

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

// Bouncing Dot Typing indicator
function appendTypingIndicator() {
    const id = 'typing_' + Date.now();
    const html = `
        <div class="message-row ai-message-row" id="${id}">
            <div class="message-avatar ai-avatar">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
            </div>
            <div class="bubble-container">
                <span class="message-sender">Bhavesh</span>
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

// --- Text Formatter / Basic Markdown Render ---
function formatMessageMarkdown(text) {
    let formatted = escapeHTML(text);
    // Replace double newlines with breaks
    formatted = formatted.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
    // Bold tag rendering: **bold** or *bold*
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
    return formatted;
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

// --- Mock Proposal Generator PDF ---
function generateProposalPDF() {
    const filename = `Proposal_${activeSummary.name.replace(/\s+/g, '_') || 'Project'}.pdf`;
    
    // Create direct mock file download link
    const element = document.createElement('a');
    const mockContent = `
========================================
PROJECT PROPOSAL & ESTIMATE REPORT
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
Status: Authorized - Ready for Kick-off
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

// --- LocalStorage Multi-Session Manager ---
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

    // Reset Chat Box
    chatHistory.innerHTML = `
        <div class="message-row ai-message-row">
            <div class="message-avatar ai-avatar">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
            </div>
            <div class="bubble-container">
                <span class="message-sender">Bhavesh</span>
                <div class="chat-bubble ai-bubble">
                    Hello! 👋 I'm Bhavesh. 
                    <br><br>
                    I'll ask you a few questions to understand your project scope, features, and target budget, and then provide a detailed development cost estimate. 
                    <br><br>
                    To start off, <strong>what type of project are you planning to build?</strong> (e.g. E-commerce web app, mobile SaaS tool, AI product, etc.)
                </div>
                <span class="message-time">Just now</span>
            </div>
        </div>
    `;

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
    
    // Clear chat display
    chatHistory.innerHTML = '';
    
    const session = chatSessions[id];
    activeSummary = { ...session.summary };
    
    // Render session messages
    session.messages.forEach(msg => {
        const time = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        const isUser = msg.sender === 'user';
        const rowClass = isUser ? 'user-message-row' : 'ai-message-row';
        const avatarClass = isUser ? 'user-avatar' : 'ai-avatar';
        const bubbleClass = isUser ? 'user-bubble' : 'ai-bubble';
        const senderName = isUser ? 'You' : 'Bhavesh';
        
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
        chatHistory.insertAdjacentHTML('beforeend', html);
    });

    updateSummaryUI();
    scrollToBottom();
    renderSessionList();
}

function renderSessionList() {
    if (!chatHistoryList) return;
    
    chatHistoryList.innerHTML = '';
    
    // Sort sessions in reverse-chronological order
    const sortedKeys = Object.keys(chatSessions).sort().reverse();
    
    sortedKeys.forEach((key, index) => {
        const session = chatSessions[key];
        const displayTitle = session.summary.name !== '—' 
            ? session.summary.name 
            : (session.messages[1] ? session.messages[1].text.substring(0, 20) + '...' : `Chat Session ${index + 1}`);

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

    // Add Click listeners to newly rendered items
    const items = chatHistoryList.querySelectorAll('.history-item');
    items.forEach(item => {
        item.addEventListener('click', () => {
            const sid = item.getAttribute('data-id');
            loadSession(sid);
        });
    });
}
