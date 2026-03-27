/* utils.js — Shared helpers */

const Utils = (() => {

  // Relative time
  const timeAgo = (date) => {
    const d = new Date(date);
    const now = Date.now();
    const diff = now - d.getTime();
    const s = Math.floor(diff / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const day = Math.floor(h / 24);
    const wk  = Math.floor(day / 7);
    const mo  = Math.floor(day / 30);
    const yr  = Math.floor(day / 365);
    if (s < 60)   return `${s}s`;
    if (m < 60)   return `${m}m`;
    if (h < 24)   return `${h}h`;
    if (day < 7)  return `${day}d`;
    if (wk < 5)   return `${wk}w`;
    if (mo < 12)  return `${mo}mo`;
    return `${yr}y`;
  };

  // Format large numbers
  const formatNum = (n) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
    return String(n);
  };

  // Get initials from display name
  const initials = (name = '') => {
    return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  };

  // Build avatar element
  const buildAvatar = (user, sizeClass = 'avatar-sm') => {
    const el = document.createElement('div');
    el.className = `avatar ${sizeClass}`;
    if (user && user.avatar) {
      const img = document.createElement('img');
      img.src = user.avatar;
      img.alt = user.displayName || user.username;
      img.onerror = () => { img.remove(); el.textContent = initials(user.displayName || user.username); };
      el.appendChild(img);
    } else {
      el.textContent = initials((user && (user.displayName || user.username)) || '?');
    }
    return el;
  };

  // Escape HTML
  const escapeHtml = (str = '') =>
    str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
       .replace(/"/g,'&quot;').replace(/'/g,'&#039;');

  // Linkify mentions & hashtags in text
  const linkify = (text = '') => {
    return escapeHtml(text)
      .replace(/@([a-zA-Z0-9_]+)/g, '<a class="text-accent" href="/profile/$1" data-link>@$1</a>')
      .replace(/#([a-zA-Z0-9_]+)/g, '<span class="tag-chip" data-tag="$1">#$1</span>');
  };

  // Debounce
  const debounce = (fn, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  };

  // Copy to clipboard
  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    }
  };

  // Auto-resize textarea
  const autoResize = (el) => {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  };

  // Truncate
  const truncate = (str, max = 120) =>
    str.length > max ? str.slice(0, max) + '…' : str;

  // Validate URL
  const isValidUrl = (str) => {
    try { new URL(str); return true; } catch { return false; }
  };

  // Generate random avatar bg gradient
  const avatarColor = (username = '') => {
    const colors = [
      'linear-gradient(135deg,#38bdf8,#818cf8)',
      'linear-gradient(135deg,#34d399,#38bdf8)',
      'linear-gradient(135deg,#f472b6,#818cf8)',
      'linear-gradient(135deg,#fb923c,#f59e0b)',
      'linear-gradient(135deg,#a78bfa,#38bdf8)',
      'linear-gradient(135deg,#4ade80,#a3e635)',
    ];
    let hash = 0;
    for (const c of username) hash = (hash << 5) - hash + c.charCodeAt(0);
    return colors[Math.abs(hash) % colors.length];
  };

  return { timeAgo, formatNum, initials, buildAvatar, escapeHtml, linkify, debounce, copyText, autoResize, truncate, isValidUrl, avatarColor };
})();

window.Utils = Utils;
