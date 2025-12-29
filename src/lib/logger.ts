import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'

const logDir = 'logs'

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
)

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`
    }
    return msg
  })
)

// Create logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Error log file
    new DailyRotateFile({
      filename: `${logDir}/error-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
    }),

    // Combined log file
    new DailyRotateFile({
      filename: `${logDir}/combined-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
})

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
  }))
}

// Export convenience methods
export const log = {
  error: (msg: string, meta?: any) => logger.error(msg, meta),
  warn: (msg: string, meta?: any) => logger.warn(msg, meta),
  info: (msg: string, meta?: any) => logger.info(msg, meta),
  debug: (msg: string, meta?: any) => logger.debug(msg, meta),
}
