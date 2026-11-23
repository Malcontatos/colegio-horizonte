import {
  useEffect,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ChevronDown,
  Loader2,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { cn, initials } from '../lib/utils';
import { BrandMark } from './Brand';

/* -------------------------------------------------------------------------- */
/* Botões                                                                     */
/* -------------------------------------------------------------------------- */

const buttonVariants = {
  primary:
    'bg-navy-900 text-white shadow-sm hover:bg-navy-800 active:bg-navy-950',
  gold: 'bg-gold-400 text-navy-900 shadow-sm hover:bg-gold-300 active:bg-gold-500',
  outline:
    'border border-navy-200 bg-white text-navy-800 hover:border-navy-300 hover:bg-navy-50',
  ghost: 'text-navy-700 hover:bg-navy-100/80',
  subtle: 'bg-navy-100 text-navy-800 hover:bg-navy-200/80',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
  dangerGhost: 'text-red-600 hover:bg-red-50',
};

const buttonSizes = {
  sm: 'h-9 gap-1.5 rounded-lg px-3 text-[13px]',
  md: 'h-10 gap-2 rounded-xl px-4 text-sm',
  lg: 'h-12 gap-2 rounded-xl px-5 text-[15px]',
};

type ButtonProps = ComponentProps<'button'> & {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  loading?: boolean;
  icon?: ReactNode;
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}

type IconButtonProps = ComponentProps<'button'> & {
  label: string;
  tone?: 'default' | 'danger' | 'light';
};

export function IconButton({
  label,
  tone = 'default',
  className,
  children,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        tone === 'default' && 'text-navy-500 hover:bg-navy-100 hover:text-navy-800',
        tone === 'danger' && 'text-red-500 hover:bg-red-50 hover:text-red-700',
        tone === 'light' && 'text-navy-200 hover:bg-white/10 hover:text-white',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  to,
  variant = 'primary',
  size = 'md',
  icon,
  className,
  children,
}: {
  to: string;
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2',
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
    >
      {icon}
      {children}
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/* Formulários                                                                */
/* -------------------------------------------------------------------------- */

const fieldBase =
  'w-full rounded-xl border border-navy-200/70 bg-white text-sm text-navy-900 shadow-sm transition placeholder:text-navy-300 focus:border-gold-400 focus:outline-none focus:ring-4 focus:ring-gold-100 disabled:cursor-not-allowed disabled:bg-cream-50';

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(fieldBase, 'h-11 px-3.5', className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(fieldBase, 'min-h-24 px-3.5 py-2.5', className)}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: ComponentProps<'select'>) {
  return (
    <div className="relative">
      <select
        className={cn(fieldBase, 'h-11 appearance-none px-3.5 pr-10', className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400"
        aria-hidden="true"
      />
    </div>
  );
}

type FieldProps = {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="flex items-center gap-1 text-[13px] font-medium text-navy-700"
        >
          {label}
          {required && <span className="text-gold-600">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="flex items-center gap-1 text-xs font-medium text-red-600">
          <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-navy-400">{hint}</p>
      ) : null}
    </div>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;

  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder = 'Buscar...',
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400"
        aria-hidden="true"
      />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(fieldBase, 'h-10 pl-10 pr-3')}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Estrutura                                                                  */
/* -------------------------------------------------------------------------- */

export function Card({
  className,
  children,
  padded = true,
}: {
  className?: string;
  children: ReactNode;
  padded?: boolean;
}) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-cream-200 bg-white shadow-card',
        padded && 'p-5 sm:p-6',
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-3',
        className,
      )}
    >
      <div>
        <h2 className="text-base font-semibold text-navy-900">{title}</h2>
        {description && (
          <p className="mt-0.5 text-sm text-navy-500">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

const badgeTones = {
  navy: 'bg-navy-100 text-navy-700',
  gold: 'bg-gold-100 text-gold-600',
  teal: 'bg-teal-100 text-teal-700',
  red: 'bg-red-100 text-red-700',
  neutral: 'bg-cream-100 text-navy-600',
  outline: 'border border-navy-200 text-navy-600',
  green: 'bg-emerald-100 text-emerald-700',
};

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: keyof typeof badgeTones;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none',
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-600">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 text-2xl font-semibold text-navy-900 sm:text-[28px]">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-navy-500">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

const statTones = {
  navy: 'bg-navy-100 text-navy-700',
  gold: 'bg-gold-100 text-gold-600',
  teal: 'bg-teal-100 text-teal-700',
  cream: 'bg-cream-100 text-navy-600',
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'navy',
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: keyof typeof statTones;
}) {
  return (
    <div className="rounded-2xl border border-cream-200 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy-400">
            {label}
          </p>
          <p className="mt-2 font-display text-3xl font-semibold leading-none text-navy-900">
            {value}
          </p>
        </div>
        {icon && (
          <span
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
              statTones[tone],
            )}
          >
            {icon}
          </span>
        )}
      </div>
      {hint && <p className="mt-3 text-xs leading-relaxed text-navy-500">{hint}</p>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Tabelas                                                                    */
/* -------------------------------------------------------------------------- */

export function TableShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'overflow-x-auto rounded-2xl border border-cream-200 bg-white shadow-card',
        className,
      )}
    >
      <table className="w-full min-w-[680px] border-collapse text-left text-sm">
        {children}
      </table>
    </div>
  );
}

