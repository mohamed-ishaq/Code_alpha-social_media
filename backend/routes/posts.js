const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const Follow = require('../models/Follow');
const User = require('../models/User');
const { protect, optionalAuth } = require('../middleware/auth');
const { postLimiter } = require('../middleware/rateLimiter');
const { uploadPostImages } = require('../middleware/upload');
const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');
const sharp = require('sharp');

const uploadsRoot = path.join(__dirname, '..', 'uploads');
const postsUploadDir = path.join(uploadsRoot, 'posts');

const ensureDir = async (dirPath) => {
  await fs.mkdir(dirPath, { recursive: true });
};

const parseTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  if (typeof tags !== 'string') return [];

  const raw = tags.trim();
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {}

  return raw.split(/[\s,#]+/).filter(Boolean);
};

const parseCodeSnippet = (codeSnippet) => {
  if (!codeSnippet) return {};
  if (typeof codeSnippet === 'object') return codeSnippet;
  if (typeof codeSnippet !== 'string') return {};

  const raw = codeSnippet.trim();
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed;
  } catch (e) {}
  return {};
};

const processAndSaveImages = async (files = []) => {
  if (!files.length) return [];

  await ensureDir(postsUploadDir);
  const results = [];

  for (const file of files) {
    const id = crypto.randomBytes(12).toString('hex');
    const filename = `${Date.now()}-${id}.webp`;
    const outPath = path.join(postsUploadDir, filename);

    await sharp(file.buffer)
      .rotate()
      .resize({ width: 1400, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(outPath);

    results.push(`/uploads/posts/${filename}`);
  }

  return results;
};

const removeUploadedFiles = async (imageUrls = []) => {
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) return;
  await ensureDir(postsUploadDir);

  for (const url of imageUrls) {
    if (typeof url !== 'string') continue;
    if (!url.startsWith('/uploads/')) continue;

    const rel = url.replace(/^\/uploads\//, '');
    const abs = path.resolve(uploadsRoot, rel);
    if (!abs.startsWith(path.resolve(uploadsRoot))) continue;

    try { await fs.unlink(abs); } catch (e) {}
  }
};

// @GET /api/posts/feed - authenticated user's feed (following + own)
router.get('/feed', protect, async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const followingIds = await Follow.find({ follower: req.user._id }).distinct('following');
    const feedUserIds = [...followingIds, req.user._id];

    const posts = await Post.find({ author: { $in: feedUserIds }, visibility: 'public' })
      .populate('author', 'username displayName avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Post.countDocuments({ author: { $in: feedUserIds }, visibility: 'public' });

    const likes = await Like.find({ user: req.user._id, targetType: 'post', targetId: { $in: posts.map(p => p._id) } });
    const likedPostIds = new Set(likes.map(l => l.targetId.toString()));

    const postsWithMeta = posts.map(post => ({
      ...post.toObject(),
      isLiked: likedPostIds.has(post._id.toString())
    }));

    res.json({ success: true, posts: postsWithMeta, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    next(err);
  }
});

// @GET /api/posts/explore - public posts for all
router.get('/explore', optionalAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, tag } = req.query;
    const filter = { visibility: 'public' };
    if (tag) filter.tags = tag.toLowerCase();

    const posts = await Post.find(filter)
      .populate('author', 'username displayName avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Post.countDocuments(filter);

    let likedPostIds = new Set();
    if (req.user) {
      const likes = await Like.find({ user: req.user._id, targetType: 'post', targetId: { $in: posts.map(p => p._id) } });
      likedPostIds = new Set(likes.map(l => l.targetId.toString()));
    }

    const postsWithMeta = posts.map(post => ({
      ...post.toObject(),
      isLiked: likedPostIds.has(post._id.toString())
    }));

    res.json({ success: true, posts: postsWithMeta, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    next(err);
  }
});

// @POST /api/posts - create post
router.post('/', protect, postLimiter, (req, res, next) => {
  uploadPostImages(req, res, (err) => {
    if (err) return next(err);
    next();
  });
}, async (req, res, next) => {
  try {
    const content = (req.body.content || '').toString().trim();
    if (!content || content.length > 3000) {
      return res.status(400).json({ success: false, message: 'Content is required and max 3000 chars' });
    }

    const visibility = (req.body.visibility || 'public').toString();
    if (!['public', 'followers', 'private'].includes(visibility)) {
      return res.status(400).json({ success: false, message: 'Invalid visibility value.' });
    }

    const tags = parseTags(req.body.tags)
      .map(t => t.toLowerCase().trim().replace(/^#/, ''))
      .filter(Boolean)
      .slice(0, 10);

    const codeSnippet = parseCodeSnippet(req.body.codeSnippet);
    const images = await processAndSaveImages(req.files || []);

    const post = await Post.create({
      author: req.user._id,
      content,
      tags,
      codeSnippet: codeSnippet || {},
      visibility,
      images
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { postsCount: 1 } });

    const populated = await Post.findById(post._id).populate('author', 'username displayName avatar');

    res.status(201).json({ success: true, message: 'Post created!', post: { ...populated.toObject(), isLiked: false } });
  } catch (err) {
    next(err);
  }
});

// @GET /api/posts/:id
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'username displayName avatar bio');
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    let isLiked = false;
    if (req.user) {
      const like = await Like.findOne({ user: req.user._id, targetType: 'post', targetId: post._id });
      isLiked = !!like;
    }

    res.json({ success: true, post: { ...post.toObject(), isLiked } });
  } catch (err) {
    next(err);
  }
});

// @PUT /api/posts/:id
router.put('/:id', protect, [
  body('content').trim().isLength({ min: 1, max: 3000 })
], async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this post.' });
    }

    const { content, tags, codeSnippet, visibility } = req.body;
    post.content = content || post.content;
    post.tags = tags ? tags.map(t => t.toLowerCase().trim()) : post.tags;
    post.codeSnippet = codeSnippet || post.codeSnippet;
    post.visibility = visibility || post.visibility;
    post.isEdited = true;
    await post.save();

    const populated = await Post.findById(post._id).populate('author', 'username displayName avatar');
    res.json({ success: true, message: 'Post updated.', post: populated });
  } catch (err) {
    next(err);
  }
});

