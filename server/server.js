const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Load environment variables from server/.env if local
require('dotenv').config({ path: path.join(__dirname, '.env') });

const taskRoutes = require('./routes/taskRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// MongoDB connection with Serverless caching
const MONGO_URI = process.env.MONGO_URI;

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (!MONGO_URI) {
    throw new Error('MONGO_URI environment variable is not defined!');
  }

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Fail fast with clear error instead of hanging
      serverSelectionTimeoutMS: 8000,
      maxPoolSize: 10,
    };

    cached.promise = mongoose
      .connect(MONGO_URI, opts)
      .then((mongooseInstance) => {
        console.log('MongoDB connected successfully to task-assessments-db');
        return mongooseInstance;
      })
      .catch((err) => {
        cached.promise = null;
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Ensure DB is connected before handling any API request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection error in middleware:', error.message);
    if (req.path === '/api/health') {
      return next(); // Let health route output diagnostic details
    }
    return res.status(500).json({
      message: 'Database connection failed',
      error: error.message,
      hasMongoUri: Boolean(MONGO_URI),
    });
  }
});

// Health check endpoint with diagnostic information
app.get('/api/health', (req, res) => {
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  const readyState = mongoose.connection.readyState;
  const isConnected = readyState === 1;

  res.status(isConnected ? 200 : 503).json({
    status: isConnected ? 'OK' : 'DEGRADED',
    message: isConnected
      ? 'Task Manager API is running smoothly'
      : 'Database connection not ready',
    database: stateMap[readyState] || 'unknown',
    readyState,
    hasMongoUri: Boolean(MONGO_URI),
    timestamp: new Date().toISOString(),
  });
});

// Task API Routes
app.use('/api/tasks', taskRoutes);

// Fallback 404 handler for API routes
app.use((req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

// For local development
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel Serverless Functions
module.exports = app;
