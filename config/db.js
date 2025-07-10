const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
        // Simplified MongoDB connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };
    
    // Connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGO_URI, options);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Handle MongoDB connection errors after initial connection
    mongoose.connection.on('error', err => {
      logger.error(`MongoDB connection error: ${err}`);
      
      // Attempt to reconnect
      setTimeout(() => {
        logger.info('Attempting to reconnect to MongoDB...');
        mongoose.connect(process.env.MONGO_URI, options);
      }, 5000); // Wait 5 seconds before reconnecting
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      
      // Attempt to reconnect
      setTimeout(() => {
        logger.info('Attempting to reconnect to MongoDB...');
        mongoose.connect(process.env.MONGO_URI, options);
      }, 5000); // Wait 5 seconds before reconnecting
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    // If Node process ends, close MongoDB connection
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    logger.warn('Running in demo mode without database connection');
    logger.info('API endpoints will return sample data');
    
    // Set global flag for demo mode
    global.isDemoMode = true;
  }
};

module.exports = connectDB; 