import DailyPromptAnswer from '../models/DailyPromptAnswer.js';

const PROMPTS = [
  'What’s your ideal Sunday?',
  'Pick one: beach day or mountain hike?',
  'What hobby could you talk about for hours?',
  'What’s a small joy that makes your day?',
  'What song do you play on repeat?'
];

function todayKey() {
  const d = new Date();
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function promptOfTheDay() {
  const d = new Date();
  // Simple deterministic index by date
  const dayIndex = Math.floor(d.getTime() / (24 * 3600 * 1000));
  return PROMPTS[dayIndex % PROMPTS.length];
}

export const getTodayPrompt = async (req, res) => {
  const date = todayKey();
  const prompt = promptOfTheDay();
  const existing = await DailyPromptAnswer.findOne({ user: req.user.id, date });
  return res.json({ date, prompt, answered: !!existing, answer: existing?.answer || '' });
};

export const answerTodayPrompt = async (req, res) => {
  const date = todayKey();
  const { answer } = req.body;
  if (!answer || !String(answer).trim()) return res.status(400).json({ message: 'Answer is required' });
  const doc = await DailyPromptAnswer.findOneAndUpdate(
    { user: req.user.id, date },
    { $set: { answer: String(answer).trim() } },
    { upsert: true, new: true }
  );
  return res.json({ saved: true, date, answer: doc.answer });
};
