import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    age: { type: Number, required: true, min: 18 },
    bio: { type: String, default: '' },
    // Primary profile photo (kept for backward compatibility)
    photo: { type: String, default: '' },
    // Support multiple photos like Tinder-style profiles
    photos: { type: [String], default: [] },
    gender: { type: String, enum: ['male', 'female', 'non-binary', 'other'], default: 'other' },
    intent: { type: String, enum: ['serious', 'casual', 'friends'], default: 'friends' },
    lookingFor: {
      type: [String],
      enum: ['male', 'female', 'non-binary', 'other'],
      default: ['male', 'female', 'non-binary', 'other']
    },
    profileQuestions: {
      musicGenres: { type: [String], default: [] },
      hobbies: { type: [String], default: [] },
      passions: { type: [String], default: [] },
      about: { type: String, default: '' }
    },
    profileComplete: { type: Boolean, default: false },
    liked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    skipped: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
