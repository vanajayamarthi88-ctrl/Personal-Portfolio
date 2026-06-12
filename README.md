# Task Manager App

A full-stack task management application built with Node.js, Express, MongoDB, JWT authentication, and Socket.io.

## Features

- User registration and login
- Authorized CRUD operations for tasks
- Task status, priority, and due date
- Real-time task updates with Socket.io
- Responsive interface for desktop and mobile

## Setup

1. Copy `.env.example` to `.env` and update the values.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:4000` in your browser.

## Environment

Example values in `.env`:
```bash
MONGODB_URI=mongodb://127.0.0.1:27017/task-manager
PORT=4000
JWT_SECRET=supersecret
```

## Project Structure

- `server.js` — Express server, MongoDB connection, and Socket.io integration
- `routes/auth.js` — Authentication endpoints
- `routes/tasks.js` — Task CRUD endpoints with authorization
- `models/User.js` — Mongoose schema for users
- `models/Task.js` — Mongoose schema for tasks
- `public/` — Frontend files

## Notes

- If you do not have local MongoDB, you can use MongoDB Atlas and update `MONGODB_URI`.
- The app falls back to in-memory stores if the database connection is unavailable.

