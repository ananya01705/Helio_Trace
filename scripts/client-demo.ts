import { McpClient } from '@nitrostack/core';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const client = new McpClient({
    url: process.env.MCP_URL || 'http://localhost:3000',
    logger: console,
  });

  try {
    await client.connect();
    console.log('✅ Connected to MCP server');

    const result = await client.callTool('search_space_weather_events', {
      event_type: 'FLR',
      start_date: '2026-10-01',
      end_date:   '2026-10-07',
    });

    console.log('🚀 Search Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('❌ Error calling tool:', err);
  } finally {
    await client.disconnect();
  }
}

main();
