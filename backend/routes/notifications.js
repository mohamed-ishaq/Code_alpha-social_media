const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const Follow = require('../models/Follow');
const Like = require('../models/Like');
const Comment = require('../models/Comment');
const Post = require('../models/Post');

// @GET /api/notifications
// Returns a merged feed of follow/like/comment notifications for the logged-in user.
router.get('/', protect, async (req, res, next) => {
  try {
    const limitRaw = parseInt(req.query.limit, 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 50;

    // Fetch a bit more per category then merge + slice to `limit`
    const perCategory = Math.min(Math.max(limit, 10), 100);

    const [follows, myPosts] = await Promise.all([
      Follow.find({ following: req.user._id })
        .populate('follower', 'username displayName avatar')
        .sort({ createdAt: -1 })
        .limit(perCategory),
      Post.find({ author: req.user._id }).select('_id').limit(2000)
    ]);

    const postIds = myPosts.map(p => p._id);

    let postLikes = [];
    let postComments = [];

    if (postIds.length) {
      [postLikes, postComments] = await Promise.all([
        Like.find({
          targetType: 'post',
          targetId: { $in: postIds },
          user: { $ne: req.user._id }
        })
          .populate('user', 'username displayName avatar')
          .sort({ createdAt: -1 })
          .limit(perCategory),
        Comment.find({
          post: { $in: postIds },
          author: { $ne: req.user._id },
          parentComment: null
        })
          .select('post author content createdAt')
          .populate('author', 'username displayName avatar')
          .sort({ createdAt: -1 })
          .limit(perCategory)
      ]);
    }

    const notifications = [];

    for (const f of follows) {
      if (!f.follower) continue;
      notifications.push({
        id: f._id,
        type: 'follow',
        actor: f.follower,
        createdAt: f.createdAt,
        href: `/profile/${f.follower.username}`
      });
    }

    for (const l of postLikes) {
      if (!l.user) continue;
      notifications.push({
        id: l._id,
        type: 'like',
        actor: l.user,
        createdAt: l.createdAt,
        postId: l.targetId,
        href: `/post/${l.targetId}`
      });
    }

    for (const c of postComments) {
      if (!c.author) continue;
      notifications.push({
        id: c._id,
        type: 'comment',
        actor: c.author,
        createdAt: c.createdAt,
        postId: c.post,
        comment: c.content,
        href: `/post/${c.post}`
      });
    }

    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({
      success: true,
      notifications: notifications.slice(0, limit)
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

