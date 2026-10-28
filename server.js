const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { connectDB, getDbStatus } = require('./config/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  const dbStatus = getDbStatus();
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      type: 'MongoDB',
      connected: dbStatus.connected,
      host: dbStatus.host,
      mode: dbStatus.connected ? 'MongoDB Live' : 'Fallback Mode',
    },
    version: '1.0.0',
  });
});

app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/external', require('./routes/externalApiRoutes'));

app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API route ${req.originalUrl} not found`,
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
