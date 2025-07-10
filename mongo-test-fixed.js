const mongoose = require('mongoose');

// Connection string with properly encoded credentials
// Note: The '@7' in the password needs to be URL-encoded
const mongoUri = 'mongodb+srv://SAADIITR:9368245097%407@cluster0.yb16xa7.mongodb.net/?retryWrites=true&w=majority';

// Connection options
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
};

async function testConnection() {
  try {
    console.log('Attempting to connect to MongoDB...');
    
    const conn = await mongoose.connect(mongoUri, options);
    
    console.log(`MongoDB Connected Successfully to: ${conn.connection.host}`);
    console.log('Database name:', conn.connection.name);
    
    // Disconnect
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
    
    return 'SUCCESS';
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    return 'FAILED: ' + error.message;
  }
}

// Run the test
testConnection()
  .then(result => {
    console.log('Test result:', result);
    process.exit(0);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  }); 