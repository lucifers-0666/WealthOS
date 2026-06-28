import React from 'react';
import { Loader2, AlertTriangle, Inbox } from 'lucide-react';

function SectionHeader({ title }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-[2px] h-3 bg-[var(--color-gold)]"></div>
      <h3 className="font-cinzel text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
        {title}
      </h3>
    </div>
  );
}

export function PageLoadingState({
  title = 'Loading Arca…',
  subtitle = 'Preparing secure market context.',
}) {
  return (
    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[3px] p-6 flex items-center justify-center min-h-[240px] w-full">
      <div className="flex flex-col items-center text-center gap-3">
        <Loader2
          size={20}
          className="animate-spin text-[var(--color-gold)]"
        />
        <div className="font-cinzel text-[13px] font-semibold text-[var(--color-text)]">
          {title}
        </div>
        <div className="font-inter text-[11px] text-[var(--color-text-faint)] max-w-[260px] leading-relaxed">
          {subtitle}
        </div>
      </div>
    </div>
  );
}

export function PageErrorState({
  title = 'Unable to load content',
  message = 'We hit a temporary service issue.',
}) {
  return (
    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[3px] p-5 w-full">
      <div className="flex items-center gap-2 text-[var(--color-warn)] mb-2">
        <AlertTriangle size={16} />
        <span className="font-cinzel text-[12px] font-semibold uppercase tracking-[0.10em]">
          {title}
        </span>
      </div>
      <div className="font-inter text-[11px] text-[var(--color-text-muted)] leading-relaxed ml-6">
        {message}
      </div>
    </div>
  );
}

export function EmptyState({
  title = 'Nothing here yet',
  message = 'This section will populate once data arrives.',
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-16 px-8 text-center min-h-[200px]">
      <Inbox
        size={28}
        className="text-[var(--color-border)] mb-4"
        strokeWidth={1.5}
      />
      <div className="font-cinzel text-[13px] font-semibold text-[var(--color-text)] mb-2">
        {title}
      </div>
      <div className="font-inter text-[11px] text-[var(--color-text-faint)] max-w-[260px] leading-relaxed">
        {message}
      </div>
    </div>
  );
}
