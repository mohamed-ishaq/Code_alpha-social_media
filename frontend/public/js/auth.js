/* auth.js — Auth state management */

const Auth = (() => {
  const TOKEN_KEY = 'devlink_token';
  const USER_KEY  = 'devlink_user';

  let _user = null;
  let _listeners = [];

  const init = () => {
    const stored = localStorage.getItem(USER_KEY);
    if (stored) {
      try { _user = JSON.parse(stored); } catch(e) { clear(); }
    }
  };

  const setSession = (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    _user = user;
    _notify();
  };

  const updateUser = (userData) => {
    _user = { ..._user, ...userData };
    localStorage.setItem(USER_KEY, JSON.stringify(_user));
    _notify();
  };

  const clear = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    _user = null;
    _notify();
  };

  const getUser  = () => _user;
  const getToken = () => localStorage.getItem(TOKEN_KEY);
  const isLoggedIn = () => !!_user && !!getToken();

  const onChange = (fn) => {
    _listeners.push(fn);
    return () => { _listeners = _listeners.filter(l => l !== fn); };
  };

  const _notify = () => _listeners.forEach(fn => fn(_user));

  // Verify token with server on page load
  const verify = async () => {
    if (!getToken()) return false;
    try {
      const { user } = await API.auth.me();
      updateUser(user);
      return true;
    } catch (e) {
      if (e.status === 401) clear();
      return false;
    }
  };

  init();
  return { setSession, updateUser, clear, getUser, getToken, isLoggedIn, onChange, verify };
})();

window.Auth = Auth;
