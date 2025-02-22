import { Monitor } from './monitor';

type MonitoringEvent = {
  type: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: Date;
  data?: any;
};

export const AlertThresholds = {
  responseTime: {
    warning: 1000, // 1 second
    critical: 3000 // 3 seconds
  },
  errorRate: {
    warning: 0.01, // 1%
    critical: 0.05 // 5%
  },
  rateLimit: {
    warning: 80, // 80% of limit
    critical: 95 // 95% of limit
  }
};

export class AlertManager {
  static async checkThresholds(metric: string, value: number) {
    const thresholds = (AlertThresholds as Record<string, { warning: number; critical: number }>)[metric];
    if (!thresholds) return;

    if (value >= thresholds.critical) {
      await this.sendAlert({
        type: 'threshold_breach',
        level: 'critical',
        message: `${metric} exceeded critical threshold: ${value}`,
        timestamp: new Date(),
        data: { metric, value, threshold: thresholds.critical }
      });
    } else if (value >= thresholds.warning) {
      await this.sendAlert({
        type: 'threshold_breach',
        level: 'warning',
        message: `${metric} exceeded warning threshold: ${value}`,
        timestamp: new Date(),
        data: { metric, value, threshold: thresholds.warning }
      });
    }
  }

  private static async sendAlert(event: MonitoringEvent) {
    await Monitor.logEvent(event.type, event.message, event.level, event.data);
  }
}