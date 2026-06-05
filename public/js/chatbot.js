/**
 * CineBot — AI Movie Assistant (Gemini-powered)
 * Floating chat widget for CineAndhra
 */
(function () {
  'use strict';

  // ── State ──────────────────────────────────────────────────────────────────
  let isOpen = false;
  let isTyping = false;
  let chatHistory = []; // [{role, parts:[{text}]}]

  // ── Suggested prompts ──────────────────────────────────────────────────────
  const SUGGESTIONS = [
    '🎬 What movies are showing today?',
    '🍿 Recommend a movie for tonight',
    '⏱️ Any short movies under 2.5h?',
    '🎭 Which movie has the best story?',
    '🏟️ What theaters are available?',
    '💺 How do I book seats?',
  ];

  // ── Build DOM ──────────────────────────────────────────────────────────────
  function buildWidget() {
    const style = document.createElement('style');
    style.textContent = `
      /* ── CineBot Widget ── */
      #cinebot-fab {
        position: fixed;
        bottom: 28px;
        right: 28px;
        z-index: 9999;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #f5a623 0%, #ffcd6b 50%, #f5a623 100%);
        background-size: 200% 200%;
        animation: cinebot-pulse 3s ease-in-out infinite;
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 24px rgba(245,166,35,0.55), 0 0 0 0 rgba(245,166,35,0.35);
        display: flex; align-items: center; justify-content: center;
        transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
        font-size: 1.5rem;
      }
      #cinebot-fab:hover { transform: scale(1.1); }
      #cinebot-fab.open  { transform: rotate(20deg) scale(1.05); }

      @keyframes cinebot-pulse {
        0%,100% { box-shadow: 0 4px 24px rgba(245,166,35,0.55), 0 0 0 0 rgba(245,166,35,0.3); }
        50%      { box-shadow: 0 4px 32px rgba(245,166,35,0.7), 0 0 0 10px rgba(245,166,35,0); }
      }

      #cinebot-badge {
        position: absolute;
        top: -4px; right: -4px;
        width: 18px; height: 18px;
        background: #e50914;
        border-radius: 50%;
        border: 2px solid #04080f;
        display: flex; align-items: center; justify-content: center;
        font-size: 0.55rem;
        font-weight: 900;
        color: #fff;
        font-family: 'Outfit', sans-serif;
      }

      #cinebot-window {
        position: fixed;
        bottom: 102px;
        right: 28px;
        z-index: 9998;
        width: 380px;
        max-height: 580px;
        display: flex;
        flex-direction: column;
        background: #090f1c;
        border: 1px solid rgba(245,166,35,0.25);
        border-radius: 20px;
        box-shadow: 0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(245,166,35,0.08), 0 0 60px rgba(245,166,35,0.08);
        overflow: hidden;
        transform-origin: bottom right;
        transform: scale(0.85) translateY(20px);
        opacity: 0;
        pointer-events: none;
        transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.22s ease;
        font-family: 'Outfit', 'Inter', system-ui, sans-serif;
      }
      #cinebot-window.visible {
        transform: scale(1) translateY(0);
        opacity: 1;
        pointer-events: all;
      }

      /* Header */
      #cinebot-header {
        background: linear-gradient(135deg, #0d1626 0%, #111e33 100%);
        border-bottom: 1px solid rgba(245,166,35,0.15);
        padding: 14px 18px;
        display: flex;
        align-items: center;
        gap: 12px;
        flex-shrink: 0;
      }
      .cinebot-avatar {
        width: 38px; height: 38px;
        border-radius: 50%;
        background: linear-gradient(135deg, #f5a623, #ffcd6b);
        display: flex; align-items: center; justify-content: center;
        font-size: 1.1rem;
        flex-shrink: 0;
        box-shadow: 0 0 14px rgba(245,166,35,0.4);
      }
      .cinebot-info { flex: 1; min-width: 0; }
      .cinebot-name {
        font-weight: 800;
        font-size: 0.92rem;
        color: #eef2ff;
        letter-spacing: -0.01em;
      }
      .cinebot-status {
        font-size: 0.7rem;
        color: #5ee9a8;
        display: flex; align-items: center; gap: 4px;
        font-weight: 500;
      }
      .cinebot-status::before {
        content: '';
        width: 6px; height: 6px;
        border-radius: 50%;
        background: #5ee9a8;
        box-shadow: 0 0 6px #5ee9a8;
        animation: cinebot-blink 2s ease-in-out infinite;
      }
      @keyframes cinebot-blink { 0%,100%{opacity:1} 50%{opacity:0.4} }

      #cinebot-close-btn {
        background: none;
        border: none;
        color: #525f78;
        cursor: pointer;
        font-size: 1.1rem;
        padding: 4px;
        border-radius: 6px;
        transition: color 0.15s, background 0.15s;
        display: flex; align-items: center; justify-content: center;
        line-height: 1;
      }
      #cinebot-close-btn:hover { color: #eef2ff; background: rgba(255,255,255,0.07); }

      /* Messages */
      #cinebot-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        scroll-behavior: smooth;
      }
      #cinebot-messages::-webkit-scrollbar { width: 4px; }
      #cinebot-messages::-webkit-scrollbar-track { background: transparent; }
      #cinebot-messages::-webkit-scrollbar-thumb { background: #1b2640; border-radius: 99px; }

      .cinebot-msg {
        display: flex;
        gap: 8px;
        align-items: flex-end;
        animation: cinebot-fadein 0.25s ease;
      }
      @keyframes cinebot-fadein { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

      .cinebot-msg.user { flex-direction: row-reverse; }

      .cinebot-bubble {
        max-width: 80%;
        padding: 10px 14px;
        border-radius: 16px;
        font-size: 0.865rem;
        line-height: 1.55;
        word-break: break-word;
        white-space: pre-wrap;
      }
      .cinebot-msg.bot .cinebot-bubble {
        background: #0d1626;
        border: 1px solid #1b2640;
        color: #d4dff5;
        border-bottom-left-radius: 4px;
      }
      .cinebot-msg.user .cinebot-bubble {
        background: linear-gradient(135deg, #f5a623 0%, #ffcd6b 100%);
        color: #000;
        font-weight: 600;
        border-bottom-right-radius: 4px;
      }
      .cinebot-msg-avatar {
        width: 24px; height: 24px;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 0.7rem;
        flex-shrink: 0;
        margin-bottom: 2px;
      }
      .cinebot-msg.bot .cinebot-msg-avatar {
        background: linear-gradient(135deg,#f5a623,#ffcd6b);
      }
      .cinebot-msg.user .cinebot-msg-avatar {
        background: #1b2640;
        color: #8b9ab8;
      }

      /* Typing indicator */
      .cinebot-typing .cinebot-bubble {
        background: #0d1626;
        border: 1px solid #1b2640;
        padding: 12px 16px;
        display: flex; align-items: center; gap: 5px;
      }
      .cinebot-dot {
        width: 7px; height: 7px;
        border-radius: 50%;
        background: #f5a623;
        animation: cinebot-bounce 1.2s ease-in-out infinite;
      }
      .cinebot-dot:nth-child(2) { animation-delay: 0.2s; }
      .cinebot-dot:nth-child(3) { animation-delay: 0.4s; }
      @keyframes cinebot-bounce {
        0%,60%,100% { transform: translateY(0); opacity:0.4; }
        30% { transform: translateY(-6px); opacity:1; }
      }

      /* Suggestions */
      #cinebot-suggestions {
        padding: 0 16px 10px;
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        flex-shrink: 0;
      }
      .cinebot-chip {
        padding: 5px 11px;
        border-radius: 99px;
        border: 1px solid rgba(245,166,35,0.25);
        background: rgba(245,166,35,0.06);
        color: #c8a84b;
        font-size: 0.72rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.18s;
        white-space: nowrap;
        font-family: inherit;
      }
      .cinebot-chip:hover {
        background: rgba(245,166,35,0.14);
        border-color: rgba(245,166,35,0.5);
        color: #f5a623;
        transform: translateY(-1px);
      }

      /* Input */
      #cinebot-input-row {
        border-top: 1px solid rgba(245,166,35,0.1);
        background: #060c18;
        padding: 12px 14px;
        display: flex;
        gap: 10px;
        align-items: flex-end;
        flex-shrink: 0;
      }
      #cinebot-input {
        flex: 1;
        background: #0d1626;
        border: 1px solid #1b2640;
        border-radius: 12px;
        padding: 9px 14px;
        color: #eef2ff;
        font-size: 0.875rem;
        font-family: inherit;
        resize: none;
        outline: none;
        min-height: 40px;
        max-height: 110px;
        line-height: 1.5;
        transition: border-color 0.18s, box-shadow 0.18s;
        overflow-y: auto;
      }
      #cinebot-input::placeholder { color: #3a4a63; }
      #cinebot-input:focus {
        border-color: rgba(245,166,35,0.4);
        box-shadow: 0 0 0 3px rgba(245,166,35,0.08);
      }
      #cinebot-send {
        width: 40px; height: 40px;
        border-radius: 50%;
        border: none;
        background: linear-gradient(135deg,#f5a623,#ffcd6b);
        color: #000;
        font-size: 1rem;
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 3px 12px rgba(245,166,35,0.4);
        transition: transform 0.18s, box-shadow 0.18s, opacity 0.18s;
        flex-shrink: 0;
      }
      #cinebot-send:hover { transform: scale(1.08); box-shadow: 0 5px 18px rgba(245,166,35,0.55); }
      #cinebot-send:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

      /* Powered by */
      .cinebot-powered {
        text-align: center;
        font-size: 0.62rem;
        color: #2a3850;
        padding: 6px 0 4px;
        letter-spacing: 0.04em;
        font-weight: 500;
        flex-shrink: 0;
      }

      /* Welcome card */
      .cinebot-welcome {
        background: linear-gradient(135deg, rgba(245,166,35,0.08) 0%, rgba(245,166,35,0.03) 100%);
        border: 1px solid rgba(245,166,35,0.18);
        border-radius: 14px;
        padding: 14px;
        text-align: center;
        margin-bottom: 4px;
      }
      .cinebot-welcome-icon { font-size: 2rem; margin-bottom: 6px; }
      .cinebot-welcome-title {
        font-weight: 800;
        font-size: 0.92rem;
        color: #f5a623;
        margin-bottom: 4px;
        letter-spacing: -0.01em;
      }
      .cinebot-welcome-text {
        font-size: 0.77rem;
        color: #8b9ab8;
        line-height: 1.5;
      }

      /* Mobile */
      @media (max-width: 480px) {
        #cinebot-window {
          right: 12px; left: 12px;
          width: auto;
          bottom: 90px;
          max-height: calc(100dvh - 110px);
        }
        #cinebot-fab { bottom: 20px; right: 20px; }
      }
    `;
    document.head.appendChild(style);

    // FAB button
    const fab = document.createElement('button');
    fab.id = 'cinebot-fab';
    fab.setAttribute('aria-label', 'Open CineBot AI Assistant');
    fab.innerHTML = '<span id="cinebot-badge" title="AI">AI</span>🎬';
    document.body.appendChild(fab);

    // Chat window
    const win = document.createElement('div');
    win.id = 'cinebot-window';
    win.setAttribute('role', 'dialog');
    win.setAttribute('aria-label', 'CineBot AI Movie Assistant');
    win.innerHTML = `
      <div id="cinebot-header">
        <div class="cinebot-avatar">🎬</div>
        <div class="cinebot-info">
          <div class="cinebot-name">CineBot AI</div>
          <div class="cinebot-status">Online · Telugu Movies Expert</div>
        </div>
        <button id="cinebot-close-btn" aria-label="Close chat">✕</button>
      </div>

      <div id="cinebot-messages">
        <div class="cinebot-welcome">
          <div class="cinebot-welcome-icon">🎥</div>
          <div class="cinebot-welcome-title">Hey there! I'm CineBot</div>
          <div class="cinebot-welcome-text">Your AI-powered Guide to Telugu cinema.<br/>Ask me anything — movies, shows, seats, or recommendations!</div>
        </div>
      </div>

      <div id="cinebot-suggestions"></div>

      <div id="cinebot-input-row">
        <textarea
          id="cinebot-input"
          rows="1"
          placeholder="Ask about movies, shows, prices…"
          aria-label="Chat input"
        ></textarea>
        <button id="cinebot-send" aria-label="Send message">➤</button>
      </div>
      <div class="cinebot-powered">✦ Powered by Google Gemini AI</div>
    `;
    document.body.appendChild(win);

    // Render suggestion chips
    renderSuggestions();

    // ── Events ──────────────────────────────────────────────────────────────
    fab.addEventListener('click', toggleChat);
    document.getElementById('cinebot-close-btn').addEventListener('click', closeChat);
    document.getElementById('cinebot-send').addEventListener('click', sendMessage);

    const input = document.getElementById('cinebot-input');
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 110) + 'px';
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (isOpen && !win.contains(e.target) && e.target !== fab) {
        closeChat();
      }
    });
  }

  // ── Suggestions ──────────────────────────────────────────────────────────
  function renderSuggestions(prompts = SUGGESTIONS.slice(0, 4)) {
    const container = document.getElementById('cinebot-suggestions');
    if (!container) return;
    container.innerHTML = prompts.map(p =>
      `<button class="cinebot-chip" data-prompt="${p.replace(/"/g, '&quot;')}">${p}</button>`
    ).join('');
    container.querySelectorAll('.cinebot-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const prompt = chip.getAttribute('data-prompt');
        sendMessage(prompt);
      });
    });
  }

  // ── Toggle ────────────────────────────────────────────────────────────────
  function toggleChat() {
    isOpen ? closeChat() : openChat();
  }
  function openChat() {
    isOpen = true;
    document.getElementById('cinebot-window').classList.add('visible');
    document.getElementById('cinebot-fab').classList.add('open');
    document.getElementById('cinebot-badge').style.display = 'none';
    setTimeout(() => document.getElementById('cinebot-input')?.focus(), 300);
    scrollToBottom();
  }
  function closeChat() {
    isOpen = false;
    document.getElementById('cinebot-window').classList.remove('visible');
    document.getElementById('cinebot-fab').classList.remove('open');
  }

  // ── Messages ──────────────────────────────────────────────────────────────
  function appendMessage(role, text) {
    const container = document.getElementById('cinebot-messages');
    const isBot = role === 'bot';
    const div = document.createElement('div');
    div.className = `cinebot-msg ${role}`;
    div.innerHTML = `
      <div class="cinebot-msg-avatar">${isBot ? '🎬' : '👤'}</div>
      <div class="cinebot-bubble">${escapeHtml(text)}</div>
    `;
    container.appendChild(div);
    scrollToBottom();
    return div;
  }

  function showTypingIndicator() {
    const container = document.getElementById('cinebot-messages');
    const div = document.createElement('div');
    div.className = 'cinebot-msg bot cinebot-typing';
    div.id = 'cinebot-typing-indicator';
    div.innerHTML = `
      <div class="cinebot-msg-avatar">🎬</div>
      <div class="cinebot-bubble">
        <span class="cinebot-dot"></span>
        <span class="cinebot-dot"></span>
        <span class="cinebot-dot"></span>
      </div>
    `;
    container.appendChild(div);
    scrollToBottom();
  }

  function removeTypingIndicator() {
    document.getElementById('cinebot-typing-indicator')?.remove();
  }

  function scrollToBottom() {
    const container = document.getElementById('cinebot-messages');
    if (container) container.scrollTop = container.scrollHeight;
  }

  function setInputDisabled(val) {
    const input = document.getElementById('cinebot-input');
    const send = document.getElementById('cinebot-send');
    if (input) input.disabled = val;
    if (send) send.disabled = val;
  }

  // ── Send ──────────────────────────────────────────────────────────────────
  async function sendMessage(text) {
    const input = document.getElementById('cinebot-input');
    const message = (text || input?.value || '').trim();
    if (!message || isTyping) return;

    if (!text && input) {
      input.value = '';
      input.style.height = 'auto';
    }

    // Hide suggestions after first message
    document.getElementById('cinebot-suggestions').innerHTML = '';

    appendMessage('user', message);

    // Build history entry
    chatHistory.push({ role: 'user', parts: [{ text: message }] });

    isTyping = true;
    setInputDisabled(true);
    showTypingIndicator();

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: chatHistory.slice(0, -1), // exclude current message (sent separately)
        }),
      });

      const data = await res.json();
      removeTypingIndicator();

      const reply = data.reply || data.error || 'Sorry, I could not get a response.';
      appendMessage('bot', reply);

      if (data.reply) {
        chatHistory.push({ role: 'model', parts: [{ text: reply }] });
      } else {
        // pop the failed user message from history
        chatHistory.pop();
      }

      // Show contextual quick-replies after bot responds
      showQuickReplies(message, reply);

    } catch (err) {
      removeTypingIndicator();
      appendMessage('bot', '⚠️ Network error. Please check your connection and try again.');
      chatHistory.pop();
    } finally {
      isTyping = false;
      setInputDisabled(false);
      document.getElementById('cinebot-input')?.focus();
    }
  }

  function showQuickReplies(userMsg, botReply) {
    const container = document.getElementById('cinebot-suggestions');
    const lower = userMsg.toLowerCase();
    let followups = [];

    if (lower.includes('recommend') || lower.includes('suggest')) {
      followups = ['🎭 Tell me more about this movie', '🏟️ Where can I watch it?', '💺 How do I book?'];
    } else if (lower.includes('book') || lower.includes('seat')) {
      followups = ['📋 Show all movies', '⏱️ What are today\'s showtimes?', '💰 What are ticket prices?'];
    } else if (lower.includes('price') || lower.includes('ticket') || lower.includes('cost')) {
      followups = ['📍 Where are the theaters?', '🎬 Which movie should I watch?', '💺 How do I pick seats?'];
    } else {
      followups = ['🎬 Recommend a movie', '📋 Show all showtimes', '💺 How to book tickets'];
    }

    container.innerHTML = followups.map(p =>
      `<button class="cinebot-chip" data-prompt="${p.replace(/"/g, '&quot;')}">${p}</button>`
    ).join('');
    container.querySelectorAll('.cinebot-chip').forEach(chip => {
      chip.addEventListener('click', () => sendMessage(chip.getAttribute('data-prompt')));
    });
  }

  // ── Utils ──────────────────────────────────────────────────────────────────
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/\n/g, '<br>');
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildWidget);
  } else {
    buildWidget();
  }
})();
