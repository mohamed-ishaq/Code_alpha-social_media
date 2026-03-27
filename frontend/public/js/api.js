/* api.js — Centralized API client */

const API = (() => {
  const BASE = '/api';

  const getToken = () => localStorage.getItem('devlink_token');

  const headers = (body, extra = {}) => {
    const isForm = (typeof FormData !== 'undefined') && (body instanceof FormData);
    const h = { ...extra };
    const token = getToken();
    if (token) h['Authorization'] = `Bearer ${token}`;
    if (!isForm && !h['Content-Type']) h['Content-Type'] = 'application/json';
    return h;
  };

  const request = async (method, path, body = null, opts = {}) => {
    const config = {
      method,
      headers: headers(body, opts.headers || {}),
    };

    const isForm = (typeof FormData !== 'undefined') && (body instanceof FormData);
    if (body !== null) config.body = isForm ? body : JSON.stringify(body);

    const res = await fetch(`${BASE}${path}`, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const err = new Error(data.message || 'Request failed');
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  };

  return {
    get:    (path, opts)       => request('GET',    path, null, opts),
    post:   (path, body, opts) => request('POST',   path, body, opts),
    put:    (path, body, opts) => request('PUT',    path, body, opts),
    delete: (path, opts)       => request('DELETE', path, null, opts),

    // Auth
    auth: {
      register: (data)   => request('POST', '/auth/register', data),
      login:    (data)   => request('POST', '/auth/login', data),
      me:       ()       => request('GET',  '/auth/me'),
      logout:   ()       => request('POST', '/auth/logout'),
    },

    // Users
    users: {
      get:         (username)       => request('GET',  `/users/${username}`),
      getPosts:    (username, p=1)  => request('GET',  `/users/${username}/posts?page=${p}`),
      getFollowers:(username, p=1)  => request('GET',  `/users/${username}/followers?page=${p}`),
      getFollowing:(username, p=1)  => request('GET',  `/users/${username}/following?page=${p}`),
      follow:      (username)       => request('POST', `/users/${username}/follow`),
      update:      (data)           => request('PUT',  '/users/profile', data),
      search:      (q, p=1)         => request('GET',  `/users/search?q=${encodeURIComponent(q)}&page=${p}`),
      suggestions: ()               => request('GET',  '/users/suggestions'),
    },

    // Posts
    posts: {
      getFeed:    (p=1)         => request('GET',    `/posts/feed?page=${p}`),
      getExplore: (p=1, tag='') => request('GET',    `/posts/explore?page=${p}${tag ? `&tag=${tag}` : ''}`),
      get:        (id)          => request('GET',    `/posts/${id}`),
      create:     (data)        => request('POST',   '/posts', data),
      update:     (id, data)    => request('PUT',    `/posts/${id}`, data),
      delete:     (id)          => request('DELETE', `/posts/${id}`),
      like:       (id)          => request('POST',   `/posts/${id}/like`),

      // Comments
      getComments:   (postId, p=1) => request('GET',    `/posts/${postId}/comments?page=${p}`),
      createComment: (postId, data)=> request('POST',   `/posts/${postId}/comments`, data),
      deleteComment: (postId, cid) => request('DELETE', `/posts/${postId}/comments/${cid}`),
      likeComment:   (cid)         => request('POST',   `/posts/comments/${cid}/like`),
    },

    // Notifications
    notifications: {
      list: (limit = 50) => request('GET', `/notifications?limit=${limit}`),
    },
  };
})();

window.API = API;
