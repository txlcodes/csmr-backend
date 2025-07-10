/**
 * CSMR Journal System - Logger Utility
 * Uses Winston for structured logging
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// Define log format
const logFormat = winston.format.printf(
    ({ level, message, timestamp, stack }) => {
        return `${timestamp} ${level}: ${stack || message}`;
    }
);

// Configure the Winston logger
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        logFormat
    ),
    transports: [
        // Console transport for all environments
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        
        // File transport for error logs
        new winston.transports.File({ 
            filename: path.join(logDir, 'error.log'), 
            level: 'error' 
        }),
        
        // File transport for all logs
        new winston.transports.File({ 
            filename: path.join(logDir, 'combined.log') 
        })
    ],
    // Don't exit on handled exceptions
    exitOnError: false
});

// Add stream for Morgan integration (used in server.js)
logger.stream = {
    write: function(message) {
        logger.info(message.trim());
    }
};

// Create a simple wrapper for the logger
module.exports = {
    info: (message) => {
        logger.info(message);
    },
    error: (message, meta = {}) => {
        logger.error(message, meta);
    },
    warn: (message) => {
        logger.warn(message);
    },
    debug: (message) => {
        logger.debug(message);
    },
    // Stream for Morgan
    stream: logger.stream
}; 