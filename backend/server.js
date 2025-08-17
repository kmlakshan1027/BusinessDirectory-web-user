// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { testCloudinaryConnection } = require('./config/cloudinary');

// Import routes
const cloudinaryRoutes = require('./routes/cloudinary');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/cloudinary', cloudinaryRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      'GET /health',
      'GET /api/cloudinary/health',
      'DELETE /api/cloudinary/delete',
      'POST /api/cloudinary/delete-multiple'
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Global error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
const startServer = async () => {
  try {
    // Test Cloudinary connection
    console.log('🔧 Testing Cloudinary connection...');
    const cloudinaryConnected = await testCloudinaryConnection();
    
    if (!cloudinaryConnected) {
      console.error('❌ Warning: Cloudinary connection failed. Image operations may not work.');
    }

    app.listen(PORT, () => {
      console.log('🚀 Server started successfully!');
      console.log(`📍 Server running on port ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 Cloudinary health: http://localhost:${PORT}/api/cloudinary/health`);
      console.log(`🎯 Environment: ${process.env.NODE_ENV || 'development'}`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('\n📋 Available endpoints:');
        console.log(`  GET    http://localhost:${PORT}/health`);
        console.log(`  GET    http://localhost:${PORT}/api/cloudinary/health`);
        console.log(`  DELETE http://localhost:${PORT}/api/cloudinary/delete`);
        console.log(`  POST   http://localhost:${PORT}/api/cloudinary/delete-multiple`);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();