/* pages/messages.js */

const MessagesPage = (() => {
  let _activeUsername = '';
  let _pollTimer = null;

  const stopPolling = () => {
    if (_pollTimer) {
      clearInterval(_pollTimer);
      _pollTimer = null;
    }
  };

  const render = async (username = '') => {
    if (!Auth.isLoggedIn()) {
      Router.navigate('/login', true);
      return;
    }

    stopPolling();
    _activeUsername = (username || '').toLowerCase();

    const content = document.getElementById('content-area');
    content.innerHTML = `
      <div class="section-header">
        <span class="section-title">Messages</span>
        <button class="btn-icon" id="refresh-threads-btn" title="Refresh">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
        </button>
      </div>

      <div class="messages-layout">
        <aside class="messages-sidebar">
          <div class="messages-sidebar-head">Your followers</div>
          <div id="threads-list" class="threads-list"></div>
        </aside>

        <section class="messages-chat">
          <div id="chat-head" class="chat-head"></div>
          <div id="chat-body" class="chat-body"></div>
          <div id="chat-footer" class="chat-footer"></div>
        </section>
      </div>
    `;

    document.getElementById('refresh-threads-btn')?.addEventListener('click', () => {
      loadThreads({ force: true });
      if (_activeUsername) loadConversation(_activeUsername, { scroll: false });
    });

    await loadThreads({ force: true });
    if (_activeUsername) await loadConversation(_activeUsername);
    else renderEmptyChat();

    _pollTimer = setInterval(() => {
      loadThreads({ force: false });
      if (_activeUsername) loadConversation(_activeUsername, { silent: true, scroll: false });
    }, 10_000);
  };

  const renderEmptyChat = () => {
    const head = document.getElementById('chat-head');
    const body = document.getElementById('chat-body');
    const footer = document.getElementById('chat-footer');
    if (head) head.innerHTML = '<div class="chat-title">Select a follower</div>';
    if (body) body.innerHTML = `<div class="empty-state" style="margin-top:60px"><div class="empty-icon">💬</div><div class="empty-title">No chat selected</div><div class="empty-desc">Choose a follower on the left to start messaging.</div></div>`;
    if (footer) footer.innerHTML = '';
  };

  const loadThreads = async ({ force } = {}) => {
    const listEl = document.getElementById('threads-list');
    if (!listEl) return;
    if (force) listEl.innerHTML = '<div class="page-loading" style="padding:20px 0"><div class="spinner"></div></div>';

    try {
      const { threads } = await API.messages.threads();

      if (!threads.length) {
        listEl.innerHTML = `
          <div class="empty-state" style="padding:28px 18px">
            <div class="empty-title">No followers yet</div>
            <div class="empty-desc">When someone follows you, they’ll show up here for messaging.</div>
            <button class="btn-secondary btn-sm" onclick="Router.navigate('/explore')">Find people</button>
          </div>
        `;
        return;
      }

      listEl.innerHTML = threads.map(t => {
        const u = t.user;
        const avatarBg = Utils.avatarColor(u.username);
        const avatarContent = u.avatar
          ? `<img src="${u.avatar}" onerror="this.remove()">`
          : Utils.initials(u.displayName || u.username);
        const last = t.lastMessage ? Utils.escapeHtml(t.lastMessage.content).slice(0, 50) : 'No messages yet';
        const active = (_activeUsername === u.username) ? 'active' : '';
        return `
          <div class="thread-item ${active}" data-username="${u.username}">
            <div class="avatar avatar-sm" style="background:${avatarBg}">${avatarContent}</div>
            <div class="thread-info">
              <div class="thread-top">
                <span class="thread-name">${Utils.escapeHtml(u.displayName || u.username)}</span>
                ${t.unreadCount ? `<span class="thread-unread">${t.unreadCount}</span>` : ''}
              </div>
              <div class="thread-last">${last}</div>
            </div>
          </div>
        `;
      }).join('');

      listEl.querySelectorAll('.thread-item').forEach(item => {
        item.addEventListener('click', () => {
          const u = item.dataset.username;
          if (!u) return;
          if (u === _activeUsername) return;
          Router.navigate(`/messages/${u}`);
        });
      });
    } catch (err) {
      if (force) listEl.innerHTML = `<div class="error-state" style="padding:18px">Failed to load threads: ${Utils.escapeHtml(err.message)}</div>`;
    }
  };

  const loadConversation = async (username, opts = {}) => {
    const head = document.getElementById('chat-head');
    const body = document.getElementById('chat-body');
    const footer = document.getElementById('chat-footer');
    if (!head || !body || !footer) return;

    if (!opts.silent) {
      head.innerHTML = '<div class="chat-title">Loading…</div>';
      body.innerHTML = '<div class="page-loading" style="padding:28px 0"><div class="spinner"></div></div>';
      footer.innerHTML = '';
    }

    try {
      const { user, messages } = await API.messages.getWith(username, { limit: 80, markRead: true });
      _activeUsername = user.username;

      const avatarBg = Utils.avatarColor(user.username);
      const avatarContent = user.avatar
        ? `<img src="${user.avatar}" onerror="this.remove()">`
        : Utils.initials(user.displayName || user.username);

      head.innerHTML = `
        <div class="chat-head-left">
          <div class="avatar avatar-sm" style="background:${avatarBg}">${avatarContent}</div>
          <div>
            <div class="chat-title">${Utils.escapeHtml(user.displayName || user.username)}</div>
            <div class="chat-sub">@${user.username}</div>
          </div>
        </div>
        <button class="btn-secondary btn-sm" id="view-profile-btn">View profile</button>
      `;
      head.querySelector('#view-profile-btn')?.addEventListener('click', () => Router.navigate(`/profile/${user.username}`));

      const meId = Auth.getUser()?._id || '';
      body.innerHTML = `
        <div class="chat-messages" id="chat-messages">
          ${messages.map(m => {
            const mine = String(m.sender) === String(meId);
            return `
              <div class="chat-bubble ${mine ? 'mine' : 'theirs'}">
                <div class="chat-text">${Utils.escapeHtml(m.content)}</div>
                <div class="chat-time">${new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            `;
          }).join('')}
        </div>
      `;

      footer.innerHTML = `
        <div class="chat-input-row">
          <textarea class="chat-input" id="chat-input" placeholder="Write a message…" rows="1"></textarea>
          <button class="btn-primary btn-sm" id="send-msg-btn">Send</button>
        </div>
        <div class="chat-hint">You can only message users who follow you.</div>
      `;

      const input = footer.querySelector('#chat-input');
      const sendBtn = footer.querySelector('#send-msg-btn');

      const send = async () => {
        const text = (input.value || '').trim();
        if (!text) return;
        sendBtn.disabled = true;
        try {
          await API.messages.sendTo(user.username, text);
          input.value = '';
          await loadConversation(user.username, { silent: true, scroll: true });
          loadThreads({ force: false });
        } catch (err) {
          Toast.error(err.message);
        } finally {
          sendBtn.disabled = false;
        }
      };

      input.addEventListener('input', () => Utils.autoResize(input));
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          send();
        }
      });
      sendBtn.addEventListener('click', send);

      if (opts.scroll !== false) {
        setTimeout(() => {
          const wrap = document.getElementById('chat-messages');
          if (wrap) wrap.scrollTop = wrap.scrollHeight;
        }, 20);
      }
    } catch (err) {
      if (!opts.silent) {
        head.innerHTML = '<div class="chat-title">Messages</div>';
        body.innerHTML = `<div class="error-state" style="margin-top:40px">Failed to load conversation: ${Utils.escapeHtml(err.message)}</div>`;
        footer.innerHTML = '';
      }
    }
  };

  return { render };
})();

window.MessagesPage = MessagesPage;

