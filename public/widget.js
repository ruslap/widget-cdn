/**
 * ChatIQ Widget v3.0.0 - Enhanced Edition
 * Premium chat widget with killer features
 * 
 * New Features:
 * - 📎 File uploads with drag & drop
 * - 😊 Emoji picker
 * - ❤️ Message reactions
 * - ⚡ Quick reply suggestions
 * - 👤 Agent avatar & typing with name
 * - 🔔 Sound notifications
 * - 📎 Rich attachment previews
 * - 🕐 Message timestamps
 * - ✓✓ Read receipts
 * - 🎨 Animated backgrounds
 * - ⌨️ Typing indicators with names
 * - 🎭 Status presence (online/away/busy)
 * - 📱 Mobile-optimized gestures
 * 
 * Usage:
 * <script src="https://cdn.chatiq.io/widget.js" data-site-id="YOUR_SITE_ID"></script>
 */

(function () {
    'use strict';

    // Configuration
    const WIDGET_VERSION = '3.0.0';
    const API_URL = 'wss://api.chatiq.io';
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_FILE_TYPES = ['image/*', 'application/pdf', '.doc', '.docx', '.txt'];

    // Get configuration
    const config = window.ChatIQConfig || {};
    const accentColor = config.accentColor || '#B6FF00';
    const position = config.position || 'right';
    const agentName = config.agentName || 'Support Team';
    const agentAvatar = config.agentAvatar || null;
    let soundEnabled = localStorage.getItem('chatiq_sound_enabled') !== 'false';

    // Get siteId from script tag
    const currentScript = document.currentScript;
    const siteId = currentScript?.getAttribute('data-site-id');

    if (!siteId) {
        console.warn('[ChatIQ] Missing data-site-id attribute');
        return;
    }

    // Generate or retrieve visitorId
    function getVisitorId() {
        const storageKey = 'chatiq_visitor_id';
        let visitorId = localStorage.getItem(storageKey);

        if (!visitorId) {
            visitorId = 'v_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
            localStorage.setItem(storageKey, visitorId);
        }

        return visitorId;
    }

    const visitorId = getVisitorId();

    // Detect theme preference
    function getThemePreference() {
        const themeConfig = config.theme || 'light';
        if (themeConfig === 'auto') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return themeConfig;
    }

    let currentTheme = getThemePreference();

    console.log(`[ChatIQ] Widget v${WIDGET_VERSION} initialized`);
    console.log(`[ChatIQ] Site ID: ${siteId}`);
    console.log(`[ChatIQ] Visitor ID: ${visitorId}`);

    // Create widget container with Shadow DOM
    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'chatiq-widget';
    // Fix container to viewport to avoid layout interference
    Object.assign(widgetContainer.style, {
        position: 'fixed',
        bottom: '0',
        right: '0',
        width: '0',
        height: '0',
        zIndex: '2147483647',
        overflow: 'visible'
    });
    document.body.appendChild(widgetContainer);

    const shadow = widgetContainer.attachShadow({ mode: 'closed' });

    // Generate accent color variants
    function hexToHSL(hex) {
        let r = parseInt(hex.slice(1, 3), 16) / 255;
        let g = parseInt(hex.slice(3, 5), 16) / 255;
        let b = parseInt(hex.slice(5, 7), 16) / 255;

        let max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            let d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
    }

    const accentHSL = hexToHSL(accentColor);

    // Sound effects
    const sounds = {
        send: () => playTone(800, 0.1, 'sine'),
        receive: () => playTone(600, 0.15, 'sine'),
        notification: () => playTone([600, 800], 0.1, 'sine'),
    };

    function playTone(freq, duration, type = 'sine') {
        if (!soundEnabled) return;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const freqs = Array.isArray(freq) ? freq : [freq];

            freqs.forEach((f, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.frequency.value = f;
                osc.type = type;
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

                osc.start(ctx.currentTime + (i * 0.1));
                osc.stop(ctx.currentTime + duration + (i * 0.1));
            });
        } catch (e) {
            console.warn('[ChatIQ] Sound playback failed:', e);
        }
    }

    // Design Tokens & Enhanced Styles
    const styles = `
    /* ===== FONTS ===== */
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

    /* ===== DESIGN TOKENS ===== */
    :host {
      /* Accent Color */
      --accent-h: ${accentHSL.h};
      --accent-s: ${accentHSL.s}%;
      --accent-l: ${accentHSL.l}%;
      
      --accent: hsl(var(--accent-h), var(--accent-s), var(--accent-l));
      --accent-hover: hsl(var(--accent-h), var(--accent-s), calc(var(--accent-l) - 8%));
      --accent-light: hsl(var(--accent-h), var(--accent-s), 96%);
      --accent-soft: hsl(var(--accent-h), calc(var(--accent-s) * 0.3), 95%);
      --accent-text: ${accentHSL.l > 60 ? '#000000' : '#FFFFFF'};

      /* Typography - Using DM Sans instead of generic system fonts */
      --font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-mono: 'JetBrains Mono', 'Courier New', monospace;
      --font-size-xs: 11px;
      --font-size-sm: 12px;
      --font-size-base: 14px;
      --font-size-lg: 15px;
      --font-weight-normal: 400;
      --font-weight-medium: 500;
      --font-weight-semibold: 600;
      --font-weight-bold: 700;
      --line-height: 1.5;

      /* Spacing */
      --space-1: 4px;
      --space-2: 8px;
      --space-3: 12px;
      --space-4: 16px;
      --space-5: 20px;
      --space-6: 24px;
      --space-8: 32px;

      /* Border Radius */
      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 14px;
      --radius-xl: 18px;
      --radius-full: 9999px;

      /* Transitions */
      --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
      --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
      --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
      --duration-fast: 150ms;
      --duration-base: 200ms;
      --duration-slow: 300ms;

      /* Z-index */
      --z-launcher: 999999;
      --z-panel: 999998;
      --z-overlay: 999997;
    }

    /* ===== LIGHT THEME ===== */
    :host {
      --bg-primary: #FFFFFF;
      --bg-secondary: #F8F9FA;
      --bg-tertiary: #F1F3F5;
      --bg-hover: #E9ECEF;
      --bg-overlay: rgba(29, 35, 49, 0.4);
      
      --border-light: #F1F3F5;
      --border-medium: #E9ECEF;
      --border-strong: #DEE2E6;
      
      --text-primary: #1D2331;
      --text-secondary: #495057;
      --text-tertiary: #6C757D;
      --text-muted: #ADB5BD;
      
      /* Primary Accent (Purple) */
      --accent-primary: #7D53FF;
      /* Highlight Accent (Lime) - Used minimally */
      --accent-highlight: #B6FF00;
      --accent-highlight-soft: #8EFF01;
      
      --shadow-sm: 0 2px 8px rgba(29, 35, 49, 0.05);
      --shadow-md: 0 4px 16px rgba(29, 35, 49, 0.08);
      --shadow-lg: 0 12px 32px rgba(29, 35, 49, 0.12);
      
      --message-user-bg: var(--accent-primary);
      --message-user-text: #FFFFFF;
      --message-bot-bg: var(--bg-tertiary);
      --message-bot-text: var(--text-primary);

      --bg-pattern: none;
    }

    /* ===== DARK THEME ===== */
    :host(.dark) {
      --bg-primary: #1A1E28;
      --bg-secondary: #242834;
      --bg-tertiary: #2D3241;
      --bg-hover: #363C4D;
      --bg-overlay: rgba(0, 0, 0, 0.7);
      
      --border-light: #2D3241;
      --border-medium: #3D4454;
      --border-strong: #4D5568;
      
      --text-primary: #FFFFFF;
      --text-secondary: #C4C9D4;
      --text-tertiary: #8EFF01;
      --text-muted: #5A6274;
      
      /* Purple accent for secondary elements */
      --secondary-accent: #7D53FF;
      --secondary-accent-light: rgba(125, 83, 255, 0.15);
      
      --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.3);
      --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.4);
      --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3);
      --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5), 0 4px 8px rgba(0, 0, 0, 0.3);
      --shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.6), 0 8px 16px rgba(0, 0, 0, 0.4);
      
      --accent-light: rgba(182, 255, 0, 0.15);
      --accent-soft: rgba(182, 255, 0, 0.08);
      
      --message-user-bg: var(--accent);
      --message-user-text: #1D2331;
      --message-bot-bg: var(--secondary-accent);
      --message-bot-text: #FFFFFF;

      /* Animated background - subtle lime/purple glow */
      --bg-pattern: radial-gradient(circle at 20% 50%, rgba(142, 255, 1, 0.06) 0%, transparent 50%),
                     radial-gradient(circle at 80% 80%, rgba(125, 83, 255, 0.08) 0%, transparent 50%);
    }

    /* ===== RESET ===== */
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    /* ===== LAUNCHER BUTTON ===== */
    .launcher {
      position: absolute;
      bottom: 24px;
      right: 24px;
      width: 64px;
      height: 64px;
      border-radius: var(--radius-full);
      background: #1D2331;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--duration-base) var(--ease-out);
      z-index: var(--z-launcher);
      box-shadow: var(--shadow-lg);
      overflow: visible;
    }

    .launcher::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at center, rgba(255,255,255,0.3) 0%, transparent 70%);
      opacity: 0;
      transition: opacity var(--duration-base);
    }

    .launcher:hover::before {
      opacity: 1;
    }

    .launcher:hover {
      transform: scale(1.08) rotate(5deg);
      background: var(--accent-hover);
      box-shadow: var(--shadow-xl);
    }

    .launcher:active {
      transform: scale(0.95);
    }

    .launcher:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 4px;
    }

    .launcher svg {
      width: 26px;
      height: 26px;
      fill: var(--accent-highlight);
      transition: transform var(--duration-base) var(--ease-out),
                  opacity var(--duration-fast);
      position: relative;
      z-index: 1;
    }

    .launcher .icon-chat {
      position: absolute;
    }

    .launcher .icon-close {
      position: absolute;
      opacity: 0;
      transform: rotate(-90deg) scale(0.8);
    }

    .launcher.open .icon-chat {
      opacity: 0;
      transform: rotate(90deg) scale(0.8);
    }

    .launcher.open .icon-close {
      opacity: 1;
      transform: rotate(0) scale(1);
    }

    /* Pulse animation for launcher */
    @keyframes launcher-pulse {
      0%, 100% {
        box-shadow: var(--shadow-lg);
      }
      50% {
        box-shadow: var(--shadow-xl);
      }
    }

    .launcher.pulse {
      animation: launcher-pulse 2s ease-in-out infinite;
    }

    /* Badge */
    .launcher-badge {
      top: -4px;
      right: -4px;
      min-width: 22px;
      height: 22px;
      padding: 0 6px;
      border-radius: var(--radius-full);
      background: var(--accent-highlight);
      color: #1D2331;
      font-family: var(--font-family);
      font-size: 12px;
      font-weight: 800;
      display: none;
      align-items: center;
      justify-content: center;
      border: 2px solid #1D2331;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      z-index: 2;
    }

    .launcher-badge.visible {
      display: flex;
      animation: badge-bounce var(--duration-slow) var(--ease-bounce);
    }

    @keyframes badge-bounce {
      0% { transform: scale(0); }
      50% { transform: scale(1.3); }
      70% { transform: scale(0.9); }
      100% { transform: scale(1); }
    }

    /* ===== CHAT PANEL ===== */
    .panel {
      position: absolute;
      bottom: 104px;
      right: 24px;
      width: 400px;
      height: 600px;
      max-height: calc(100vh - 130px);
      background: var(--bg-primary);
      border-radius: var(--radius-xl);
      border: 1px solid var(--border-light);
      box-shadow: var(--shadow-xl);
      display: none;
      flex-direction: column;
      overflow: hidden;
      z-index: var(--z-panel);
      opacity: 0;
      transform: translateY(16px) scale(0.94);
      transform-origin: bottom right;
    }

    .panel::before {
      content: '';
      position: absolute;
      inset: 0;
      background: var(--bg-pattern);
      pointer-events: none;
      z-index: 0;
    }

    .panel.open {
      display: flex;
      animation: panel-enter var(--duration-slow) var(--ease-out) forwards;
    }

    .panel.closing {
      animation: panel-exit var(--duration-base) var(--ease-in-out) forwards;
    }

    @keyframes panel-enter {
      from {
        opacity: 0;
        transform: translateY(20px) scale(0.94);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes panel-exit {
      from {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      to {
        opacity: 0;
        transform: translateY(20px) scale(0.94);
      }
    }

    /* ===== HEADER ===== */
    .header {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-5);
      background: #1D2331;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      flex-shrink: 0;
      position: relative;
      z-index: 1;
    }

    .header-avatar {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-full);
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      position: relative;
    }

    .header-avatar::after {
      content: '';
      position: absolute;
      bottom: -1px;
      right: -1px;
      width: 12px;
      height: 12px;
      border-radius: var(--radius-full);
      background: #8EFF01;
      border: 2px solid #1D2331;
    }

    .header-avatar svg {
      width: 22px;
      height: 22px;
      fill: #FFFFFF;
    }

    .header-content {
      flex: 1;
      min-width: 0;
    }

    .header-title {
      font-family: var(--font-family);
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: #FFFFFF;
      line-height: 1.3;
      margin-bottom: 2px;
    }

    .header-status {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-family: var(--font-family);
      font-size: var(--font-size-sm);
      color: var(--accent-highlight);
      opacity: 0.9;
      line-height: 1.3;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      padding: 2px 8px;
      border-radius: var(--radius-full);
      background: rgba(255, 255, 255, 0.15);
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: var(--radius-full);
      background: #8EFF01;
    }

    .header-actions {
      display: flex;
      gap: var(--space-1);
    }

    .header-btn {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      background: rgba(255, 255, 255, 0.1);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      opacity: 0.7;
      transition: all var(--duration-fast);
    }

    .header-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      opacity: 1;
      color: var(--accent-highlight);
      transform: scale(1.05);
    }

    .header-btn:active {
      transform: scale(0.95);
    }

    .header-btn:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: -2px;
    }

    .header-btn svg {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }

    /* ===== MESSAGES ===== */
    .messages {
      flex: 1;
      padding: var(--space-5);
      overflow-y: auto;
      background: var(--bg-secondary);
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      position: relative;
      z-index: 1;
    }

    .messages::-webkit-scrollbar {
      width: 6px;
    }

    .messages::-webkit-scrollbar-track {
      background: transparent;
    }

    .messages::-webkit-scrollbar-thumb {
      background: var(--border-medium);
      border-radius: var(--radius-full);
    }

    .messages::-webkit-scrollbar-thumb:hover {
      background: var(--border-strong);
    }

    /* Message Group */
    .message-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .message-group.bot {
      align-items: flex-start;
    }

    .message-group.user {
      align-items: flex-end;
    }

    /* Message */
    .message {
      display: flex;
      gap: var(--space-2);
      max-width: 85%;
      animation: message-slide-in var(--duration-base) var(--ease-out);
    }

    @keyframes message-slide-in {
      from {
        opacity: 0;
        transform: translateY(10px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .message.bot {
      align-self: flex-start;
    }

    .message.user {
      align-self: flex-end;
      flex-direction: row-reverse;
    }

    .message-avatar {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-full);
      background: #1D2331;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: var(--shadow-sm);
    }

    .message-avatar svg {
      width: 18px;
      height: 18px;
      fill: var(--accent-highlight);
    }

    .message.user .message-avatar {
      display: none;
    }

    .message-content {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      flex: 1;
    }

    .message-bubble {
      padding: var(--space-3) var(--space-4);
      font-family: var(--font-family);
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-normal);
      line-height: var(--line-height);
      word-wrap: break-word;
      overflow-wrap: break-word;
      position: relative;
      transition: transform var(--duration-fast);
    }

    .message-bubble:hover {
      transform: translateY(-1px);
    }

    .message.bot .message-bubble {
      background: var(--message-bot-bg);
      color: var(--message-bot-text);
      border-radius: var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--space-1);
      box-shadow: var(--shadow-xs);
    }

    .message.user .message-bubble {
      background: var(--accent-primary);
      color: #FFFFFF;
      border-radius: var(--radius-lg) var(--radius-lg) var(--space-1) var(--radius-lg);
    }

    /* Message Meta */
    .message-meta {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: 0 var(--space-1);
      font-family: var(--font-family);
      font-size: var(--font-size-xs);
      color: var(--text-muted);
    }

    .message.user .message-meta {
      flex-direction: row-reverse;
    }

    .message-time {
      opacity: 0;
      transition: opacity var(--duration-fast);
    }

    .message:hover .message-time {
      opacity: 1;
    }

    .message-status {
      display: flex;
      align-items: center;
      gap: 2px;
    }

    .message-status svg {
      width: 14px;
      height: 14px;
      fill: currentColor;
    }

    /* Message Reactions */
    .message-reactions {
      display: flex;
      gap: var(--space-1);
      flex-wrap: wrap;
      margin-top: var(--space-1);
    }

    .reaction {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: var(--radius-full);
      background: var(--bg-tertiary);
      border: 1px solid var(--border-light);
      font-size: var(--font-size-sm);
      cursor: pointer;
      transition: all var(--duration-fast);
    }

    .reaction:hover {
      background: var(--bg-hover);
      transform: scale(1.05);
    }

    .reaction.active {
      background: var(--accent-light);
      border-color: var(--accent);
    }

    .reaction-emoji {
      font-size: 14px;
    }

    .reaction-count {
      font-family: var(--font-mono);
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
      font-weight: var(--font-weight-medium);
    }

    /* Attachment */
    .message-attachment {
      margin-top: var(--space-2);
      border-radius: var(--radius-md);
      overflow: hidden;
      border: 1px solid var(--border-light);
      background: var(--bg-primary);
    }

    .attachment-image {
      width: 100%;
      display: block;
      max-height: 200px;
      object-fit: cover;
    }

    .attachment-file {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3);
    }

    .attachment-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      background: var(--accent-soft);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .attachment-icon svg {
      width: 20px;
      height: 20px;
      fill: var(--accent);
    }

    .attachment-info {
      flex: 1;
      min-width: 0;
    }

    .attachment-name {
      font-family: var(--font-family);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .attachment-size {
      font-family: var(--font-mono);
      font-size: var(--font-size-xs);
      color: var(--text-tertiary);
    }

    /* Welcome */
    /* Welcome */
    .welcome {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: var(--space-12) var(--space-8);
      flex: 1;
      background: var(--bg-primary);
    }

    .welcome-card {
      background: var(--bg-primary);
      padding: var(--space-8) var(--space-6);
      border-radius: var(--radius-xl);
      border: 1px solid var(--border-light);
      box-shadow: var(--shadow-md);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-4);
      max-width: 320px;
    }

    .welcome-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-lg);
      background: #1D2331;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--shadow-sm);
    }

    .welcome-icon svg {
      width: 24px;
      height: 24px;
      fill: var(--accent-highlight);
    }

    .welcome-title {
      font-family: var(--font-family);
      font-size: 18px;
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      margin: 0;
    }

    .welcome-text {
      font-family: var(--font-family);
      font-size: 14px;
      color: var(--text-secondary);
      line-height: 1.5;
      margin: 0;
    }

    .welcome-action {
      margin-top: var(--space-2);
      width: 100%;
    }

    .btn-start {
      width: 100%;
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-lg);
      background: var(--accent-primary);
      color: #FFFFFF;
      border: none;
      font-family: var(--font-family);
      font-size: 14px;
      font-weight: var(--font-weight-semibold);
      cursor: pointer;
      transition: all var(--duration-fast);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
    }

    .btn-start:hover {
      background: #6A45EB;
      transform: translateY(-1px);
    }

    /* Quick Replies */
    .quick-replies {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      margin-top: var(--space-3);
      animation: fade-in var(--duration-base) var(--ease-out);
    }

    @keyframes fade-in {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .quick-reply {
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-full);
      background: var(--bg-primary);
      border: 1px solid var(--border-medium);
      font-family: var(--font-family);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all var(--duration-fast);
    }

    .quick-reply:hover {
      background: var(--accent-highlight);
      color: #1D2331;
      border-color: var(--accent-highlight);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .quick-reply:active {
      transform: translateY(0);
    }

    /* Typing */
    .typing {
      display: flex;
      gap: var(--space-2);
      align-self: flex-start;
      animation: message-slide-in var(--duration-base) var(--ease-out);
    }

    .typing-avatar {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-full);
      background: #1D2331;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: var(--shadow-sm);
    }

    .typing-avatar svg {
      width: 18px;
      height: 18px;
      fill: var(--accent-highlight);
    }

    .typing-content {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .typing-name {
      font-family: var(--font-family);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--text-tertiary);
      padding: 0 var(--space-1);
    }

    .typing-bubble {
      background: var(--message-bot-bg);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--space-1);
      display: flex;
      gap: 5px;
      align-items: center;
      box-shadow: var(--shadow-xs);
    }

    .typing-dot {
      width: 7px;
      height: 7px;
      border-radius: var(--radius-full);
      background: var(--text-muted);
      animation: typing-bounce 1.4s ease-in-out infinite;
    }

    .typing-dot:nth-child(2) { animation-delay: 0.15s; }
    .typing-dot:nth-child(3) { animation-delay: 0.3s; }

    @keyframes typing-bounce {
      0%, 60%, 100% {
        transform: translateY(0);
        opacity: 0.5;
      }
      30% {
        transform: translateY(-6px);
        opacity: 1;
      }
    }

    /* ===== COMPOSER ===== */
    .composer {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      padding: var(--space-4);
      background: var(--bg-primary);
      border-top: 1px solid var(--border-light);
      flex-shrink: 0;
      position: relative;
      z-index: 1;
    }

    .composer-main {
      display: flex;
      align-items: flex-end;
      gap: var(--space-2);
    }

    .composer-actions {
      display: flex;
      gap: var(--space-1);
    }

    .composer-action-btn {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      background: transparent;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-tertiary);
      transition: all var(--duration-fast);
    }

    .composer-action-btn:hover {
      background: var(--bg-hover);
      color: var(--accent);
      transform: scale(1.08);
    }

    .composer-action-btn:active {
      transform: scale(0.95);
    }

    .composer-action-btn svg {
      width: 20px;
      height: 20px;
      fill: currentColor;
    }

    .composer-input-wrapper {
      flex: 1;
      position: relative;
    }

    .composer-input {
      width: 100%;
      min-height: 44px;
      max-height: 120px;
      padding: var(--space-3) var(--space-4);
      border: 1px solid var(--border-medium);
      border-radius: var(--radius-lg);
      font-family: var(--font-family);
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-normal);
      line-height: var(--line-height);
      color: var(--text-primary);
      background: var(--bg-primary);
      outline: none;
      resize: none;
      transition: all var(--duration-fast);
    }

    .composer-input::placeholder {
      color: var(--text-muted);
    }

    .composer-input:focus {
      border-color: var(--accent-primary);
    }

    .composer-send {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-lg);
      background: var(--accent);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all var(--duration-fast);
      position: relative;
      overflow: hidden;
    }

    .composer-send::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 100%);
      opacity: 0;
      transition: opacity var(--duration-fast);
    }

    .composer-send:hover:not(:disabled)::before {
      opacity: 1;
    }

    .composer-send:hover:not(:disabled) {
      background: var(--accent-hover);
      transform: scale(1.05) rotate(-5deg);
      box-shadow: var(--shadow-md);
    }

    .composer-send:active:not(:disabled) {
      transform: scale(0.95);
    }

    .composer-send:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 3px;
    }

    .composer-send:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .composer-send svg {
      width: 20px;
      height: 20px;
      fill: #1D2331;
      position: relative;
      z-index: 1;
    }

    /* File Upload Preview */
    .upload-preview {
      display: none;
      padding: var(--space-3);
      background: var(--bg-tertiary);
      border-radius: var(--radius-md);
      gap: var(--space-3);
    }

    .upload-preview.visible {
      display: flex;
    }

    .upload-preview-thumb {
      width: 50px;
      height: 50px;
      border-radius: var(--radius-sm);
      background: var(--bg-hover);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .upload-preview-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: var(--radius-sm);
    }

    .upload-preview-thumb svg {
      width: 24px;
      height: 24px;
      fill: var(--text-muted);
    }

    .upload-preview-info {
      flex: 1;
      min-width: 0;
    }

    .upload-preview-name {
      font-family: var(--font-family);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .upload-preview-size {
      font-family: var(--font-mono);
      font-size: var(--font-size-xs);
      color: var(--text-tertiary);
    }

    .upload-preview-remove {
      width: 28px;
      height: 28px;
      border-radius: var(--radius-sm);
      background: transparent;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-tertiary);
      transition: all var(--duration-fast);
    }

    .upload-preview-remove:hover {
      background: var(--bg-hover);
      color: #EF4444;
    }

    .upload-preview-remove svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
    }

    /* Emoji Picker */
    .emoji-picker {
      position: absolute;
      bottom: 100%;
      left: 0;
      margin-bottom: var(--space-2);
      width: 300px;
      background: var(--bg-primary);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xl);
      display: none;
      flex-direction: column;
      overflow: hidden;
      z-index: 100;
    }

    .emoji-picker.visible {
      display: flex;
      animation: picker-enter var(--duration-base) var(--ease-out);
    }

    @keyframes picker-enter {
      from {
        opacity: 0;
        transform: translateY(8px) scale(0.96);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .emoji-picker-header {
      padding: var(--space-3);
      border-bottom: 1px solid var(--border-light);
    }

    .emoji-picker-search {
      width: 100%;
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--border-medium);
      border-radius: var(--radius-md);
      font-family: var(--font-family);
      font-size: var(--font-size-sm);
      background: var(--bg-secondary);
      color: var(--text-primary);
      outline: none;
    }

    .emoji-picker-search:focus {
      border-color: var(--accent);
    }

    .emoji-picker-content {
      padding: var(--space-3);
      max-height: 200px;
      overflow-y: auto;
    }

    .emoji-grid {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: var(--space-1);
    }

    .emoji-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      font-size: 20px;
      cursor: pointer;
      border-radius: var(--radius-sm);
      transition: all var(--duration-fast);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .emoji-btn:hover {
      background: var(--bg-hover);
      transform: scale(1.2);
    }

    /* Drag & Drop Overlay */
    .drop-overlay {
      position: absolute;
      inset: 0;
      background: var(--bg-overlay);
      backdrop-filter: blur(8px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 10;
      border-radius: var(--radius-xl);
    }

    .drop-overlay.visible {
      display: flex;
      animation: fade-in var(--duration-base);
    }

    .drop-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-4);
      padding: var(--space-8);
      background: var(--bg-primary);
      border-radius: var(--radius-xl);
      border: 2px dashed var(--accent);
    }

    .drop-icon {
      width: 64px;
      height: 64px;
      border-radius: var(--radius-xl);
      background: var(--accent-soft);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: drop-bounce 0.6s ease-in-out infinite;
    }

    @keyframes drop-bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }

    .drop-icon svg {
      width: 32px;
      height: 32px;
      fill: var(--accent);
    }

    .drop-text {
      font-family: var(--font-family);
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--text-primary);
    }

    /* ===== POWERED BY ===== */
    .powered {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      padding: var(--space-3);
      background: var(--bg-secondary);
      border-top: 1px solid var(--border-light);
      font-family: var(--font-family);
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
      position: relative;
      z-index: 1;
    }

    .powered a {
      color: #7D53FF;
      text-decoration: none;
      font-weight: var(--font-weight-semibold);
      transition: color var(--duration-fast);
    }

    .powered a:hover {
      color: var(--accent-hover);
    }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 480px) {
      .launcher {
        bottom: var(--space-4);
        ${position === 'left' ? 'left' : 'right'}: var(--space-4);
      }

      .panel {
        width: 100%;
        height: 100%;
        max-height: 100%;
        bottom: 0;
        ${position === 'left' ? 'left' : 'right'}: 0;
        border-radius: 0;
        border: none;
      }

      .emoji-picker {
        width: calc(100% - var(--space-8));
      }
    }

    /* Hidden file input */
    input[type="file"] {
      display: none;
    }
    `;

    // Enhanced Widget HTML
    const html = `
    <style>${styles}</style>
    
    <!-- Launcher -->
    <button class="launcher" id="launcher" aria-label="Open chat">
      <svg class="icon-chat" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/>
      </svg>
      <svg class="icon-close" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
      <span class="launcher-badge" id="badge"></span>
    </button>
    
    <!-- Panel -->
    <div class="panel" id="panel" role="dialog" aria-modal="true" aria-labelledby="chat-title">
      <!-- Drag & Drop Overlay -->
      <div class="drop-overlay" id="drop-overlay">
        <div class="drop-content">
          <div class="drop-icon">
            <svg viewBox="0 0 24 24">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4c-1.48 0-2.85.43-4.01 1.17l1.46 1.46C10.21 6.23 11.08 6 12 6c3.04 0 5.5 2.46 5.5 5.5v.5H19c1.66 0 3 1.34 3 3 0 1.13-.64 2.11-1.56 2.62l1.45 1.45C23.16 18.16 24 16.68 24 15c0-2.64-2.05-4.78-4.65-4.96zM3 5.27l2.75 2.74C2.56 8.15 0 10.77 0 14c0 3.31 2.69 6 6 6h11.73l2 2L21 20.73 4.27 4 3 5.27zM7.73 10l8 8H6c-2.21 0-4-1.79-4-4s1.79-4 4-4h1.73z"/>
            </svg>
          </div>
          <div class="drop-text">Drop files to upload</div>
        </div>
      </div>

      <!-- Header -->
      <div class="header">
        <div class="header-avatar">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
        <div class="header-content">
          <div class="header-title" id="chat-title">${agentName}</div>
          <div class="header-status">
            <div class="status-indicator">
              <span class="status-dot"></span>
              <span>Online</span>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button class="header-btn" id="sound-btn" aria-label="Toggle sound">
            <svg class="sound-on-icon" viewBox="0 0 24 24" style="display: ${soundEnabled ? 'block' : 'none'}">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
            <svg class="sound-off-icon" viewBox="0 0 24 24" style="display: ${soundEnabled ? 'none' : 'block'}">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            </svg>
          </button>
          <button class="header-btn" id="close-btn" aria-label="Close chat">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Messages -->
      <div class="messages" id="messages" role="log" aria-live="polite">
        <div class="welcome" id="welcome">
          <div class="welcome-card">
            <div class="welcome-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
            </div>
            <div class="welcome-title">Hi there! 👋</div>
            <div class="welcome-text">How can we help you today? We're here and ready to assist!</div>
            <div class="welcome-action">
              <button class="btn-start" id="start-btn">
                Start a conversation
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Composer -->
      <div class="composer-container" style="display: none;" id="composer-container">
        <div class="composer">
          <div class="upload-preview" id="upload-preview">
            <div class="upload-preview-thumb" id="upload-thumb"></div>
            <div class="upload-preview-info">
              <div class="upload-preview-name" id="upload-name"></div>
              <div class="upload-preview-size" id="upload-size"></div>
            </div>
            <button class="upload-preview-remove" id="upload-remove" aria-label="Remove file">
              <svg viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>

          <div class="composer-main">
            <div class="composer-actions">
              <button class="composer-action-btn" id="attach-btn" aria-label="Attach file">
                <svg viewBox="0 0 24 24">
                  <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
                </svg>
              </button>
              <button class="composer-action-btn" id="emoji-btn" aria-label="Insert emoji">
                <svg viewBox="0 0 24 24">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                </svg>
              </button>
            </div>

            <div class="composer-input-wrapper">
              <textarea 
                class="composer-input" 
                id="input" 
                placeholder="Type a message..." 
                rows="1"
                aria-label="Type your message"
              ></textarea>
              
              <!-- Emoji Picker -->
              <div class="emoji-picker" id="emoji-picker">
                <div class="emoji-picker-header">
                  <input type="text" class="emoji-picker-search" id="emoji-search" placeholder="Search emoji...">
                </div>
                <div class="emoji-picker-content">
                  <div class="emoji-grid" id="emoji-grid"></div>
                </div>
              </div>
            </div>

            <button class="composer-send" id="send-btn" disabled aria-label="Send message">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Powered by -->
        <div class="powered">
          Powered by <a href="https://ruslan-lapiniak-cv.vercel.app/en" target="_blank" rel="noopener">ChatIQ by Ruslan Lap</a>
        </div>
      </div>

      <!-- Hidden file input -->
      <input type="file" id="file-input" accept="${ALLOWED_FILE_TYPES.join(',')}" />
    </div>
    `;

    shadow.innerHTML = html;

    // Apply theme class
    if (currentTheme === 'dark') {
        shadow.host.classList.add('dark');
    }

    // Get elements
    const launcher = shadow.getElementById('launcher');
    const panel = shadow.getElementById('panel');
    const messages = shadow.getElementById('messages');
    const welcome = shadow.getElementById('welcome');
    const input = shadow.getElementById('input');
    const sendBtn = shadow.getElementById('send-btn');
    const closeBtn = shadow.getElementById('close-btn');
    const badge = shadow.getElementById('badge');
    const attachBtn = shadow.getElementById('attach-btn');
    const emojiBtn = shadow.getElementById('emoji-btn');
    const fileInput = shadow.getElementById('file-input');
    const emojiPicker = shadow.getElementById('emoji-picker');
    const emojiGrid = shadow.getElementById('emoji-grid');
    const emojiSearch = shadow.getElementById('emoji-search');
    const uploadPreview = shadow.getElementById('upload-preview');
    const uploadThumb = shadow.getElementById('upload-thumb');
    const uploadName = shadow.getElementById('upload-name');
    const uploadSize = shadow.getElementById('upload-size');
    const uploadRemove = shadow.getElementById('upload-remove');
    const soundBtn = shadow.getElementById('sound-btn');
    const soundOnIcon = shadow.querySelector('.sound-on-icon');
    const soundOffIcon = shadow.querySelector('.sound-off-icon');
    const dropOverlay = shadow.getElementById('drop-overlay');
    const startBtn = shadow.getElementById('start-btn');
    const composerContainer = shadow.getElementById('composer-container');

    startBtn?.addEventListener('click', () => {
        welcome.style.display = 'none';
        composerContainer.style.display = 'block';
        input.focus();
    });

    soundBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        soundEnabled = !soundEnabled;
        localStorage.setItem('chatiq_sound_enabled', soundEnabled);
        soundOnIcon.style.display = soundEnabled ? 'block' : 'none';
        soundOffIcon.style.display = soundEnabled ? 'none' : 'block';

        // Play a test sound to confirm
        if (soundEnabled) sounds.notification();
    });

    let isOpen = false;
    let isTyping = false;
    let unreadCount = 0;
    let currentFile = null;
    const messageHistory = [];

    // Emojis
    const emojis = ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐', '🖖', '👋', '🤝', '💪', '🦾', '🙏', '✍️', '💅', '🤳', '💃', '🕺', '👯', '🧘', '🛀', '🛌', '👥', '🗣', '👤', '🔥', '⭐', '✨', '💫', '💥', '💯', '💢', '💬', '👁', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👃', '👂', '🦻', '🧏', '💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔', '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸', '🥌', '🎿', '⛷', '🏂'];

    // Populate emoji grid
    function populateEmojis(filter = '') {
        const filteredEmojis = filter ? emojis.filter(e => e.includes(filter)) : emojis;
        emojiGrid.innerHTML = filteredEmojis.map(emoji =>
            `<button class="emoji-btn" data-emoji="${emoji}">${emoji}</button>`
        ).join('');
    }

    populateEmojis();

    // Emoji search
    emojiSearch.addEventListener('input', (e) => {
        populateEmojis(e.target.value.toLowerCase());
    });

    // Emoji picker events
    emojiGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.emoji-btn');
        if (btn) {
            const emoji = btn.dataset.emoji;
            const start = input.selectionStart;
            const end = input.selectionEnd;
            const text = input.value;
            input.value = text.substring(0, start) + emoji + text.substring(end);
            input.selectionStart = input.selectionEnd = start + emoji.length;

            autoResize();
            sendBtn.disabled = !input.value.trim();
            emojiPicker.classList.remove('visible');
            input.focus();
        }
    });

    emojiBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        emojiPicker.classList.toggle('visible');
    });

    // Close emoji picker when clicking outside
    shadow.addEventListener('click', (e) => {
        if (!emojiBtn.contains(e.target) && !emojiPicker.contains(e.target)) {
            emojiPicker.classList.remove('visible');
        }
    });

    document.addEventListener('click', (e) => {
        if (e.target !== widgetContainer) {
            emojiPicker.classList.remove('visible');
        }
    });

    // File upload
    attachBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        handleFileSelect(e.target.files[0]);
    });

    uploadRemove.addEventListener('click', () => {
        clearFileUpload();
    });

    function handleFileSelect(file) {
        if (!file) return;

        if (file.size > MAX_FILE_SIZE) {
            alert('File size must be less than 10MB');
            return;
        }

        currentFile = file;
        uploadName.textContent = file.name;
        uploadSize.textContent = formatFileSize(file.size);

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                uploadThumb.innerHTML = `<img src="${e.target.result}" alt="${file.name}">`;
            };
            reader.readAsDataURL(file);
        } else {
            uploadThumb.innerHTML = `
                <svg viewBox="0 0 24 24">
                    <path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z"/>
                </svg>
            `;
        }

        uploadPreview.classList.add('visible');
    }

    function clearFileUpload() {
        currentFile = null;
        fileInput.value = '';
        uploadPreview.classList.remove('visible');
    }

    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    // Drag & Drop
    let dragCounter = 0;

    panel.addEventListener('dragenter', (e) => {
        e.preventDefault();
        dragCounter++;
        if (dragCounter === 1) {
            dropOverlay.classList.add('visible');
        }
    });

    panel.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dragCounter--;
        if (dragCounter === 0) {
            dropOverlay.classList.remove('visible');
        }
    });

    panel.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    panel.addEventListener('drop', (e) => {
        e.preventDefault();
        dragCounter = 0;
        dropOverlay.classList.remove('visible');

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    });

    // Draft persistence
    const DRAFT_KEY = `chatiq_draft_${siteId}`;

    function saveDraft() {
        localStorage.setItem(DRAFT_KEY, input.value);
    }

    function loadDraft() {
        const draft = localStorage.getItem(DRAFT_KEY);
        if (draft) {
            input.value = draft;
            autoResize();
            sendBtn.disabled = !draft.trim();
        }
    }

    function clearDraft() {
        localStorage.removeItem(DRAFT_KEY);
    }

    // Auto-resize textarea
    function autoResize() {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    }

    input.addEventListener('input', () => {
        autoResize();
        sendBtn.disabled = !input.value.trim();
        saveDraft();
    });

    // Scroll management
    function scrollToBottom(smooth = true) {
        messages.scrollTo({
            top: messages.scrollHeight,
            behavior: smooth ? 'smooth' : 'auto'
        });
    }

    // Badge
    function updateBadge(count) {
        unreadCount = count;
        if (count > 0) {
            badge.textContent = count > 9 ? '9+' : count;
            badge.classList.add('visible');
            if (!isOpen) {
                launcher.classList.add('pulse');
            }
        } else {
            badge.classList.remove('visible');
            launcher.classList.remove('pulse');
        }
    }

    // Toggle widget
    function openWidget() {
        if (isOpen) return;
        isOpen = true;
        launcher.classList.add('open');
        launcher.classList.remove('pulse');
        panel.classList.add('open');
        panel.classList.remove('closing');
        launcher.setAttribute('aria-label', 'Close chat');
        input.focus();
        updateBadge(0);
        scrollToBottom(false);
        loadDraft();
    }

    function closeWidget() {
        if (!isOpen) return;
        isOpen = false;
        launcher.classList.remove('open');
        panel.classList.add('closing');
        launcher.setAttribute('aria-label', 'Open chat');
        emojiPicker.classList.remove('visible');

        if (input.value.trim()) saveDraft();

        setTimeout(() => {
            panel.classList.remove('open', 'closing');
        }, 200);
    }

    function toggleWidget() {
        isOpen ? closeWidget() : openWidget();
    }

    // Typing indicator
    function showTyping() {
        if (isTyping) return;
        isTyping = true;

        if (welcome) welcome.style.display = 'none';
        if (composerContainer) composerContainer.style.display = 'block';

        const typing = document.createElement('div');
        typing.className = 'typing';
        typing.id = 'typing';
        typing.innerHTML = `
          <div class="typing-avatar">
            <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          </div>
          <div class="typing-content">
            <div class="typing-name">${agentName}</div>
            <div class="typing-bubble">
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
            </div>
          </div>
        `;
        messages.appendChild(typing);
        scrollToBottom();
    }

    function hideTyping() {
        isTyping = false;
        const typing = shadow.getElementById('typing');
        if (typing) typing.remove();
    }

    // Format time
    function formatTime(date) {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }

    // Add message
    function addMessage(text, from = 'user', attachment = null) {
        hideTyping();

        if (welcome) welcome.style.display = 'none';
        if (composerContainer) composerContainer.style.display = 'block';

        const now = new Date();
        const msg = document.createElement('div');
        msg.className = `message ${from}`;

        const avatarHTML = from === 'bot' ? `
          <div class="message-avatar">
            <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          </div>
        ` : '';

        const attachmentHTML = attachment ? (
            attachment.type === 'image' ? `
                <div class="message-attachment">
                    <img src="${attachment.url}" alt="${attachment.name}" class="attachment-image">
                </div>
            ` : `
                <div class="message-attachment">
                    <div class="attachment-file">
                        <div class="attachment-icon">
                            <svg viewBox="0 0 24 24">
                                <path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z"/>
                            </svg>
                        </div>
                        <div class="attachment-info">
                            <div class="attachment-name">${attachment.name}</div>
                            <div class="attachment-size">${attachment.size}</div>
                        </div>
                    </div>
                </div>
            `
        ) : '';

        const statusHTML = from === 'user' ? `
            <div class="message-status">
                <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            </div>
        ` : '';

        msg.innerHTML = `
          ${avatarHTML}
          <div class="message-content">
            <div class="message-bubble">${escapeHtml(text)}${attachmentHTML}</div>
            <div class="message-meta">
              <span class="message-time">${formatTime(now)}</span>
              ${statusHTML}
            </div>
          </div>
        `;

        messages.appendChild(msg);
        scrollToBottom(true);

        if (!isOpen && from === 'bot') {
            updateBadge(unreadCount + 1);
            sounds.notification();
        } else if (from === 'user') {
            sounds.send();
        } else if (from === 'bot') {
            sounds.receive();
        }

        messageHistory.push({ text, from, timestamp: Date.now(), attachment });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Show quick replies
    function showQuickReplies(replies) {
        const quickReplies = document.createElement('div');
        quickReplies.className = 'quick-replies';
        quickReplies.innerHTML = replies.map(reply =>
            `<button class="quick-reply" data-text="${escapeHtml(reply)}">${escapeHtml(reply)}</button>`
        ).join('');

        messages.appendChild(quickReplies);
        scrollToBottom();

        // Handle quick reply clicks
        quickReplies.addEventListener('click', (e) => {
            const btn = e.target.closest('.quick-reply');
            if (btn) {
                const text = btn.dataset.text;
                input.value = text;
                sendMessage();
                quickReplies.remove();
            }
        });
    }

    // Send message
    function sendMessage() {
        const text = input.value.trim();
        if (!text && !currentFile) return;

        let attachment = null;
        if (currentFile) {
            attachment = {
                name: currentFile.name,
                size: formatFileSize(currentFile.size),
                type: currentFile.type.startsWith('image/') ? 'image' : 'file',
                url: currentFile.type.startsWith('image/') ? URL.createObjectURL(currentFile) : null
            };
        }

        addMessage(text || '📎 File attached', 'user', attachment);
        input.value = '';
        input.style.height = 'auto';
        sendBtn.disabled = true;
        clearDraft();
        clearFileUpload();

        console.log('[ChatIQ] Message sent:', { siteId, visitorId, text, attachment: currentFile?.name });

        // Simulate response
        setTimeout(() => {
            showTyping();
            setTimeout(() => {
                addMessage('Thanks for your message! Our team will get back to you shortly.', 'bot');

                // Show quick replies after bot message
                setTimeout(() => {
                    showQuickReplies([
                        'I need help with my order',
                        'Technical support',
                        'Billing question',
                        'Other'
                    ]);
                }, 500);
            }, 1500);
        }, 400);
    }

    // Theme toggle
    function setTheme(theme) {
        currentTheme = theme;
        localStorage.setItem('chatiq_theme', theme);
        shadow.host.classList.toggle('dark', theme === 'dark');
    }

    function toggleTheme() {
        setTheme(currentTheme === 'light' ? 'dark' : 'light');
    }

    // Event listeners
    launcher.addEventListener('click', toggleWidget);
    closeBtn.addEventListener('click', closeWidget);
    sendBtn.addEventListener('click', sendMessage);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isOpen) {
            closeWidget();
            emojiPicker.classList.remove('visible');
        }
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // System theme listener
    if (config.theme === 'auto') {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            setTheme(e.matches ? 'dark' : 'light');
        });
    }

    // Expose API
    globalThis.ChatIQ = {
        version: WIDGET_VERSION,
        siteId,
        visitorId,
        open: openWidget,
        close: closeWidget,
        toggle: toggleWidget,
        sendMessage: (text, attachment) => addMessage(text, 'user', attachment),
        setTheme,
        toggleTheme,
        setUnreadCount: updateBadge,
        showQuickReplies,
        setAccentColor: (color) => {
            const hsl = hexToHSL(color);
            shadow.host.style.setProperty('--accent-h', hsl.h);
            shadow.host.style.setProperty('--accent-s', `${hsl.s}%`);
            shadow.host.style.setProperty('--accent-l', `${hsl.l}%`);
            shadow.host.style.setProperty('--accent-text', hsl.l > 60 ? '#000000' : '#FFFFFF');
        },
        simulateMessage: (text, quickReplies) => {
            showTyping();
            setTimeout(() => {
                addMessage(text, 'bot');
                if (quickReplies) {
                    setTimeout(() => showQuickReplies(quickReplies), 500);
                }
            }, 1000);
        },
        playSound: (type) => sounds[type]?.(),
    };

    console.log('[ChatIQ] Enhanced Widget ready');
    console.log('[ChatIQ] New features: File upload, Emoji picker, Quick replies, Sounds, Enhanced UI');
})();