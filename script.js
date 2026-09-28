// --- DOM Elements ---
const chatMain = document.getElementById('chat-main');
const chatScroll = document.getElementById('chat-scroll');
const chatHistory = document.getElementById('chat-history');
const composer = document.getElementById('composer');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const newChatBtn = document.getElementById('new-chat-btn');
const clearChatBtn = document.getElementById('clear-chat-btn');
const attachBtn = document.getElementById('attach-btn');
const fileInput = document.getElementById('file-input');
const filePreviewChip = document.getElementById('file-preview-chip');
const filePreviewName = document.getElementById('file-preview-name');
const removeFileBtn = document.getElementById('remove-file-btn');
const themeToggle = document.getElementById('theme-toggle');
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const mainNav = document.getElementById('main-nav');
const leftSidebar = document.getElementById('left-sidebar');
const sidebarClose = document.getElementById('sidebar-close');
const sidebarBackdrop = document.getElementById('sidebar-backdrop');

// --- Configuration ---
const isLocalhost = typeof window !== 'undefined' && window.location && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const BASE_URL = isLocalhost ? 'http://127.0.0.1:8000' : 'https://clientmanger.tech';
const API_URL = `${BASE_URL}/api/v1/chat/`;
const API_KEY = '1234';
const CLIENT_NAME = '';
const SESSION_STORAGE_KEY = 'ai_single_chat_session';
let currentProjectId = null;
let pendingActionType = null;
let currentSessionId = 'single_workspace_session';

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

        if (typeof window.gtag === 'function') {
            window.gtag('event', eventName, enrichedParams);
        }
    } catch (e) {
        console.warn('GA4 event dispatch failed:', e);
    }
}

// --- Initial Setup on DOM Load ---
window.addEventListener('DOMContentLoaded', () => {
    if (chatHistory) {
        // Wake the backend so the first message is fast
        fetch(`${BASE_URL}/`).catch(() => {});

        loadSessionFromStorage();

        // Pages link here with ?prompt=... to start a conversation
        const prefilledPrompt = new URLSearchParams(window.location.search).get('prompt');
        if (prefilledPrompt && chatInput) {
            // Drop the parameter first so a reload or back navigation doesn't resend it
            const url = new URL(window.location.href);
            url.searchParams.delete('prompt');
            history.replaceState(null, '', url);
            chatInput.value = prefilledPrompt;
            handleSend('url_parameter');
        }
    }

    setupReviewsCarousel();
    setupContactForm();
    setupGlobalGATracking();
});

// --- Theme Toggle ---
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        if (newTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        try {
            localStorage.setItem('theme', newTheme);
        } catch (e) {
            console.warn('Could not save theme:', e);
        }
        trackGAEvent('toggle_theme', { theme: newTheme });
    });
}

// --- Mobile Menu: sidebar drawer on the chat page, dropdown nav elsewhere ---
function setSidebarOpen(open) {
    if (leftSidebar) leftSidebar.classList.toggle('open', open);
}

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        let isOpen;
        if (leftSidebar) {
            isOpen = !leftSidebar.classList.contains('open');
            setSidebarOpen(isOpen);
        } else if (mainNav) {
            isOpen = mainNav.classList.toggle('open');
        }
        trackGAEvent('toggle_mobile_menu', { state: isOpen ? 'open' : 'closed' });
    });
}

if (sidebarClose) sidebarClose.addEventListener('click', () => setSidebarOpen(false));
if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', () => setSidebarOpen(false));

document.addEventListener('click', (e) => {
    if (mainNav && mainNav.classList.contains('open') && !mainNav.contains(e.target)) {
        mainNav.classList.remove('open');
    }
});

// --- Chat Window Logic (index.html) ---
if (chatHistory) {
    if (composer) {
        composer.addEventListener('submit', (e) => {
            e.preventDefault();
            handleSend('send_button');
        });
    }

    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
                e.preventDefault();
                handleSend('enter_key');
            }
        });

        chatInput.addEventListener('input', autosizeInput);
    }

    [newChatBtn, clearChatBtn].forEach(btn => {
        if (!btn) return;
        btn.addEventListener('click', () => {
            const hasMessages = chatHistory.children.length > 0;
            if (hasMessages && !confirm('Start a new chat? The current conversation will be cleared.')) return;
            trackGAEvent('reset_chat_session', { session_id: currentSessionId });
            resetConversation();
            setSidebarOpen(false);
            if (chatInput) chatInput.focus();
        });
    });

    document.addEventListener('click', (e) => {
        const starter = e.target.closest('.starter');
        if (!starter || !chatInput) return;
        const text = starter.getAttribute('data-text');
        trackGAEvent('click_suggestion_chip', { chip_text: text, chip_type: 'starter' });
        chatInput.value = text;
        handleSend('suggestion_chip');
    });

    if (attachBtn && fileInput) {
        attachBtn.addEventListener('click', () => {
            trackGAEvent('click_attach_file', { session_id: currentSessionId });
            fileInput.click();
        });

        fileInput.addEventListener('change', handleFileUpload);
    }

    if (removeFileBtn && filePreviewChip) {
        removeFileBtn.addEventListener('click', () => {
            trackGAEvent('remove_attached_file', { file_name: filePreviewName ? filePreviewName.textContent : '' });
            if (fileInput) fileInput.value = '';
            filePreviewChip.hidden = true;
        });
    }
}

