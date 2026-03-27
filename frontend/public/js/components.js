/* components.js — Reusable UI components */

/* ─── TOAST ──────────────────────────────── */
const Toast = (() => {
  const container = () => document.getElementById('toast-container');
  const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };

  const show = (msg, type = 'info', duration = 3500) => {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-msg">${Utils.escapeHtml(msg)}</span>
      <span class="toast-close">×</span>
    `;
    const dismiss = () => {
      toast.style.animation = 'toastOut 0.25s ease forwards';
      setTimeout(() => toast.remove(), 250);
    };
    toast.querySelector('.toast-close').addEventListener('click', dismiss);
    container().appendChild(toast);
    setTimeout(dismiss, duration);
    return toast;
  };

  return {
    success: (m, d) => show(m, 'success', d),
    error:   (m, d) => show(m, 'error', d),
    info:    (m, d) => show(m, 'info', d),
    warning: (m, d) => show(m, 'warning', d),
  };
})();

/* ─── MODAL ──────────────────────────────── */
const Modal = (() => {
  const backdrop = () => document.getElementById('modal-backdrop');
  const container = () => document.getElementById('modal-container');
  let _current = null;

  const open = (contentHTML, title = '') => {
    close();
    backdrop().classList.add('active');
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h2 class="modal-title">${Utils.escapeHtml(title)}</h2>
          <button class="modal-close" id="modal-close-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="modal-body">${contentHTML}</div>
      </div>
    `;
    container().appendChild(modal);
    _current = modal;

    modal.querySelector('#modal-close-btn').addEventListener('click', close);
    backdrop().addEventListener('click', close, { once: true });

    return modal;
  };

  const close = () => {
    if (_current) { _current.remove(); _current = null; }
    backdrop().classList.remove('active');
  };

  const getBody = () => _current?.querySelector('.modal-body');

  return { open, close, getBody };
})();

/* ─── AUTH FORMS ─────────────────────────── */
const AuthForms = (() => {
  const renderLoginPage = () => {
    return `
      <div class="auth-page">
        <div class="auth-card animate-slide-up">
          <div class="auth-title">Welcome back</div>
          <div class="auth-subtitle">Sign in to your account</div>
          <form id="login-form">
            <div class="form-group">
              <label class="form-label">Email or Username</label>
              <input type="text" class="form-input" id="login-login" placeholder="you@example.com" autocomplete="username" required />
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input type="password" class="form-input" id="login-password" placeholder="••••••••" autocomplete="current-password" required />
            </div>
            <div id="login-error" class="form-error" style="margin-bottom:12px;display:none;"></div>
            <button type="submit" class="btn-primary w-full" id="login-submit-btn">Sign In</button>
          </form>
          <div class="auth-switch">
            Don't have an account? <a id="goto-register">Create one</a>
          </div>
        </div>
      </div>
    `;
  };

  const renderRegisterPage = () => {
    return `
      <div class="auth-page">
        <div class="auth-card animate-slide-up">
          <div class="auth-title">Join DevLink</div>
          <div class="auth-subtitle">Share photos, moments, and vibes</div>
          <form id="register-form">
            <div class="form-group">
              <label class="form-label">Username</label>
              <input type="text" class="form-input" id="reg-username" placeholder="cooluser_42" autocomplete="username" required minlength="3" maxlength="20" />
              <div class="form-hint">Letters, numbers, underscores only</div>
            </div>
            <div class="form-group">
              <label class="form-label">Display Name</label>
              <input type="text" class="form-input" id="reg-displayname" placeholder="Cool Person" maxlength="50" />
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" class="form-input" id="reg-email" placeholder="you@example.com" autocomplete="email" required />
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input type="password" class="form-input" id="reg-password" placeholder="Min. 6 characters" autocomplete="new-password" required minlength="6" />
            </div>
            <div id="reg-error" class="form-error" style="margin-bottom:12px;display:none;"></div>
            <button type="submit" class="btn-primary w-full" id="reg-submit-btn">Create Account</button>
          </form>
          <div class="auth-switch">
            Already have an account? <a id="goto-login">Sign in</a>
          </div>
        </div>
      </div>
    `;
  };

  const attachLoginHandlers = () => {
    const form = document.getElementById('login-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('login-submit-btn');
      const errEl = document.getElementById('login-error');
      const login = document.getElementById('login-login').value.trim();
      const password = document.getElementById('login-password').value;
      errEl.style.display = 'none';
      btn.textContent = 'Signing in...'; btn.disabled = true;
      try {
        const { token, user } = await API.auth.login({ login, password });
        Auth.setSession(token, user);
        Toast.success(`Welcome back, @${user.username}!`);
        Router.navigate('/');
      } catch (err) {
        errEl.textContent = err.message || 'Login failed.';
        errEl.style.display = 'block';
        btn.textContent = 'Sign In'; btn.disabled = false;
      }
    });
    document.getElementById('goto-register')?.addEventListener('click', () => Router.navigate('/register'));
  };

  const attachRegisterHandlers = () => {
    const form = document.getElementById('register-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('reg-submit-btn');
      const errEl = document.getElementById('reg-error');
      errEl.style.display = 'none';
      const payload = {
        username: document.getElementById('reg-username').value.trim(),
        email: document.getElementById('reg-email').value.trim(),
        password: document.getElementById('reg-password').value,
        displayName: document.getElementById('reg-displayname').value.trim(),
      };
      btn.textContent = 'Creating account...'; btn.disabled = true;
      try {
        const { token, user } = await API.auth.register(payload);
        Auth.setSession(token, user);
        Toast.success(`Welcome, @${user.username}! 🎉`);
        Router.navigate('/');
      } catch (err) {
        errEl.textContent = err.message || 'Registration failed.';
        errEl.style.display = 'block';
        btn.textContent = 'Create Account'; btn.disabled = false;
      }
    });
    document.getElementById('goto-login')?.addEventListener('click', () => Router.navigate('/login'));
  };

  return { renderLoginPage, renderRegisterPage, attachLoginHandlers, attachRegisterHandlers };
})();

