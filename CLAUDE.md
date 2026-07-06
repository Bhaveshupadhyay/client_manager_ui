# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This repository contains a client manager UI chat interface that communicates with a FastAPI backend at `https://clientmanger.tech`. The application features:

- A chat interface with user and AI messages
- Dark/light theme toggle
- API communication with API key authentication
- Server ping on DOM load to check server availability
- Responsive design

## Recent UI Enhancements

The UI has been significantly improved to provide a more professional and engaging experience:

1. **Clear Sender Identification**:
   - AI messages now show "AI Project Manager" as sender
   - User messages show "Client" as sender
   - Initial greeting properly identifies as AI Project Manager

2. **Modern Visual Design**:
   - Enhanced card-based layout with subtle shadows
   - Improved spacing and typography
   - Hover effects on message bubbles and buttons
   - Better avatar styling with background colors
   - Focus states on input elements
   - Smooth transitions and animations

3. **Improved Usability**:
   - Better input area with proper focus indication
   - Enhanced typing indicator animation
   - Optimized mobile responsiveness
   - Consistent visual hierarchy

## Code Structure (Updated)

```
client_manager_ui/
├── index.html          # Enhanced HTML structure of the chat interface
├── style.css           # Significantly improved CSS with modern design
├── script.js           # Updated JavaScript with clear sender identification
├── openapi.json        # API specification for the backend
├── CNAME               # DNS configuration for GitHub Pages
├── .git/               # Git repository
└── .idea/              # IntelliJ IDEA project files
```

## Key Improvements Made

### script.js Changes:
- `appendUserMessage()`: Now displays "Client" as sender name
- `appendAIMessage()`: Now displays "AI Project Manager" as sender name
- Maintains all existing functionality (API calls, typing indicators, etc.)

### index.html Changes:
- Initial AI message sender changed from "Bhavesh" to "AI Project Manager"

### style.css Improvements:
- Added shadow variables for depth (`--shadow-sm`, `--shadow-md`, `--shadow-lg`)
- Enhanced layout with better spacing and container styling
- Improved message bubbles with hover effects and better borders
- Styled avatars with background colors matching theme
- Improved input area with focus states and better proportions
- Added smooth transitions for interactive elements
- Fixed positioning issues for better responsiveness
- Enhanced typing indicator animation
- Better dark/light theme consistency

## Development Guidelines

### Theme Management:
- Theme controlled by `data-theme` attribute on `body` element
- Adding `data-theme="dark"` enables dark mode
- Removing attribute returns to light mode
- Theme toggle button switches between sun/moon icons

### API Communication:
- All API requests go to `https://clientmanger.tech/api/v1/chat/`
- Requires `X-API-Key: 1234` header
- Expects JSON with `message`, `client_name`, and `project_id` fields
- Returns JSON with `message`, `name`, and optional `action` fields

### UI Interaction Patterns:
- Messages append to chat history with automatic scrolling
- Textarea auto-resizes based on content (up to max height)
- Send button disables during API requests to prevent duplicates
- Typing indicator shows during AI response generation
- Error handling shows user-friendly messages

## Extending the Application

To add new features:
1. Modify `script.js` for new functionality
2. Update `index.html` for new UI elements (if needed)
3. Enhance `style.css` for additional styling
4. Update API constants if endpoints change
5. Test locally before deploying to GitHub Pages

## Deployment

The site is configured for GitHub Pages via the CNAME file pointing to `chat.clientmanger.tech`. Pushes to the main branch will automatically deploy to GitHub Pages.