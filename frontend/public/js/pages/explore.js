/* pages/explore.js */

const ExplorePage = (() => {
  let _page = 1;
  let _loading = false;
  let _hasMore = true;
  let _activeTab = 'latest';
  let _activeTag = '';

  const render = async (params = {}) => {
    _page = 1; _hasMore = true; _loading = false;
    _activeTag = params.tag || '';
    _activeTab = 'latest';

    const content = document.getElementById('content-area');
    content.innerHTML = `
      <div class="section-header">
        <span class="section-title">Explore</span>
      </div>

      <div class="explore-tabs">
        <div class="explore-tab active" data-tab="latest">Latest</div>
        <div class="explore-tab" data-tab="people">People</div>
      </div>

      ${_activeTag ? `
        <div class="sticky-section-label" id="tag-filter-bar">
          Filtering by <span style="color:var(--color-accent)">#${Utils.escapeHtml(_activeTag)}</span>
          <button id="clear-tag-btn" style="margin-left:8px;color:var(--color-text-muted);font-size:12px;cursor:pointer">✕ Clear</button>
        </div>
      ` : ''}

      <div id="explore-content"></div>
    `;

    content.querySelectorAll('.explore-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        content.querySelectorAll('.explore-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        _activeTab = tab.dataset.tab;
        _page = 1; _hasMore = true;
        document.getElementById('explore-content').innerHTML = '';
        loadContent();
      });
    });

    content.querySelector('#clear-tag-btn')?.addEventListener('click', () => {
      _activeTag = '';
      content.querySelector('#tag-filter-bar')?.remove();
      _page = 1; _hasMore = true;
      document.getElementById('explore-content').innerHTML = '';
      loadContent();
    });

    loadContent();
  };

  const loadContent = async () => {
    if (_activeTab === 'people') {
      loadPeople();
    } else {
      loadPosts();
    }
  };

  const loadPosts = async () => {
    if (_loading || !_hasMore) return;
    _loading = true;
    const container = document.getElementById('explore-content');
    if (!container) { _loading = false; return; }

    if (_page === 1) {
      container.innerHTML = renderSkeletons(4);
    }

    try {
      const { posts, pages } = await API.posts.getExplore(_page, _activeTag);
      if (_page === 1) container.innerHTML = '';

      if (posts.length === 0 && _page === 1) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">🌍</div>
            <div class="empty-title">${_activeTag ? `No posts tagged #${Utils.escapeHtml(_activeTag)}` : 'No posts yet'}</div>
            <div class="empty-desc">Be the first to post something!</div>
            ${Auth.isLoggedIn() ? '<button class="btn-primary" onclick="Router.navigate(\'/\')">Create Post</button>' : ''}
          </div>`;
        return;
      }

      // Remove existing load more btn
      container.querySelector('#explore-load-more')?.remove();

      posts.forEach((post, i) => {
        const card = PostCard.build(post);
        card.style.animationDelay = `${i * 0.04}s`;
        container.appendChild(card);
      });

      _hasMore = _page < pages;
      _page++;

      if (_hasMore) {
        const btn = document.createElement('button');
        btn.className = 'load-more-btn';
        btn.id = 'explore-load-more';
        btn.textContent = 'Load more';
        btn.addEventListener('click', () => { btn.remove(); loadPosts(); });
        container.appendChild(btn);
      }
    } catch (err) {
      if (_page === 1) container.innerHTML = `<div class="error-state">${Utils.escapeHtml(err.message)}</div>`;
    } finally { _loading = false; }
  };

  const loadPeople = async () => {
    const container = document.getElementById('explore-content');
    container.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';

    try {
      const { users } = await API.users.search('a', 1);
      if (!users.length) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">👥</div><div class="empty-title">No people found</div></div>`;
        return;
      }
      container.innerHTML = '';
      users.forEach(u => {
        const el = buildUserRow(u);
        container.appendChild(el);
      });
    } catch (err) {
      container.innerHTML = `<div class="error-state">${Utils.escapeHtml(err.message)}</div>`;
    }
  };

  const buildUserRow = (u) => {
    const div = document.createElement('div');
    div.className = 'user-row';
    const avatarBg = Utils.avatarColor(u.username);
    const avatarContent = u.avatar
      ? `<img src="${u.avatar}" onerror="this.remove();this.parentElement.textContent='${Utils.initials(u.displayName || u.username)}'">`
      : Utils.initials(u.displayName || u.username);

    div.innerHTML = `
      <div class="avatar avatar-md" style="background:${avatarBg}">${avatarContent}</div>
      <div class="user-row-info">
        <div class="user-row-name">${Utils.escapeHtml(u.displayName || u.username)}</div>
        <div class="user-row-handle">@${u.username} · ${Utils.formatNum(u.followersCount || 0)} followers</div>
        ${u.bio ? `<div class="user-row-bio">${Utils.escapeHtml(Utils.truncate(u.bio, 80))}</div>` : ''}
        ${u.skills && u.skills.length ? `
          <div class="chip-row" style="margin-top:4px">
            ${u.skills.slice(0, 4).map(s => `<span class="skill-badge">${Utils.escapeHtml(s)}</span>`).join('')}
          </div>` : ''}
      </div>
      <button class="follow-btn-small" data-username="${u.username}">Follow</button>
    `;

    div.addEventListener('click', (e) => {
      if (!e.target.closest('.follow-btn-small')) {
        Router.navigate(`/profile/${u.username}`);
      }
    });

    div.querySelector('.follow-btn-small').addEventListener('click', async (e) => {
      e.stopPropagation();
      const btn = e.currentTarget;
      if (!Auth.isLoggedIn()) { Router.navigate('/login'); return; }
      btn.disabled = true;
      try {
        const { isFollowing } = await API.users.follow(u.username);
        btn.textContent = isFollowing ? 'Following' : 'Follow';
        btn.classList.toggle('following', isFollowing);
      } catch (err) { Toast.error(err.message); }
      finally { btn.disabled = false; }
    });

    return div;
  };

  const renderSkeletons = (n) => {
    return Array.from({ length: n }, () => `
      <div class="post-skeleton">
        <div style="display:flex;gap:12px;margin-bottom:12px">
          <div class="skeleton skeleton-avatar"></div>
          <div style="flex:1">
            <div class="skeleton skeleton-line" style="width:35%;margin-bottom:6px"></div>
            <div class="skeleton skeleton-line" style="width:22%"></div>
          </div>
        </div>
        <div class="skeleton skeleton-line" style="width:100%;margin-bottom:6px"></div>
        <div class="skeleton skeleton-line" style="width:80%;margin-bottom:6px"></div>
        <div class="skeleton skeleton-line" style="width:50%"></div>
      </div>
    `).join('');
  };

  return { render };
})();

window.ExplorePage = ExplorePage;
