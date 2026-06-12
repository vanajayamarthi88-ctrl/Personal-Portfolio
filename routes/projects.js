const express = require('express');
const mongoose = require('mongoose');
const Project = require('../models/Project');
const router = express.Router();

const isDbConnected = () => mongoose.connection.readyState === 1;

router.get('/', async (req, res) => {
  try {
    if (isDbConnected()) {
      const projects = await Project.find().sort({ createdAt: -1 });
      return res.json(projects);
    }

    return res.json(req.app.locals.projectStore || []);
  } catch (error) {
    res.status(500).json({ error: 'Unable to load projects.' });
  }
});

router.post('/', async (req, res) => {
  const { title, description, techStack, link, imageUrl } = req.body;

  if (!title || !description || !link || !imageUrl) {
    return res.status(400).json({ error: 'Title, description, link, and image URL are required.' });
  }

  try {
    if (isDbConnected()) {
      const project = new Project({
        title,
        description,
        techStack: techStack || [],
        link,
        imageUrl
      });

      const savedProject = await project.save();
      return res.status(201).json(savedProject);
    }

    const newProject = {
      title,
      description,
      techStack: techStack || [],
      link,
      imageUrl,
      createdAt: new Date()
    };

    req.app.locals.projectStore = req.app.locals.projectStore || [];
    req.app.locals.projectStore.unshift(newProject);
    return res.status(201).json(newProject);
  } catch (error) {
    res.status(500).json({ error: 'Unable to save project.' });
  }
});

module.exports = router;
