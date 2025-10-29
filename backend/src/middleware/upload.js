import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Resolve upload directory
// - Prefer env UPLOADS_DIR (e.g., /var/data/uploads on Render Persistent Disk)
// - Fallback to <cwd>/uploads for local development
export const uploadsDir = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.resolve(process.cwd(), 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

export const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) return cb(new Error('Only images are allowed'));
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});
