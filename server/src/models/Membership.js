import mongoose from 'mongoose';

/**
 * Membership links a User to a Community with per-community encryption keys.
 * Each membership has its own NaCl keypair — compromise of one community
 * does not expose keys in another.
 */
const membershipSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  communityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: true,
  },
  // Per-community E2E encryption keys
  publicKey: {
    type: String,
    required: true,
  },
  encryptedSecretKey: {
    type: String,
    required: true,
  },
  secretKeyNonce: {
    type: String,
    required: true,
  },
  secretKeySalt: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member',
  },
  profile: {
    displayName: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 500 },
    avatarUrl: { type: String, default: '' },
  },
}, {
  timestamps: true,
});

// A user can only have one membership per community
membershipSchema.index({ userId: 1, communityId: 1 }, { unique: true });
membershipSchema.index({ communityId: 1 });

// Never return encrypted key fields in JSON by default
membershipSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.encryptedSecretKey;
  delete obj.secretKeyNonce;
  delete obj.secretKeySalt;
  return obj;
};

export default mongoose.model('Membership', membershipSchema);
