const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

const { protect } = require('../middleware/auth');
const Follow = require('../models/Follow');
const User = require('../models/User');
const Message = require('../models/Message');

const isFollowerOfMe = async (meId, otherUserId) => {
  const rel = await Follow.findOne({ follower: otherUserId, following: meId }).select('_id');
  return !!rel;
};

// @GET /api/messages/threads
// Threads are restricted to your followers (people who follow you).
router.get('/threads', protect, async (req, res, next) => {
  try {
    const followerIds = await Follow.find({ following: req.user._id }).distinct('follower');
    if (!followerIds.length) {
      return res.json({ success: true, threads: [] });
    }

    const followerUsers = await User.find({ _id: { $in: followerIds } })
      .select('username displayName avatar lastActiveAt')
      .lean();

    const agg = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: req.user._id, recipient: { $in: followerIds } },
            { recipient: req.user._id, sender: { $in: followerIds } }
          ]
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $addFields: {
          otherUser: {
            $cond: [{ $eq: ['$sender', req.user._id] }, '$recipient', '$sender']
          },
          isUnreadForMe: {
            $and: [
              { $eq: ['$recipient', req.user._id] },
              { $eq: ['$readAt', null] }
            ]
          }
        }
      },
      {
        $group: {
          _id: '$otherUser',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: { $sum: { $cond: ['$isUnreadForMe', 1, 0] } }
        }
      }
    ]);

    const metaByOtherId = new Map(agg.map(r => [String(r._id), r]));
    const userById = new Map(followerUsers.map(u => [String(u._id), u]));

    const threads = followerIds
      .map(id => {
        const u = userById.get(String(id));
        if (!u) return null;
        const meta = metaByOtherId.get(String(id));
        return {
          user: u,
          lastMessage: meta ? {
            id: meta.lastMessage._id,
            sender: meta.lastMessage.sender,
            recipient: meta.lastMessage.recipient,
            content: meta.lastMessage.content,
            createdAt: meta.lastMessage.createdAt
          } : null,
          unreadCount: meta ? meta.unreadCount : 0
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const at = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const bt = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return bt - at;
      });

    res.json({ success: true, threads });
  } catch (err) {
    next(err);
  }
});

// @GET /api/messages/with/:username
router.get('/with/:username', protect, async (req, res, next) => {
  try {
    const other = await User.findOne({ username: req.params.username.toLowerCase() }).select('_id username displayName avatar');
    if (!other) return res.status(404).json({ success: false, message: 'User not found.' });
    if (String(other._id) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You cannot message yourself.' });
    }

    const ok = await isFollowerOfMe(req.user._id, other._id);
    if (!ok) return res.status(403).json({ success: false, message: 'You can only message your followers.' });

    const limitRaw = parseInt(req.query.limit, 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 50;

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, recipient: other._id },
        { sender: other._id, recipient: req.user._id }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Mark received messages as read (best-effort)
    const markRead = (req.query.markRead ?? 'true') !== 'false';
    if (markRead) {
      Message.updateMany(
        { sender: other._id, recipient: req.user._id, readAt: null },
        { $set: { readAt: new Date() } }
      ).catch(() => {});
    }

    res.json({
      success: true,
      user: other,
      messages: messages.reverse()
    });
  } catch (err) {
    next(err);
  }
});

// @POST /api/messages/with/:username
router.post('/with/:username', protect, [
  body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Message must be between 1 and 2000 characters.')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const other = await User.findOne({ username: req.params.username.toLowerCase() }).select('_id username displayName avatar');
    if (!other) return res.status(404).json({ success: false, message: 'User not found.' });
    if (String(other._id) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You cannot message yourself.' });
    }

    const ok = await isFollowerOfMe(req.user._id, other._id);
    if (!ok) return res.status(403).json({ success: false, message: 'You can only message your followers.' });

    const message = await Message.create({
      sender: req.user._id,
      recipient: other._id,
      content: req.body.content
    });

    res.status(201).json({
      success: true,
      message: {
        id: message._id,
        sender: message.sender,
        recipient: message.recipient,
        content: message.content,
        createdAt: message.createdAt,
        readAt: message.readAt
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

