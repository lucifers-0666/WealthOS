const NSE_HOLIDAYS_2026 = new Set([
  "2026-01-26", "2026-03-20", "2026-03-30", "2026-04-03",
  "2026-04-14", "2026-04-17", "2026-05-01", "2026-08-15",
  "2026-08-20", "2026-09-18", "2026-10-02", "2026-10-20",
  "2026-11-12", "2026-11-25", "2026-12-25"
]);

export function getISTMarketStatus() {
  const now = new Date();
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
  const nowIST = new Date(utcMs + (5.5 * 3600000));
  
  const day = nowIST.getDay(); // 0=Sun, 6=Sat
  const mins = nowIST.getHours() * 60 + nowIST.getMinutes();
  
  const y = nowIST.getFullYear();
  const m = String(nowIST.getMonth() + 1).padStart(2, '0');
  const d = String(nowIST.getDate()).padStart(2, '0');
  const dateStr = `${y}-${m}-${d}`;
  
  const isWeekend = day === 0 || day === 6;
  const isHoliday = NSE_HOLIDAYS_2026.has(dateStr);
  
  if (isWeekend || isHoliday) {
    return { status: 'closed', label: 'MARKETS CLOSED', color: 'loss' };
  }
  
  if (mins >= 540 && mins < 555) {
    return { status: 'preopen', label: 'PRE-OPEN', color: 'warning' };
  }
  
  if (mins >= 555 && mins < 930) {
    return { status: 'open', label: 'MARKETS OPEN', color: 'gain' };
  }
  
  return { status: 'closed', label: 'MARKETS CLOSED', color: 'loss' };
}
