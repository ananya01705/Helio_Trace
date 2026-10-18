import { ToolDecorator as Tool, Widget, ExecutionContext, z } from '@nitrostack/core';
import { isValidDate } from './date-utils.js';

const EVENT_ENDPOINTS: Record<string, string> = {
  CME: 'CME',
  FLR: 'FLR',
  GST: 'GST',
  IPS: 'IPS',
  SEP: 'SEP',
  MPC: 'MPC',
  RBE: 'RBE',
  HSS: 'HSS',
  WSA: 'WSAEnlilSimulations'
};

type EventType = keyof typeof EVENT_ENDPOINTS;

function validateRange(startDate: string, endDate: string): void {
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    throw new Error('Dates must be valid and use YYYY-MM-DD format.');
  }
  if (startDate > endDate) {
    throw new Error('start_date must not be later than end_date.');
  }
  const days = (Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86_400_000;
  if (days >= 30) {
    throw new Error('Please search a date range of 30 days or less.');
  }
}

async function fetchEvents(endpoint: string, startDate: string, endDate: string): Promise<Record<string, unknown>[]> {
  const url = new URL(`https://ccmc.gsfc.nasa.gov/DONKI-API/get/${endpoint}`);
  url.searchParams.set('startDate', startDate);
  url.searchParams.set('endDate', endDate);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000)
    });
  } catch {
    throw new Error(`Network request failed while contacting NASA DONKI (${endpoint}).`);
  }

  if (!response.ok) {
    throw new Error(`NASA DONKI ${endpoint} request failed with HTTP ${response.status}. Please try again later.`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error(`NASA DONKI ${endpoint} returned an unexpected response format.`);
  }
  return data.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null);
}

function compactEvent(event: Record<string, unknown>, eventType: string): Record<string, unknown> {
  const summary: Record<string, unknown> = { event_type: eventType };
  for (const key of ['activityID', 'flrID', 'gstID', 'sepID', 'startTime', 'beginTime', 'peakTime', 'eventTime', 'classType', 'sourceLocation', 'link', 'note']) {
    const value = event[key];
    if (value !== undefined && value !== null && value !== '') summary[key] = value;
  }
  return summary;
}

export class HelioTraceInsightsTools {
  @Tool({
    name: 'get_space_weather_briefing',
    description: 'Build a compact multi-source briefing from NASA DONKI solar flare, CME, geomagnetic storm, and solar energetic particle records for a date range. Supports optional asynchronous MCP task execution with progress updates and cancellation.',
    taskSupport: 'optional',
    inputSchema: z.object({
      start_date: z.string().describe('Start date in YYYY-MM-DD format'),
      end_date: z.string().describe('End date in YYYY-MM-DD format')
    })
  })
  @Widget('space-weather-briefing')
  async getSpaceWeatherBriefing(input: { start_date: string; end_date: string }, ctx: ExecutionContext) {
    const { start_date, end_date } = input;
    validateRange(start_date, end_date);
    ctx.logger.info('Building NASA DONKI space-weather briefing', { start_date, end_date });
    ctx.task?.throwIfCancelled();
    ctx.task?.updateProgress('Fetching NASA DONKI records for four event categories...');

    const types = ['FLR', 'CME', 'GST', 'SEP'] as const;
    const results = await Promise.all(types.map(async (type) => ({
      event_type: type,
      events: await fetchEvents(EVENT_ENDPOINTS[type], start_date, end_date)
    })));

    ctx.task?.throwIfCancelled();
    ctx.task?.updateProgress('Summarizing event records and preparing the briefing...');

    const MAX_EVENTS_PER_SECTION = 8;
    const sections = results.map(({ event_type, events }) => {
      const returnedEvents = events.slice(0, MAX_EVENTS_PER_SECTION);
      return {
        event_type,
        totalRecords: events.length,
        recordsReturned: returnedEvents.length,
        count: returnedEvents.length,
        events: returnedEvents.map((event) => compactEvent(event, event_type)),
        truncated: returnedEvents.length < events.length,
        nextStep: returnedEvents.length < events.length
          ? 'Narrow the date range or use search_space_weather_events for a focused query.'
          : null
      };
    });

    return {
      source: 'NASA CCMC DONKI',
      source_url: 'https://ccmc.gsfc.nasa.gov/DONKI/',
      start_date,
      end_date,
      summary: {
        total_records_reported_by_responses: sections.reduce((total, section) => total + section.totalRecords, 0),
        records_returned: sections.reduce((total, section) => total + section.recordsReturned, 0),
        truncated: sections.some((section) => section.truncated),
        counts_by_type: Object.fromEntries(sections.map((section) => [section.event_type, section.totalRecords]))
      },
      sections,
      interpretation_notes: [
        'Counts describe records returned by NASA DONKI for this date range; they are not a severity score.',
        'totalRecords is the count of objects actually present in the NASA API response body; it is not a separate NASA-reported total or an estimate of records omitted upstream.',
        'Only the first eight records per event type are included in each section; truncated and nextStep indicate when records from the response body were omitted.',
        'The API response alone may not establish whether NASA omitted records upstream; truncated describes this tool response only.',
        'A missing field means the source did not provide that value in the returned record; it does not imply a negative finding.',
        'This briefing is informational and is not an operational warning or forecast.'
      ]
    };
  }

