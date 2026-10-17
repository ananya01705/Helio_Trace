
import {
  ToolDecorator as Tool,
  ExecutionContext,
  z
} from '@nitrostack/core';

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

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime())
    && date.toISOString().slice(0, 10) === value;
}

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

    if (days > 30) {
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

    const response = await fetch(url, {
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
      throw new Error(
        `NASA DONKI returned HTTP ${response.status}. Please try again later.`
      );
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      throw new Error(
        'NASA DONKI returned an unexpected response format.'
      );
    }

    const events = data.map((event: unknown) =>
      summarizeEvent(event, event_type)
    );

    return {
      source: 'NASA CCMC DONKI',
      source_url: url.toString(),
      event_type,
      start_date,
      end_date,
      count: events.length,
      events
    };
  }
  
  @Tool({
    name: 'investigate_solar_event',
    description:
      'Investigate links between NASA DONKI solar flares and CMEs for a date range.',
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

    if (days > 30) {
      throw new Error(
        'Please search a date range of 30 days or less.'
      );
    }

    ctx.logger.info('Investigating solar event relationships', {
      start_date,
      end_date
    });

    async function fetchEvents(endpoint: string): Promise<unknown[]> {
      const url = new URL(
        `https://ccmc.gsfc.nasa.gov/DONKI-API/get/${endpoint}`
      );

      url.searchParams.set('startDate', start_date);
      url.searchParams.set('endDate', end_date);

      const response = await fetch(url, {
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) {
        throw new Error(
          `NASA DONKI ${endpoint} request failed with HTTP ${response.status}.`
        );
      }

      const data: unknown = await response.json();

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

    const flares = flareData.map(
      (event: unknown) => summarizeEvent(event, 'FLR')
    );

    const cmes = cmeData.map(
      (event: unknown) => summarizeEvent(event, 'CME')
    );

    const flareById = new Map<string, any>();
    const cmeById = new Map<string, any>();

    for (const flare of flares) {
      if (typeof flare.flrID === 'string') {
        flareById.set(flare.flrID, flare);
      }
    }

    for (const cme of cmes) {
      if (typeof cme.activityID === 'string') {
        cmeById.set(cme.activityID, cme);
      }
    }

    const matches: Array<{
      flare: any;
      cme: any;
      matched_by: string;
    }> = [];

    const matchedPairs = new Set<string>();

    function addMatch(
      flare: any,
      cme: any,
      matchedBy: string
    ) {
      const key = `${flare.flrID}|${cme.activityID}`;

      if (matchedPairs.has(key)) {
        return;
      }

      matchedPairs.add(key);
      matches.push({
        flare,
        cme,
        matched_by: matchedBy
      });
    }

    for (const flare of flares) {
      for (const linked of flare.linkedEvents ?? []) {
        const cme = cmeById.get(linked.activityID);

        if (cme) {
          addMatch(flare, cme, 'NASA linkedEvents');
        }
      }
    }

    for (const cme of cmes) {
      for (const linked of cme.linkedEvents ?? []) {
        const flare = flareById.get(linked.activityID);

        if (flare) {
          addMatch(flare, cme, 'NASA linkedEvents');
        }
      }
    }

    const matchedFlareIds = new Set(
      matches.map((match) => match.flare.flrID)
    );

    const matchedCmeIds = new Set(
      matches.map((match) => match.cme.activityID)
    );

    
return {
  source: 'NASA CCMC DONKI',
  start_date,
  end_date,

  summary: {
    flare_records: flares.length,
    cme_records: cmes.length,
    confirmed_linked_pairs: matches.length,
    unmatched_flares: flares.filter(
      (flare: any) => !matchedFlareIds.has(flare.flrID)
    ).length,
    unmatched_cmes: cmes.filter(
      (cme: any) => !matchedCmeIds.has(cme.activityID)
    ).length
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

      speed_analyses: (match.cme.cmeAnalyses ?? []).map(
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

  unmatched_flare_ids: flares
    .filter((flare: any) => !matchedFlareIds.has(flare.flrID))
    .map((flare: any) => flare.flrID),

  unmatched_cme_ids: cmes
    .filter((cme: any) => !matchedCmeIds.has(cme.activityID))
    .map((cme: any) => cme.activityID),

  interpretation_notes: [
    'Linked pairs reflect relationships recorded by NASA DONKI; they do not independently prove causation.',
    'Unmatched events have no counterpart matched in the queried records; this does not prove they are unrelated.',
    'Missing arrival-time or Earth-impact fields mean that this response contains no such value for that analysis.',
    'CME speeds are measured or analysed speeds, not Earth-arrival speeds.'
  ]
};

  }

}
