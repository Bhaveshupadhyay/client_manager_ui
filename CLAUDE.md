# CLAUDE.md

This file provides guidance when working with code in this repository.

## Overview

This repository contains an AI Project Manager web interface designed as a premium, modern, SaaS-style application. The frontend communicates with a FastAPI backend at `https://clientmanger.tech`.

### Core Pages

- **Home (`index.html`)**: The primary workspace. It features a 3-column layout:
  - **Left Sidebar**: Conversation history (sessions saved in/loaded from `localStorage`), and a "New Conversation" button.
  - **Center Column**: Interactive chat stream with smooth message slide-in animations, dynamic status badges, custom avatars, an attachment handler, microphone UI, and a resizeable input bar.
  - **Right Sidebar**: A live Project Summary panel that dynamically extracts scoping info (Name, Industry, Stack, Features, Budget, Timeline, Cost Estimate) from messages using an integrated client-side regex parser. Enables PDF proposal generation/downloads once ready.
- **Services (`service.html`)**: A dedicated visual grid detailing 12 core digital capabilities.
- **Portfolio (`portfolio.html`)**: Showcase containing 6 premium sample SaaS/Web projects with tech tags, categories, live demo links, and GitHub anchors.
- **About (`about.html`)**: Interactive agency history with vertical roadmap timeline and animated stats counters.
- **Contact (`contact.html`)**: Backup contact dashboard highlighting primary mail anchors.

---

## Technical Stack & Configuration

- **Core**: Vanilla HTML5, custom CSS3, modular JavaScript.
- **Dependencies**: None. Loads "Plus Jakarta Sans" and "Inter" from Google Fonts. Runs immediately in any standard browser.
- **API URL**: `https://clientmanger.tech/api/v1/chat/`
- **Upload URL**: `https://clientmanger.tech/api/v1/file/upload`
- **Authentication**: `X-API-Key: 1234` header sent on API calls.
- **Mock Scope ID**: `fi_us_2026_4528` used to map chat sessions.

---

## Development Guidelines

### 1. Style & Theme Management:
- Core variable rules and styles are configured in [style.css](file:///c:/Users/tanma/OneDrive/Desktop/newone/client_manager_ui-feat-chat-ui/style.css).
- Theme toggles are controlled via the `data-theme="dark"` attribute on the `<body>` tag.
- Toggling automatically flips local storage values (`localStorage.setItem('theme', 'dark')`) and transitions SVG icons.

### 2. Sidebars Responsive Drawers:
- Under mobile breakpoints (<768px), the 3-column layout is collapsed.
- Left sidebar chat logs are toggled via the hamburger button (`#mobile-menu-toggle`), while the right panel is hidden.

### 3. Dynamic Summary Regex Parsing:
- Front-end message parsing is done in `script.js` inside the `parseSummaryText(text, isUser)` loop.
- It scans messages for pricing tokens (`$X,XXX` or `Xk`), timeline durations (`X months`), and technology strings (`REACT`, `FASTAPI`, etc.) to update UI panels in real-time.

### 4. File Upload Integration:
- Uploading files via the paperclip triggers the browser file drawer, compiling a `FormData` block sent directly to `/api/v1/file/upload` alongside security headers.