import { ResourceDecorator as Resource, ExecutionContext } from '@nitrostack/core';

export class HelioTraceResources {
  @Resource({ uri: 'heliotrace://guide', name: 'HelioTrace User Guide', description: 'How to use HelioTrace tools and interpret their outputs.', mimeType: 'text/markdown' })
  async getGuide(uri: string, ctx: ExecutionContext) {
    ctx.logger.info('Serving HelioTrace user guide');
    const text = '# HelioTrace User Guide\n\nHelioTrace investigates solar and space-weather event records from NASA CCMC DONKI.\n\n## Tools\n- search_space_weather_events: query one supported event category over a date range.\n- investigate_solar_event: inspect NASA-recorded links between solar flares and CMEs.\n- get_space_weather_briefing: gather compact records for FLR, CME, GST and SEP.\n- compare_space_weather_periods: compare record counts for the same event type across two date windows.\n\n## Input dates\nUse real calendar dates in YYYY-MM-DD format. Start dates must not be after end dates. Each requested range must be fewer than 30 elapsed days.\n\n## Interpretation\nCounts describe records returned by DONKI, not severity or risk. A missing field is unavailable in the returned record, not proof of a negative result. NASA-linked events are recorded associations and do not independently prove causation. HelioTrace is informational, not an operational warning or forecast.\n\n## Provenance\nVerify event details using NASA DONKI source links included in tool responses.';
    return { contents: [{ uri, mimeType: 'text/markdown', text }] };
  }

  @Resource({ uri: 'heliotrace://event-types', name: 'NASA DONKI Event Types', description: 'Definitions for event categories supported by HelioTrace.', mimeType: 'application/json' })
  async getEventTypes(uri: string, ctx: ExecutionContext) {
    ctx.logger.info('Serving DONKI event type reference');
    const eventTypes = [
      { code: 'FLR', name: 'Solar flare', meaning: 'A solar flare record, often including begin, peak and end times and a class.', used_by: ['search_space_weather_events', 'investigate_solar_event', 'get_space_weather_briefing', 'compare_space_weather_periods'] },
      { code: 'CME', name: 'Coronal mass ejection', meaning: 'A CME record; analysis fields may include speed and estimated arrival information.', used_by: ['search_space_weather_events', 'investigate_solar_event', 'get_space_weather_briefing', 'compare_space_weather_periods'] },
      { code: 'GST', name: 'Geomagnetic storm', meaning: 'A DONKI geomagnetic-storm event record.', used_by: ['search_space_weather_events', 'get_space_weather_briefing', 'compare_space_weather_periods'] },
      { code: 'SEP', name: 'Solar energetic particles', meaning: 'A DONKI solar energetic-particle event record.', used_by: ['search_space_weather_events', 'get_space_weather_briefing', 'compare_space_weather_periods'] },
      { code: 'IPS', name: 'Interplanetary shock', meaning: 'A DONKI interplanetary shock record.', used_by: ['search_space_weather_events', 'compare_space_weather_periods'] },
      { code: 'MPC', name: 'Magnetopause crossing', meaning: 'A DONKI magnetopause-crossing record.', used_by: ['search_space_weather_events', 'compare_space_weather_periods'] },
      { code: 'RBE', name: 'Radiation belt enhancement', meaning: 'A DONKI radiation-belt enhancement record.', used_by: ['search_space_weather_events', 'compare_space_weather_periods'] },
      { code: 'HSS', name: 'High-speed stream', meaning: 'A DONKI high-speed-stream record.', used_by: ['search_space_weather_events', 'compare_space_weather_periods'] },
      { code: 'WSA', name: 'WSA-Enlil simulation', meaning: 'A WSA-Enlil simulation record exposed through the DONKI endpoint.', used_by: ['search_space_weather_events', 'compare_space_weather_periods'] }
    ];
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify({ source: 'NASA CCMC DONKI', event_types: eventTypes }, null, 2) }] };
  }

  @Resource({ uri: 'heliotrace://methodology', name: 'HelioTrace Methodology and Limitations', description: 'Explains event matching, record-count comparisons, data gaps, and scientific limitations.', mimeType: 'text/markdown' })
  async getMethodology(uri: string, ctx: ExecutionContext) {
    ctx.logger.info('Serving HelioTrace methodology');
    const text = '# Methodology and Limitations\n\n## Event investigation\nHelioTrace compares flare and CME records using linked-event identifiers provided by NASA DONKI. A match means the source records link those events; it is not an independent causal inference.\n\n## Period comparison\nThe comparison tool reports event-record counts, the second-minus-first difference, and percentage change where the first count is non-zero. Counts can be affected by reporting coverage, classification, and selected date windows. They are not a physical severity index.\n\n## Missing values\nNull or absent arrival-time, speed, Earth-impact, or other fields mean the returned source record did not supply that value. Do not interpret missing values as proof that an impact will or will not occur.\n\n## Briefing limits\nThe briefing returns up to eight sample events per category and flags when a category is truncated. Use the focused search tool to inspect records for a specific category and period.\n\n## Use\nHelioTrace is an exploratory research aid, not an operational space-weather warning service. Consult NASA DONKI and relevant official operational agencies for authoritative information.';
    return { contents: [{ uri, mimeType: 'text/markdown', text }] };
  }
}
