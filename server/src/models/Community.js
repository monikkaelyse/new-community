import mongoose from 'mongoose';

const communitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 100,
  },
  description: {
    type: String,
    default: '',
    maxlength: 1000,
  },
  // Encrypted community key — each member gets a copy wrapped with their public key
  // This allows all members to decrypt shared content (message board posts)
  encryptedKeys: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    encryptedKey: { type: String }, // community key encrypted with user's public key
    nonce: { type: String },
  }],
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

export default mongoose.model('Community', communitySchema);
