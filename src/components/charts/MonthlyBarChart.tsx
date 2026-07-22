export function MonthlyBarChart({ data, labels, max = 100 }: { data: number[]; labels: string[]; max?: number }) {
  return (
    <div className="flex h-[200px] items-end gap-2.5">
      {data.map((v, i) => (
        <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
          <div
            className="animate-dc-bar-y w-full origin-bottom rounded-t-[8px] bg-gradient-to-b from-pink to-purple"
            style={{ height: `${(v / max) * 160}px` }}
          />
          <span className="text-[11px] text-text-2">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}
