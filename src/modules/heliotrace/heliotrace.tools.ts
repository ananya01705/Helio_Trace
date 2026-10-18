
import {
  ToolDecorator as Tool,
  ExecutionContext,
  z
} from '@nitrostack/core';
import { isValidDate } from './date-utils';
import { correlateSolarEvents } from './event-correlation';

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
function summarizeEvent(event: unknown, eventType: string) {
  if (typeof event !== 'object' || event === null) {
    return { event_type: eventType };
  }

  const record = event as Record<string, any>;

  const summary: Record<string, any> = {
    event_type: eventType
  };

  const fields = [
    'activityID',
    'flrID',
    'gstID',
    'ipsID',
    'sepID',
    'mpcID',
    'rbeID',
    'hssID',
    'wsaID',
    'startTime',
    'beginTime',
    'peakTime',
    'endTime',
    'eventTime',
    'classType',
    'sourceLocation',
    'activeRegionNum',
    'note',
    'link',
    'instruments'
  ];

  for (const field of fields) {
    const value = record[field];

    if (value !== undefined && value !== null && value !== '') {
      summary[field] = value;
    }
  }

  if (Array.isArray(record.linkedEvents)) {
    summary.linkedEvents = record.linkedEvents
      .filter(
        (item: unknown) =>
          typeof item === 'object' && item !== null
      )
      .map((item: unknown) => {
        const linked = item as Record<string, unknown>;

        return linked.activityID
          ? { activityID: linked.activityID }
          : null;
      })
      .filter(Boolean);
  }

  if (Array.isArray(record.cmeAnalyses)) {
    summary.cmeAnalyses = record.cmeAnalyses.map(
      (analysis: unknown) => {
        if (typeof analysis !== 'object' || analysis === null) {
          return {};
        }

        const item = analysis as Record<string, unknown>;
        const result: Record<string, unknown> = {};

        for (const field of [
          'time21_5',
          'latitude',
          'longitude',
          'halfAngle',
          'speed',
          'type',
          'isEarthGB',
          'estimatedShockArrivalTime',
          'estimatedArrivalTime',
          'note',
          'link'
        ]) {
          if (item[field] !== undefined && item[field] !== null) {
            result[field] = item[field];
          }
        }

        return result;
      }
    );
  }

  return summary;
}

export class HelioTraceTools {
  @Tool({
    name: 'search_space_weather_events',
    description:
      'Search NASA CCMC DONKI for space-weather events by type and date range.',
    inputSchema: z.object({
      event_type: z.enum([
        'CME', 'FLR', 'GST', 'IPS', 'SEP',
        'MPC', 'RBE', 'HSS', 'WSA'
      ]).describe(
        'Event type: CME, FLR, GST, IPS, SEP, MPC, RBE, HSS or WSA'
      ),
      start_date: z.string().describe('Start date in YYYY-MM-DD format'),
      end_date: z.string().describe('End date in YYYY-MM-DD format')
    }),
    examples: {
      request: {
        event_type: 'FLR',
        start_date: '2026-10-01',
        end_date: '2026-10-07'
      },
      response: {
        source: 'NASA CCMC DONKI',
        event_type: 'FLR',
        count: 6,
        events: [
          {
            event_type: 'FLR',
            flrID: 'example-event-id',
            classType: 'M1.0',
            peakTime: '2026-10-05T18:48Z'
          }
        ]
      }
    }
  })
  async searchSpaceWeatherEvents(
    input: any,
    ctx: ExecutionContext
  ) {
    const { event_type, start_date, end_date } = input;

    if (!isValidDate(start_date) || !isValidDate(end_date)) {
      throw new Error(
        'Dates must be valid and use YYYY-MM-DD format.'
      );
    }

    if (start_date > end_date) {
      throw new Error(
        'start_date must not be later than end_date.'
      );
    }

    const days =
      (Date.parse(`${end_date}T00:00:00Z`)
      - Date.parse(`${start_date}T00:00:00Z`))
      / 86_400_000;

    if (days >= 30) {
      throw new Error(
        'Please search a date range of 30 days or less.'
      );
    }

    const endpoint = EVENT_ENDPOINTS[event_type];

    if (!endpoint) {
      throw new Error('Unsupported space-weather event type.');
    }

    const url = new URL(
      `https://ccmc.gsfc.nasa.gov/DONKI-API/get/${endpoint}`
    );

    url.searchParams.set('startDate', start_date);
    url.searchParams.set('endDate', end_date);

    ctx.logger.info('Searching NASA DONKI events', {
      event_type,
      start_date,
      end_date
    });
let response;
try {
  response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000)
  });
} catch (err) {
  // Network‑level failure (DNS, timeout, etc.)
  throw new Error('Network request failed while contacting NASA DONKI API.');
}

