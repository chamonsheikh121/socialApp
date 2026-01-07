import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';

@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric('user_registration_total')
    private readonly userRegistrationCounter: Counter<string>,

    @InjectMetric('user_profile_get_total')
    private readonly userProfileGetCounter: Counter<string>,

    @InjectMetric('user_registration_duration_seconds')
    private readonly userRegistrationHistogram: Histogram<string>,

    @InjectMetric('user_profile_get_duration_seconds')
    private readonly userProfileGetHistogram: Histogram<string>,
  ) {}

  incrementUserRegistration() {
    this.userRegistrationCounter.inc();
  }

  incrementUserProfileGet() {
    this.userProfileGetCounter.inc();
  }

  recordUserRegistrationDuration(duration: number) {
    this.userRegistrationHistogram.observe(duration);
  }

  recordUserProfileGetDuration(duration: number) {
    this.userProfileGetHistogram.observe(duration);
  }
}
