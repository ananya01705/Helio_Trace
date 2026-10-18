'use client';

import { useTheme, useWidgetSDK } from '@nitrostack/widgets';
type Obj = Record<string, any>;
type Result = { source?: string; event_type?: string; first_period?: Obj; second_period?: Obj; comparison?: Obj; interpretation_notes?: string[] };
const show = (v: unknown) => v === null || v === undefined || v === '' ? 'Not available' : String(v);
const box = (dark: boolean): React.CSSProperties => ({ background: dark ? '#111827' : '#fff', border: `1px solid ${dark ? '#273449' : '#dbe4f0'}`, borderRadius: 14, padding: 15 });
function Period({ title, period, dark }: { title: string; period: Obj; dark: boolean }) {
  const events = Array.isArray(period.sample_events) ? period.sample_events : [];
  return <section style={box(dark)}><div style={{ fontSize: 11, letterSpacing: 1, opacity: .65 }}>{title}</div><div style={{ fontSize: 13, marginTop: 6 }}>{show(period.start_date)} → {show(period.end_date)}</div><div style={{ fontSize: 32, fontWeight: 850, margin: '8px 0' }}>{period.count ?? 0}<span style={{ fontSize: 12, fontWeight: 500, opacity: .65, marginLeft: 7 }}>records</span></div><div style={{ marginTop: 8 }}>{events.length ? events.slice(0, 6).map((e: Obj, i: number) => <div key={e.activityID || e.flrID || e.gstID || i} style={{ borderTop: `1px solid ${dark ? '#273449' : '#e2e8f0'}`, padding: '8px 0', fontSize: 12, overflowWrap: 'anywhere' }}><b>{show(e.classType || e.activityID || e.flrID || e.gstID || e.sepID)}</b><div style={{ opacity: .7, marginTop: 3 }}>{show(e.peakTime || e.startTime || e.beginTime || e.eventTime)}</div>{e.link && <a href={String(e.link)} target="_blank" rel="noreferrer" style={{ color: dark ? '#7dd3fc' : '#0369a1' }}>NASA record ↗</a>}</div>) : <div style={{ fontSize: 12, opacity: .7 }}>No sample records in this response.</div>}</div></section>;
}
export default function SpaceWeatherPeriodComparison() {
  const theme = useTheme(); const { getToolOutput } = useWidgetSDK(); const data = getToolOutput<Result>(); const dark = theme === 'dark'; const text = dark ? '#f8fafc' : '#0f172a';
  if (!data) return <main style={{ ...box(dark), color: text }}>Waiting for period-comparison results…</main>;
  const c = data.comparison || {}; const diff = Number(c.count_difference_second_minus_first ?? 0); const positive = diff > 0; const neutral = diff === 0;
  const trend = neutral ? 'Same record count' : positive ? 'More records in period 2' : 'Fewer records in period 2';
  const trendColor = neutral ? '#64748b' : positive ? '#059669' : '#d97706';
  return <main style={{ color: text, fontFamily: 'system-ui, sans-serif', padding: 2 }}>
    <header style={{ ...box(dark), background: dark ? 'linear-gradient(135deg,#7c2d12,#312e81)' : 'linear-gradient(135deg,#ffedd5,#ede9fe)' }}>
      <div style={{ fontSize: 11, letterSpacing: 1.4, fontWeight: 800, opacity: .7 }}>HELIOTRACE / PERIOD COMPARISON</div><h2 style={{ margin: '8px 0 4px', fontSize: 22 }}>Space-weather period comparison</h2><div style={{ fontSize: 13, opacity: .8 }}>Event type: {show(data.event_type)}</div>
    </header>
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 10, marginTop: 12 }}><Period title="PERIOD 1" period={data.first_period || {}} dark={dark}/><Period title="PERIOD 2" period={data.second_period || {}} dark={dark}/></section>
    <section style={{ ...box(dark), marginTop: 12 }}><div style={{ fontSize: 11, letterSpacing: 1, opacity: .65 }}>COUNT DIFFERENCE (PERIOD 2 − PERIOD 1)</div><div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 10, marginTop: 6 }}><strong style={{ fontSize: 36, color: trendColor }}>{diff > 0 ? '+' : ''}{diff}</strong><span style={{ fontSize: 14, fontWeight: 700 }}>{trend}</span></div><div style={{ fontSize: 13, marginTop: 6 }}>Percentage change: {c.percentage_change === null || c.percentage_change === undefined ? 'Not available (period 1 count is zero)' : `${c.percentage_change}%`}</div></section>
    <div style={{ ...box(dark), marginTop: 12 }}><b style={{ fontSize: 13 }}>Interpretation</b><ul style={{ fontSize: 12, lineHeight: 1.65, paddingLeft: 18 }}>{(data.interpretation_notes || ['Counts are not severity or impact measures. Check whether the two date ranges have equal duration.']).map((n, i) => <li key={i}>{n}</li>)}</ul></div>
    <p style={{ fontSize: 11, opacity: .6 }}>A higher record count does not by itself mean more severe space weather. Compare date-range lengths and verify the original NASA records.</p>
  </main>;
}
