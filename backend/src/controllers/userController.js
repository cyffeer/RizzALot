import User from '../models/User.js';
import Match from '../models/Match.js';
import { computeMutualInterests } from '../utils/matchUtils.js';
import fs from 'fs';
import path from 'path';
import { uploadsDir } from '../middleware/upload.js';

// Static options for onboarding questions (can be moved to DB later)
export const questionOptions = {
  genders: ['male', 'female', 'non-binary', 'other'],
  intents: ['serious','casual','friends'],
  musicGenres: ['Pop','Rock','Hip-Hop','R&B','Jazz','Classical','EDM','Country','Indie','K-Pop'],
  hobbies: ['Travel','Cooking','Gaming','Reading','Movies','Hiking','Gym','Art','Dancing','Photography'],
  passions: ['Tech','Music','Sports','Food','Fashion','Animals','Environment','Entrepreneurship','Volunteering','Learning']
};

export const getQuestionOptions = async (req, res) => {
  return res.json(questionOptions);
};

export const getMyProfile = async (req, res) => {
  const me = await User.findById(req.user.id).select('-password');
  return res.json(me);
};

export const updateMyProfile = async (req, res) => {
  const updates = (({ name, age, bio, gender, intent }) => ({ name, age, bio, gender, intent }))(req.body);
  if (req.body.lookingFor) {
    const arr = Array.isArray(req.body.lookingFor) ? req.body.lookingFor : [req.body.lookingFor];
    updates.lookingFor = arr;
  }
  if (req.file) updates.photo = `/uploads/${req.file.filename}`;
  // If client sends a comma-separated list of photos (e.g., already uploaded), accept it
  if (req.body.photos) {
    if (Array.isArray(req.body.photos)) updates.photos = req.body.photos;
    else if (typeof req.body.photos === 'string') updates.photos = req.body.photos.split(',').map((s) => s.trim()).filter(Boolean);
  }
  const me = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
  return res.json(me);
};

export const uploadProfilePhotos = async (req, res) => {
  // Expect multiple files uploaded under field name 'photos'
  const files = req.files || [];
  const paths = files.map((f) => `/uploads/${f.filename}`);
  const me = await User.findById(req.user.id);
  me.photos = [...(me.photos || []), ...paths];
  // Keep legacy single photo in sync with first photo if empty
  if (!me.photo && me.photos.length > 0) me.photo = me.photos[0];
  await me.save();
  const safe = await User.findById(me._id).select('-password');
  return res.json(safe);
};

export const removeProfilePhoto = async (req, res) => {
  // Remove a photo by exact path or by index
  const p = req.query.path;
  const idxParam = req.query.index;

  const me = await User.findById(req.user.id);
  if (!me) return res.status(404).json({ message: 'User not found' });

  let removedPath = null;
  if (typeof idxParam !== 'undefined') {
    const idx = parseInt(idxParam, 10);
    if (!Number.isNaN(idx) && idx >= 0 && idx < (me.photos?.length || 0)) {
      removedPath = me.photos[idx];
      me.photos.splice(idx, 1);
    }
  } else if (p) {
    const i = (me.photos || []).indexOf(p);
    if (i !== -1) {
      removedPath = me.photos[i];
      me.photos.splice(i, 1);
    }
  }

  // If nothing removed, return current state
  if (!removedPath) {
    const safe = await User.findById(me._id).select('-password');
    return res.json(safe);
  }

  // Keep legacy single photo in sync if necessary
  if (me.photo === removedPath) {
    me.photo = me.photos?.[0] || null;
  } else if (!me.photo && (me.photos?.length || 0) > 0) {
    me.photo = me.photos[0];
  }

  await me.save();

  // Best-effort delete from disk if it's one of our uploads
  try {
    if (removedPath && removedPath.startsWith('/uploads/')) {
      const filename = path.basename(removedPath);
      const filePath = path.join(uploadsDir, filename);
      if (fs.existsSync(filePath)) fs.unlink(filePath, () => {});
    }
  } catch {}

  const safe = await User.findById(me._id).select('-password');
  return res.json(safe);
};

export const discoverUsers = async (req, res) => {
  const me = await User.findById(req.user.id).select('liked skipped gender lookingFor profileQuestions intent');
  const excludeIds = new Set([
    req.user.id,
    ...me.liked.map(String),
    ...me.skipped.map(String)
  ]);
  const page = parseInt(req.query.page || '1', 10);
  const limit = parseInt(req.query.limit || '20', 10);
  const skip = (page - 1) * limit;

  const genderFilter = me.lookingFor && me.lookingFor.length
    ? { gender: { $in: me.lookingFor } }
    : {};

  const intentFilter = req.query.intent ? { intent: req.query.intent } : {};

  // Stacks
  const stack = req.query.stack || '';
  let dateFilter = {};
  if (stack === 'new-today') {
    const start = new Date();
    start.setHours(0,0,0,0);
    dateFilter = { createdAt: { $gte: start } };
  }

  const users = await User.find({ _id: { $nin: Array.from(excludeIds) }, ...genderFilter, ...intentFilter, ...dateFilter })
    .select('name age bio photo photos gender intent lookingFor profileQuestions profileComplete createdAt')
    .skip(skip)
    .limit(limit);

  // Attach mutual interests summary for each candidate
  let enriched = users.map((u) => {
    const obj = u.toObject();
    // Ensure we always return an array of photos for the client UI
    if (!obj.photos || obj.photos.length === 0) {
      obj.photos = obj.photo ? [obj.photo] : [];
    }
    const mutual = computeMutualInterests(me, u);
    return { ...obj, mutual };
  });

  if (stack === 'music-twins') {
    enriched.sort((a, b) => (b.mutual?.count || 0) - (a.mutual?.count || 0));
  }

  return res.json({ page, limit, count: enriched.length, users: enriched });
};

export const likeUser = async (req, res) => {
  const targetId = req.params.id;
  if (targetId === req.user.id) return res.status(400).json({ message: "Cannot like yourself" });

  const me = await User.findById(req.user.id);
  if (me.liked.map(String).includes(targetId)) return res.json({ message: 'Already liked' });

  me.liked.push(targetId);
  await me.save();

  const target = await User.findById(targetId);
  const isMutual = target.liked.map(String).includes(String(req.user.id));

  let match = null;
  if (isMutual) {
    match = await Match.findOne({ users: { $all: [req.user.id, targetId] } });
    if (!match) {
      match = await Match.create({ users: [req.user.id, targetId] });
    }
  }

  return res.json({ liked: true, matchCreated: !!match, matchId: match?._id || null });
};

export const skipUser = async (req, res) => {
  const targetId = req.params.id;
  const me = await User.findById(req.user.id);
  if (!me.skipped.map(String).includes(targetId)) {
    me.skipped.push(targetId);
    await me.save();
  }
  return res.json({ skipped: true });
};

export const submitQuestions = async (req, res) => {
  const { gender, intent, lookingFor, musicGenres, hobbies, passions, about } = req.body;

  const updates = { profileComplete: true };
  if (gender) updates.gender = gender;
  if (intent) updates.intent = intent;
  if (lookingFor) {
    const arr = Array.isArray(lookingFor) ? lookingFor : [lookingFor];
    updates.lookingFor = arr;
  }
  updates.profileQuestions = {
    musicGenres: toArray(musicGenres),
    hobbies: toArray(hobbies),
    passions: toArray(passions),
    about: about || ''
  };

  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
  return res.json(user);
};

const toArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    // Accept comma-separated values
    return val.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
};