/* ─── POST CARD ──────────────────────────── */
const PostCard = (() => {
  const build = (post, opts = {}) => {
    const author = post.author || {};
    const user = Auth.getUser();
    const isOwn = user && author._id === user._id;

    const card = document.createElement('article');
    card.className = 'post-card';
    card.dataset.postId = post._id;

    const hasTags = post.tags && post.tags.length > 0;
    const images = Array.isArray(post.images) ? post.images.filter(Boolean) : [];
    const hasImages = images.length > 0;

    card.innerHTML = `
      <div class="post-header">
        <a class="post-author-link" href="/profile/${author.username}" data-link>
          <div class="avatar avatar-sm post-avatar-slot" data-username="${author.username}" data-displayname="${Utils.escapeHtml(author.displayName || author.username)}" data-avatar="${author.avatar || ''}"></div>
          <div class="post-author-info">
            <span class="post-author-name">${Utils.escapeHtml(author.displayName || author.username)}</span>
            <span class="post-author-handle">@${author.username}</span>
          </div>
        </a>
        <div class="post-meta">
          <span class="post-time" title="${new Date(post.createdAt).toLocaleString()}">${Utils.timeAgo(post.createdAt)}</span>
          ${post.isEdited ? '<span class="edited-badge">edited</span>' : ''}
          ${isOwn ? `
          <div class="post-menu">
            <button class="btn-icon btn-sm post-menu-btn" aria-label="Post options">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
            </button>
            <div class="dropdown post-dropdown">
              <button class="dropdown-item edit-post-btn">✏ Edit</button>
              <button class="dropdown-item danger delete-post-btn">🗑 Delete</button>
            </div>
          </div>` : ''}
        </div>
      </div>
      <div class="post-body">
        <p class="post-content">${Utils.linkify(post.content)}</p>
        ${hasImages ? `
        <div class="post-images ${images.length > 1 ? 'grid' : ''}">
          ${images.slice(0, 4).map(src => `
            <img class="post-image" src="${Utils.escapeHtml(src)}" alt="Post image" loading="lazy" onerror="this.remove()" />
          `).join('')}
        </div>` : ''}
        ${hasTags ? `<div class="post-tags">${post.tags.map(t => `<span class="tag-chip" data-tag="${t}">#${t}</span>`).join('')}</div>` : ''}
      </div>
      <div class="post-footer">
        <button class="btn-action like-btn ${post.isLiked ? 'liked' : ''}" data-post-id="${post._id}">
          <svg viewBox="0 0 24 24" fill="${post.isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          <span class="like-count">${Utils.formatNum(post.likesCount || 0)}</span>
        </button>
        <button class="btn-action comment-btn" data-post-id="${post._id}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span class="comment-count">${Utils.formatNum(post.commentsCount || 0)}</span>
        </button>
        <button class="btn-action share-btn" data-post-id="${post._id}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        </button>
      </div>
      <div class="comments-section" id="comments-${post._id}"></div>
    `;

    // Build avatar
    const avatarSlot = card.querySelector('.post-avatar-slot');
    avatarSlot.style.background = Utils.avatarColor(author.username);
    if (author.avatar) {
      const img = document.createElement('img');
      img.src = author.avatar;
      img.alt = author.displayName || author.username;
      img.onerror = () => { img.remove(); avatarSlot.textContent = Utils.initials(author.displayName || author.username); };
      avatarSlot.appendChild(img);
    } else {
      avatarSlot.textContent = Utils.initials(author.displayName || author.username);
    }

    attachCardHandlers(card, post);
    return card;
  };

  const attachCardHandlers = (card, post) => {
    const user = Auth.getUser();

    // Like
    card.querySelector('.like-btn').addEventListener('click', async (e) => {
      if (!user) { Router.navigate('/login'); return; }
      const btn = e.currentTarget;
      const icon = btn.querySelector('svg');
      const countEl = btn.querySelector('.like-count');
      btn.disabled = true;
      try {
        const { isLiked, likesCount } = await API.posts.like(post._id);
        btn.classList.toggle('liked', isLiked);
        icon.setAttribute('fill', isLiked ? 'currentColor' : 'none');
        countEl.textContent = Utils.formatNum(likesCount);
        if (isLiked) btn.classList.add('like-pop');
        btn.addEventListener('animationend', () => btn.classList.remove('like-pop'), { once: true });
        post.isLiked = isLiked;
        post.likesCount = likesCount;
      } catch (err) { Toast.error(err.message); }
      finally { btn.disabled = false; }
    });

    // Comments toggle
    card.querySelector('.comment-btn').addEventListener('click', () => {
      if (!user) { Router.navigate('/login'); return; }
      const section = card.querySelector(`#comments-${post._id}`);
      const isOpen = section.style.display !== 'none' && section.innerHTML !== '';
      if (isOpen) {
        section.style.display = 'none';
        card.querySelector('.comment-btn').classList.remove('active');
      } else {
        card.querySelector('.comment-btn').classList.add('active');
        loadComments(card, post);
      }
    });

    // Share
    card.querySelector('.share-btn').addEventListener('click', async () => {
      const url = `${location.origin}/post/${post._id}`;
      await Utils.copyText(url);
      Toast.info('Link copied!');
    });

    // Tag chips
    card.querySelectorAll('.tag-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        Router.navigate(`/explore?tag=${chip.dataset.tag}`);
      });
    });

    // Post menu
    const menuBtn = card.querySelector('.post-menu-btn');
    const dropdown = card.querySelector('.post-dropdown');
    if (menuBtn && dropdown) {
      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
      });
      document.addEventListener('click', () => dropdown.classList.remove('open'));

      card.querySelector('.edit-post-btn')?.addEventListener('click', () => startEditPost(card, post));
      card.querySelector('.delete-post-btn')?.addEventListener('click', () => confirmDeletePost(card, post));
    }

    // Data-link clicks inside card
    card.querySelectorAll('[data-link]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        Router.navigate(el.getAttribute('href'));
      });
    });
  };

  const loadComments = async (card, post) => {
    const section = card.querySelector(`#comments-${post._id}`);
    section.style.display = 'block';
    section.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';

    const user = Auth.getUser();
    try {
      const { comments } = await API.posts.getComments(post._id);

      let html = '<div class="comments-list">';
      if (comments.length === 0) {
        html += '<div style="padding:16px;text-align:center;color:var(--color-text-muted);font-size:13px;">No comments yet. Be the first!</div>';
      } else {
        comments.forEach(c => { html += buildCommentHTML(c, post._id); });
      }
      html += '</div>';

      if (user) {
        const avatarStyle = `background:${Utils.avatarColor(user.username)}`;
        const avatarContent = user.avatar
          ? `<img src="${user.avatar}" alt="${Utils.escapeHtml(user.displayName)}" onerror="this.remove();this.parentElement.textContent='${Utils.initials(user.displayName || user.username)}'">`
          : Utils.initials(user.displayName || user.username);
        html += `
          <div class="comment-input-wrap">
            <div class="avatar avatar-xs" style="${avatarStyle}">${avatarContent}</div>
            <div class="comment-input-box">
              <textarea class="comment-input" placeholder="Write a comment..." rows="1" id="comment-input-${post._id}"></textarea>
              <button class="btn-primary btn-sm submit-comment-btn" data-post-id="${post._id}">Post</button>
            </div>
          </div>`;
      }

      section.innerHTML = html;

      // Auto-resize textarea
      const textarea = section.querySelector(`#comment-input-${post._id}`);
      if (textarea) {
        textarea.addEventListener('input', () => Utils.autoResize(textarea));
      }

      // Submit comment
      const submitBtn = section.querySelector('.submit-comment-btn');
      if (submitBtn) {
        submitBtn.addEventListener('click', () => submitComment(section, post, card));
      }

      // Comment likes & deletes
      section.querySelectorAll('.comment-like-btn').forEach(btn => {
        btn.addEventListener('click', () => handleCommentLike(btn));
      });
      section.querySelectorAll('.comment-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => handleCommentDelete(btn, post, card));
      });

      // Data-link in comments
      section.querySelectorAll('[data-link]').forEach(el => {
        el.addEventListener('click', (e) => { e.preventDefault(); Router.navigate(el.getAttribute('href')); });
      });

    } catch (err) {
      section.innerHTML = `<div class="error-state">${err.message}</div>`;
    }
  };

  const buildCommentHTML = (c, postId) => {
    const user = Auth.getUser();
    const isOwn = user && c.author && c.author._id === user._id;
    const avatarBg = Utils.avatarColor(c.author?.username || '');
    const avatarContent = c.author?.avatar
      ? `<img src="${c.author.avatar}" alt="${Utils.escapeHtml(c.author.displayName || '')}" onerror="this.remove()">`
      : Utils.initials(c.author?.displayName || c.author?.username || '?');

    return `
      <div class="comment-item" data-comment-id="${c._id}">
        <div class="avatar avatar-xs" style="background:${avatarBg}">${avatarContent}</div>
        <div class="comment-body">
          <div class="comment-author-line">
            <a class="comment-author-name" href="/profile/${c.author?.username}" data-link>${Utils.escapeHtml(c.author?.displayName || c.author?.username || 'User')}</a>
            <span class="comment-author-handle">@${c.author?.username || ''}</span>
            <span class="comment-time">${Utils.timeAgo(c.createdAt)}</span>
          </div>
          <p class="comment-text">${Utils.escapeHtml(c.content)}</p>
          <div class="comment-actions">
            <button class="comment-like-btn ${c.isLiked ? 'liked' : ''}" data-comment-id="${c._id}">
              <svg viewBox="0 0 24 24" fill="${c.isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              <span class="clikes">${c.likesCount || 0}</span>
            </button>
            ${isOwn ? `<button class="comment-delete-btn" data-comment-id="${c._id}" data-post-id="${postId}">Delete</button>` : ''}
          </div>
        </div>
      </div>`;
  };

  const submitComment = async (section, post, card) => {
    const textarea = section.querySelector(`#comment-input-${post._id}`);
    const btn = section.querySelector('.submit-comment-btn');
    const content = textarea.value.trim();
    if (!content) return;

    btn.disabled = true; btn.textContent = 'Posting...';
    try {
      const { comment } = await API.posts.createComment(post._id, { content });
      const list = section.querySelector('.comments-list');
      const commentHTML = buildCommentHTML(comment, post._id);
      list.insertAdjacentHTML('beforeend', commentHTML);

      // Attach handlers to new comment
      const newComment = list.lastElementChild;
      newComment.querySelectorAll('.comment-like-btn').forEach(b => b.addEventListener('click', () => handleCommentLike(b)));
      newComment.querySelectorAll('.comment-delete-btn').forEach(b => b.addEventListener('click', () => handleCommentDelete(b, post, card)));
      newComment.querySelectorAll('[data-link]').forEach(el => {
        el.addEventListener('click', (e) => { e.preventDefault(); Router.navigate(el.getAttribute('href')); });
      });

      // Update count
      const countEl = card.querySelector('.comment-count');
      post.commentsCount = (post.commentsCount || 0) + 1;
      countEl.textContent = Utils.formatNum(post.commentsCount);

      textarea.value = ''; textarea.style.height = 'auto';
    } catch (err) { Toast.error(err.message); }
    finally { btn.disabled = false; btn.textContent = 'Post'; }
  };

  const handleCommentLike = async (btn) => {
    const cid = btn.dataset.commentId;
    btn.disabled = true;
    try {
      const { isLiked, likesCount } = await API.posts.likeComment(cid);
      btn.classList.toggle('liked', isLiked);
      btn.querySelector('svg').setAttribute('fill', isLiked ? 'currentColor' : 'none');
      btn.querySelector('.clikes').textContent = likesCount;
    } catch (err) { Toast.error(err.message); }
    finally { btn.disabled = false; }
  };

  const handleCommentDelete = async (btn, post, card) => {
    const cid = btn.dataset.commentId;
    const postId = btn.dataset.postId;
    if (!confirm('Delete this comment?')) return;
    try {
      await API.posts.deleteComment(postId, cid);
      btn.closest('.comment-item').remove();
      post.commentsCount = Math.max(0, (post.commentsCount || 0) - 1);
      card.querySelector('.comment-count').textContent = Utils.formatNum(post.commentsCount);
    } catch (err) { Toast.error(err.message); }
  };

  const startEditPost = (card, post) => {
    const contentEl = card.querySelector('.post-content');
    const originalText = post.content;

    const editArea = document.createElement('textarea');
    editArea.className = 'post-edit-area';
    editArea.value = originalText;
    contentEl.replaceWith(editArea);
    Utils.autoResize(editArea);
    editArea.addEventListener('input', () => Utils.autoResize(editArea));
    editArea.focus();

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'post-edit-actions';
    actionsDiv.innerHTML = `
      <button class="btn-secondary btn-sm cancel-edit-btn">Cancel</button>
      <button class="btn-primary btn-sm save-edit-btn">Save</button>
    `;
    editArea.after(actionsDiv);

    actionsDiv.querySelector('.cancel-edit-btn').addEventListener('click', () => {
      editArea.replaceWith(contentEl);
      actionsDiv.remove();
    });

    actionsDiv.querySelector('.save-edit-btn').addEventListener('click', async () => {
      const newContent = editArea.value.trim();
      if (!newContent || newContent === originalText) {
        editArea.replaceWith(contentEl);
        actionsDiv.remove();
        return;
      }
      try {
        const { post: updated } = await API.posts.update(post._id, { content: newContent });
        post.content = updated.content;
        post.isEdited = true;
        contentEl.innerHTML = Utils.linkify(updated.content);
        editArea.replaceWith(contentEl);
        actionsDiv.remove();
        // Show edited badge
        const timeEl = card.querySelector('.post-time');
        if (!card.querySelector('.edited-badge')) {
          timeEl.insertAdjacentHTML('afterend', '<span class="edited-badge">edited</span>');
        }
        Toast.success('Post updated.');
      } catch (err) { Toast.error(err.message); }
    });
  };

  const confirmDeletePost = (card, post) => {
    const modal = Modal.open(`
      <div class="confirm-dialog">
        <p>Are you sure you want to delete this post? This action cannot be undone.</p>
        <div class="confirm-actions">
          <button class="btn-secondary" id="cancel-del">Cancel</button>
          <button class="btn-danger" id="confirm-del">Delete Post</button>
        </div>
      </div>
    `, 'Delete Post');

    modal.querySelector('#cancel-del').addEventListener('click', Modal.close);
    modal.querySelector('#confirm-del').addEventListener('click', async () => {
      try {
        await API.posts.delete(post._id);
        Modal.close();
        card.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => card.remove(), 300);
        Toast.success('Post deleted.');
      } catch (err) { Toast.error(err.message); }
    });
  };

  return { build, loadComments };
})();

