const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Post = require('../models/Post');
const Follow = require('../models/Follow');
const Like = require('../models/Like');
const { protect, optionalAuth } = require('../middleware/auth');

// @GET /api/users/search
router.get('/search', optionalAuth, async (req, res, next) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Search query must be at least 2 characters.' });
    }

    const regex = new RegExp(q.trim(), 'i');
    const users = await User.find({
      $or: [{ username: regex }, { displayName: regex }, { bio: regex }]
    })
      .select('username displayName avatar bio followersCount followingCount postsCount skills')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ followersCount: -1 });

    res.json({ success: true, users, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
});

// @GET /api/users/suggestions
router.get('/suggestions', protect, async (req, res, next) => {
  try {
    const followingIds = await Follow.find({ follower: req.user._id }).distinct('following');
    const excludeIds = [...followingIds, req.user._id];

    const users = await User.find({ _id: { $nin: excludeIds } })
      .select('username displayName avatar bio followersCount skills')
      .sort({ followersCount: -1 })
      .limit(5);

    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
});

// @GET /api/users/:username
router.get('/:username', optionalAuth, async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() })
      .select('-password -email -__v');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let isFollowing = false;
    let isOwnProfile = false;

    if (req.user) {
      isOwnProfile = req.user._id.toString() === user._id.toString();
      if (!isOwnProfile) {
        const follow = await Follow.findOne({ follower: req.user._id, following: user._id });
        isFollowing = !!follow;
      }
    }

    res.json({ success: true, user, isFollowing, isOwnProfile });
  } catch (err) {
    next(err);
  }
});

// @PUT /api/users/profile
router.put('/profile', protect, [
  body('displayName').optional().trim().isLength({ max: 50 }),
  body('bio').optional().trim().isLength({ max: 300 }),
  body('location').optional().trim().isLength({ max: 100 }),
  body('website').optional().trim().isLength({ max: 200 }),
  body('skills').optional().isArray({ max: 15 }),
  body('githubUrl').optional().trim(),
  body('twitterUrl').optional().trim(),
  body('linkedinUrl').optional().trim()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const allowedFields = ['displayName', 'bio', 'location', 'website', 'skills', 'githubUrl', 'twitterUrl', 'linkedinUrl', 'avatar'];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ success: true, message: 'Profile updated successfully.', user });
  } catch (err) {
    next(err);
  }
});

// @POST /api/users/:username/follow
router.post('/:username/follow', protect, async (req, res, next) => {
  try {
    const targetUser = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself.' });
    }

    const existingFollow = await Follow.findOne({ follower: req.user._id, following: targetUser._id });

    if (existingFollow) {
      // Unfollow
      await Follow.deleteOne({ _id: existingFollow._id });
      await User.findByIdAndUpdate(req.user._id, { $inc: { followingCount: -1 } });
      await User.findByIdAndUpdate(targetUser._id, { $inc: { followersCount: -1 } });

      return res.json({ success: true, isFollowing: false, message: `Unfollowed @${targetUser.username}` });
    } else {
      // Follow
      await Follow.create({ follower: req.user._id, following: targetUser._id });
      await User.findByIdAndUpdate(req.user._id, { $inc: { followingCount: 1 } });
      await User.findByIdAndUpdate(targetUser._id, { $inc: { followersCount: 1 } });

      return res.json({ success: true, isFollowing: true, message: `Following @${targetUser.username}` });
    }
  } catch (err) {
    next(err);
  }
});

// @GET /api/users/:username/followers
router.get('/:username/followers', optionalAuth, async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const { page = 1, limit = 20 } = req.query;
    const followers = await Follow.find({ following: user._id })
      .populate('follower', 'username displayName avatar bio followersCount')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({ success: true, followers: followers.map(f => f.follower) });
  } catch (err) {
    next(err);
  }
});

// @GET /api/users/:username/following
router.get('/:username/following', optionalAuth, async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const { page = 1, limit = 20 } = req.query;
    const following = await Follow.find({ follower: user._id })
      .populate('following', 'username displayName avatar bio followersCount')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({ success: true, following: following.map(f => f.following) });
  } catch (err) {
    next(err);
  }
});

// @GET /api/users/:username/posts
router.get('/:username/posts', optionalAuth, async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const { page = 1, limit = 10 } = req.query;
    const posts = await Post.find({ author: user._id, visibility: 'public' })
      .populate('author', 'username displayName avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Post.countDocuments({ author: user._id, visibility: 'public' });

    let likedPostIds = [];
    if (req.user) {
      const likes = await Like.find({ user: req.user._id, targetType: 'post', targetId: { $in: posts.map(p => p._id) } });
      likedPostIds = likes.map(l => l.targetId.toString());
    }

    const postsWithLikes = posts.map(post => ({
      ...post.toObject(),
      isLiked: likedPostIds.includes(post._id.toString())
    }));

    res.json({ success: true, posts: postsWithLikes, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
