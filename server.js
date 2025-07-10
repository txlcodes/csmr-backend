const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const path = require('path');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');

dotenv.config();

const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const logger = require('./utils/logger');
const User = require('./models/userModel');

// Load env vars and validate required ones
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  logger.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  logger.error('Please create a .env file with the required variables. Check .env.example for reference.');
  process.exit(1);
}

// Connect to database
connectDB();

// Create default admin user if not exists
async function createDefaultAdmin() {
  try {
    const adminEmail = 'admin@csmr.org.in';
    const existing = await User.findOne({ email: adminEmail });
    if (!existing) {
      const password = 'Admin@123'; // Client can change this after first login
      const hashedPassword = await bcrypt.hash(password, 10);
      await User.create({
        name: 'Admin User',
        email: adminEmail,
        password: hashedPassword,
        isAdmin: true,
        role: 'admin',
        institution: 'CSMR',
      });
      logger.info('Default admin user created: admin@csmr.org.in / Admin@123');
    } else {
      logger.info('Default admin user already exists.');
    }
  } catch (err) {
    logger.error('Error creating default admin user:', err);
  }
}
createDefaultAdmin();

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Compress all responses
app.use(compression());

// Enable CORS for frontend with better configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    // Add your Vercel frontend URL here
    'https://csmr-frontend.vercel.app',
    // Allow all Vercel domains (for development)
    /\.vercel\.app$/
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

// Security middleware
app.use(helmet()); // Set security headers

// Add content security policy
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com", "cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: [
        "'self'",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        // Allow connections to Render backend
        "https://*.onrender.com"
      ]
    }
  })
);

app.use(mongoSanitize()); // Sanitize data
app.use(xss()); // Prevent XSS attacks
app.use(hpp()); // Prevent HTTP param pollution

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: process.env.NODE_ENV === 'production' ? 60 : 100, // Stricter limits in production
  message: 'Too many requests from this IP, please try again after 10 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Set static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount routers
app.use('/api/users', require('./routes/userRoutes')); // correct 
app.use('/api/journals', require('./routes/journalRoutes')); //correct 
app.use('/api/articles', require('./routes/articleRoutes'));
app.use('/api/contact', require('./routes/contactRoutes')); //incomplete
app.use('/api/cfp', require('./routes/cfpRoutes'));  // incomplete
app.use('/api/newsletter', require('./routes/newsletterRoutes')); //incomplete

// Error handler
app.use(errorHandler);

// Handle 404 errors
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
}); 