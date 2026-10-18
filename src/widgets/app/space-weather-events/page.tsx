'use client';

import { useTheme, useWidgetSDK } from '@nitrostack/widgets';

type EventRecord = Record<string, any>;
type Result = { source?: string; source_url?: string; event_type?: string; start_date?: string; end_date?: string; totalRecords?: number; recordsReturned?: number; count?: number; truncated?: boolean; nextStep?: string | null; events?: EventRecord[] };

const panel = (dark: boolean): React.CSSProperties => ({ background: dark ? '#111827' : '#ffffff', border: `1px solid ${dark ? '#273449' : '#dbe4f0'}`, borderRadius: 14, padding: 16 });
const label: React.CSSProperties = { fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', opacity: .65, marginBottom: 6 };
const value: React.CSSProperties = { fontSize: 25, fontWeight: 750, lineHeight: 1.2 };

function first(...values: unknown[]) { const v = values.find(x => x !== undefined && x !== null && x !== ''); return v === undefined ? 'Not provided' : String(v); }
function EventCard({ event, dark }: { event: EventRecord; dark: boolean }) {
  const title = first(event.classType, event.activityID, event.flrID, event.gstID, event.sepID, event.event_type);
  const time = first(event.peakTime, event.startTime, event.beginTime, event.eventTime, event.endTime);
  return <article style={{ ...panel(dark), padding: 13, marginTop: 10 }}>
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 8px', borderRadius: 20, background: dark ? '#173b58' : '#e0f2fe', color: dark ? '#7dd3fc' : '#075985' }}>{first(event.event_type, 'EVENT')}</span>
      <strong style={{ overflowWrap: 'anywhere' }}>{title}</strong>
    </div>
    <div style={{ marginTop: 9, fontSize: 13, opacity: .8 }}>Time: {time}</div>
    <div style={{ marginTop: 5, fontSize: 13, opacity: .8 }}>Source location: {first(event.sourceLocation)}</div>
    {event.activityID && <div style={{ marginTop: 5, fontSize: 12, opacity: .7 }}>Event ID: {String(event.activityID)}</div>}
    {event.link && <a href={String(event.link)} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 10, color: dark ? '#7dd3fc' : '#0369a1', fontSize: 13 }}>Open NASA record ↗</a>}
    {Array.isArray(event.linkedEvents) && event.linkedEvents.length > 0 && <div style={{ marginTop: 8, fontSize: 12 }}>Linked IDs: {event.linkedEvents.map((x: any) => x.activityID).filter(Boolean).join(', ')}</div>}
  </article>;
}

export default function SpaceWeatherEvents() {
  const theme = useTheme();
  const { getToolOutput } = useWidgetSDK();
  const data = getToolOutput<Result>();
  const dark = theme === 'dark';
  const text = dark ? '#f8fafc' : '#0f172a';
  if (!data) return <main style={{ ...panel(dark), color: text }}>Waiting for NASA DONKI search results…</main>;
  const events = Array.isArray(data.events) ? data.events : [];
  return <main style={{ color: text, fontFamily: 'system-ui, sans-serif', padding: 2 }}>
    <header style={{ ...panel(dark), background: dark ? 'linear-gradient(135deg,#0b2545,#172554)' : 'linear-gradient(135deg,#e0f2fe,#eef2ff)', color: dark ? '#f8fafc' : '#0f172a' }}>
      <div style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: 800, opacity: .75 }}>HELIOTRACE / EVENT SEARCH</div>
      <h2 style={{ margin: '8px 0 4px', fontSize: 22 }}>Space-weather records</h2>
      <div style={{ fontSize: 13, opacity: .8 }}>{first(data.event_type)} · {first(data.start_date)} → {first(data.end_date)}</div>
    </header>
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(125px,1fr))', gap: 10, marginTop: 12 }}>
      <div style={panel(dark)}><div style={label}>Records returned</div><div style={value}>{data.recordsReturned ?? data.count ?? events.length}</div></div>
      <div style={panel(dark)}><div style={label}>In API response</div><div style={value}>{data.totalRecords ?? events.length}</div></div>
      <div style={panel(dark)}><div style={label}>Response status</div><div style={{ ...value, fontSize: 18, color: data.truncated ? '#f59e0b' : '#10b981' }}>{data.truncated ? 'Truncated' : 'Complete response'}</div></div>
    </section>
    {data.truncated && <p style={{ ...panel(dark), color: '#b45309', fontSize: 13 }}>Some records in the API response were omitted from this display. {data.nextStep || 'Try a shorter date range.'}</p>}
    <h3 style={{ margin: '18px 0 4px', fontSize: 16 }}>Event records ({events.length})</h3>
    {events.length ? events.map((event, i) => <EventCard key={String(event.activityID || event.flrID || event.gstID || i)} event={event} dark={dark} />) : <div style={{ ...panel(dark), marginTop: 10 }}>No event records were included in this response for the selected query.</div>}
    {data.source_url && <p style={{ fontSize: 12, opacity: .7, marginTop: 12 }}>Source: <a href={data.source_url} target="_blank" rel="noreferrer" style={{ color: dark ? '#7dd3fc' : '#0369a1' }}>NASA CCMC DONKI API ↗</a></p>}
    <p style={{ fontSize: 11, opacity: .6 }}>Record counts describe the returned data; they are not a severity or impact score.</p>
  </main>;
}
