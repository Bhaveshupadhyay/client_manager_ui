# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This repository contains a client manager UI chat interface that communicates with a FastAPI backend at `https://clientmanger.tech`. The application features:

- A chat interface with user and AI messages
- Dark/light theme toggle
- API communication with API key authentication
- Server ping on DOM load to check server availability
- Responsive design with multi-page navigation
- Enhanced UI with background images and modern styling

## Recent UI Enhancements

The UI has been significantly improved to provide a professional and engaging experience:

1. **Clear Sender Identification**:
   - AI messages show "AI Project Manager" as sender
   - User messages show "You" as sender (more personal)
   - Initial greeting properly identifies as AI Project Manager

2. **Multi-Page Navigation**:
   - Home (index.html) - Main chat interface
   - Service (service.html) - Shows services offered
   - Portfolio (portfolio.html) - Shows portfolio/work examples
   - About (about.html) - About us/page
   - Contact (contact.html) - Contact information with email: bhaveshupadhyay929@gmail.com

3. **Modern Visual Design**:
   - Enhanced card-based layout with subtle shadows and backdrop blur
   - Improved spacing and typography
   - Hover effects on message bubbles and buttons
   - Better avatar styling with theme-appropriate background colors
   - Focus states on input elements
   - Smooth transitions and animations
   - Subtle noise pattern background images
   - Semi-transparent containers with blur effect for depth

4. **Improved Usability**:
   - Better input area with proper focus indication
   - Enhanced typing indicator animation
   - Optimized mobile responsiveness
   - Consistent visual hierarchy
   - Fixed header navigation that stays visible

## Code Structure

```
client_manager_ui/
├── index.html          # Main chat interface (Home page)
├── service.html        # Services page
├── portfolio.html      # Portfolio page
├── about.html          # About page
├── contact.html        # Contact page
├── style.css           # Enhanced CSS with modern design
├── script.js           # JavaScript logic for chat functionality
├── openapi.json        # API specification for the backend
├── CNAME               # DNS configuration for GitHub Pages
├── .git/               # Git repository
└── .idea/              # IntelliJ IDEA project files
```

## Key Improvements Made

### HTML Files (All pages):
- Added consistent header navigation with links to all pages
- Added theme toggle button in header
- Removed duplicate theme-toggle function section on all pages shows current page as active link

### script.js Changes:
- `appendUserMessage()`: Now displays "You" as sender name (also said asis to maintain proper
- `appendTypingIndicator()`: Fixed to show "AI Project Manager" as sender during typing
- Maintains all existing functionality (API calls, etc.)

### style.css Improvements:
- Added background noise pattern using SVG data URI
- Implemented backdrop-filter blur effect on containers for depth
- Enhanced layout with better spacing and container styling
- Improved message bubbles with hover effects and better borders
- Styled avatars with background colors matching theme
- Improved input area with focus states and better proportions
- Added smooth transitions for interactive elements
- Fixed positioning for better responsiveness
- Enhanced typing indicator animation
- Better dark/light theme consistency with proper color variables
- Added shadow variables for depth (`--shadow-sm`, `--shadow-md`, `--shadow-lg`)
- Responsive design adjustments for mobile devices

## Development Guidelines

### Theme Management:
- Theme controlled by `data-theme` attribute on `body` element
- Adding `data-theme="dark"` enables dark mode
- Removing attribute returns to light mode
- Theme toggle button switches between sun/moon icons in header

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

### Navigation:
- All pages share common header navigation
- Active page is highlighted in navigation menu
- Consistent layout across all pages
- Clicking logo or "Home" nav item returns to main chat interface

## Extending the Application

To add new features:
1. Modify `script.js` for new functionality
2. Update/create HTML pages for new UI elements (if needed)
3. Enhance `style.css` for additional styling
4. Update API constants if endpoints change
5. Test locally before deploying to GitHub Pages
6. Ensure new pages include the same header navigation

## Deployment

The site is configured for GitHub Pages via the CNAME file pointing to `chat.clientmanger.tech`. Pushes to the main branch will automatically deploy to GitHub Pages.