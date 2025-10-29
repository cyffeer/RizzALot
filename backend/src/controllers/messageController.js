import Match from '../models/Match.js';
import Message from '../models/Message.js';

export const getMessages = async (req, res) => {
  const { matchId } = req.params;
  const match = await Match.findById(matchId);
  if (!match || !match.users.map(String).includes(String(req.user.id))) {
    return res.status(403).json({ message: 'Not authorized' });
  }
  const messages = await Message.find({ match: matchId }).sort({ createdAt: 1 });
  return res.json(messages);
};

export const sendMessage = async (req, res) => {
  const { matchId } = req.params;
  const { content } = req.body;
  const match = await Match.findById(matchId);
  if (!match || !match.users.map(String).includes(String(req.user.id))) {
    return res.status(403).json({ message: 'Not authorized' });
  }
  const recipient = match.users.find((id) => String(id) !== String(req.user.id));
  const message = await Message.create({ match: matchId, sender: req.user.id, recipient, content });
  match.lastMessage = content;
  await match.save();
  return res.status(201).json(message);
};

export const reactToMessage = async (req, res) => {
  const { messageId } = req.params;
  const { type } = req.body; // 'love' | 'like' | 'funny'
  if (!['love', 'like', 'funny'].includes(type)) return res.status(400).json({ message: 'Invalid reaction' });
  const message = await Message.findById(messageId);
  if (!message) return res.status(404).json({ message: 'Message not found' });
  const match = await Match.findById(message.match);
  if (!match || !match.users.map(String).includes(String(req.user.id))) {
    return res.status(403).json({ message: 'Not authorized' });
  }
  // Toggle reaction for this user: if same type exists remove; else set to only that type (one per user)
  const existingIdx = message.reactions.findIndex((r) => String(r.user) === String(req.user.id));
  if (existingIdx >= 0) {
    const existing = message.reactions[existingIdx];
    if (existing.type === type) {
      message.reactions.splice(existingIdx, 1);
    } else {
      message.reactions[existingIdx].type = type;
      message.reactions[existingIdx].createdAt = new Date();
    }
  } else {
    message.reactions.push({ user: req.user.id, type });
  }
  await message.save();
  return res.json(message);
};
