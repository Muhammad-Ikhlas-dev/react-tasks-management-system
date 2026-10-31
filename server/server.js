const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Load environment variables from server/.env regardless of CWD
require('dotenv').config({ path: path.join(__dirname, '.env') });

const taskRoutes = require('./routes/taskRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('CRITICAL: MONGO_URI is not defined in environment variables!');
}

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully to task-assessments-db');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
  });

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Task Manager API is running smoothly',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Task API Routes
app.use('/api/tasks', taskRoutes);

// Fallback 404 handler for API routes
app.use((req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
