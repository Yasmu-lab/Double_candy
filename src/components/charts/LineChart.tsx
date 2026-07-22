interface LineChartProps {
  data: number[];
  labels: string[];
  max?: number;
}

export function LineChart({ data, labels, max }: LineChartProps) {
  const w = 560;
  const h = 200;
  const pad = 28;
  const peak = max ?? Math.max(...data) * 1.15;
  const step = (w - pad * 2) / (data.length - 1);
  const points = data.map((v, i) => [pad + i * step, h - pad - (v / peak) * (h - pad * 2)] as const);
  const line = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${line} L ${points[points.length - 1][0]} ${h - pad} L ${points[0][0]} ${h - pad} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="dc-line-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FF4FA0" stopOpacity="0.35" />
          <stop offset="1" stopColor="#FF4FA0" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[1, 2, 3].map((i) => (
        <line
          key={i}
          x1={pad}
          y1={pad + i * ((h - pad * 2) / 3)}
          x2={w - pad}
          y2={pad + i * ((h - pad * 2) / 3)}
          stroke="#ffffff"
          strokeOpacity="0.05"
        />
      ))}
      <path d={area} fill="url(#dc-line-fill)" />
      <path
        d={line}
        fill="none"
        stroke="#FF4FA0"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={1400}
        strokeDashoffset={1400}
        className="animate-dc-draw"
      />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4.5" fill="#1B1330" stroke="#FF4FA0" strokeWidth="2.5" />
      ))}
      {labels.map((label, i) => (
        <text
          key={i}
          x={points[i][0]}
          y={h - 8}
          fill="#B9A9DD"
          fontSize="12"
          textAnchor="middle"
          fontFamily="Space Grotesk"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}
