// Simple logger utility for jewelry shop management system
export interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

export const LOG_LEVELS: LogLevel = {
  ERROR: 'error',
  WARN: 'warn', 
  INFO: 'info',
  DEBUG: 'debug'
};

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  service?: string;
  meta?: any;
}

export class Logger {
  private service: string;

  constructor(service: string = 'jewelry-shop') {
    this.service = service;
  }

  private formatMessage(level: string, message: string, meta?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.service,
      meta
    };
  }

  private write(entry: LogEntry): void {
    const output = `[${entry.timestamp}] ${entry.level.toUpperCase()} [${entry.service}]: ${entry.message}`;
    
    if (entry.level === 'error') {
      console.error(output, entry.meta || '');
    } else if (entry.level === 'warn') {
      console.warn(output, entry.meta || '');
    } else {
      console.log(output, entry.meta || '');
    }
  }

  error(message: string, meta?: any): void {
    this.write(this.formatMessage(LOG_LEVELS.ERROR, message, meta));
  }

  warn(message: string, meta?: any): void {
    this.write(this.formatMessage(LOG_LEVELS.WARN, message, meta));
  }

  info(message: string, meta?: any): void {
    this.write(this.formatMessage(LOG_LEVELS.INFO, message, meta));
  }

  debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV === 'development') {
      this.write(this.formatMessage(LOG_LEVELS.DEBUG, message, meta));
    }
  }
}

// Default logger instance
export const logger = new Logger('jewelry-shop');

// Service-specific logger factory
export const createLogger = (service: string): Logger => {
  return new Logger(service);
};