export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-dc-shimmer rounded-sm bg-[linear-gradient(90deg,#241A3D_25%,#362A58_37%,#241A3D_63%)] bg-[length:400px_100%] ${className}`}
    />
  );
}

export function Spinner({ size = 24 }: { size?: number }) {
  return (
    <div
      className="animate-dc-spin rounded-full border-[3px] border-white/15 border-t-pink"
      style={{ width: size, height: size }}
    />
  );
}
