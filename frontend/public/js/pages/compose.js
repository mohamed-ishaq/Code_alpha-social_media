/* pages/compose.js */

const ComposePage = (() => {
  const render = async () => {
    if (!Auth.isLoggedIn()) {
      Router.navigate('/login', true);
      return;
    }

    const content = document.getElementById('content-area');
    content.innerHTML = `
      <div class="section-header">
        <span class="section-title">Create Post</span>
      </div>
      ${PostComposer.render()}
      <div class="empty-state" style="padding:18px 20px;border-top:1px solid var(--color-border-dim)">
        <div class="empty-desc">Your post will appear on Home after publishing.</div>
      </div>
    `;

    PostComposer.attach((newPost) => {
      Toast.success('Posted!');
      Router.navigate('/');
    });
  };

  return { render };
})();

window.ComposePage = ComposePage;

