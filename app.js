const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const { connectDB } = require('./config/db');
const swaggerSpec = require('./config/swagger');
const logger = require('./utils/logger');
const requestLogger = require('./middleware/requestLogger');

// Import routes
const setupRoutes = require('./routes/setup');
const authRoutes = require('./routes/auth');
const donationRoutes = require('./routes/donations');
const ngoRoutes = require('./routes/ngos');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');
const searchRoutes = require('./routes/search');
const dashboardRoutes = require('./routes/dashboard');
const passwordResetRoutes = require('./routes/password-reset');
const reviewRoutes = require('./routes/reviews');

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware with Winston
app.use(requestLogger);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'DAANSETU API Documentation'
}));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'DAANSETU API Server',
    version: '1.0.0',
    status: 'running',
    documentation: '/api-docs'
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/setup', setupRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/password-reset', passwordResetRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/ngos', ngoRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  // Log error with context
  logger.error('❌ Global Error Handler', {
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip
    }
  });
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start Express server
    app.listen(PORT, () => {
      logger.info('🚀 DAANSETU API Server Started');
      logger.info(`📡 Port: ${PORT}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`📄 Swagger Docs: http://localhost:${PORT}/api-docs`);
      logger.info('✨ Ready to accept requests!');
      
      // Console output for visibility
      console.log(`\n🚀 DAANSETU API Server is running!`);
      console.log(`📡 Port: ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`\n📚 API Documentation:`);
      console.log(`   Swagger UI: http://localhost:${PORT}/api-docs`);
      console.log(`   Health Check: http://localhost:${PORT}/health`);
      console.log(`\n✨ Ready to accept requests!\n`);
      console.log(`📝 All logs are saved to /logs directory`);
      console.log(`   - combined.log (all logs)`);
      console.log(`   - error.log (errors only)\n`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server', { error: error.message, stack: error.stack });
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('💥 Uncaught Exception', { error: error.message, stack: error.stack });
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  logger.error('💥 Unhandled Rejection', { error: error.message, stack: error.stack });
  console.error('Unhandled Rejection:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.warn('⚠️ SIGTERM received. Shutting down gracefully...');
  console.log('SIGTERM received. Shutting down gracefully...');
  const { closeDB } = require('./config/db');
  await closeDB();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.warn('⚠️ SIGINT received. Shutting down gracefully...');
  console.log('\nSIGINT received. Shutting down gracefully...');
  const { closeDB } = require('./config/db');
  await closeDB();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;

