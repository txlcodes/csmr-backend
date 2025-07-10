/**
 * CSMR Journal System - Error Handling Middleware
 */
const logger = require('../utils/logger');

/**
 * Custom error response handler
 * Formats all errors into a consistent structure
 */
const errorHandler = (err, req, res, next) => {
  // Log the error for debugging
  logger.error(`${err.name}: ${err.message}`, { 
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  // Default error values
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;
  let errors = [];
  
  // Mongoose validation error (400)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    
    // Extract validation error messages
    Object.values(err.errors).forEach(error => {
      errors.push({
        field: error.path,
        message: error.message
      });
    });
  }
  
  // Mongoose bad ObjectId (404)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found';
  }
  
  // Mongoose duplicate key error (400)
  if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
    
    // Extract duplicate field
    const field = Object.keys(err.keyValue)[0];
    errors.push({
      field,
      message: `${field} already exists`
    });
  }
  
  // JWT errors (401)
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Send standardized error response
  res.status(statusCode).json({
    success: false,
    message,
    errors: errors.length > 0 ? errors : undefined,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
};

module.exports = { errorHandler }; 