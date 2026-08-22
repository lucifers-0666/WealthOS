import React, { useState, useEffect } from 'react';

const NSE_HOLIDAYS_2026 = new Set([
  "2026-01-26", "2026-03-20", "2026-03-30", "2026-04-03",
  "2026-04-14", "2026-04-17", "2026-05-01", "2026-08-15",
  "2026-08-20", "2026-09-18", "2026-10-02", "2026-10-20",
  "2026-11-12", "2026-11-25", "2026-12-25"
]);


function getISTNow() {
  const now = new Date();
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utcMs + (5.5 * 3600000));
}

function toIST_YYYY_MM_DD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function isHoliday(date) {
  return NSE_HOLIDAYS_2026.has(toIST_YYYY_MM_DD(date));
}

function isTradingDay(date) {
  return !isWeekend(date) && !isHoliday(date);
}

function getMarketState() {
  const now = getISTNow();
  const hhmm = now.getHours() * 60 + now.getMinutes();

  const PRE_OPEN_START  = 9 * 60;
  const MARKET_OPEN     = 9 * 60 + 15;
  const MARKET_CLOSE    = 15 * 60 + 30;
  const CLOSING_END     = 16 * 60;

  if (!isTradingDay(now)) return "CLOSED";
  if (hhmm < PRE_OPEN_START)  return "CLOSED";
  if (hhmm < MARKET_OPEN)     return "PREOPEN";
  if (hhmm < MARKET_CLOSE)    return "OPEN";
  if (hhmm < CLOSING_END)     return "CLOSING";
  return "CLOSED";
}

function getNextOpenMs() {
  let candidate = getISTNow();
  candidate.setSeconds(0, 0);
  candidate.setHours(9, 15, 0, 0);

  const nowIST = getISTNow();
  const todayMs = nowIST.getHours() * 60 + nowIST.getMinutes();
  const marketOpenMins = 9 * 60 + 15;

  if (isTradingDay(nowIST) && todayMs < marketOpenMins) {
    // Opens today
  } else {
    candidate.setDate(candidate.getDate() + 1);
    let maxDays = 10;
    while (maxDays-- > 0) {
      if (isTradingDay(candidate)) break;
      candidate.setDate(candidate.getDate() + 1);
    }
  }

  return candidate.getTime() - nowIST.getTime();
}

function getCloseInMs() {
  const now = getISTNow();
  const close = new Date(now);
  close.setHours(15, 30, 0, 0);
  return Math.max(0, close.getTime() - now.getTime());
}

function formatCountdown(ms) {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hrs  = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  const hms = `${String(hrs).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  return days > 0 ? `${days}d ${hms}` : hms;
}

export default function MarketStatusBadge() {
  const [stateInfo, setStateInfo] = useState({});

  useEffect(() => {
    const update = () => {
      const state = getMarketState();
      let badgeClass = '';
      let title = '';
      let content = null;

      if (state === "OPEN") {
        badgeClass = 'badge-open';
        const closeIn = formatCountdown(getCloseInMs());
        title = `NSE · 09:15–15:30 IST  ·  Closes in ${closeIn}`;
        content = (
          <>
            <span className="status-dot dot-open"></span>
            <span className="badge-text">MARKET OPEN</span>
          </>
        );
      } else if (state === "PREOPEN") {
        badgeClass = 'badge-preopen';
        const openIn = formatCountdown(getNextOpenMs());
        title = `Pre-open session active  ·  Trading opens in ${openIn}`;
        content = (
          <>
            <span className="status-dot dot-warn"></span>
            <span className="badge-text">PRE-OPEN</span>
          </>
        );
      } else if (state === "CLOSING") {
        badgeClass = 'badge-closing';
        title = `Closing session in progress`;
        content = (
          <>
            <span className="status-dot dot-gold"></span>
            <span className="badge-text">CLOSING</span>
          </>
        );
      } else {
        badgeClass = 'badge-closed';
        const openIn = formatCountdown(getNextOpenMs());
        title = `Opens in ${openIn}`;
        content = (
          <>
            <span className="status-dot dot-muted"></span>
            <span className="badge-text">MARKET CLOSED</span>
            <span className="badge-sep"></span>
            <svg className="clock-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
            </svg>
            <span className="badge-countdown">{openIn}</span>
          </>
        );
      }
      setStateInfo({ badgeClass, title, content });
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  if (!stateInfo.content) return null;

  return (
    <div 
      id="market-status-badge"
      className={`market-status-badge ${stateInfo.badgeClass}`}
      aria-live="polite"
      aria-label="Market status indicator"
      title={stateInfo.title}
    >
      {stateInfo.content}
    </div>
  );
}
