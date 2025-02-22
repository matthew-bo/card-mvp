import { MetricsCollector } from './collector';

export class UserMetrics {
  static async recordUserAction(action: string, userId: string) {
    await MetricsCollector.recordMetric({
      name: 'user_action',
      value: 1,
      timestamp: new Date(),
      metadata: { action, userId }
    });
  }

  static async recordActiveUsers() {
    // Count users active in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const metrics = await MetricsCollector.getMetrics('user_action', {
      start: fiveMinutesAgo,
      end: new Date()
    });
  
    const uniqueUsers = new Set(
      metrics.map(m => m.metadata?.userId).filter(userId => userId !== undefined)
    ).size;
  
    await MetricsCollector.recordMetric({
      name: 'active_users',
      value: uniqueUsers,
      timestamp: new Date()
    });
  }
}