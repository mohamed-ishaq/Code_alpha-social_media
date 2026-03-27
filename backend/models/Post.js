const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  content: {
    type: String,
    required: [true, 'Post content is required'],
    maxlength: [3000, 'Post cannot exceed 3000 characters'],
    trim: true
  },
  images: [{
    type: String
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 30
  }],
  codeSnippet: {
    code: { type: String, default: '' },
    language: { type: String, default: 'javascript' }
  },
  likesCount: {
    type: Number,
    default: 0
  },
  commentsCount: {
    type: Number,
    default: 0
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  visibility: {
    type: String,
    enum: ['public', 'followers', 'private'],
    default: 'public'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ content: 'text' });

module.exports = mongoose.model('Post', postSchema);
