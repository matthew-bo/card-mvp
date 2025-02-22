type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class Logger {
  static log(level: LogLevel, message: string, data?: Record<string, unknown>) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };

    if (process.env.NODE_ENV === 'development') {
      console.log(JSON.stringify(logEntry));
    } else {
      // In production, implement proper logging service
      // For now, just use console
      console.log(JSON.stringify(logEntry));
    }
  }

  static debug(message: string, data?: Record<string, unknown>) {
    this.log('debug', message, data);
  }

  static info(message: string, data?: Record<string, unknown>) {
    this.log('info', message, data);
  }

  static error(message: string, data?: Record<string, unknown>) {
    this.log('error', message, data);
  }
}