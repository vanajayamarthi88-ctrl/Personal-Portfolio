const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGODB_URI;

app.locals.users = [];
app.locals.tasks = [];

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/api/skills', (req, res) => {
  res.json([
    { name: 'Task planning', level: 'Advanced' },
    { name: 'API design', level: 'Advanced' },
    { name: 'JWT authentication', level: 'Intermediate' },
    { name: 'Real-time sync', level: 'Intermediate' },
    { name: 'Responsive UI', level: 'Advanced' }
  ]);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function startServer() {
  try {
    if (MONGO_URI) {
      await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
      console.log('Connected to MongoDB');
    } else {
      console.log('MONGODB_URI not set; using in-memory stores for users and tasks');
    }
  } catch (error) {
    console.error('Database connection failed:', error);
    console.log('Starting with in-memory stores only');
  }

  server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

startServer();
