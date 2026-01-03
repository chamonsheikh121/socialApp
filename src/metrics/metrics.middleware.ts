// metrics.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Histogram } from 'prom-client';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(
    @InjectMetric('http_server_request_duration_seconds')
    private readonly histogram: Histogram<string>,
  ) {}

  use(req: Request, res: Response, next: () => void) {
    const start = process.hrtime();

    res.on('finish', () => {
      const duration = process.hrtime(start);
      const seconds = duration[0] + duration[1] / 1e9;

      this.histogram.observe(
        {
          method: req.method,
          route: req.originalUrl.split('?')[0],
          status_code: res.statusCode.toString(),
        },
        seconds,
      );
    });

    next();
  }
}
