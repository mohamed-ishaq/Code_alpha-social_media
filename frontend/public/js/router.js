/* router.js — Client-side SPA router */

const Router = (() => {
  const routes = [
    { pattern: /^\/$/, page: 'home' },
    { pattern: /^\/login$/, page: 'login' },
    { pattern: /^\/register$/, page: 'register' },
    { pattern: /^\/explore$/, page: 'explore' },
    { pattern: /^\/notifications$/, page: 'notifications' },
    { pattern: /^\/profile\/([a-zA-Z0-9_]+)$/, page: 'profile', param: 1 },
    { pattern: /^\/post\/([a-zA-Z0-9]+)$/, page: 'post', param: 1 },
  ];

  const navigate = (path, replace = false) => {
    if (replace) {
      window.history.replaceState(null, '', path);
    } else {
      window.history.pushState(null, '', path);
    }
    dispatch(path);
  };

  const dispatch = async (path) => {
    const url = new URL(path, window.location.origin);
    const pathname = url.pathname;
    const searchParams = url.searchParams;

    // Close any open modal
    Modal.close();

    // Scroll to top
    window.scrollTo({ top: 0 });

    let matched = false;
    for (const route of routes) {
      const m = pathname.match(route.pattern);
      if (m) {
        matched = true;
        const param = route.param ? m[route.param] : null;
        await renderPage(route.page, param, searchParams);
        break;
      }
    }

    if (!matched) {
      render404();
    }
  };

  const renderPage = async (page, param, searchParams) => {
    const isLanding = page === 'home' && !Auth.isLoggedIn();
    document.body.classList.toggle('mode-landing', isLanding);
    document.body.classList.toggle('mode-app', !isLanding);

    // Update nav + sidebar
    NavAuth.render();
    Sidebar.renderLeft(page);
    Sidebar.renderRight();

    switch (page) {
      case 'home':
        if (!Auth.isLoggedIn()) {
          HomePage.render();
          Sidebar.renderLeft('home');
        } else {
          await HomePage.render();
        }
        break;

      case 'login':
        if (Auth.isLoggedIn()) { navigate('/', true); return; }
        document.getElementById('content-area').innerHTML = AuthForms.renderLoginPage();
        AuthForms.attachLoginHandlers();
        Sidebar.renderLeft('login');
        break;

      case 'register':
        if (Auth.isLoggedIn()) { navigate('/', true); return; }
        document.getElementById('content-area').innerHTML = AuthForms.renderRegisterPage();
        AuthForms.attachRegisterHandlers();
        Sidebar.renderLeft('register');
        break;

      case 'explore': {
        const tag = searchParams.get('tag') || '';
        await ExplorePage.render({ tag });
        Sidebar.renderLeft('explore');
        break;
      }

      case 'profile':
        await ProfilePage.render(param);
        Sidebar.renderLeft('profile');
        break;

      case 'notifications':
        await NotificationsPage.render();
        Sidebar.renderLeft('notifications');
        break;

      case 'post':
        await renderSinglePost(param);
        break;

      default:
        render404();
    }
  };

  const renderSinglePost = async (postId) => {
    const content = document.getElementById('content-area');
    content.innerHTML = '<div class="page-loading" style="margin-top:60px"><div class="spinner"></div></div>';
    try {
      const { post } = await API.posts.get(postId);
      content.innerHTML = `
        <div class="section-header">
          <button class="btn-icon" onclick="history.back()" title="Back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
          <span class="section-title">Post</span>
        </div>
        <div id="single-post-wrap"></div>
      `;
      const card = PostCard.build(post, { expanded: true });
      document.getElementById('single-post-wrap').appendChild(card);
      // Auto-open comments
      const commentBtn = card.querySelector('.comment-btn');
      if (commentBtn) commentBtn.click();
    } catch (err) {
      content.innerHTML = `<div class="error-state" style="margin-top:60px">Post not found.</div>`;
    }
  };

  const render404 = () => {
    document.getElementById('content-area').innerHTML = `
      <div class="empty-state" style="margin-top:80px">
        <div class="empty-icon">🗺️</div>
        <div class="empty-title">404 — Page not found</div>
        <div class="empty-desc">The page you're looking for doesn't exist.</div>
        <button class="btn-primary" onclick="Router.navigate('/')">Go Home</button>
      </div>
    `;
  };

  const init = () => {
    // Handle browser back/forward
    window.addEventListener('popstate', () => dispatch(window.location.pathname + window.location.search));

    // Handle all data-link clicks globally (delegation)
    document.addEventListener('click', (e) => {
      const link = e.target.closest('[data-link]');
      if (link) {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (href && href !== window.location.pathname) navigate(href);
      }
    });

    // Initial dispatch
    dispatch(window.location.pathname + window.location.search);
  };

  return { navigate, dispatch, init };
})();

window.Router = Router;
