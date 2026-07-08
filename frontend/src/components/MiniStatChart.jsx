function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function buildTrend(value, points = 7) {
  const v = Math.max(0, Number(value) || 0);
  if (v === 0) return Array(points).fill(0.12);

  return Array.from({ length: points }, (_, i) => {
    const progress = (i + 1) / points;
    const wave = 0.85 + Math.sin(i * 1.2) * 0.08;
    return clamp((v * progress * wave) / v, 0.15, 1);
  });
}

export function MiniSparkline({ value = 0, color = '#0d9488', className = '' }) {
  const heights = buildTrend(value);
  const maxH = 28;

  return (
    <div className={`flex items-end gap-1 h-8 ${className}`} aria-hidden>
      {heights.map((h, i) => (
        <span
          key={i}
          className="flex-1 rounded-sm opacity-90"
          style={{
            height: `${Math.max(4, h * maxH)}px`,
            backgroundColor: color,
          }}
        />
      ))}
    </div>
  );
}

export function MiniAreaChart({ value = 0, max = 50, color = '#0d9488', className = '' }) {
  const ratio = clamp((Number(value) || 0) / (max || 1), 0, 1);
  const points = buildTrend(value, 8);
  const w = 100;
  const h = 32;
  const coords = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - p * h * 0.85 - 2;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={`w-full h-8 ${className}`} aria-hidden>
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${coords} ${w},${h}`} fill={`url(#grad-${color.replace('#', '')})`} />
      <polyline points={coords} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="0" y1={h - ratio * h * 0.85 - 2} x2={w} y2={h - ratio * h * 0.85 - 2} stroke={color} strokeOpacity="0.2" strokeDasharray="3 3" />
    </svg>
  );
}

export function MiniGauge({ value = 0, max = 50, color = '#7c3aed', className = '' }) {
  const ratio = clamp((Number(value) || 0) / (max || 1), 0, 1);
  const r = 14;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - ratio);

  return (
    <div className={`flex items-center gap-2 ${className}`} aria-hidden>
      <svg viewBox="0 0 36 36" className="w-9 h-9 -rotate-90">
        <circle cx="18" cy="18" r={r} fill="none" stroke="#ede9fe" strokeWidth="4" />
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="text-[10px] font-semibold text-violet-600">{Math.round(ratio * 100)}%</span>
    </div>
  );
}

export default function MiniStatChart({ type, value, max, color }) {
  if (type === 'gauge') return <MiniGauge value={value} max={max} color={color} />;
  if (type === 'area') return <MiniAreaChart value={value} max={max} color={color} />;
  return <MiniSparkline value={value} color={color} />;
}
