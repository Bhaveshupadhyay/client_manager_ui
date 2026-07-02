const chatHistory = document.getElementById('chat-history');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const themeToggle = document.getElementById('theme-toggle');
const sunIcon = document.getElementById('sun-icon');
const moonIcon = document.getElementById('moon-icon');

// --- Configuration ---
// Make sure to match this with your secure FastAPI setup
const API_URL = 'https://clientmanger.tech/api/v1/chat/'; 
const API_KEY = '1234';
const CLIENT_NAME = 'WebClient';

window.addEventListener('DOMContentLoaded', () => {
    fetch('https://clientmanger.tech/')
        .then(() => console.log("Server pinged successfully."))
        .catch((e) => console.log("Ping sent (ignoring network errors while server boots)."));
});
// --- Theme Toggling ---
themeToggle.addEventListener('click', () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    if (isDark) {
        document.body.removeAttribute('data-theme');
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    } else {
        document.body.setAttribute('data-theme', 'dark');
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    }
});

// --- Event Listeners ---
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

// --- Helpers ---
function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function scrollToBottom() {
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function escapeHTML(str) {
    const p = document.createElement('p');
    p.appendChild(document.createTextNode(str));
    return p.innerHTML;
}

// --- Chat Logic ---
async function handleSend() {
    const text = chatInput.value.trim();
    if (!text) return;

    appendUserMessage(text);
    
    chatInput.value = '';
    chatInput.style.height = 'auto';
    sendBtn.disabled = true;

    const loadingId = appendTypingIndicator();

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
                project_id: "fi_us_2026_4528"
            })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        
        document.getElementById(loadingId).remove();
        appendAIMessage(data.message);

    } catch (error) {
        console.error('Error fetching chat response:', error);
        document.getElementById(loadingId).remove();
        appendAIMessage("Sorry, I'm having trouble connecting right now.");
    } finally {
        sendBtn.disabled = false;
    }
}

// --- UI Rendering ---
function appendUserMessage(text) {
    const time = getCurrentTime();
    const html = `
        <div class="user-message-row">
            <div class="message-wrapper">
                <div class="bubble-and-time">
                    <div class="bubble user-bubble">${escapeHTML(text)}</div>
                    <span class="timestamp">${time}</span>
                </div>
            </div>
        </div>
    `;
    chatHistory.insertAdjacentHTML('beforeend', html);
    scrollToBottom();
}

function appendAIMessage(text) {
    const time = getCurrentTime();
    const html = `
        <div class="message ai-message-row">
            <div class="avatar ai-avatar">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/></svg>
            </div>
            <div class="message-wrapper">
                <span class="sender-name">Bhavesh</span>
                <div class="bubble-and-time">
                    <div class="bubble ai-bubble">${escapeHTML(text)}</div>
                    <span class="timestamp">${time}</span>
                </div>
            </div>
        </div>
    `;
    chatHistory.insertAdjacentHTML('beforeend', html);
    scrollToBottom();
}

function appendTypingIndicator() {
    const id = 'typing-' + Date.now();
    const html = `
        <div id="${id}" class="message ai-message-row">
            <div class="avatar ai-avatar">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/></svg>
            </div>
            <div class="message-wrapper">
                <span class="sender-name">Bhavesh</span>
                <div class="bubble-and-time">
                    <div class="bubble ai-bubble">
                        <div class="typing-indicator">
                            <div class="dot"></div>
                            <div class="dot"></div>
                            <div class="dot"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    chatHistory.insertAdjacentHTML('beforeend', html);
    scrollToBottom();
    return id;
}
