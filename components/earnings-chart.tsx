'use client';

export function EarningsChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <div className="earnings-chart">
      {data.map(d => (
        <div className="earnings-bar" key={d.label}>
          <div className="earnings-bar-track">
            <div className="earnings-bar-fill" style={{ height: `${Math.max(4, (d.value / max) * 100)}%` }} />
          </div>
          <span className="earnings-bar-value">₦{d.value.toLocaleString()}</span>
          <span className="earnings-bar-label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
