'use client';

import { useTheme, useWidgetSDK } from '@nitrostack/widgets';
type Obj = Record<string, any>;
type Result = { source?: string; source_url?: string; start_date?: string; end_date?: string; summary?: Obj; sections?: Obj[]; interpretation_notes?: string[] };
const show = (v: unknown) => v === null || v === undefined || v === '' ? 'Not provided' : String(v);
const box = (dark: boolean): React.CSSProperties => ({ background: dark ? '#111827' : '#fff', border: `1px solid ${dark ? '#273449' : '#dbe4f0'}`, borderRadius: 13, padding: 14 });
const names: Record<string, string> = { FLR: 'Solar flares', CME: 'Coronal mass ejections', GST: 'Geomagnetic storms', SEP: 'Solar energetic particles' };
export default function SpaceWeatherBriefing() {
  const theme = useTheme(); const { getToolOutput } = useWidgetSDK(); const data = getToolOutput<Result>(); const dark = theme === 'dark'; const text = dark ? '#f8fafc' : '#0f172a';
  if (!data) return <main style={{ ...box(dark), color: text }}>Waiting for space-weather briefing…</main>;
  const sections = Array.isArray(data.sections) ? data.sections : []; const summary = data.summary || {};
  return <main style={{ color: text, fontFamily: 'system-ui, sans-serif', padding: 2 }}>
    <header style={{ ...box(dark), background: dark ? 'linear-gradient(135deg,#0f766e,#172554)' : 'linear-gradient(135deg,#ccfbf1,#dbeafe)' }}>
      <div style={{ fontSize: 11, letterSpacing: 1.4, fontWeight: 800, opacity: .7 }}>HELIOTRACE / MULTI-SOURCE</div><h2 style={{ margin: '8px 0 4px', fontSize: 22 }}>Space-weather briefing</h2><div style={{ fontSize: 13, opacity: .8 }}>{show(data.start_date)} → {show(data.end_date)}</div>
    </header>
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 9, marginTop: 12 }}>
      <div style={box(dark)}><div style={{ fontSize: 11, opacity: .65 }}>Records in sections</div><div style={{ fontSize: 25, fontWeight: 800 }}>{summary.records_returned ?? sections.reduce((n, s) => n + (s.recordsReturned ?? 0), 0)}</div></div>
      <div style={box(dark)}><div style={{ fontSize: 11, opacity: .65 }}>Records in API responses</div><div style={{ fontSize: 25, fontWeight: 800 }}>{summary.total_records_reported_by_responses ?? '—'}</div></div>
      <div style={box(dark)}><div style={{ fontSize: 11, opacity: .65 }}>Display status</div><div style={{ fontSize: 17, fontWeight: 800, color: summary.truncated ? '#f59e0b' : '#10b981' }}>{summary.truncated ? 'Some sections capped' : 'All included'}</div></div>
    </section>
    <h3 style={{ margin: '18px 0 8px', fontSize: 16 }}>Category breakdown</h3>
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 10 }}>
      {sections.map((section, i) => <article key={section.event_type || i} style={box(dark)}>
        <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 8 }}><div><div style={{ fontSize: 11, opacity: .65 }}>{section.event_type}</div><h4 style={{ margin: '3px 0 8px', fontSize: 15 }}>{names[section.event_type] || section.event_type}</h4></div><strong style={{ fontSize: 25 }}>{section.totalRecords ?? section.count ?? 0}</strong></div>
        <div style={{ fontSize: 12, opacity: .75 }}>Displayed: {section.recordsReturned ?? (section.events || []).length} record(s)</div>
        {section.truncated && <p style={{ fontSize: 12, color: '#d97706', marginBottom: 0 }}>Display capped. {section.nextStep || 'Use a narrower search for more detail.'}</p>}
        <div style={{ marginTop: 10 }}>{(section.events || []).slice(0, 5).map((event: Obj, j: number) => <div key={event.activityID || event.flrID || j} style={{ borderTop: `1px solid ${dark ? '#273449' : '#e2e8f0'}`, padding: '8px 0', fontSize: 12, overflowWrap: 'anywhere' }}><b>{show(event.classType || event.activityID || event.flrID || event.gstID || event.sepID)}</b><div style={{ opacity: .7, marginTop: 3 }}>{show(event.peakTime || event.startTime || event.beginTime || event.eventTime)}</div>{event.link && <a href={String(event.link)} target="_blank" rel="noreferrer" style={{ color: dark ? '#7dd3fc' : '#0369a1' }}>NASA record ↗</a>}</div>)}</div>
      </article>)}
    </section>
    <details style={{ ...box(dark), marginTop: 12 }}><summary style={{ cursor: 'pointer', fontWeight: 700 }}>How to interpret this briefing</summary><ul style={{ fontSize: 12, lineHeight: 1.6, paddingLeft: 18 }}>{(data.interpretation_notes || ['Counts are not severity scores. Missing fields do not imply a negative finding.']).map((n, i) => <li key={i}>{n}</li>)}</ul></details>
    {data.source_url && <p style={{ fontSize: 12, opacity: .7 }}>Source: <a href={data.source_url} target="_blank" rel="noreferrer" style={{ color: dark ? '#7dd3fc' : '#0369a1' }}>NASA CCMC DONKI ↗</a></p>}
    <p style={{ fontSize: 11, opacity: .6 }}>Informational research view only — not an operational warning or forecast.</p>
  </main>;
}
