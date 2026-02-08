import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  // E2E encryption keys
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
  // Profile info
  profile: {
    displayName: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 500 },
    avatarUrl: { type: String, default: '' },
  },
  // Community membership
  communityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member',
  },
}, {
  timestamps: true,
});

// Never return sensitive fields in JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.encryptedSecretKey;
  return obj;
};

export default mongoose.model('User', userSchema);
