const express = require('express');
const cors = require('cors');
require('dotenv').config();

const apiRoutes = require('./routes');
const errorMiddleware = require('./middleware/error.middleware');

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Base Welcome Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the PhotoDay Backend API!' });
});

// Production Health & Diagnostics Endpoint
app.get(['/health', '/api/health'], (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    environment: process.env.NODE_ENV || 'development',
  });
});

// Mount all API routes under /api
app.use('/api', apiRoutes);

// Handle 404 fallback
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// Global error handler
app.use(errorMiddleware);

module.exports = app;
