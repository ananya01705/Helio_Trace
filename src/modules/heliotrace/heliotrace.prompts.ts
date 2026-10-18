import { PromptDecorator as Prompt, ExecutionContext } from '@nitrostack/core';

function userMessage(content: string) {
  return [{ role: 'user' as const, content }];
}

export class HelioTracePrompts {
  @Prompt({ name: 'investigate_solar_event', description: 'Create a structured, evidence-aware investigation of solar flare and CME records.', arguments: [
    { name: 'start_date', description: 'Start date in YYYY-MM-DD format', required: true },
    { name: 'end_date', description: 'End date in YYYY-MM-DD format', required: true }
  ] })
  async investigateSolarEvent(args: { start_date: string; end_date: string }, ctx: ExecutionContext) {
    ctx.logger.info('Preparing solar-event investigation prompt', args);
    return userMessage('Investigate NASA DONKI solar events from ' + args.start_date + ' through ' + args.end_date + '. Use investigate_solar_event to inspect NASA-recorded flare-CME links, then use search_space_weather_events for focused follow-up if needed. Summarize counts, linked pairs and unmatched records. Include NASA source links. Distinguish recorded associations from causation and state when arrival or Earth-impact fields are missing. Do not invent predictions or operational warnings.');
  }

  @Prompt({ name: 'space_weather_briefing', description: 'Prepare a concise, source-linked briefing across four NASA DONKI event categories.', arguments: [
    { name: 'start_date', description: 'Start date in YYYY-MM-DD format', required: true },
    { name: 'end_date', description: 'End date in YYYY-MM-DD format', required: true }
  ] })
  async spaceWeatherBriefing(args: { start_date: string; end_date: string }, ctx: ExecutionContext) {
    ctx.logger.info('Preparing space-weather briefing prompt', args);
    return userMessage('Prepare a concise NASA DONKI space-weather briefing for ' + args.start_date + ' through ' + args.end_date + '. Call get_space_weather_briefing. Present counts for FLR, CME, GST and SEP, notable returned records with source links, and any truncation. Separate observations from interpretation. Counts are not a severity score; missing fields are not negative findings. Finish with limitations and source links.');
  }

  @Prompt({ name: 'compare_solar_activity_periods', description: 'Compare the same NASA DONKI event category across two date ranges without overstating the result.', arguments: [
    { name: 'event_type', description: 'DONKI event code, e.g. FLR, CME, GST or SEP', required: true },
    { name: 'first_start_date', description: 'First period start date YYYY-MM-DD', required: true },
    { name: 'first_end_date', description: 'First period end date YYYY-MM-DD', required: true },
    { name: 'second_start_date', description: 'Second period start date YYYY-MM-DD', required: true },
    { name: 'second_end_date', description: 'Second period end date YYYY-MM-DD', required: true }
  ] })
  async compareSolarActivityPeriods(args: { event_type: string; first_start_date: string; first_end_date: string; second_start_date: string; second_end_date: string }, ctx: ExecutionContext) {
    ctx.logger.info('Preparing solar activity comparison prompt', args);
    return userMessage('Compare NASA DONKI ' + args.event_type + ' records across ' + args.first_start_date + ' to ' + args.first_end_date + ' and ' + args.second_start_date + ' to ' + args.second_end_date + '. Call compare_space_weather_periods with these exact inputs. Report both counts, difference, percentage change if available, and period lengths. Explain that counts are not equivalent to physical severity, risk, or impact. Include source links and data-coverage limitations.');
  }
}
