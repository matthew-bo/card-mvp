interface LogData {
  context?: string;
  data?: unknown;
}

class LoggerService {
  private isDevelopment = process.env.NEXT_PUBLIC_DEBUG === 'true';

  info(message: string, { context, data }: LogData = {}) {
    if (this.isDevelopment) {
      console.info(
        `[INFO]${context ? ` [${context}]` : ''}: ${message}`,
        data ? data : ''
      );
    }
  }

  warn(message: string, { context, data }: LogData = {}) {
    if (this.isDevelopment) {
      console.warn(
        `[WARN]${context ? ` [${context}]` : ''}: ${message}`,
        data ? data : ''
      );
    }
  }

  error(message: string, { context, data }: LogData = {}) {
    console.error(
      `[ERROR]${context ? ` [${context}]` : ''}: ${message}`,
      data ? data : ''
    );
  }

  debug(message: string, { context, data }: LogData = {}) {
    if (this.isDevelopment) {
      console.debug(
        `[DEBUG]${context ? ` [${context}]` : ''}: ${message}`,
        data ? data : ''
      );
    }
  }
}

export const Logger = new LoggerService(); 