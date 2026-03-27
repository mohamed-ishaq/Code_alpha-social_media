/* pages/profile.js */

const ProfilePage = (() => {
  let _username = '';
  let _profileData = null;
  let _activeTab = 'posts';
  let _postPage = 1;
  let _loadingPosts = false;
  let _hasMorePosts = true;

  const render = async (username) => {
    _username = username.toLowerCase();
    _postPage = 1; _hasMorePosts = true; _activeTab = 'posts';

    const content = document.getElementById('content-area');
    content.innerHTML = '<div class="page-loading" style="margin-top:80px"><div class="spinner"></div></div>';

    try {
      const data = await API.users.get(_username);
      _profileData = data;
      renderProfile(data);
    } catch (err) {
      content.innerHTML = `
        <div class="empty-state" style="margin-top:80px">
          <div class="empty-icon">🔍</div>
          <div class="empty-title">User not found</div>
          <div class="empty-desc">@${Utils.escapeHtml(_username)} doesn't exist.</div>
          <button class="btn-primary" onclick="Router.navigate('/')">Go Home</button>
        </div>
      `;
    }
  };

  const renderProfile = ({ user, isFollowing, isOwnProfile }) => {
    const content = document.getElementById('content-area');
    const avatarBg = Utils.avatarColor(user.username);
    const avatarContent = user.avatar
      ? `<img src="${user.avatar}" alt="${Utils.escapeHtml(user.displayName || user.username)}" onerror="this.remove();this.parentElement.textContent='${Utils.initials(user.displayName || user.username)}'">`
      : Utils.initials(user.displayName || user.username);

    const socialLinks = '';

    content.innerHTML = `
      <div class="profile-banner">
        <div class="profile-banner-grid"></div>
      </div>

      <div class="profile-info-section">
        <div class="profile-avatar-row">
          <div class="profile-avatar" style="background:${avatarBg}" id="profile-avatar-el">${avatarContent}</div>
          <div class="profile-actions" id="profile-actions-area">
            ${isOwnProfile ? `
              <button class="btn-secondary" id="edit-profile-btn">Edit Profile</button>
            ` : `
              <button class="${isFollowing ? 'btn-secondary' : 'btn-primary'} follow-profile-btn" id="follow-profile-btn" data-username="${user.username}" data-following="${isFollowing}">
                ${isFollowing ? 'Following' : 'Follow'}
              </button>
            `}
          </div>
        </div>

        <div class="profile-display-name">${Utils.escapeHtml(user.displayName || user.username)}</div>
        <div class="profile-username">@${user.username}</div>
        ${user.bio ? `<p class="profile-bio">${Utils.escapeHtml(user.bio)}</p>` : ''}

        <div class="profile-meta">
          ${user.location ? `<span class="profile-meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${Utils.escapeHtml(user.location)}</span>` : ''}
          ${user.website ? `<span class="profile-meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg><a href="${Utils.escapeHtml(user.website)}" target="_blank" rel="noopener">${Utils.escapeHtml(user.website.replace(/^https?:\/\//, ''))}</a></span>` : ''}
          <span class="profile-meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>Joined ${new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          ${socialLinks ? `<span class="profile-meta-item" style="gap:8px">${socialLinks}</span>` : ''}
        </div>

        <div class="profile-stats">
          <div class="stat-item" id="stat-posts">
            <span class="stat-value">${Utils.formatNum(user.postsCount || 0)}</span>
            <span class="stat-label">Posts</span>
          </div>
          <div class="stat-item" id="stat-followers">
            <span class="stat-value">${Utils.formatNum(user.followersCount || 0)}</span>
            <span class="stat-label">Followers</span>
          </div>
          <div class="stat-item" id="stat-following">
            <span class="stat-value">${Utils.formatNum(user.followingCount || 0)}</span>
            <span class="stat-label">Following</span>
          </div>
        </div>

        ${user.skills && user.skills.length > 0 ? `
          <div class="skills-wrap">
            ${user.skills.map(s => `<span class="skill-badge">${Utils.escapeHtml(s)}</span>`).join('')}
          </div>
        ` : ''}
      </div>

      <div class="profile-tabs">
        <div class="profile-tab active" data-tab="posts">Posts</div>
        <div class="profile-tab" data-tab="likes">Likes</div>
      </div>

      <div id="profile-tab-content"></div>
    `;

    // Follow/unfollow
    const followBtn = content.querySelector('.follow-profile-btn');
    if (followBtn) {
      followBtn.addEventListener('click', async () => {
        const loggedIn = Auth.isLoggedIn();
        if (!loggedIn) { Router.navigate('/login'); return; }
        followBtn.disabled = true;
        try {
          const { isFollowing: nowFollowing, message } = await API.users.follow(user.username);
          followBtn.textContent = nowFollowing ? 'Following' : 'Follow';
          followBtn.className = nowFollowing ? 'btn-secondary follow-profile-btn' : 'btn-primary follow-profile-btn';
          followBtn.dataset.following = nowFollowing;

          // Update count
          const followerStat = content.querySelector('#stat-followers .stat-value');
          const delta = nowFollowing ? 1 : -1;
          user.followersCount = Math.max(0, (user.followersCount || 0) + delta);
          followerStat.textContent = Utils.formatNum(user.followersCount);
          Toast.success(message);
        } catch (err) { Toast.error(err.message); }
        finally { followBtn.disabled = false; }
      });
    }

    // Edit profile
    content.querySelector('#edit-profile-btn')?.addEventListener('click', () => openEditProfile(user));

    // Stats click → show follow lists
    content.querySelector('#stat-followers')?.addEventListener('click', () => openFollowList(user, 'followers'));
    content.querySelector('#stat-following')?.addEventListener('click', () => openFollowList(user, 'following'));

    // Tabs
    content.querySelectorAll('.profile-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        content.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        _activeTab = tab.dataset.tab;
        _postPage = 1; _hasMorePosts = true;
        document.getElementById('profile-tab-content').innerHTML = '';
        loadProfilePosts(user._id, _username);
      });
    });

    loadProfilePosts(user._id, _username);
  };

  const loadProfilePosts = async (userId, username) => {
    if (_loadingPosts || !_hasMorePosts) return;
    _loadingPosts = true;
    const container = document.getElementById('profile-tab-content');
    if (!container) { _loadingPosts = false; return; }

    if (_postPage === 1) {
      container.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';
    }

    try {
      const { posts, pages } = await API.users.getPosts(username, _postPage);
      if (_postPage === 1) container.innerHTML = '';

      if (posts.length === 0 && _postPage === 1) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">📝</div>
            <div class="empty-title">No posts yet</div>
            <div class="empty-desc">@${Utils.escapeHtml(username)} hasn't posted anything yet.</div>
          </div>`;
        return;
      }

      posts.forEach((post, i) => {
        const card = PostCard.build(post);
        card.style.animationDelay = `${i * 0.04}s`;
        container.appendChild(card);
      });

      _hasMorePosts = _postPage < pages;
      _postPage++;

      if (_hasMorePosts) {
        const loadMoreBtn = document.createElement('button');
        loadMoreBtn.className = 'load-more-btn';
        loadMoreBtn.id = 'profile-load-more';
        loadMoreBtn.textContent = 'Load more';
        loadMoreBtn.addEventListener('click', () => { loadMoreBtn.remove(); loadProfilePosts(userId, username); });
        container.appendChild(loadMoreBtn);
      }
    } catch (err) {
      if (_postPage === 1) container.innerHTML = `<div class="error-state">${Utils.escapeHtml(err.message)}</div>`;
    } finally { _loadingPosts = false; }
  };

  const openFollowList = async (user, type) => {
    const modal = Modal.open('<div class="page-loading"><div class="spinner"></div></div>', type === 'followers' ? 'Followers' : 'Following');
    try {
      const data = type === 'followers' ? await API.users.getFollowers(user.username) : await API.users.getFollowing(user.username);
      const list = type === 'followers' ? data.followers : data.following;
      const body = Modal.getBody();
      if (!body) return;

      if (!list || list.length === 0) {
        body.innerHTML = `<div class="empty-state" style="padding:24px"><div class="empty-desc">No ${type} yet.</div></div>`;
        return;
      }

      body.innerHTML = `<div class="follow-list">${list.map(u => `
        <div class="follow-list-item" data-username="${u.username}">
          <div class="avatar avatar-sm" style="background:${Utils.avatarColor(u.username)}">
            ${u.avatar ? `<img src="${u.avatar}" onerror="this.remove()">` : Utils.initials(u.displayName || u.username)}
          </div>
          <div class="follow-user-info">
            <div class="follow-user-name" data-username="${u.username}">${Utils.escapeHtml(u.displayName || u.username)}</div>
            <div class="follow-user-handle">@${u.username}</div>
          </div>
        </div>
      `).join('')}</div>`;

      body.querySelectorAll('[data-username]').forEach(el => {
        el.style.cursor = 'pointer';
        el.addEventListener('click', () => {
          Modal.close();
          Router.navigate(`/profile/${el.dataset.username}`);
        });
      });
    } catch (err) {
      const body = Modal.getBody();
      if (body) body.innerHTML = `<div class="error-state">${Utils.escapeHtml(err.message)}</div>`;
    }
  };

  const openEditProfile = (user) => {
    const modal = Modal.open(`
      <div class="edit-profile-form">
        <div class="form-group">
          <label class="form-label">Avatar URL</label>
          <input type="url" class="form-input" id="edit-avatar" placeholder="https://example.com/avatar.jpg" value="${Utils.escapeHtml(user.avatar || '')}" />
        </div>
        <div class="form-group">
          <label class="form-label">Display Name</label>
          <input type="text" class="form-input" id="edit-displayname" maxlength="50" value="${Utils.escapeHtml(user.displayName || '')}" />
        </div>
        <div class="form-group">
          <label class="form-label">Bio</label>
          <textarea class="form-textarea" id="edit-bio" maxlength="300" rows="3" placeholder="Tell us about yourself...">${Utils.escapeHtml(user.bio || '')}</textarea>
          <div class="form-hint">Max 300 characters</div>
        </div>
        <div class="form-group">
          <label class="form-label">Location</label>
          <input type="text" class="form-input" id="edit-location" maxlength="100" placeholder="San Francisco, CA" value="${Utils.escapeHtml(user.location || '')}" />
        </div>
        <div class="form-group">
          <label class="form-label">Website</label>
          <input type="url" class="form-input" id="edit-website" placeholder="https://yoursite.com" value="${Utils.escapeHtml(user.website || '')}" />
        </div>
        <div class="form-group">
          <label class="form-label">Interests</label>
          <div class="skills-input-wrap" id="skills-wrap">
            <input type="text" class="skill-input-hidden" id="skill-input" placeholder="Add interest (press Enter)" />
          </div>
        </div>
        <div id="edit-error" class="form-error" style="display:none;margin-bottom:8px"></div>
        <button class="btn-primary w-full" id="save-profile-btn">Save Changes</button>
      </div>
    `, 'Edit Profile');

    // Skills input
    const skills = [...(user.skills || [])];
    const skillsWrap = modal.querySelector('#skills-wrap');
    const skillInput = modal.querySelector('#skill-input');

    const renderSkillTags = () => {
      skillsWrap.querySelectorAll('.skill-tag').forEach(t => t.remove());
      skills.forEach((skill, i) => {
        const tag = document.createElement('span');
        tag.className = 'skill-tag';
        tag.innerHTML = `${Utils.escapeHtml(skill)} <span class="skill-tag-remove" data-i="${i}">×</span>`;
        skillsWrap.insertBefore(tag, skillInput);
      });
      skillsWrap.querySelectorAll('.skill-tag-remove').forEach(btn => {
        btn.addEventListener('click', () => { skills.splice(parseInt(btn.dataset.i), 1); renderSkillTags(); });
      });
    };

    renderSkillTags();
    skillInput.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ',') && skillInput.value.trim() && skills.length < 15) {
        e.preventDefault();
        const val = skillInput.value.trim().replace(/^#/, '');
        if (val && !skills.includes(val)) { skills.push(val); renderSkillTags(); }
        skillInput.value = '';
      } else if (e.key === 'Backspace' && !skillInput.value && skills.length > 0) {
        skills.pop(); renderSkillTags();
      }
    });

    // Save
    modal.querySelector('#save-profile-btn').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      const errEl = modal.querySelector('#edit-error');
      errEl.style.display = 'none';
      btn.disabled = true; btn.textContent = 'Saving...';

      const payload = {
        avatar:      modal.querySelector('#edit-avatar').value.trim(),
        displayName: modal.querySelector('#edit-displayname').value.trim(),
        bio:         modal.querySelector('#edit-bio').value.trim(),
        location:    modal.querySelector('#edit-location').value.trim(),
        website:     modal.querySelector('#edit-website').value.trim(),
        skills,
      };

      try {
        const { user: updated } = await API.users.update(payload);
        Auth.updateUser(updated);
        Modal.close();
        Toast.success('Profile updated!');
        render(updated.username);
      } catch (err) {
        errEl.textContent = err.message;
        errEl.style.display = 'block';
        btn.disabled = false; btn.textContent = 'Save Changes';
      }
    });
  };

  // Icon helpers
  const githubIcon = () => `<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" style="color:var(--color-text-dim)"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>`;
  const twitterIcon = () => `<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" style="color:var(--color-text-dim)"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>`;
  const linkedinIcon = () => `<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" style="color:var(--color-text-dim)"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`;

  return { render };
})();

window.ProfilePage = ProfilePage;
