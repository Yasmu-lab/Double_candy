interface DonutSegment {
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  centerValue: string;
  centerLabel: string;
}

export function DonutChart({ segments, centerValue, centerLabel }: DonutChartProps) {
  const r = 58;
  const cx = 70;
  const cy = 70;
  const sw = 26;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg viewBox="0 0 140 140" width={150} height={150}>
      {segments.map((s, i) => {
        const len = (c * s.value) / 100;
        const el = (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={sw}
            strokeDasharray={`${len} ${c - len}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="round"
          />
        );
        offset += len;
        return el;
      })}
      <text x={cx} y={66} fill="#fff" fontSize="24" fontWeight="700" textAnchor="middle" fontFamily="Space Grotesk">
        {centerValue}
      </text>
      <text x={cx} y={86} fill="#B9A9DD" fontSize="12" textAnchor="middle">
        {centerLabel}
      </text>
    </svg>
  );
}
