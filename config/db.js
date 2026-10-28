const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/taskmaster';

  try {
    const conn = await mongoose.connect(uri, {
      dbName: process.env.DB_NAME || 'taskmaster',
      serverSelectionTimeoutMS: 7000,
    });
    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);

    try {
      const Task = require('../models/Task');
      const count = await Task.countDocuments();
      if (count === 0) {
        await Task.insertMany([
          {
            title: 'Complete Full-Stack Application Setup',
            description: 'Build modern React frontend with Tailwind CSS and Node.js REST API with MongoDB.',
            completed: true,
            status: 'completed',
            priority: 'high',
            category: 'Development',
            dueDate: new Date(Date.now() + 86400000),
            tags: ['react', 'node', 'mongodb'],
          },
          {
            title: 'Integrate Public Open-Meteo & GitHub Weather APIs',
            description: 'Fetch real-time weather forecasts to empower weather-aware task scheduling and planning.',
            completed: false,
            status: 'in-progress',
            priority: 'urgent',
            category: 'Development',
            dueDate: new Date(Date.now() + 86400000 * 2),
            tags: ['api', 'integration', 'weather'],
          },
          {
            title: 'Design Premium Glassmorphism UI Components',
            description: 'Style task cards, filter bar, modals, and responsive mobile layout with sleek dark/light aesthetics.',
            completed: false,
            status: 'pending',
            priority: 'medium',
            category: 'Design',
            dueDate: new Date(Date.now() + 86400000 * 3),
            tags: ['ui', 'ux', 'tailwind'],
          },
          {
            title: 'Prepare Comprehensive README & API Documentation',
            description: 'Include setup steps, MongoDB schema, endpoints, screenshots, and live demo guide.',
            completed: false,
            status: 'pending',
            priority: 'low',
            category: 'Work',
            dueDate: new Date(Date.now() + 86400000 * 5),
            tags: ['docs', 'submission'],
          },
        ]);
      }
    } catch (seedErr) {
      console.warn(seedErr.message);
    }
  } catch (error) {
    isConnected = false;
    console.warn(`MongoDB connection error: ${error.message}`);
  }
};

const getDbStatus = () => ({
  connected: isConnected && mongoose.connection.readyState === 1,
  readyState: mongoose.connection.readyState,
  host: mongoose.connection.host || null,
  name: mongoose.connection.name || null,
});

module.exports = { connectDB, getDbStatus };