function autosizeInput() {
    if (!chatInput) return;
    chatInput.style.height = 'auto';
    chatInput.style.height = chatInput.scrollHeight + 'px';
}

function updateEmptyState() {
    if (chatMain && chatHistory) {
        chatMain.classList.toggle('is-empty', chatHistory.children.length === 0);
    }
}

// --- Chat Send & API Pipeline ---
async function handleSend(triggerSource = 'send_button') {
    if (!chatInput) return;
    const text = chatInput.value.trim();
    if (!text || (sendBtn && sendBtn.disabled)) return;

    trackGAEvent('send_chat_message', {
        message_text: text,
        message_length: text.length,
        session_id: currentSessionId,
        trigger_source: triggerSource,
        has_file_attached: !!(fileInput && fileInput.files && fileInput.files.length > 0)
    });

    appendMessage(text, 'user');

    chatInput.value = '';
    autosizeInput();
    if (sendBtn) sendBtn.disabled = true;
    if (filePreviewChip) filePreviewChip.hidden = true;

    const typingId = appendTypingIndicator();

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

    } catch (error) {
        console.error('Error fetching chat response:', error);
        removeTypingIndicator(typingId);
        appendMessage("Sorry, I couldn't reach the server. Check your connection and try again.", 'ai');
    } finally {
        if (sendBtn) sendBtn.disabled = false;
        saveSessionToStorage();
    }
}

// --- File Upload ---
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
        filePreviewChip.hidden = false;
    }

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

        trackGAEvent('upload_file_success', {
            file_name: file.name,
            project_id: currentProjectId
        });

        if (filePreviewChip) filePreviewChip.hidden = true;
        fileInput.value = '';
        appendMessage(`Attached **${file.name}**`, 'user');
        appendMessage(`Thanks, I've added **${file.name}** to your project. What are the main features you need, and do you have a preferred tech stack?`, 'ai');
        saveSessionToStorage();

    } catch (error) {
        console.error('File upload failed:', error);
        trackGAEvent('upload_file_failure', {
            file_name: file.name,
            error_message: error.message
        });
        showToast('Upload failed. Please try again.');
    }
}

// --- Messages ---
function triggerStartNewProject(btn) {
    if (btn) btn.disabled = true;
    pendingActionType = 'start_new_project';
    currentProjectId = null;

    appendMessage("Let's start a new project.\n\nWhat are you looking to build (for example a SaaS platform, mobile app or AI tool), and what key features or tech stack do you have in mind?", 'ai');

    saveSessionToStorage();
    if (chatInput) chatInput.focus();
}

function messageHTML(contentHtml, sender) {
    return `<div class="msg msg-${sender === 'user' ? 'user' : 'ai'}"><div class="msg-content">${contentHtml}</div></div>`;
}

function appendMessage(text, sender, action = null) {
    if (!chatHistory) return;

    let content = formatMessageMarkdown(text);
    if (action === 'start_new_project') {
        content += `<div><button class="msg-action" onclick="triggerStartNewProject(this)">Start a new project</button></div>`;
    }

    chatHistory.insertAdjacentHTML('beforeend', messageHTML(content, sender));
    updateEmptyState();
    scrollToBottom();
}

function appendTypingIndicator() {
    const id = 'typing_' + Date.now();
    chatHistory.insertAdjacentHTML('beforeend', `<div class="msg msg-ai" id="${id}"><div class="msg-content"><span class="typing-dot"></span></div></div>`);
    updateEmptyState();
    scrollToBottom();
    return id;
}

function removeTypingIndicator(id) {
    const element = document.getElementById(id);
    if (element) element.remove();
}

function scrollToBottom() {
    if (chatScroll) chatScroll.scrollTop = chatScroll.scrollHeight;
}

function formatMessageMarkdown(text) {
    if (!text) return '';
    const cleaned = text.replace(/<br\s*[\/]?>/gi, '\n');
    let formatted = escapeHTML(cleaned);
    formatted = formatted.replace(/\n/g, '<br>');
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
    return formatted;
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

// --- Single Conversation Storage ---
function resetConversation() {
    currentProjectId = null;
    pendingActionType = null;
    if (chatHistory) chatHistory.innerHTML = '';
    updateEmptyState();
    saveSessionToStorage();
}

function saveSessionToStorage() {
    if (!chatHistory) return;

    const messages = [];
    chatHistory.querySelectorAll('.msg:not([id^="typing_"])').forEach(row => {
        const content = row.querySelector('.msg-content');
        if (!content) return;
        messages.push({
            sender: row.classList.contains('msg-user') ? 'user' : 'ai',
            text: content.innerHTML
        });
    });

    try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
            messages: messages,
            projectId: currentProjectId,
            pendingActionType: pendingActionType
        }));
    } catch (e) {
        console.warn('Could not save chat session:', e);
    }
}

