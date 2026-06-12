const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const isDbConnected = () => mongoose.connection.readyState === 1;

function createToken(user) {
  return jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '12h' });
}

function sanitizeUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt
  };
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const passwordHash = await bcrypt.hash(password, 10);

    if (isDbConnected()) {
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(409).json({ error: 'User already exists with this email.' });
      }

      const user = await User.create({ name, email: normalizedEmail, passwordHash });
      return res.status(201).json({ token: createToken(user), user: sanitizeUser(user) });
    }

    req.app.locals.users = req.app.locals.users || [];
    if (req.app.locals.users.some((user) => user.email === normalizedEmail)) {
      return res.status(409).json({ error: 'User already exists with this email.' });
    }

    const user = {
      _id: new mongoose.Types.ObjectId(),
      name,
      email: normalizedEmail,
      passwordHash,
      createdAt: new Date()
    };

    req.app.locals.users.push(user);
    return res.status(201).json({ token: createToken(user), user: sanitizeUser(user) });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Unable to register user.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user;

    if (isDbConnected()) {
      user = await User.findOne({ email: normalizedEmail });
    } else {
      req.app.locals.users = req.app.locals.users || [];
      user = req.app.locals.users.find((entry) => entry.email === normalizedEmail);
    }

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    return res.json({ token: createToken(user), user: sanitizeUser(user) });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Unable to login.' });
  }
});

module.exports = router;
