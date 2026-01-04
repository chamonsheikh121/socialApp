import { Global, Module } from '@nestjs/common';
import {
  makeCounterProvider,
  makeHistogramProvider,
} from '@willsoto/nestjs-prometheus';
import { MetricsService } from './metrics.service';
import { MetricsMiddleware } from './metrics.middleware';

@Global()
@Module({
  providers: [
    makeCounterProvider({
      name: 'user_registration_total',
      help: 'Total number of user registrations',
    }),
    makeCounterProvider({
      name: 'user_profile_get_total',
      help: 'Total number of user profile retrievals',
    }),
    makeHistogramProvider({
      name: 'user_registration_duration_seconds',
      help: 'Duration of user registration operations in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
    }),
    makeHistogramProvider({
      name: 'user_profile_get_duration_seconds',
      help: 'Duration of user profile get operations in seconds',
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
    }),
    makeHistogramProvider({
      name: 'http_server_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
    }),
    MetricsService,
    MetricsMiddleware,
  ],
  exports: [
    MetricsService,
    MetricsMiddleware,
    'PROM_METRIC_HTTP_SERVER_REQUEST_DURATION_SECONDS',
  ],
})
export class MetricsModule {}
