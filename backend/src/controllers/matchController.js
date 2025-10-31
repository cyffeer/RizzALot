import Match from '../models/Match.js';
import User from '../models/User.js';
import { computeMatchReasons } from '../utils/matchUtils.js';

export const getMyMatches = async (req, res) => {
  const matches = await Match.find({ users: req.user.id })
    .sort({ updatedAt: -1 })
    .populate({ path: 'users', select: 'name age bio photo gender profileQuestions' });

  // For each match, return the other user and basic info
  const data = matches.map((m) => {
    const other = m.users.find((u) => String(u._id) !== String(req.user.id));
    const me = m.users.find((u) => String(u._id) === String(req.user.id));
    const { reasons, mutual } = computeMatchReasons(me, other);
    return { id: m._id, otherUser: other, lastMessage: m.lastMessage, updatedAt: m.updatedAt, reasons, mutual };
  });

  return res.json(data);
};

export const getMatchDetails = async (req, res) => {
  const { id } = req.params;
  const match = await Match.findById(id).populate({ path: 'users', select: 'name age bio photo gender profileQuestions' });
  // When populated, match.users contains User documents, not ObjectIds
  // Ensure membership check uses user._id
  const isMember = match && match.users.some((u) => String(u._id) === String(req.user.id));
  if (!match || !isMember) {
    return res.status(403).json({ message: 'Not authorized' });
  }
  const other = match.users.find((u) => String(u._id) !== String(req.user.id));
  const me = match.users.find((u) => String(u._id) === String(req.user.id));
  const { reasons, mutual } = computeMatchReasons(me, other);
  return res.json({ id: match._id, otherUser: other, reasons, mutual, lastMessage: match.lastMessage, updatedAt: match.updatedAt });
};
