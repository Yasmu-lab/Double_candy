export const formatBRLCents = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;

export function formatRelativeDate(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;
  const diffDays = Math.floor(diffH / 24);
  if (diffDays === 1) return 'ontem';
  if (diffDays < 7) return `há ${diffDays} dias`;
  return date.toLocaleDateString('pt-BR');
}

function saoPauloDateKey(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

/** Compares an ISO timestamp's America/Sao_Paulo calendar day against "today + dayOffset". */
export function isSaoPauloDay(iso: string | null, dayOffset: number): boolean {
  if (!iso) return false;
  const target = new Date();
  target.setUTCDate(target.getUTCDate() + dayOffset);
  return saoPauloDateKey(new Date(iso)) === saoPauloDateKey(target);
}

export function formatPickup(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
  if (isSaoPauloDay(iso, 0)) return `Hoje · ${time}`;
  if (isSaoPauloDay(iso, 1)) return `Amanhã · ${time}`;
  return `${date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })} · ${time}`;
}
