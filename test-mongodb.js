require('dotenv').config();
const mongoose = require('mongoose');
const logger = console;
const fs = require('fs');
const path = require('path');

async function testConnection() {
  try {
    // Debug .env file
    const envPath = path.resolve(__dirname, '.env');
    logger.log('Looking for .env file at:', envPath);
    
    if (fs.existsSync(envPath)) {
      logger.log('.env file exists');
      const envContent = fs.readFileSync(envPath, 'utf8');
      logger.log('.env file content:', envContent);
    } else {
      logger.error('.env file does not exist');
    }
    
    // Log all environment variables
    logger.log('Environment variables:');
    logger.log('NODE_ENV:', process.env.NODE_ENV);
    logger.log('PORT:', process.env.PORT);
    logger.log('MONGO_URI:', process.env.MONGO_URI ? 'URI is defined' : 'URI is not defined');
    logger.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Secret is defined' : 'Secret is not defined');
    
    // Set a manual MongoDB URI if it's not defined in environment
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://SAADIITR:9368245097@7@cluster0.yb16xa7.mongodb.net/?retryWrites=true&w=majority';
    
    if (!mongoUri) {
      logger.error('MongoDB URI is not available');
      process.exit(1);
    }

    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    };
    
    logger.log('Attempting to connect to MongoDB with URI:', mongoUri);
    
    const conn = await mongoose.connect(mongoUri, options);
    
    logger.log(`MongoDB Connected Successfully to: ${conn.connection.host}`);
    logger.log('Database name:', conn.connection.name);
    
    // List collections
    const collections = await conn.connection.db.listCollections().toArray();
    logger.log('Collections:', collections.map(c => c.name));
    
    // Disconnect
    await mongoose.disconnect();
    logger.log('MongoDB disconnected');
    
    return true;
  } catch (error) {
    logger.error('MongoDB connection failed:', error.message);
    return false;
  }
}

// Run the test
testConnection()
  .then(success => {
    if (success) {
      logger.log('MongoDB connection test PASSED');
    } else {
      logger.error('MongoDB connection test FAILED');
    }
    process.exit(0);
  })
  .catch(err => {
    logger.error('Unexpected error:', err);
    process.exit(1);
  }); 