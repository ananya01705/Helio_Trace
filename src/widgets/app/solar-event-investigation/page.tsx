'use client';

import { useTheme, useWidgetSDK } from '@nitrostack/widgets';

type Obj = Record<string, any>;
type Result = { source?: string; start_date?: string; end_date?: string; summary?: Obj; matches?: Obj[]; unmatched_flare_ids?: string[]; unmatched_cme_ids?: string[]; interpretation_notes?: string[] };
const fmt = (v: unknown) => v === null || v === undefined || v === '' ? 'Not provided' : String(v);
const box = (dark: boolean): React.CSSProperties => ({ background: dark ? '#111827' : '#fff', border: `1px solid ${dark ? '#273449' : '#dbe4f0'}`, borderRadius: 14, padding: 15 });
function RecordPanel({ title, record, dark }: { title: string; record: Obj; dark: boolean }) {
  return <section style={box(dark)}><h4 style={{ margin: '0 0 10px', fontSize: 14 }}>{title}</h4>
    <div style={{ fontSize: 12, lineHeight: 1.8, overflowWrap: 'anywhere' }}>
      <div><b>ID:</b> {fmt(record.id)}</div><div><b>Time:</b> {fmt(record.peak_time || record.start_time || record.begin_time)}</div>
      <div><b>Class:</b> {fmt(record.class)}</div><div><b>Location:</b> {fmt(record.source_location)}</div>
      {record.nasa_source && <a href={String(record.nasa_source)} target="_blank" rel="noreferrer" style={{ color: dark ? '#7dd3fc' : '#0369a1' }}>Open NASA record ↗</a>}
      {Array.isArray(record.speed_analyses) && record.speed_analyses.map((a: Obj, i: number) => <div key={i} style={{ marginTop: 8, paddingTop: 7, borderTop: `1px solid ${dark ? '#273449' : '#e2e8f0'}` }}><b>CME analysis {i + 1}:</b> {fmt(a.speed_km_s)} km/s · Earth impact flag: {fmt(a.earth_impact_flag)}<br/>Estimated arrival: {fmt(a.estimated_arrival_time)}</div>)}
    </div>
  </section>;
}
export default function SolarEventInvestigation() {
  const theme = useTheme(); const { getToolOutput } = useWidgetSDK(); const data = getToolOutput<Result>(); const dark = theme === 'dark'; const text = dark ? '#f8fafc' : '#0f172a';
  if (!data) return <main style={{ ...box(dark), color: text }}>Waiting for flare–CME investigation results…</main>;
  const s = data.summary || {}; const matches = Array.isArray(data.matches) ? data.matches : [];
  const stats = [['Flare records', s.flare_records ?? 0], ['CME records', s.cme_records ?? 0], ['Linked pairs', s.confirmed_linked_pairs ?? matches.length], ['Unmatched flares', s.unmatched_flares ?? (data.unmatched_flare_ids || []).length], ['Unmatched CMEs', s.unmatched_cmes ?? (data.unmatched_cme_ids || []).length]];
  return <main style={{ color: text, fontFamily: 'system-ui, sans-serif', padding: 2 }}>
    <header style={{ ...box(dark), background: dark ? 'linear-gradient(135deg,#312e81,#172554)' : 'linear-gradient(135deg,#ede9fe,#e0f2fe)' }}>
      <div style={{ fontSize: 11, letterSpacing: 1.4, fontWeight: 800, opacity: .7 }}>HELIOTRACE / CORRELATION</div><h2 style={{ margin: '8px 0 4px', fontSize: 21 }}>Solar event investigation</h2><div style={{ fontSize: 13, opacity: .8 }}>{fmt(data.start_date)} → {fmt(data.end_date)}</div>
    </header>
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(105px,1fr))', gap: 9, marginTop: 12 }}>{stats.map(([name, val]) => <div key={String(name)} style={box(dark)}><div style={{ fontSize: 11, opacity: .65 }}>{name}</div><div style={{ fontSize: 24, fontWeight: 800, marginTop: 5 }}>{val}</div></div>)}</section>
    <h3 style={{ margin: '18px 0 8px', fontSize: 16 }}>Recorded flare–CME matches</h3>
    {matches.length ? matches.map((m, i) => <section key={i} style={{ ...box(dark), marginTop: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}><b>Pair {i + 1}</b><span style={{ fontSize: 11, borderRadius: 20, padding: '4px 8px', background: dark ? '#064e3b' : '#d1fae5', color: dark ? '#a7f3d0' : '#065f46' }}>{fmt(m.relationship?.status)}</span></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 10 }}><RecordPanel title="Solar flare (FLR)" record={m.flare || {}} dark={dark}/><RecordPanel title="Coronal mass ejection (CME)" record={m.cme || {}} dark={dark}/></div>
    </section>) : <div style={{ ...box(dark), fontSize: 13 }}>No linked flare–CME pairs were found in the queried records. This does not prove the events are unrelated.</div>}
    <details style={{ ...box(dark), marginTop: 12 }}><summary style={{ cursor: 'pointer', fontWeight: 700 }}>Unmatched event IDs</summary><p style={{ fontSize: 13 }}>Flares: {(data.unmatched_flare_ids || []).join(', ') || 'None reported'}</p><p style={{ fontSize: 13 }}>CMEs: {(data.unmatched_cme_ids || []).join(', ') || 'None reported'}</p></details>
    <div style={{ ...box(dark), marginTop: 12 }}><b style={{ fontSize: 13 }}>Interpretation notes</b><ul style={{ fontSize: 12, lineHeight: 1.6, paddingLeft: 18 }}>{(data.interpretation_notes || ['Matches reflect NASA-recorded links and do not independently prove causation.']).map((n, i) => <li key={i}>{n}</li>)}</ul></div>
    <p style={{ fontSize: 11, opacity: .6 }}>NASA-recorded relationships are evidence of a recorded association, not proof of physical causation or a forecast.</p>
  </main>;
}
