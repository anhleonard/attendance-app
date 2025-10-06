import { createLogger, transports, format } from 'winston';
import * as fs from 'fs';
import * as path from 'path';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.printf(({ timestamp, level, message, requestId, ...meta }) => {
      // Format as readable text with requestId in the message
      const levelStr = level.toUpperCase();
      const messageStr = typeof message === 'object' ? JSON.stringify(message) : message;
      
      // Add requestId to the message if available
      const requestIdStr = requestId ? `[${requestId}] ` : '';
      
      // Add metadata if exists
      const metaStr = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';
      
      return `${timestamp} [${levelStr}] ${requestIdStr}${messageStr}${metaStr}`;
    }),
  ),
  transports: [
    new transports.File({
      filename: path.join(logsDir, 'app.log'),
      level: 'info',
    }),
    new transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
    }),
  ],
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
  );
}
