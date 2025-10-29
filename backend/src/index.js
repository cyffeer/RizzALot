import http from 'http';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';
import { initSocket } from './sockets/chat.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGO = process.env.MONGODB_URI || process.env.MONGO_URI;

const start = async () => {
  try {
    if (!MONGO) {
      throw new Error('Missing MONGODB_URI (or MONGO_URI) in environment');
    }
    await connectDB(MONGO);
    const app = createApp();
    const server = http.createServer(app);
    initSocket(server, process.env.CLIENT_ORIGIN);

    server.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }
};

start();
