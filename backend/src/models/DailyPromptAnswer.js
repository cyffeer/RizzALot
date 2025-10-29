import mongoose from 'mongoose';

const DailyPromptAnswerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    answer: { type: String, default: '' }
  },
  { timestamps: true }
);

DailyPromptAnswerSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model('DailyPromptAnswer', DailyPromptAnswerSchema);
