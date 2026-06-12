const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Task = require('../models/Task');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const isDbConnected = () => mongoose.connection.readyState === 1;

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) {
    return res.status(401).json({ error: 'Authorization token required.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

function buildUserTasks(req) {
  if (isDbConnected()) {
    return Task.find({ userId: req.userId }).sort({ createdAt: -1 });
  }

  req.app.locals.tasks = req.app.locals.tasks || [];
  return Promise.resolve(req.app.locals.tasks.filter((task) => String(task.userId) === String(req.userId)));
}

function broadcastTaskUpdate(req) {
  if (req.io && typeof req.io.emit === 'function') {
    req.io.emit('task-changed', { userId: req.userId });
  }
}

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const tasks = await buildUserTasks(req);
    res.json(tasks);
  } catch (error) {
    console.error('Fetch tasks error:', error);
    res.status(500).json({ error: 'Unable to load tasks.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, status, priority, dueDate } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Task title is required.' });
    }

    const payload = {
      title: title.trim(),
      description: (description || '').trim(),
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      userId: req.userId
    };

    if (isDbConnected()) {
      const task = await Task.create(payload);
      broadcastTaskUpdate(req);
      return res.status(201).json(task);
    }

    req.app.locals.tasks = req.app.locals.tasks || [];
    const task = { ...payload, _id: new mongoose.Types.ObjectId(), createdAt: new Date() };
    req.app.locals.tasks.unshift(task);
    broadcastTaskUpdate(req);
    return res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Unable to create task.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = (({ title, description, status, priority, dueDate }) => ({ title, description, status, priority, dueDate }))(req.body);

    if (isDbConnected()) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid task id.' });
      }

      const task = await Task.findOneAndUpdate(
        { _id: id, userId: req.userId },
        { $set: updates },
        { new: true, runValidators: true }
      );
      if (!task) {
        return res.status(404).json({ error: 'Task not found.' });
      }

      broadcastTaskUpdate(req);
      return res.json(task);
    }

    req.app.locals.tasks = req.app.locals.tasks || [];
    const taskIndex = req.app.locals.tasks.findIndex((task) => String(task._id) === String(id) && String(task.userId) === String(req.userId));
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const task = req.app.locals.tasks[taskIndex];
    req.app.locals.tasks[taskIndex] = { ...task, ...updates, dueDate: dueDate ? new Date(dueDate) : task.dueDate };
    broadcastTaskUpdate(req);
    return res.json(req.app.locals.tasks[taskIndex]);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Unable to update task.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid task id.' });
      }

      const deleted = await Task.findOneAndDelete({ _id: id, userId: req.userId });
      if (!deleted) {
        return res.status(404).json({ error: 'Task not found.' });
      }

      broadcastTaskUpdate(req);
      return res.json({ success: true });
    }

    req.app.locals.tasks = req.app.locals.tasks || [];
    const initialLength = req.app.locals.tasks.length;
    req.app.locals.tasks = req.app.locals.tasks.filter((task) => !(String(task._id) === String(id) && String(task.userId) === String(req.userId)));
    if (req.app.locals.tasks.length === initialLength) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    broadcastTaskUpdate(req);
    return res.json({ success: true });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Unable to delete task.' });
  }
});

module.exports = router;