function loadSessionFromStorage() {
    try {
        const session = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || 'null');
        chatHistory.innerHTML = '';

        if (session && Array.isArray(session.messages)) {
            currentProjectId = session.projectId || null;
            pendingActionType = session.pendingActionType || null;

            session.messages
                // Drop the canned greeting that older versions of the page stored
                .filter(msg => !(msg.sender === 'ai' && msg.text.includes('AI Project Scope Architect')))
                .forEach(msg => chatHistory.insertAdjacentHTML('beforeend', messageHTML(msg.text, msg.sender)));
        }

        updateEmptyState();
        scrollToBottom();
    } catch (e) {
        console.error('Error reading chat session:', e);
        resetConversation();
    }
}

// --- Reviews Carousel (testimonials.html) ---
function setupReviewsCarousel() {
    const track = document.getElementById('reviews-track');
    if (!track) return;

    const prevBtn = document.getElementById('reviews-prev');
    const nextBtn = document.getElementById('reviews-next');
    const AUTO_SLIDE_MS = 4000;
    let timer = null;

    // Scroll by one card (card width + gap), wrapping around at either end
    function step(direction) {
        const card = track.querySelector('.review-card');
        if (!card) return;
        const distance = card.offsetWidth + parseFloat(getComputedStyle(track).columnGap || 0);
        const maxScroll = track.scrollWidth - track.clientWidth;

        if (direction > 0 && track.scrollLeft >= maxScroll - 4) {
            track.scrollTo({ left: 0 });
        } else if (direction < 0 && track.scrollLeft <= 4) {
            track.scrollTo({ left: maxScroll });
        } else {
            track.scrollBy({ left: direction * distance });
        }
    }

    function start() {
        stop();
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        timer = setInterval(() => step(1), AUTO_SLIDE_MS);
    }

    function stop() {
        clearInterval(timer);
        timer = null;
    }

    if (prevBtn) prevBtn.addEventListener('click', () => { step(-1); start(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { step(1); start(); });

    // Pause while the visitor is reading or scrolling the cards themselves
    track.addEventListener('mouseenter', stop);
    track.addEventListener('mouseleave', start);
    track.addEventListener('focusin', stop);
    track.addEventListener('focusout', start);
    track.addEventListener('touchstart', stop, { passive: true });
    track.addEventListener('touchend', start, { passive: true });
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

    start();
}

// --- Contact Form (contact.html) ---
function setupContactForm() {
    const form = document.getElementById('contact-inquiry-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('contact-name').value.trim();
        const email = document.getElementById('contact-email').value.trim();
        const category = document.getElementById('contact-category').value;
        const budget = document.getElementById('contact-budget').value;
        const message = document.getElementById('contact-message').value.trim();

        const emailDomain = email.includes('@') ? '@' + email.split('@')[1] : 'unknown';
        trackGAEvent('submit_contact_form', {
            has_name: !!name,
            email_domain: emailDomain,
            inquiry_category: category,
            target_budget: budget,
            message_length: message.length
        });

        const subject = encodeURIComponent(`Project inquiry from ${name || 'Client'} [${category}]`);
        const body = encodeURIComponent(
            `Name: ${name}\nEmail: ${email}\nCategory: ${category}\nBudget: ${budget}\n\n${message}`
        );

        window.location.href = `mailto:bhaveshupadhyay929@gmail.com?subject=${subject}&body=${body}`;

        showToast('Opening your email app...');
        form.reset();
    });
}

// --- Global GA Event Delegation for Links & CTAs ---
function setupGlobalGATracking() {
    document.addEventListener('click', (e) => {
        const navLink = e.target.closest('.main-nav a, .site-nav a');
        if (navLink) {
            trackGAEvent('navigation_click', {
                nav_label: navLink.textContent.trim(),
                target_href: navLink.getAttribute('href')
            });
        }

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

        const serviceCta = e.target.closest('.service-cta');
        if (serviceCta) {
            const item = serviceCta.closest('.list-item');
            trackGAEvent('click_service_cta', {
                service_title: item ? item.querySelector('h3')?.textContent : 'Service',
                target_url: serviceCta.getAttribute('href')
            });
        }

        const projectLink = e.target.closest('.project a');
        if (projectLink) {
            const href = projectLink.getAttribute('href') || '';
            trackGAEvent('click_portfolio_link', {
                project_title: projectLink.closest('.project').querySelector('h2')?.textContent || 'Project',
                link_type: href.startsWith('index.html') ? 'estimate' : 'live_site',
                target_url: href
            });
        }
    });
}
