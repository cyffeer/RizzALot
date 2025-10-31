import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import Match from '../models/Match.js';
import Message from '../models/Message.js';

let ioInstance = null;
export const getIO = () => ioInstance;

export const initSocket = (httpServer, corsOrigin) => {
  const io = new Server(httpServer, {
    cors: { origin: corsOrigin, methods: ['GET', 'POST'] }
  });
  ioInstance = io;

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('No token'));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = payload.id;
      next();
    } catch (e) {
      next(new Error('Auth failed'));
    }
  });

  io.on('connection', (socket) => {
    // Join a personal room for user-wide notifications
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }
    socket.on('joinMatch', async (matchId) => {
      const match = await Match.findById(matchId);
      if (!match || !match.users.map(String).includes(String(socket.userId))) return;
      socket.join(`match:${matchId}`);
    });

    socket.on('message', async ({ matchId, content }) => {
      if (!content?.trim()) return;
      const match = await Match.findById(matchId);
      if (!match || !match.users.map(String).includes(String(socket.userId))) return;
      const recipient = match.users.find((id) => String(id) !== String(socket.userId));
      const message = await Message.create({ match: matchId, sender: socket.userId, recipient, content });
      match.lastMessage = content;
      await match.save();
      io.to(`match:${matchId}`).emit('message', message);
      // Also emit a user-level notification to the recipient
      io.to(`user:${recipient}`).emit('newMessage', {
        matchId,
        messageId: message._id,
        from: String(socket.userId),
        content: message.content,
        createdAt: message.createdAt
      });
    });

    socket.on('react', async ({ matchId, messageId, type }) => {
      if (!['love','like','funny'].includes(type)) return;
      const match = await Match.findById(matchId);
      if (!match || !match.users.map(String).includes(String(socket.userId))) return;
      const msg = await Message.findById(messageId);
      if (!msg || String(msg.match) !== String(matchId)) return;
      const idx = msg.reactions.findIndex((r) => String(r.user) === String(socket.userId));
      if (idx >= 0) {
        if (msg.reactions[idx].type === type) {
          msg.reactions.splice(idx, 1);
        } else {
          msg.reactions[idx].type = type;
          msg.reactions[idx].createdAt = new Date();
        }
      } else {
        msg.reactions.push({ user: socket.userId, type });
      }
      await msg.save();
      io.to(`match:${matchId}`).emit('reaction', { messageId, reactions: msg.reactions });
    });
  });

  return io;
};
