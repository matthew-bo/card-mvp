import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';

interface MetricData {
  name: string;
  value: number;
  timestamp: Date;
  metadata?: {
    route?: string;
    endpoint?: string;
    userId?: string;
    action?: string;
    [key: string]: string | undefined;
  };
}

interface Metric extends MetricData {
  id: string;
}

export class MetricsCollector {
  static async recordMetric(metric: MetricData) {
    try {
      await addDoc(collection(db, 'metrics'), {
        ...metric,
        timestamp: Timestamp.fromDate(metric.timestamp),
      });
    } catch (error) {
      console.error('Failed to record metric:', error);
    }
  }

  static async getMetrics(metricName: string, timeRange: { start: Date; end: Date }): Promise<Metric[]> {
    try {
      const metricsRef = collection(db, 'metrics');
      const q = query(
        metricsRef,
        where('name', '==', metricName),
        where('timestamp', '>=', Timestamp.fromDate(timeRange.start)),
        where('timestamp', '<=', Timestamp.fromDate(timeRange.end))
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate(),
      })) as Metric[];
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      return [];
    }
  }
}