// @DELETE /api/posts/:id
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this post.' });
    }

    await removeUploadedFiles(post.images || []);
    await Post.deleteOne({ _id: post._id });
    await Comment.deleteMany({ post: post._id });
    await Like.deleteMany({ targetType: 'post', targetId: post._id });
    await User.findByIdAndUpdate(post.author, { $inc: { postsCount: -1 } });

    res.json({ success: true, message: 'Post deleted.' });
  } catch (err) {
    next(err);
  }
});

// @POST /api/posts/:id/like
router.post('/:id/like', protect, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    const existingLike = await Like.findOne({ user: req.user._id, targetType: 'post', targetId: post._id });

    if (existingLike) {
      await Like.deleteOne({ _id: existingLike._id });
      await Post.findByIdAndUpdate(post._id, { $inc: { likesCount: -1 } });
      const updated = await Post.findById(post._id);
      return res.json({ success: true, isLiked: false, likesCount: updated.likesCount });
    } else {
      await Like.create({ user: req.user._id, targetType: 'post', targetId: post._id });
      await Post.findByIdAndUpdate(post._id, { $inc: { likesCount: 1 } });
      const updated = await Post.findById(post._id);
      return res.json({ success: true, isLiked: true, likesCount: updated.likesCount });
    }
  } catch (err) {
    next(err);
  }
});

// @GET /api/posts/:id/comments
router.get('/:id/comments', optionalAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const comments = await Comment.find({ post: req.params.id, parentComment: null })
      .populate('author', 'username displayName avatar')
      .sort({ createdAt: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Comment.countDocuments({ post: req.params.id, parentComment: null });

    let likedCommentIds = new Set();
    if (req.user) {
      const likes = await Like.find({ user: req.user._id, targetType: 'comment', targetId: { $in: comments.map(c => c._id) } });
      likedCommentIds = new Set(likes.map(l => l.targetId.toString()));
    }

    const commentsWithMeta = comments.map(c => ({
      ...c.toObject(),
      isLiked: likedCommentIds.has(c._id.toString())
    }));

    res.json({ success: true, comments: commentsWithMeta, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    next(err);
  }
});

// @POST /api/posts/:id/comments
router.post('/:id/comments', protect, [
  body('content').trim().isLength({ min: 1, max: 1000 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    const comment = await Comment.create({
      post: post._id,
      author: req.user._id,
      content: req.body.content,
      parentComment: req.body.parentComment || null
    });

    await Post.findByIdAndUpdate(post._id, { $inc: { commentsCount: 1 } });

    const populated = await Comment.findById(comment._id).populate('author', 'username displayName avatar');

    res.status(201).json({ success: true, comment: { ...populated.toObject(), isLiked: false } });
  } catch (err) {
    next(err);
  }
});

// @DELETE /api/posts/:postId/comments/:commentId
router.delete('/:postId/comments/:commentId', protect, async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' });
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    await Comment.deleteOne({ _id: comment._id });
    await Post.findByIdAndUpdate(req.params.postId, { $inc: { commentsCount: -1 } });
    await Like.deleteMany({ targetType: 'comment', targetId: comment._id });

    res.json({ success: true, message: 'Comment deleted.' });
  } catch (err) {
    next(err);
  }
});

// @POST /api/posts/comments/:commentId/like
router.post('/comments/:commentId/like', protect, async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' });

    const existingLike = await Like.findOne({ user: req.user._id, targetType: 'comment', targetId: comment._id });

    if (existingLike) {
      await Like.deleteOne({ _id: existingLike._id });
      await Comment.findByIdAndUpdate(comment._id, { $inc: { likesCount: -1 } });
      const updated = await Comment.findById(comment._id);
      return res.json({ success: true, isLiked: false, likesCount: updated.likesCount });
    } else {
      await Like.create({ user: req.user._id, targetType: 'comment', targetId: comment._id });
      await Comment.findByIdAndUpdate(comment._id, { $inc: { likesCount: 1 } });
      const updated = await Comment.findById(comment._id);
      return res.json({ success: true, isLiked: true, likesCount: updated.likesCount });
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
