/* pages/home.js */

const HomePage = (() => {
  let _page = 1;
  let _loading = false;
  let _hasMore = true;

  const scrollToHash = () => {
    const id = (window.location.hash || '').replace('#', '').trim();
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const render = async () => {
    const content = document.getElementById('content-area');
    const user = Auth.getUser();

    if (!user) {
      // Landing page for guests
      content.innerHTML = `
        <div class="landing-page">
          <section class="landing-hero" id="top">
            <div class="landing-hero-left">
              <div class="hero-badge">⬡ Dark glass social for creators</div>
              <h1 class="landing-title">Connect, collaborate, and <span>catch the moment</span></h1>
              <p class="landing-subtitle">A modern social space to share photos, dev wins, and live rooms—built for your circle.</p>
              <div class="landing-cta">
                <button class="btn-primary btn-lg" id="landing-cta-primary">Get Started →</button>
                <button class="btn-secondary btn-lg" id="landing-cta-secondary">Explore</button>
              </div>
              <div class="landing-metrics">
                <div class="metric"><div class="metric-value">Live</div><div class="metric-label">Rooms & Events</div></div>
                <div class="metric"><div class="metric-value">Glass</div><div class="metric-label">UI + Glow</div></div>
                <div class="metric"><div class="metric-value">Fast</div><div class="metric-label">SPA Experience</div></div>
              </div>
            </div>

            <div class="landing-hero-right" aria-hidden="true">
              <div class="hero-visual">
                <div class="glass-phone phone-main">
                  <div class="phone-top">
                    <div class="phone-pill"></div>
                    <div class="phone-title">DevLink</div>
                    <div class="phone-chip">LIVE</div>
                  </div>
                  <div class="phone-body">
                    <div class="phone-row">
                      <div class="story-dot"></div><div class="story-dot"></div><div class="story-dot"></div><div class="story-dot"></div><div class="story-dot"></div>
                    </div>
                    <div class="phone-card">
                      <div class="phone-card-head">
                        <div class="mini-avatar"></div>
                        <div class="mini-lines">
                          <div class="mini-line w-60"></div>
                          <div class="mini-line w-35"></div>
                        </div>
                      </div>
                      <div class="mini-media"></div>
                      <div class="mini-actions"><div class="mini-action"></div><div class="mini-action"></div><div class="mini-action"></div></div>
                    </div>
                  </div>
                </div>

                <div class="glass-phone phone-side">
                  <div class="phone-top">
                    <div class="phone-title">Top Picks</div>
                    <div class="phone-chip">NEW</div>
                  </div>
                  <div class="phone-body">
                    <div class="pick-row">
                      <div class="pick-thumb"></div>
                      <div class="mini-lines"><div class="mini-line w-70"></div><div class="mini-line w-45"></div></div>
                    </div>
                    <div class="pick-row">
                      <div class="pick-thumb"></div>
                      <div class="mini-lines"><div class="mini-line w-55"></div><div class="mini-line w-40"></div></div>
                    </div>
                    <div class="pick-row">
                      <div class="pick-thumb"></div>
                      <div class="mini-lines"><div class="mini-line w-62"></div><div class="mini-line w-38"></div></div>
                    </div>
                  </div>
                </div>

                <div class="glass-card hero-float-card">
                  <div class="float-title">Live Room</div>
                  <div class="float-sub">Orange glow / glass UI</div>
                  <div class="float-row">
                    <div class="mini-avatar"></div><div class="mini-avatar"></div><div class="mini-avatar"></div>
                    <div class="float-badge">Join</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section class="landing-section" id="connect">
            <div class="landing-section-head">
              <div class="landing-kicker">Connect & Collaborate</div>
              <h2 class="landing-h2">Build together in a calm, elegant dark UI</h2>
              <p class="landing-p">Glass cards, soft shadows, and glowing borders—designed for focus and community.</p>
            </div>
            <div class="landing-grid-3">
              <div class="glass-card feature-card"><div class="feature-icon">⚡</div><div class="feature-title">Lightning feed</div><div class="feature-text">Share photos, wins, and updates with smooth spacing and modern typography.</div></div>
              <div class="glass-card feature-card"><div class="feature-icon">🔥</div><div class="feature-title">Gradient glow</div><div class="feature-text">Orange→gold highlights across buttons, borders, and live overlays.</div></div>
              <div class="glass-card feature-card"><div class="feature-icon">🎛️</div><div class="feature-title">Rooms & meetups</div><div class="feature-text">Hop into live rooms and events with elevated, glassy cards.</div></div>
            </div>
          </section>

          <section class="landing-section" id="discover">
            <div class="landing-section-head split">
              <div>
                <div class="landing-kicker">Discover Your Circle</div>
                <h2 class="landing-h2">Find people with your vibe</h2>
                <p class="landing-p">Explore trending posts, tags, and creators—then follow your favorites.</p>
              </div>
              <div class="glass-card mini-panel">
                <div class="panel-row">
                  <span class="panel-label">Trending</span>
                  <span class="panel-pill">#design</span>
                  <span class="panel-pill">#mern</span>
                  <span class="panel-pill">#buildinpublic</span>
                </div>
                <div class="panel-line"></div>
                <div class="panel-row">
                  <span class="panel-label">Suggested</span>
                  <span class="panel-pill">Glass UI</span>
                  <span class="panel-pill">Live Rooms</span>
                  <span class="panel-pill">Top Picks</span>
                </div>
              </div>
            </div>
          </section>

          <section class="landing-section" id="moment">
            <div class="landing-section-head">
              <div class="landing-kicker">Catch the Moment</div>
              <h2 class="landing-h2">Post photos with a premium glass layout</h2>
              <p class="landing-p">Rounded corners, blur backgrounds, and soft shadows that feel modern and minimal.</p>
            </div>
            <div class="landing-grid-2">
              <div class="glass-card moment-card"><div class="moment-grad"></div><div class="moment-title">Story-ready</div><div class="moment-text">A clean, cinematic frame for your best shots.</div></div>
              <div class="glass-card moment-card"><div class="moment-grad alt"></div><div class="moment-title">Creator-first</div><div class="moment-text">Elegant spacing, readable contrast, and glowing highlights.</div></div>
            </div>
          </section>

          <section class="landing-section" id="picks">
            <div class="landing-section-head">
              <div class="landing-kicker">Today's Top Picks</div>
              <h2 class="landing-h2">A dashboard-style grid with glow overlays</h2>
              <p class="landing-p">Curated cards that look great on desktop and mobile.</p>
            </div>
            <div class="landing-grid-4">
              ${['UI Kits', 'Meetups', 'Moments', 'Creators'].map((t, i) => `
                <div class="glass-card pick-card" style="animation-delay:${i * 0.04}s">
                  <div class="pick-grad"></div>
                  <div class="pick-title">${t}</div>
                  <div class="pick-text">Explore trending ${t.toLowerCase()} with elegant glass cards.</div>
                </div>
              `).join('')}
            </div>
          </section>

          <section class="landing-section" id="meetup">
            <div class="landing-section-head">
              <div class="landing-kicker">Live Rooms / Events</div>
              <h2 class="landing-h2">Join rooms with gradient overlays</h2>
              <p class="landing-p">Soft shadows, blurred backdrops, and rounded cards with a premium feel.</p>
            </div>
            <div class="landing-grid-3">
              ${[
                { title: 'Glassmorphism UI Jam', meta: 'Today • 7:30 PM' },
                { title: 'Build in Public Night', meta: 'Tomorrow • 8:00 PM' },
                { title: 'Creators & Collabs', meta: 'This Week • Live' },
              ].map((e, i) => `
                <div class="event-card" style="animation-delay:${i * 0.05}s">
                  <div class="event-overlay"></div>
                  <div class="event-title">${e.title}</div>
                  <div class="event-meta">${e.meta}</div>
                  <div class="event-footer">
                    <div class="event-avatars"><span class="event-dot"></span><span class="event-dot"></span><span class="event-dot"></span></div>
                    <button class="btn-outline btn-sm" onclick="Router.navigate('/register')">Join</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </section>

          <footer class="landing-footer" id="contact">
            <div class="footer-card">
              <div class="footer-left">
                <div class="footer-title">Ready to glow?</div>
                <div class="footer-text">Join DevLink and start sharing moments with a modern dark glass UI.</div>
              </div>
              <div class="footer-right">
                <button class="btn-primary btn-lg" onclick="Router.navigate('/register')">Create Account</button>
                <button class="btn-secondary btn-lg" onclick="Router.navigate('/login')">Sign In</button>
              </div>
            </div>
            <div class="footer-bottom">
              <span>© ${new Date().getFullYear()} DevLink</span>
              <span class="footer-muted">Discover • Meetup • Contact</span>
            </div>
          </footer>
        </div>
      `;

      content.querySelector('#landing-cta-primary')?.addEventListener('click', () => Router.navigate('/register'));
      content.querySelector('#landing-cta-secondary')?.addEventListener('click', () => Router.navigate('/explore'));
      setTimeout(scrollToHash, 60);
      return;
    }

    _page = 1; _hasMore = true;
    content.innerHTML = `
      <div class="section-header">
        <span class="section-title">Home</span>
        <div style="display:flex;align-items:center;gap:10px">
          <button class="btn-secondary btn-sm" id="new-post-btn">New Post</button>
          <button class="btn-icon" id="refresh-feed-btn" title="Refresh">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </button>
        </div>
      </div>
      <div id="followers-status"></div>
      <div id="feed-list"></div>
      <div id="feed-footer"></div>
    `;

    document.getElementById('new-post-btn')?.addEventListener('click', () => Router.navigate('/compose'));

    document.getElementById('refresh-feed-btn')?.addEventListener('click', () => {
      _page = 1; _hasMore = true;
      document.getElementById('feed-list').innerHTML = '';
      loadFeed();
    });

    await renderFollowersStatus();
    await loadFeed();
    setupInfiniteScroll();
  };

  const renderFollowersStatus = async () => {
    const box = document.getElementById('followers-status');
    if (!box) return;
    box.innerHTML = `
      <div class="widget-card followers-status-card">
        <div class="widget-title">Followers Status</div>
        <div class="followers-status-list" id="followers-status-list">
          <div class="page-loading" style="padding:14px 0"><div class="spinner"></div></div>
        </div>
      </div>
    `;

    try {
      const me = Auth.getUser();
      const { followers } = await API.users.getFollowers(me.username, 1);
      const list = (followers || []).slice(0, 12);
      const listEl = document.getElementById('followers-status-list');
      if (!listEl) return;

      if (list.length === 0) {
        listEl.innerHTML = `
          <div style="padding:6px 0 12px;color:var(--color-text-muted);font-size:13px">
            No followers yet. When someone follows you, their status will show here.
          </div>
        `;
        return;
      }

      const now = Date.now();
      const ONLINE_WINDOW_MS = 5 * 60 * 1000;

      listEl.innerHTML = list.map(u => {
        const avatarBg = Utils.avatarColor(u.username);
        const avatarContent = u.avatar
          ? `<img src="${u.avatar}" onerror="this.remove()">`
          : Utils.initials(u.displayName || u.username);

        const last = u.lastActiveAt ? new Date(u.lastActiveAt).getTime() : 0;
        const online = last && (now - last) < ONLINE_WINDOW_MS;
        const statusText = online ? 'Online' : last ? `Seen ${Utils.timeAgo(u.lastActiveAt)} ago` : 'Offline';

        return `
          <div class="fstatus-item" data-username="${u.username}">
            <div class="avatar avatar-xs" style="background:${avatarBg}">${avatarContent}</div>
            <div class="fstatus-main">
              <div class="fstatus-name">${Utils.escapeHtml(u.displayName || u.username)}</div>
              <div class="fstatus-sub">
                <span class="status-dot ${online ? 'on' : ''}"></span>
                ${statusText}
              </div>
            </div>
            <button class="btn-secondary btn-sm fstatus-msg" data-username="${u.username}">Message</button>
          </div>
        `;
      }).join('');

      listEl.querySelectorAll('.fstatus-item').forEach(row => {
        row.addEventListener('click', (e) => {
          if (e.target.closest('button')) return;
          Router.navigate(`/profile/${row.dataset.username}`);
        });
      });

      listEl.querySelectorAll('.fstatus-msg').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          Router.navigate(`/messages/${btn.dataset.username}`);
        });
      });
    } catch (err) {
      const listEl = document.getElementById('followers-status-list');
      if (listEl) listEl.innerHTML = `<div class="error-state">Failed to load follower status.</div>`;
    }
  };

  const loadFeed = async () => {
    if (_loading || !_hasMore) return;
    _loading = true;

    const list    = document.getElementById('feed-list');
    const footer  = document.getElementById('feed-footer');

    if (_page === 1) {
      list.innerHTML = renderSkeletons(3);
    } else {
      footer.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';
    }

    try {
      const { posts, pages } = await API.posts.getFeed(_page);
      if (_page === 1) list.innerHTML = '';
      footer.innerHTML = '';

      if (posts.length === 0 && _page === 1) {
        list.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">🌱</div>
            <div class="empty-title">Your feed is empty</div>
            <div class="empty-desc">Follow people to see their posts here, or explore what's trending.</div>
            <button class="btn-primary" onclick="Router.navigate('/explore')">Explore Posts</button>
          </div>
        `;
        return;
      }

      posts.forEach((post, i) => {
        const card = PostCard.build(post);
        card.style.animationDelay = `${i * 0.04}s`;
        list.appendChild(card);
      });

      _hasMore = _page < pages;
      _page++;

      if (_hasMore) {
        footer.innerHTML = '<button class="load-more-btn" id="load-more-btn">Load more posts</button>';
        document.getElementById('load-more-btn')?.addEventListener('click', loadFeed);
      }
    } catch (err) {
      list.innerHTML = _page === 1 ? `<div class="error-state">Failed to load feed: ${Utils.escapeHtml(err.message)}</div>` : '';
      footer.innerHTML = '';
      Toast.error('Failed to load feed.');
    } finally {
      _loading = false;
    }
  };

  const setupInfiniteScroll = () => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && _hasMore && !_loading) loadFeed();
    }, { threshold: 0.1 });

    // Observe footer element when it exists
    const check = () => {
      const footer = document.getElementById('feed-footer');
      if (footer) observer.observe(footer);
    };
    setTimeout(check, 500);
  };

  const renderSkeletons = (n) => {
    return Array.from({ length: n }, () => `
      <div class="post-skeleton">
        <div style="display:flex;gap:12px;margin-bottom:12px">
          <div class="skeleton skeleton-avatar"></div>
          <div style="flex:1">
            <div class="skeleton skeleton-line" style="width:30%;margin-bottom:6px"></div>
            <div class="skeleton skeleton-line" style="width:20%"></div>
          </div>
        </div>
        <div class="skeleton skeleton-line" style="width:100%;margin-bottom:6px"></div>
        <div class="skeleton skeleton-line" style="width:85%;margin-bottom:6px"></div>
        <div class="skeleton skeleton-line" style="width:60%"></div>
      </div>
    `).join('');
  };

  return { render };
})();

window.HomePage = HomePage;
