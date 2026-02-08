import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  channelId: {
    type: String, // community-wide channel or DM identifier
  },
  // E2E encrypted content — server never sees plaintext
  encryptedContent: {
    type: String,
    required: true,
  },
  nonce: {
    type: String,
    required: true,
  },
  // Sender's public key at time of sending (for verification)
  senderPublicKey: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

messageSchema.index({ channelId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, recipientId: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);