export function Th({
  className,
  children,
  ...props
}: ComponentProps<'th'>) {
  return (
    <th
      className={cn(
        'border-b border-cream-200 bg-cream-50/80 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-navy-500',
        className,
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function Td({
  className,
  children,
  ...props
}: ComponentProps<'td'>) {
  return (
    <td
      className={cn(
        'border-b border-cream-100 px-4 py-3.5 align-middle text-navy-700',
        className,
      )}
      {...props}
    >
      {children}
    </td>
  );
}

/* -------------------------------------------------------------------------- */
/* Estados e feedback                                                         */
/* -------------------------------------------------------------------------- */

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn('h-5 w-5 animate-spin text-gold-500', className)}
      aria-label="Carregando"
    />
  );
}

export function LoadingScreen({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <BrandMark className="h-12 w-12" />
      <div className="flex items-center gap-2 text-sm text-navy-500">
        <Spinner className="h-4 w-4" />
        {label}
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-navy-200 bg-white/60 px-6 py-12 text-center',
        className,
      )}
    >
      {icon && (
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-cream-100 text-navy-500">
          {icon}
        </span>
      )}
      <h3 className="text-base font-semibold text-navy-800">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-navy-500">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-xl bg-cream-200/80', className)}
    />
  );
}

export function ErrorState({
  error,
  onRetry,
  className,
}: {
  error: unknown;
  onRetry?: () => void;
  className?: string;
}) {
  const message =
    error instanceof Error
      ? error.message
      : 'Não foi possível carregar os dados.';

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50/60 px-6 py-10 text-center',
        className,
      )}
    >
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-600">
        <AlertCircle className="h-5 w-5" />
      </span>
      <p className="max-w-md text-sm font-medium text-red-700">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={onRetry}
          icon={<RefreshCw className="h-3.5 w-3.5" />}
        >
          Tentar novamente
        </Button>
      )}
    </div>
  );
}

export function Meter({
  value,
  tone = 'auto',
  className,
}: {
  value: number | null | undefined;
  tone?: 'auto' | 'navy' | 'teal' | 'gold';
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, ((value ?? 0) / 10) * 100));
  const autoTone =
    value === null || value === undefined
      ? 'bg-navy-200'
      : value >= 7
        ? 'bg-teal-500'
        : value >= 6
          ? 'bg-gold-400'
          : 'bg-red-500';
  const toneClass =
    tone === 'auto'
      ? autoTone
      : tone === 'navy'
        ? 'bg-navy-700'
        : tone === 'teal'
          ? 'bg-teal-500'
          : 'bg-gold-400';

  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-cream-200', className)}>
      <div
        className={cn('h-full rounded-full transition-all', toneClass)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Avatar({
  name,
  size = 'md',
  tone = 'navy',
  className,
}: {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'navy' | 'gold';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-display font-semibold',
        tone === 'navy' ? 'bg-navy-900 text-gold-300' : 'bg-gold-400 text-navy-900',
        size === 'sm' && 'h-8 w-8 text-[11px]',
        size === 'md' && 'h-10 w-10 text-xs',
        size === 'lg' && 'h-12 w-12 text-sm',
        className,
      )}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Modal                                                                      */
/* -------------------------------------------------------------------------- */

const modalSizes = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-xl',
  lg: 'sm:max-w-3xl',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof modalSizes;
}) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-lift animate-rise sm:rounded-2xl',
          modalSizes[size],
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-cream-200 px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-display text-lg font-semibold text-navy-900">
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-sm text-navy-500">{description}</p>
            )}
          </div>
          <IconButton label="Fechar" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-cream-200 bg-cream-50/60 px-5 py-4 sm:px-6">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  loading = false,
  danger = true,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-navy-600">{description}</p>
    </Modal>
  );
}
