# ⬡ DevLink — Share Photos & Moments

A production-ready, full-stack social app for sharing photos, moments, and vibes. Follow people, like and comment on posts, and explore what's trending.

![DevLink](https://img.shields.io/badge/DevLink-v1.0.0-38bdf8?style=for-the-badge)
![Node](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=for-the-badge&logo=mongodb)

---

## ✨ Features

### Core
- **User Profiles** — Custom avatars, bios, interests, links, location
- **Posts** — Rich text posts with photos and hashtags
- **Comments** — Nested comment threads on every post
- **Likes** — Like posts and comments
- **Follow System** — Follow/unfollow users, follower/following counts
- **Feed** — Personalized home feed from users you follow
- **Explore** — Browse all public posts, filter by tag, discover people
- **Search** — Real-time search for users
- **Edit/Delete** — Full CRUD on your own posts

### Technical
- **JWT Authentication** — Secure stateless auth with 7-day tokens
- **Rate Limiting** — Per-endpoint protection against abuse
- **Input Validation** — Server-side validation with express-validator
- **Security Headers** — Helmet.js + CORS
- **SPA Routing** — Client-side router with browser history API
- **Infinite Scroll** — IntersectionObserver-based feed pagination
- **Optimistic UI** — Instant like/unlike feedback
- **Toast Notifications** — Non-blocking feedback system
- **Responsive** — Works on mobile, tablet, and desktop

---

## 🛠 Tech Stack

| Layer     | Technology                  |
|-----------|-----------------------------|
| Frontend  | Vanilla HTML, CSS, JavaScript (SPA) |
| Backend   | Express.js (Node.js)         |
| Database  | MongoDB (Mongoose ODM)       |
| Auth      | JWT (jsonwebtoken + bcryptjs)|
| Security  | Helmet, CORS, express-rate-limit |
| Validation| express-validator            |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 6+ (local or Atlas)

### 1. Clone & Install

```bash
git clone <repo-url>
cd devlink
cd backend && npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/devlink
JWT_SECRET=your-super-secret-256-bit-key-here
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5000
```

### 3. Start the Server

```bash
cd backend
npm start          # production
npm run dev        # development (nodemon)
```

Open: **http://localhost:5000**

---

## 🐳 Docker (Optional)

```bash
docker-compose up -d
```

---

## 📁 Project Structure

```
devlink/
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── middleware/
│   │   ├── auth.js            # JWT protect/optionalAuth
│   │   ├── errorHandler.js    # Global error handler
│   │   └── rateLimiter.js     # Rate limiting
│   ├── models/
│   │   ├── User.js            # User schema
│   │   ├── Post.js            # Post schema
│   │   ├── Comment.js         # Comment schema
│   │   ├── Like.js            # Like schema (polymorphic)
│   │   └── Follow.js          # Follow relationship schema
│   ├── routes/
│   │   ├── auth.js            # /api/auth/*
│   │   ├── users.js           # /api/users/*
│   │   └── posts.js           # /api/posts/*
│   ├── server.js              # Express app entry
│   ├── .env.example
│   └── package.json
│
└── frontend/
    └── public/
        ├── index.html         # SPA shell
        ├── css/
        │   ├── style.css      # Design system + base styles
        │   ├── components.css # Component extras
        │   └── animations.css # Keyframes + transitions
        └── js/
            ├── api.js         # API client (all fetch wrappers)
            ├── auth.js        # Auth state manager
            ├── utils.js       # Shared utilities
            ├── components.js  # Toast, Modal, PostCard, Sidebar, etc.
            ├── router.js      # Client-side SPA router
            ├── app.js         # App entry point
            └── pages/
                ├── home.js    # Home/Feed page
                ├── profile.js # User profile page
                └── explore.js # Explore/Discover page
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Login |
| GET | `/api/auth/me` | ✓ | Current user |
| POST | `/api/auth/logout` | ✓ | Logout |

### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/search?q=` | Optional | Search users |
| GET | `/api/users/suggestions` | ✓ | Who to follow |
| GET | `/api/users/:username` | Optional | Get profile |
| PUT | `/api/users/profile` | ✓ | Update profile |
| POST | `/api/users/:username/follow` | ✓ | Follow/unfollow |
| GET | `/api/users/:username/followers` | Optional | Get followers |
| GET | `/api/users/:username/following` | Optional | Get following |
| GET | `/api/users/:username/posts` | Optional | Get user posts |

### Posts
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/posts/feed` | ✓ | Home feed |
| GET | `/api/posts/explore` | Optional | All public posts |
| POST | `/api/posts` | ✓ | Create post |
| GET | `/api/posts/:id` | Optional | Get single post |
| PUT | `/api/posts/:id` | ✓ | Edit post |
| DELETE | `/api/posts/:id` | ✓ | Delete post |
| POST | `/api/posts/:id/like` | ✓ | Like/unlike post |
| GET | `/api/posts/:id/comments` | Optional | Get comments |
| POST | `/api/posts/:id/comments` | ✓ | Add comment |
| DELETE | `/api/posts/:postId/comments/:commentId` | ✓ | Delete comment |
| POST | `/api/posts/comments/:commentId/like` | ✓ | Like/unlike comment |

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Primary | `#0F172A` |
| Secondary | `#1E293B` |
| Accent | `#38BDF8` |
| Background | `#020617` |
| Card | `#111827` |
| Text | `#E5E7EB` |
| Font Display | Syne |
| Font Mono | JetBrains Mono |
| Font Body | Inter |

---

## 🔒 Security Checklist

- [x] Passwords hashed with bcrypt (12 rounds)
- [x] JWT with expiry
- [x] HTTP security headers (Helmet)
- [x] CORS configured
- [x] Rate limiting on all routes
- [x] Input validation + sanitization
- [x] Parameterized queries (Mongoose)
- [x] Auth on all protected routes
- [x] Ownership check before edit/delete
- [x] Compound unique indexes (prevent duplicate follows/likes)

---

## 📄 License

MIT — free to use, modify, and deploy.
