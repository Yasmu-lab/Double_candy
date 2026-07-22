const PALETTE = [
  'linear-gradient(135deg,#9B6BFF,#6b3fd6)',
  'linear-gradient(135deg,#FFA347,#e6842a)',
  'linear-gradient(135deg,#FF4FA0,#E63B8C)',
  'linear-gradient(135deg,#C6FF4D,#8fbf20)',
  'linear-gradient(135deg,#FF5C6C,#E63B8C)',
  'linear-gradient(135deg,#FF4FA0,#9B6BFF)',
];

/** Deterministic decorative gradient per id — the DB has no color column. */
export function tintForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}
