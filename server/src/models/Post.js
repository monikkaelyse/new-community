import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  communityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: true,
  },
  // Encrypted with community shared key
  encryptedTitle: {
    type: String,
    required: true,
  },
  encryptedContent: {
    type: String,
    required: true,
  },
  nonce: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

postSchema.index({ communityId: 1, createdAt: -1 });

export default mongoose.model('Post', postSchema);
