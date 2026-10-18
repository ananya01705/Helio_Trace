import { Module } from '@nitrostack/core';
import { HelioTraceTools } from './heliotrace.tools.js';
import { HelioTraceInsightsTools } from './heliotrace-insights.tools.js';

@Module({
  name: 'heliotrace',
  description: 'NASA DONKI space-weather event investigation and analysis tools',
  controllers: [HelioTraceTools, HelioTraceInsightsTools]
})
export class HelioTraceModule {}
