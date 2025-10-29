import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

export const register = async (req, res) => {
  try {
    const { name, email, password, age, bio } = req.body;
    if (!name || !email || !password || !age) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const hash = await bcrypt.hash(password, 10);
    const photo = req.file ? `/uploads/${req.file.filename}` : '';
    const user = await User.create({ name, email, password: hash, age, bio: bio || '', photo });
    const token = signToken(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,      // required for SameSite=None
      sameSite: "none",  // allow cross-site from Vercel -> Render
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        bio: user.bio,
        photo: user.photo,
        gender: user.gender,
        lookingFor: user.lookingFor,
        profileQuestions: user.profileQuestions,
        profileComplete: user.profileComplete
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Registration failed' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,      // required for SameSite=None
      sameSite: "none",  // allow cross-site from Vercel -> Render
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        bio: user.bio,
        photo: user.photo,
        gender: user.gender,
        lookingFor: user.lookingFor,
        profileQuestions: user.profileQuestions,
        profileComplete: user.profileComplete
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Login failed' });
  }
};

export const me = async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json(user);
};
