/* app.js — Application entry point */

const App = (() => {
  const init = async () => {
    // Navbar scroll effect
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });

    // Quick nav actions
    document.getElementById('explore-btn')?.addEventListener('click', () => Router.navigate('/explore'));

    // Verify auth session with server
    if (Auth.isLoggedIn()) {
      await Auth.verify().catch(() => {});
    }

    // Render nav auth area (based on current auth state)
    NavAuth.render();

    // Init global search
    GlobalSearch.init();

    // Re-render nav auth when auth changes
    Auth.onChange(() => NavAuth.render());

    // Start router
    Router.init();
  };

  return { init };
})();

// Boot when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
