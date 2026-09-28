# CLAUDE.md

This file provides guidance when working with code in this repository.

## Overview

This repository contains the AI Client Manager website: a chat interface for scoping software projects, plus a few plain content pages. The UI is deliberately minimal and modeled on chatgpt.com. The frontend communicates with a FastAPI backend at `https://clientmanger.tech`.

### Pages

- **Chat (`index.html`)**: ChatGPT-style layout.
  - **Sidebar**: brand, "New chat", links to the content pages, theme toggle, Fiverr link. Becomes a drawer below 768px.
  - **Main column**: when empty, a centered heading, the composer and starter prompts; otherwise a single-column thread (user messages in gray bubbles on the right, assistant replies as plain text) with the composer pinned to the bottom.
  - One conversation, persisted in `localStorage` under `ai_single_chat_session`.
  - `index.html?prompt=...` sends the prompt on load (used by the "Get an estimate" links on other pages).
- **Services (`service.html`)**, **Work (`portfolio.html`)**, **Reviews (`testimonials.html`)**, **About (`about.html`)**, **Contact (`contact.html`)**: plain content pages sharing one header and footer.
- **Auto-DM demo (`autodm-simulator.html`)**: scripted chatbot demo with canned replies (inline script, no backend calls).

---

## Technical Stack & Configuration

- **Core**: Vanilla HTML, CSS and JavaScript. No build step, no dependencies, system font stack.
- **API URL**: `https://clientmanger.tech/api/v1/chat/` (`http://127.0.0.1:8000` on localhost)
- **Upload URL**: `https://clientmanger.tech/api/v1/file/upload`
- **Authentication**: `X-API-Key: 1234` header sent on API calls.
- **Analytics**: GA4 (`G-FWVLD04NV3`) via `trackGAEvent()` in `script.js`, which redacts emails and phone numbers.

---

## Development Guidelines

### 1. Keep it simple
- No emojis, gradients, glows, decorative animations, fake status badges or made-up metrics.
- Neutral palette, one accent (near-black in light mode, near-white in dark mode).

### 2. Styles and theme
- All styles live in `style.css`; color tokens are CSS variables on `:root`, overridden by `:root[data-theme="dark"]`.
- The theme is stored in `localStorage` (`theme`) and applied to `<html>` by an inline script in each page's `<head>` to avoid a flash.
- Theme toggle icons are swapped with CSS (`.icon-moon` / `.icon-sun`).

### 3. Shared header and footer
- Content pages repeat the same `.site-header` and `.site-footer` markup. Change them in every page together.

### 4. File upload
- The "+" button in the composer opens the file picker and posts a `FormData` body to `/api/v1/file/upload` with the API key header.
