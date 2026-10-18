import { Module } from '@nitrostack/core';
import { HelioTraceTools } from './heliotrace.tools.js';
import { HelioTraceInsightsTools } from './heliotrace-insights.tools.js';
import { HelioTraceResources } from './heliotrace.resources.js';
import { HelioTracePrompts } from './heliotrace.prompts.js';

@Module({
  name: 'heliotrace',
  description: 'NASA DONKI space-weather event investigation, analysis, resources, and prompts',
  controllers: [HelioTraceTools, HelioTraceInsightsTools, HelioTraceResources, HelioTracePrompts]
})
export class HelioTraceModule {}
