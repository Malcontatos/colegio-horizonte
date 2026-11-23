import { cn } from '../lib/utils';

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn('h-10 w-10', className)}
      aria-hidden="true"
    >
      <rect width="48" height="48" rx="14" fill="#0a2540" />
      <circle cx="24" cy="20" r="9" fill="#f2b84b" />
      <path
        d="M8 29.5h32"
        stroke="#fdf1d8"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M13 36h22"
        stroke="#f2b84b"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

export function BrandLockup({
  compact = false,
  light = false,
}: {
  compact?: boolean;
  light?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <BrandMark className={compact ? 'h-9 w-9' : 'h-11 w-11'} />
      <div className="leading-tight">
        <p
          className={cn(
            'font-display text-[15px] font-semibold tracking-tight',
            light ? 'text-white' : 'text-navy-900',
          )}
        >
          Colégio Horizonte
        </p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-500">
          Portal Escolar
        </p>
      </div>
    </div>
  );
}
