const chatHistory = document.getElementById('chat-history');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');

// --- Configuration ---
const API_URL = 'https://clientmanger.tech/api/v1/chat/';
const API_KEY = '1234';
const CLIENT_NAME = 'WebClient'; // Replace with dynamic logic if needed

// --- Event Listeners ---
sendBtn.addEventListener('click', handleSend);

chatInput.addEventListener('keydown', (e) => {
    // Submit on Enter (allow Shift+Enter for new lines)
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
});

// Auto-resize textarea
chatInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

// --- Core Logic ---
async function handleSend() {
    const text = chatInput.value.trim();
    if (!text) return;

    // 1. Render User Message
    appendMessage(text, 'user');
    
    // Clear input & reset height
    chatInput.value = '';
    chatInput.style.height = 'auto';
    
    // 2. Render Loading State
    const loadingId = appendLoading();
    
    // Disable button to prevent spam
    sendBtn.disabled = true;

    try {
        // 3. Make API Call
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'X-API-Key': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: text,
                client_name: CLIENT_NAME
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // 4. Remove loading state & Render AI Response
        removeElement(loadingId);
        appendMessage(data.message, 'ai');

    } catch (error) {
        console.error('Error fetching chat response:', error);
        removeElement(loadingId);
        appendMessage('Error: Could not connect to the API. Please check the console.', 'ai');
    } finally {
        // Re-enable button
        sendBtn.disabled = false;
    }
}

// --- UI Helpers ---
function appendMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);
    
    const avatarLetter = sender === 'ai' ? 'AI' : 'U';
    const avatarClass = sender === 'ai' ? 'ai-avatar' : 'user-avatar';

    messageDiv.innerHTML = `
        <div class="message-inner">
            <div class="avatar ${avatarClass}">${avatarLetter}</div>
            <div class="content">${escapeHTML(text)}</div>
        </div>
    `;
    
    chatHistory.appendChild(messageDiv);
    scrollToBottom();
}

function appendLoading() {
    const id = 'loading-' + Date.now();
    const loadingDiv = document.createElement('div');
    loadingDiv.id = id;
    loadingDiv.classList.add('message', 'ai-message', 'loading');
    
    loadingDiv.innerHTML = `
        <div class="message-inner">
            <div class="avatar ai-avatar">AI</div>
            <div class="content">Thinking...</div>
        </div>
    `;
    
    chatHistory.appendChild(loadingDiv);
    scrollToBottom();
    return id;
}

function removeElement(id) {
    const element = document.getElementById(id);
    if (element) {
        element.remove();
    }
}

function scrollToBottom() {
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// Prevents XSS attacks by sanitizing text
function escapeHTML(str) {
    const p = document.createElement('p');
    p.appendChild(document.createTextNode(str));
    return p.innerHTML;
}