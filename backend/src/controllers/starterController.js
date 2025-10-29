import Match from '../models/Match.js';
import User from '../models/User.js';
import { computeMutualInterests, normalizeList } from '../utils/matchUtils.js';

const GENERIC_STARTERS = [
  "What's something fun you did recently?",
  "Two truths and a lie? I'll go first if you want.",
  "What are you oddly good at?",
  "Favorite way to spend a Sunday?",
  "What's your go-to comfort food?"
];

export const getStarters = async (req, res) => {
  try {
    const { matchId } = req.query;
    let tailored = [];

    if (matchId) {
      const match = await Match.findById(matchId);
      if (!match || !match.users.map(String).includes(String(req.user.id))) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      const meId = String(req.user.id);
      const otherId = match.users.find((id) => String(id) !== meId);
      const [me, other] = await Promise.all([
        User.findById(meId).select('profileQuestions'),
        User.findById(otherId).select('profileQuestions name')
      ]);
      const mutual = computeMutualInterests(me, other);

      if (mutual.musicGenres.length) {
        const g = mutual.musicGenres[0];
        tailored.push(`What ${g} track never gets old for you?`);
        tailored.push(`Seen any great ${g} concerts lately?`);
      }
      if (mutual.hobbies.length) {
        const h = mutual.hobbies[0];
        tailored.push(`What's your favorite way to do ${h} around here?`);
        tailored.push(`How did you get into ${h}?`);
      }
      if (mutual.passions.length) {
        const p = mutual.passions[0];
        tailored.push(`What do you love most about ${p}?`);
      }
    }

    // Deduplicate and limit
    const unique = Array.from(new Set([...tailored, ...GENERIC_STARTERS])).slice(0, 6);
    return res.json({ starters: unique });
  } catch (e) {
    console.error('starters error', e);
    return res.status(500).json({ message: 'Failed to load starters' });
  }
};
