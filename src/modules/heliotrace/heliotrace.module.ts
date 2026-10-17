
import { Module } from '@nitrostack/core';
import { HelioTraceTools } from './heliotrace.tools.js';

@Module({
  name: 'heliotrace',
  description: 'NASA DONKI space-weather event investigation tools',
  controllers: [HelioTraceTools]
})
export class HelioTraceModule {}
