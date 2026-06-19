export function getISTMarketStatus() {
  const nowUTC = new Date();
  const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
  const nowIST = new Date(nowUTC.getTime() + istOffsetMs);
  const day  = nowIST.getUTCDay();
  const mins = nowIST.getUTCHours() * 60 + nowIST.getUTCMinutes();
  const isWeekday = day >= 1 && day <= 5;
  if (!isWeekday) return { status: 'closed', label: 'MARKETS CLOSED', color: 'loss' };
  if (mins >= 540 && mins < 548) return { status: 'preopen', label: 'PRE-OPEN', color: 'warning' };
  if (mins >= 555 && mins < 930) return { status: 'open',   label: 'MARKETS OPEN', color: 'gain' };
  return { status: 'closed', label: 'MARKETS CLOSED', color: 'loss' };
}
