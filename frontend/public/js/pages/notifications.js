/* pages/notifications.js */

const NotificationsPage = (() => {
  const iconSvg = {
    follow: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="8.5" cy="7" r="4"/>
        <path d="M20 8v6"/>
        <path d="M23 11h-6"/>
      </svg>`,
    like: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>`,
    comment: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>`,
    default: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 8v4"/>
        <path d="M12 16h.01"/>
      </svg>`
  };

  const labelFor = (n) => {
    const name = Utils.escapeHtml(n?.actor?.displayName || n?.actor?.username || 'Someone');
    if (n.type === 'follow') return `${name} started following you`;
    if (n.type === 'like') return `${name} liked your post`;
    if (n.type === 'comment') return `${name} commented on your post`;
    return `${name} sent an update`;
  };

  const subtitleFor = (n) => {
    if (n.type === 'comment' && n.comment) {
      const s = Utils.truncate(String(n.comment), 120);
      return `“${Utils.escapeHtml(s)}”`;
    }
    return '';
  };

  const renderSkeleton = (count = 6) => {
    return Array.from({ length: count }, () => `
      <div class="notification-item">
        <div class="notification-icon skeleton" style="width:36px;height:36px;border-radius:12px"></div>
        <div class="notification-main" style="width:100%">
          <div class="skeleton skeleton-line" style="width:65%;height:12px;margin-bottom:8px"></div>
          <div class="skeleton skeleton-line" style="width:35%;height:10px"></div>
        </div>
      </div>
    `).join('');
  };

  const render = async () => {
    const user = Auth.getUser();
    if (!user) { Router.navigate('/login'); return; }

    const content = document.getElementById('content-area');
    content.innerHTML = `
      <div class="section-header">
        <span class="section-title">Notifications</span>
        <button class="btn-icon" id="refresh-notifs-btn" title="Refresh">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
        </button>
      </div>
      <div class="notifications-wrap">
        <div class="notifications-list" id="notifications-list">${renderSkeleton()}</div>
      </div>
    `;

    document.getElementById('refresh-notifs-btn')?.addEventListener('click', () => load());

    await load();
  };

  const load = async () => {
    const list = document.getElementById('notifications-list');
    if (!list) return;

    list.innerHTML = renderSkeleton(5);

    try {
      const { notifications } = await API.notifications.list(50);

      if (!notifications || notifications.length === 0) {
        list.innerHTML = `
          <div class="empty-state" style="margin-top:24px">
            <div class="empty-icon">🔔</div>
            <div class="empty-title">No notifications yet</div>
            <div class="empty-desc">When someone follows you, likes your post, or comments on your post, it will show up here.</div>
            <button class="btn-primary" onclick="Router.navigate('/explore')">Explore</button>
          </div>
        `;
        return;
      }

      list.innerHTML = '';
      notifications.forEach((n, i) => {
        const actor = n.actor || {};
        const avatarBg = Utils.avatarColor(actor.username || '');
        const actorInitials = Utils.initials(actor.displayName || actor.username || '?');

        const row = document.createElement('div');
        row.className = 'notification-item animate-slide-up';
        row.style.animationDelay = `${i * 0.03}s`;
        row.innerHTML = `
          <div class="notification-icon" title="${Utils.escapeHtml(n.type || 'notification')}">
            ${iconSvg[n.type] || iconSvg.default}
          </div>
          <div class="avatar avatar-xs notification-avatar" style="background:${avatarBg}">
            ${actor.avatar ? `<img src="${actor.avatar}" alt="" onerror="this.remove();this.parentElement.textContent='${actorInitials}'">` : actorInitials}
          </div>
          <div class="notification-main">
            <div class="notification-top">
              <div class="notification-text">${labelFor(n)}</div>
              <div class="notification-time">${Utils.timeAgo(n.createdAt)}</div>
            </div>
            ${subtitleFor(n) ? `<div class="notification-sub">${subtitleFor(n)}</div>` : ''}
          </div>
        `;

        row.addEventListener('click', () => {
          if (n.href) Router.navigate(n.href);
        });

        list.appendChild(row);
      });
    } catch (err) {
      if (err.status === 401) {
        Router.navigate('/login');
        return;
      }
      list.innerHTML = `<div class="error-state" style="margin-top:24px">Failed to load notifications: ${Utils.escapeHtml(err.message)}</div>`;
      Toast.error('Failed to load notifications.');
    }
  };

  return { render };
})();

window.NotificationsPage = NotificationsPage;