/* ─── POST COMPOSER ──────────────────────── */
const PostComposer = (() => {
  const render = (onPost) => {
    const user = Auth.getUser();
    if (!user) return '';

    const avatarBg = Utils.avatarColor(user.username);
    const avatarContent = user.avatar
      ? `<img src="${user.avatar}" alt="${Utils.escapeHtml(user.displayName)}" onerror="this.remove();this.parentElement.textContent='${Utils.initials(user.displayName || user.username)}'">`
      : Utils.initials(user.displayName || user.username);

    return `
      <div class="post-composer" id="post-composer">
        <div class="composer-header">
          <div class="avatar avatar-sm" style="background:${avatarBg}">${avatarContent}</div>
          <div style="flex:1">
            <textarea class="composer-textarea" id="composer-text" placeholder="Share a moment, ${user.displayName || user.username}..." rows="2"></textarea>
          </div>
        </div>
        <div class="composer-body">
          <input type="file" id="composer-images" accept="image/*" multiple style="display:none" />
          <div class="composer-images" id="composer-images-preview" style="display:none"></div>
          <input type="text" class="composer-tags-input" id="composer-tags" placeholder="#fun #music #travel" />
          <div class="composer-footer">
            <div class="composer-tools">
              <button class="composer-tool-btn" id="add-photo-btn" title="Add photos">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                Photo
              </button>
            </div>
            <div style="display:flex;align-items:center;gap:10px">
              <span class="char-counter" id="char-counter">0 / 3000</span>
              <button class="btn-primary btn-sm" id="composer-submit-btn">Post</button>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const attach = (onPost) => {
    const textarea = document.getElementById('composer-text');
    const counter  = document.getElementById('char-counter');
    const addPhotoBtn = document.getElementById('add-photo-btn');
    const fileInput = document.getElementById('composer-images');
    const preview = document.getElementById('composer-images-preview');
    const submitBtn = document.getElementById('composer-submit-btn');

    if (!textarea) return;

    const files = [];

    const renderPreview = () => {
      if (!preview) return;
      if (files.length === 0) {
        preview.style.display = 'none';
        preview.innerHTML = '';
        return;
      }

      preview.style.display = 'grid';
      preview.innerHTML = files.map((f, idx) => `
        <div class="composer-image-item">
          <img src="${f.url}" alt="Selected image ${idx + 1}" />
          <button class="composer-image-remove" type="button" data-index="${idx}" aria-label="Remove image">×</button>
        </div>
      `).join('');

      preview.querySelectorAll('.composer-image-remove').forEach(btn => {
        btn.addEventListener('click', () => {
          const index = Number(btn.dataset.index);
          if (!Number.isFinite(index) || index < 0 || index >= files.length) return;
          try { URL.revokeObjectURL(files[index].url); } catch (e) {}
          files.splice(index, 1);
          renderPreview();
        });
      });
    };

    textarea.addEventListener('input', () => {
      Utils.autoResize(textarea);
      const len = textarea.value.length;
      counter.textContent = `${len} / 3000`;
      counter.className = 'char-counter' + (len > 2800 ? ' danger' : len > 2400 ? ' warning' : '');
    });

    addPhotoBtn?.addEventListener('click', () => {
      fileInput?.click();
    });

    fileInput?.addEventListener('change', () => {
      const selected = Array.from(fileInput.files || []);
      if (!selected.length) return;

      const remaining = Math.max(0, 4 - files.length);
      if (remaining === 0) {
        Toast.warning('Max 4 photos per post.');
        fileInput.value = '';
        return;
      }

      selected.slice(0, remaining).forEach(file => {
        const url = URL.createObjectURL(file);
        files.push({ file, url });
      });

      if (selected.length > remaining) Toast.warning('Only 4 photos allowed per post.');
      fileInput.value = '';
      renderPreview();
    });

    submitBtn?.addEventListener('click', async () => {
      const content = textarea.value.trim();
      if (!content) { Toast.warning('Write something first!'); return; }

      const tagsRaw = document.getElementById('composer-tags')?.value || '';
      const tags = tagsRaw.split(/[\s,#]+/).filter(t => t.trim().length > 0).map(t => t.toLowerCase().replace(/^#/, ''));

      const codeSnippet = {};

      submitBtn.disabled = true; submitBtn.textContent = 'Posting...';
      try {
        const payload = (() => {
          if (!files.length) return { content, tags, codeSnippet };
          const fd = new FormData();
          fd.append('content', content);
          fd.append('tags', JSON.stringify(tags));
          fd.append('codeSnippet', JSON.stringify(codeSnippet));
          files.forEach(f => fd.append('images', f.file, f.file.name));
          return fd;
        })();

        const { post } = await API.posts.create(payload);
        textarea.value = ''; textarea.style.height = 'auto';
        document.getElementById('composer-tags').value = '';
        counter.textContent = '0 / 3000';
        files.forEach(f => { try { URL.revokeObjectURL(f.url); } catch (e) {} });
        files.splice(0, files.length);
        renderPreview();
        if (typeof onPost === 'function') onPost(post);
        Toast.success('Posted!');
      } catch (err) { Toast.error(err.message); }
      finally { submitBtn.disabled = false; submitBtn.textContent = 'Post'; }
    });
  };

  return { render, attach };
})();

/* ─── SIDEBAR ────────────────────────────── */
const Sidebar = (() => {
  const renderLeft = (activePage = 'home') => {
    const user = Auth.getUser();
    const content = document.getElementById('sidebar-content');
    if (!content) return;

    if (user) {
      const avatarBg = Utils.avatarColor(user.username);
      const avatarContent = user.avatar
        ? `<img src="${user.avatar}" alt="" onerror="this.remove();this.parentElement.textContent='${Utils.initials(user.displayName || user.username)}'">`
        : Utils.initials(user.displayName || user.username);

      content.innerHTML = `
        <div class="sidebar-user-card" id="sidebar-profile-link">
          <div class="avatar avatar-sm" style="background:${avatarBg}">${avatarContent}</div>
          <div class="sidebar-user-info">
            <div class="sidebar-username">${Utils.escapeHtml(user.displayName || user.username)}</div>
            <div class="sidebar-handle">@${user.username}</div>
          </div>
        </div>
        <nav class="sidebar-nav">
          <a class="sidebar-nav-item ${activePage === 'home' ? 'active' : ''}" href="/" data-link>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Home
          </a>
          <a class="sidebar-nav-item ${activePage === 'explore' ? 'active' : ''}" href="/explore" data-link>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
            Explore
          </a>
          <a class="sidebar-nav-item ${activePage === 'profile' ? 'active' : ''}" href="/profile/${user.username}" data-link>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Profile
          </a>
        </nav>
        <div class="divider" style="margin:16px 0"></div>
        <button class="sidebar-nav-item" id="logout-sidebar-btn" style="width:100%;color:var(--color-text-muted)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sign Out
        </button>
      `;

      content.querySelectorAll('[data-link]').forEach(el => {
        el.addEventListener('click', (e) => { e.preventDefault(); Router.navigate(el.getAttribute('href')); });
      });
      content.querySelector('#sidebar-profile-link')?.addEventListener('click', () => Router.navigate(`/profile/${user.username}`));
      content.querySelector('#logout-sidebar-btn')?.addEventListener('click', async () => {
        try { await API.auth.logout(); } catch(e) {}
        Auth.clear();
        Toast.info('Signed out.');
        Router.navigate('/login');
      });
    } else {
      content.innerHTML = `
        <nav class="sidebar-nav">
          <a class="sidebar-nav-item ${activePage === 'explore' ? 'active' : ''}" href="/explore" data-link>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
            Explore
          </a>
          <a class="sidebar-nav-item ${activePage === 'login' ? 'active' : ''}" href="/login" data-link>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            Sign In
          </a>
          <a class="sidebar-nav-item ${activePage === 'register' ? 'active' : ''}" href="/register" data-link>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
            Join DevLink
          </a>
        </nav>
      `;
      content.querySelectorAll('[data-link]').forEach(el => {
        el.addEventListener('click', (e) => { e.preventDefault(); Router.navigate(el.getAttribute('href')); });
      });
    }
  };

  const renderRight = async () => {
    const container = document.getElementById('sidebar-right-content');
    if (!container) return;

    const user = Auth.getUser();
    container.innerHTML = '<div class="page-loading" style="padding:20px 0"><div class="spinner"></div></div>';

    try {
      let suggestionsHTML = '';
      if (user) {
        try {
          const { users } = await API.users.suggestions();
          if (users.length > 0) {
            suggestionsHTML = `
              <div class="widget-card right-sidebar-section">
                <div class="widget-title">Who to follow</div>
                ${users.map(u => `
                  <div class="suggestion-item">
                    <div class="avatar avatar-xs" style="background:${Utils.avatarColor(u.username)};cursor:pointer" data-username="${u.username}">
                      ${u.avatar ? `<img src="${u.avatar}" onerror="this.remove();this.parentElement.textContent='${Utils.initials(u.displayName || u.username)}'">`
                               : Utils.initials(u.displayName || u.username)}
                    </div>
                    <div class="suggestion-info">
                      <div class="suggestion-name" data-username="${u.username}">${Utils.escapeHtml(u.displayName || u.username)}</div>
                      <div class="suggestion-handle">@${u.username}</div>
                    </div>
                    <button class="follow-btn-small" data-username="${u.username}">Follow</button>
                  </div>
                `).join('')}
              </div>`;
          }
        } catch(e) {}
      }

      container.innerHTML = `
        ${suggestionsHTML}
        <div class="widget-card">
          <div class="widget-title">DevLink</div>
          <div class="footer-links">
            <span class="footer-link" data-link href="/explore">Explore</span>
            <span class="footer-link" id="terms-link">Terms</span>
            <span class="footer-link" id="about-link">About</span>
          </div>
          <div style="padding:8px 16px 14px;font-size:11px;color:var(--color-text-muted);font-family:var(--font-mono)">
            © ${new Date().getFullYear()} DevLink
          </div>
        </div>
      `;

      // Follow buttons
      container.querySelectorAll('.follow-btn-small').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const username = btn.dataset.username;
          try {
            const { isFollowing } = await API.users.follow(username);
            btn.textContent = isFollowing ? 'Following' : 'Follow';
            btn.classList.toggle('following', isFollowing);
          } catch (err) {
            if (err.status === 401) Router.navigate('/login');
            else Toast.error(err.message);
          }
        });
      });

      // Name clicks
      container.querySelectorAll('.suggestion-name, [data-username]').forEach(el => {
        if (el.dataset.username) {
          el.style.cursor = 'pointer';
          el.addEventListener('click', () => Router.navigate(`/profile/${el.dataset.username}`));
        }
      });

    } catch(err) {
      container.innerHTML = '';
    }
  };

  return { renderLeft, renderRight };
})();

/* ─── NAV AUTH AREA ──────────────────────── */
const NavAuth = (() => {
  const render = () => {
    const area = document.getElementById('auth-nav-area');
    if (!area) return;
    const user = Auth.getUser();

    if (user) {
      const avatarBg = Utils.avatarColor(user.username);
      area.innerHTML = `
        <div class="avatar avatar-sm" id="nav-avatar" style="cursor:pointer;background:${avatarBg}" title="Your profile">
          ${user.avatar ? `<img src="${user.avatar}" onerror="this.remove();this.parentElement.textContent='${Utils.initials(user.displayName || user.username)}'">` : Utils.initials(user.displayName || user.username)}
        </div>
      `;
      area.querySelector('#nav-avatar')?.addEventListener('click', () => Router.navigate(`/profile/${user.username}`));
    } else {
      area.innerHTML = `
        <button class="btn-secondary btn-sm" id="nav-login-btn">Sign In</button>
        <button class="btn-primary btn-sm" id="nav-register-btn">Join</button>
      `;
      area.querySelector('#nav-login-btn')?.addEventListener('click', () => Router.navigate('/login'));
      area.querySelector('#nav-register-btn')?.addEventListener('click', () => Router.navigate('/register'));
    }
  };
  return { render };
})();

/* ─── SEARCH ─────────────────────────────── */
const GlobalSearch = (() => {
  const init = () => {
    const input    = document.getElementById('global-search');
    const dropdown = document.getElementById('search-dropdown');
    if (!input) return;

    const search = Utils.debounce(async (q) => {
      if (q.length < 2) { dropdown.classList.remove('active'); return; }
      try {
        const { users } = await API.users.search(q);
        if (!users.length) {
          dropdown.innerHTML = '<div style="padding:14px;text-align:center;color:var(--color-text-muted);font-size:13px;">No results</div>';
        } else {
          dropdown.innerHTML = users.slice(0, 6).map(u => `
            <div class="search-result-item" data-username="${u.username}">
              <div class="avatar avatar-xs" style="background:${Utils.avatarColor(u.username)};flex-shrink:0">
                ${u.avatar ? `<img src="${u.avatar}" onerror="this.remove()">` : Utils.initials(u.displayName || u.username)}
              </div>
              <div>
                <div style="font-size:13px;font-weight:600">${Utils.escapeHtml(u.displayName || u.username)}</div>
                <div style="font-size:11px;color:var(--color-text-muted);font-family:var(--font-mono)">@${u.username}</div>
              </div>
            </div>
          `).join('');
        }
        dropdown.classList.add('active');
        dropdown.querySelectorAll('.search-result-item').forEach(item => {
          item.addEventListener('click', () => {
            Router.navigate(`/profile/${item.dataset.username}`);
            dropdown.classList.remove('active');
            input.value = '';
          });
        });
      } catch(e) {}
    }, 300);

    input.addEventListener('input', (e) => search(e.target.value.trim()));
    input.addEventListener('focus', (e) => { if (e.target.value.trim().length >= 2) dropdown.classList.add('active'); });
    document.addEventListener('click', (e) => {
      if (!input.contains(e.target) && !dropdown.contains(e.target)) dropdown.classList.remove('active');
    });
  };
  return { init };
})();

window.Toast = Toast;
window.Modal = Modal;
window.AuthForms = AuthForms;
window.PostCard = PostCard;
window.PostComposer = PostComposer;
window.Sidebar = Sidebar;
window.NavAuth = NavAuth;
window.GlobalSearch = GlobalSearch;