if (!response.ok) {
  throw new Error(
    `NASA DONKI API returned HTTP ${response.status}. Please try again later.`
  );
}



    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      throw new Error(
        'NASA DONKI returned an unexpected response format.'
      );
    }

    // The DONKI endpoint returns an array rather than a separate total-count
    // field. Therefore, totalRecords means the number of records in the actual
    // NASA response body, not an estimate of all records that may exist.
    const totalRecords = data.length;
    const MAX_EVENTS_RETURNED = 25;
    const events = data
      .slice(0, MAX_EVENTS_RETURNED)
      .map((event: unknown) => summarizeEvent(event, event_type));
    const recordsReturned = events.length;
    const truncated = recordsReturned < totalRecords;

    return {
      source: 'NASA CCMC DONKI',
      source_url: url.toString(),
      event_type,
      start_date,
      end_date,
      totalRecords,
      recordsReturned,
      truncated,
      nextStep: truncated
        ? 'Narrow the date range or query a specific event to retrieve a smaller result set.'
        : null,
      // Keep count for compatibility with existing clients; it is the number
      // of event objects actually included in this response.
      count: recordsReturned,
      events
    };
  }
  
  @Tool({
    name: 'investigate_solar_event',
    description:
      'Investigate links between NASA DONKI solar flares and CMEs for a date range. Supports optional asynchronous MCP task execution with progress updates and cancellation.',
    taskSupport: 'optional',
    inputSchema: z.object({
      start_date: z.string().describe('Start date in YYYY-MM-DD format'),
      end_date: z.string().describe('End date in YYYY-MM-DD format')
    })
  })
  async investigateSolarEvent(input: any, ctx: ExecutionContext) {
    const { start_date, end_date } = input;

    if (!isValidDate(start_date) || !isValidDate(end_date)) {
      throw new Error(
        'Dates must be valid and use YYYY-MM-DD format.'
      );
    }

    if (start_date > end_date) {
      throw new Error(
        'start_date must not be later than end_date.'
      );
    }

    const days =
      (Date.parse(`${end_date}T00:00:00Z`)
      - Date.parse(`${start_date}T00:00:00Z`))
      / 86_400_000;

    if (days >= 30) {
      throw new Error(
        'Please search a date range of 30 days or less.'
      );
    }

    ctx.logger.info('Investigating solar event relationships', {
      start_date,
      end_date
    });
    ctx.task?.throwIfCancelled();
    ctx.task?.updateProgress('Fetching NASA DONKI flare and CME records...');

    async function fetchEvents(endpoint: string): Promise<unknown[]> {
      const url = new URL(
        `https://ccmc.gsfc.nasa.gov/DONKI-API/get/${endpoint}`
      );

      url.searchParams.set('startDate', start_date);
      url.searchParams.set('endDate', end_date);

      let response: Response;

      try {
        response = await fetch(url, {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(10_000)
        });
      } catch {
        throw new Error(
          `Network request failed while contacting NASA DONKI (${endpoint}). Please check your connection and try again.`
        );
      }

      if (!response.ok) {
        throw new Error(
          `NASA DONKI ${endpoint} request failed with HTTP ${response.status}. Please try again later.`
        );
      }

      let data: unknown;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          `NASA DONKI returned invalid JSON for ${endpoint}.`
        );
      }

      if (!Array.isArray(data)) {
        throw new Error(
          `NASA DONKI returned an unexpected ${endpoint} response.`
        );
      }

      return data;
    }

    const [flareData, cmeData] = await Promise.all([
      fetchEvents('FLR'),
      fetchEvents('CME')
    ]);

    ctx.task?.throwIfCancelled();
    ctx.task?.updateProgress('Correlating NASA-recorded flare and CME links...');

    const flares = flareData.map(
      (event: unknown) => summarizeEvent(event, 'FLR')
    );

    const cmes = cmeData.map(
      (event: unknown) => summarizeEvent(event, 'CME')
    );

    ctx.task?.throwIfCancelled();
    ctx.task?.updateProgress('Preparing the source-linked investigation report...');

    const {
      matches,
      unmatchedFlareIds,
      unmatchedCmeIds
    } = correlateSolarEvents(flares, cmes);

    return {
  source: 'NASA CCMC DONKI',
  start_date,
  end_date,

  summary: {
    flare_records: flares.length,
    cme_records: cmes.length,
    confirmed_linked_pairs: matches.length,
    unmatched_flares: unmatchedFlareIds.length,
    unmatched_cmes: unmatchedCmeIds.length
  },

  matches: matches.map((match) => ({
    relationship: {
      status: 'NASA linkedEvents match',
      matched_by: match.matched_by
    },

    flare: {
      id: match.flare.flrID ?? null,
      class: match.flare.classType ?? null,
      begin_time: match.flare.beginTime ?? null,
      peak_time: match.flare.peakTime ?? null,
      end_time: match.flare.endTime ?? null,
      source_location: match.flare.sourceLocation ?? null,
      active_region: match.flare.activeRegionNum ?? null,
      nasa_source: match.flare.link ?? null
    },

    cme: {
      id: match.cme.activityID ?? null,
      start_time: match.cme.startTime ?? null,
      source_location: match.cme.sourceLocation ?? null,
      active_region: match.cme.activeRegionNum ?? null,
      nasa_source: match.cme.link ?? null,

      speed_analyses: ((match.cme.cmeAnalyses as any[]) ?? []).map(
        (analysis: any) => ({
          speed_km_s: analysis.speed ?? null,
          analysis_type: analysis.type ?? null,
          analysis_time: analysis.time21_5 ?? null,
          estimated_arrival_time:
            analysis.estimatedArrivalTime ?? null,
          estimated_shock_arrival_time:
            analysis.estimatedShockArrivalTime ?? null,
          earth_impact_flag: analysis.isEarthGB ?? null,
          nasa_source: analysis.link ?? null
        })
      )
    }
  })),

  unmatched_flare_ids: unmatchedFlareIds,
  unmatched_cme_ids: unmatchedCmeIds,

  interpretation_notes: [
    'Linked pairs reflect relationships recorded by NASA DONKI; they do not independently prove causation.',
    'Unmatched events have no counterpart matched in the queried records; this does not prove they are unrelated.',
    'Missing arrival-time or Earth-impact fields mean that this response contains no such value for that analysis.',
    'CME speeds are measured or analysed speeds, not Earth-arrival speeds.'
  ]
};

  }

}
