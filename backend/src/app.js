import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import starterRoutes from './routes/starterRoutes.js';
import promptRoutes from './routes/promptRoutes.js';
import { uploadsDir } from './middleware/upload.js';

export const createApp = () => {
  const app = express();
  app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(morgan('dev'));

  // Static uploads served from resolved uploadsDir
  app.use('/uploads', express.static(uploadsDir));

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/matches', matchRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/starters', starterRoutes);
  app.use('/api/prompts', promptRoutes);

  app.get('/health', (req, res) => res.json({ ok: true }));

  // 404 handler
  app.use((req, res) => res.status(404).json({ message: 'Not found' }));

  // Error handler
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  });

  return app;
};
