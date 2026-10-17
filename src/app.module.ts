import { McpApp, Module, ConfigModule } from '@nitrostack/core';
import { SystemHealthCheck } from './health/system.health.js';
import { HelioTraceModule } from './modules/heliotrace/heliotrace.module.js';

/**
 * Root Application Module
 * 
 * This is the main module that bootstraps the MCP server.
 * It registers all feature modules and health checks.
 */
@McpApp({
  module: AppModule,
  server: {
    name: 'heliotrace',
    version: '1.0.0'
  },
  logging: {
    level: 'info'
  }
})
@Module({
  name: 'app',
  description: 'Root application module',
  imports: [
  ConfigModule.forRoot(),
  HelioTraceModule
 ] , 
  providers: [
    // Health Checks
    SystemHealthCheck,
  ]
})
export class AppModule {}

