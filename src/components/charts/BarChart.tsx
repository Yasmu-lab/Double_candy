interface BarChartItem {
  name: string;
  value: number;
  color: string;
}

export function BarChart({ items, max = 100 }: { items: BarChartItem[]; max?: number }) {
  return (
    <div className="flex flex-col gap-3.5">
      {items.map((d, i) => (
        <div key={i}>
          <div className="mb-1.5 flex justify-between text-[12.5px]">
            <span className="text-text">{d.name}</span>
            <span className="font-bold text-text-2">{d.value}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-card-2">
            <div
              className="animate-dc-bar-x h-full origin-left rounded-full"
              style={{ width: `${(d.value / max) * 100}%`, background: d.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