  @Tool({
    name: 'compare_space_weather_periods',
    description: 'Compare NASA DONKI event counts and sample records across two date ranges for the same event type.',
    inputSchema: z.object({
      event_type: z.enum(['CME', 'FLR', 'GST', 'IPS', 'SEP', 'MPC', 'RBE', 'HSS', 'WSA']),
      first_start_date: z.string().describe('First period start date in YYYY-MM-DD format'),
      first_end_date: z.string().describe('First period end date in YYYY-MM-DD format'),
      second_start_date: z.string().describe('Second period start date in YYYY-MM-DD format'),
      second_end_date: z.string().describe('Second period end date in YYYY-MM-DD format')
    })
  })
  @Widget('space-weather-period-comparison')
  async compareSpaceWeatherPeriods(input: {
    event_type: EventType;
    first_start_date: string;
    first_end_date: string;
    second_start_date: string;
    second_end_date: string;
  }, ctx: ExecutionContext) {
    const { event_type, first_start_date, first_end_date, second_start_date, second_end_date } = input;
    validateRange(first_start_date, first_end_date);
    validateRange(second_start_date, second_end_date);
    ctx.logger.info('Comparing NASA DONKI periods', { event_type, first_start_date, first_end_date, second_start_date, second_end_date });

    const endpoint = EVENT_ENDPOINTS[event_type];
    const [firstEvents, secondEvents] = await Promise.all([
      fetchEvents(endpoint, first_start_date, first_end_date),
      fetchEvents(endpoint, second_start_date, second_end_date)
    ]);
    const difference = secondEvents.length - firstEvents.length;

    return {
      source: 'NASA CCMC DONKI',
      event_type,
      first_period: {
        start_date: first_start_date,
        end_date: first_end_date,
        count: firstEvents.length,
        sample_events: firstEvents.slice(0, 10).map((event) => compactEvent(event, event_type))
      },
      second_period: {
        start_date: second_start_date,
        end_date: second_end_date,
        count: secondEvents.length,
        sample_events: secondEvents.slice(0, 10).map((event) => compactEvent(event, event_type))
      },
      comparison: {
        count_difference_second_minus_first: difference,
        direction: difference > 0 ? 'more_records_in_second_period' : difference < 0 ? 'fewer_records_in_second_period' : 'same_record_count',
        percentage_change: firstEvents.length === 0
          ? null
          : Math.round((difference / firstEvents.length) * 1000) / 10
      },
      interpretation_notes: [
        'This compares record counts, not physical severity, risk, or impact.',
        'A percentage change is unavailable when the first period contains zero records.',
        'The periods may have different lengths; compare their date ranges before drawing conclusions.',
        'All event records and links should be verified against the original NASA DONKI source.'
      ]
    };
  }
}
