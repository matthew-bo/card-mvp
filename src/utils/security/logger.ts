type LogLevel = 'info' | 'warn' | 'error';

export class SecurityLogger {
  static log(level: LogLevel, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };

    // In production, you'd want to send this to a logging service
    console.log(JSON.stringify(logEntry));

    if (level === 'error') {
      // Add error reporting service here
    }
  }

  static error(message: string, error?: any) {
    this.log('error', message, error);
  }

  static warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  static info(message: string, data?: any) {
    this.log('info', message, data);
  }
}