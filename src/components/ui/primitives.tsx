import type { ReactNode } from 'react'

export function Icon({ name, className = '', fill }: { name: string; className?: string; fill?: boolean }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={fill ? { fontVariationSettings: "'FILL' 1" } : undefined}
      aria-hidden="true"
    >
      {name}
    </span>
  )
}

/** Neo-brutalist panel: bordered surface with hard shadow (Stitch `industrial-shadow`). */
export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`bg-surface border-2 border-primary industrial-shadow ${className}`}>{children}</div>
}

/** Panel header bar with bottom border (Stitch pattern). */
export function PanelHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`border-b-2 border-primary p-stack-md flex justify-between items-center ${className}`}>
      {children}
    </div>
  )
}

/** KPI stat card exactly per Stitch dashboards. */
export function StatCard({
  label,
  value,
  tone = 'default',
  icon,
  sublabel,
  className = '',
}: {
  label: string
  value: ReactNode
  tone?: 'default' | 'orange' | 'yellow' | 'dark'
  icon?: string
  sublabel?: ReactNode
  className?: string
}) {
  const toneCls =
    tone === 'orange'
      ? 'bg-secondary-container text-on-secondary-container'
      : tone === 'yellow'
        ? 'bg-tertiary-fixed text-on-tertiary-fixed'
        : tone === 'dark'
          ? 'bg-tertiary text-surface'
          : 'bg-surface text-on-surface'
  return (
    <div
      className={`${toneCls} border-2 border-primary p-stack-md industrial-shadow flex flex-col justify-between h-32 ${className}`}
    >
      <span className="font-label-caps text-label-caps uppercase flex items-center gap-1.5">
        {icon && <Icon name={icon} className="text-[16px]" />}
        {label}
      </span>
      <div className="flex items-baseline justify-between">
        <span className="font-headline-md text-headline-md font-bold">{value}</span>
        {sublabel && (
          <span className="font-mono-label text-[10px] uppercase font-bold bg-primary text-surface px-1.5 py-0.5 border border-primary">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  )
}

/** Status badge (repair lifecycle / asset / warranty). */
const STATUS_CLASSES: Record<string, string> = {
  // repair statuses
  OPEN: 'bg-white text-primary',
  ASSIGNED: 'bg-surface-container-high text-primary',
  DIAGNOSING: 'bg-tertiary-fixed text-on-tertiary-fixed',
  IN_REPAIR: 'bg-secondary-container text-on-secondary-container',
  RESOLVED: 'bg-tertiary-fixed text-on-tertiary-fixed',
  CLOSED: 'bg-surface-container-highest text-on-surface-variant',
  // priorities
  CRITICAL: 'bg-secondary-container text-on-secondary-container',
  HIGH: 'bg-error-container text-on-error-container',
  MEDIUM: 'bg-surface-container-high text-primary',
  LOW: 'bg-white text-outline border border-primary',
  // asset / warranty
  ACTIVE: 'bg-tertiary-fixed text-on-tertiary-fixed',
  IN_REPAIR_ASSET: 'bg-secondary-container text-on-secondary-container',
  RETIRED: 'bg-surface-variant text-on-surface-variant',
  EXPIRING_SOON: 'bg-tertiary-fixed-dim text-on-tertiary-fixed',
  EXPIRED: 'bg-error-container text-on-error-container',
}

export function StatusBadge({ status, className = '' }: { status: string; className?: string }) {
  const key = status.startsWith('IN_REPAIR') ? status : status.toUpperCase()
  const cls = STATUS_CLASSES[key] ?? 'bg-white text-primary'
  return (
    <span
      className={`${cls} px-2 py-0.5 font-label-caps text-[10px] uppercase border border-primary font-bold inline-block ${className}`}
    >
      {status.replace(/_/g, ' ').toLowerCase()}
    </span>
  )
}

/** Primary button — orange fill, black border, hard shadow, press behavior. */
export function NeoButton({
  children,
  onClick,
  type = 'button',
  disabled,
  tone = 'orange',
  className = '',
  title,
}: {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
  tone?: 'orange' | 'yellow' | 'dark' | 'surface' | 'black'
  className?: string
  title?: string
}) {
  const toneCls =
    tone === 'orange'
      ? 'bg-secondary-container text-on-secondary-container hover:brightness-95'
      : tone === 'yellow'
        ? 'bg-tertiary-fixed text-on-tertiary-fixed'
        : tone === 'dark'
          ? 'bg-primary text-surface hover:bg-inverse-surface'
          : tone === 'black'
            ? 'bg-primary text-surface'
            : 'bg-surface text-primary hover:bg-surface-container-highest'
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`px-4 py-2 border-2 border-primary industrial-shadow industrial-shadow-active font-label-caps text-label-caps uppercase flex items-center gap-2 font-bold transition-colors disabled:opacity-50 disabled:pointer-events-none ${toneCls} ${className}`}
    >
      {children}
    </button>
  )
}

/** Page title block per Stitch header pattern. */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-stack-md mb-stack-lg">
      <div>
        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold uppercase tracking-tight">
          {title}
        </h1>
        {subtitle && <p className="font-body-md text-body-md text-on-surface-variant mt-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-stack-md">{actions}</div>}
    </header>
  )
}

/** Loading skeleton block. */
export function LoadingState({ label = 'Loading…', rows = 3 }: { label?: string; rows?: number }) {
  return (
    <div className="space-y-2" role="status" aria-label={label}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-surface border-2 border-primary p-4 animate-pulse flex items-center gap-3">
          <div className="w-16 h-4 bg-surface-container-highest" />
          <div className="flex-1 h-4 bg-surface-container-highest" />
          <div className="w-10 h-4 bg-surface-container-highest" />
        </div>
      ))}
    </div>
  )
}

/** Empty state per web-app-flow.md §42. */
export function EmptyState({
  icon = 'inbox',
  title,
  hint,
  action,
}: {
  icon?: string
  title: string
  hint?: string
  action?: ReactNode
}) {
  return (
    <div className="bg-surface border-2 border-primary p-stack-lg flex flex-col items-center justify-center text-center gap-2">
      <Icon name={icon} className="text-[40px] text-outline" />
      <h3 className="font-label-caps text-label-caps uppercase text-primary">{title}</h3>
      {hint && <p className="font-body-md text-sm text-on-surface-variant">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

/** Error state. */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="bg-error-container text-on-error-container border-2 border-primary p-stack-md flex flex-col items-start gap-2">
      <div className="flex items-center gap-2 font-label-caps text-label-caps uppercase font-bold">
        <Icon name="error" className="text-[20px]" fill />
        Something went wrong
      </div>
      <p className="font-body-md text-sm">{message}</p>
      {onRetry && (
        <NeoButton tone="surface" onClick={onRetry}>
          <Icon name="refresh" className="text-[18px]" /> Retry
        </NeoButton>
      )}
    </div>
  )
}

/** Inline form error banner. */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div className="bg-error-container text-on-error-container border-2 border-primary px-3 py-2 font-body-md text-sm flex items-center gap-2" role="alert">
      <Icon name="error" className="text-[18px]" fill />
      {message}
    </div>
  )
}

/** Success banner. */
export function FormSuccess({ message }: { message: string | null }) {
  if (!message) return null
    return (
    <div className="bg-tertiary-fixed text-on-tertiary-fixed border-2 border-primary px-3 py-2 font-body-md text-sm flex items-center gap-2" role="status">
      <Icon name="check_circle" className="text-[18px]" fill />
      {message}
    </div>
  )
}

/** Industrial input. */
export function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="flex flex-col">
      <label className="font-label-caps text-[12px] uppercase font-bold text-on-surface mb-1 flex items-center justify-between">
        <span>{label}</span>
        {hint && <span className="font-mono-label text-[10px] text-on-surface-variant normal-case">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

export const inputCls =
  'w-full bg-surface border-2 border-primary p-2 font-body-md text-[14px] text-primary focus:outline-none focus:border-secondary-container'

/** Dark WebMCP activity log panel per Stitch. */
export function WebmcpLog({ entries, title = 'WebMCP Log' }: { entries: Array<{ time: string; text: string; tone?: 'yellow' | 'orange' }>; title?: string }) {
  return (
    <div className="bg-tertiary text-surface border-2 border-primary industrial-shadow">
      <div className="border-b-2 border-outline p-stack-md flex justify-between items-center">
        <h2 className="font-label-caps text-label-caps uppercase tracking-wider text-tertiary-fixed">{title}</h2>
        <div className="w-3 h-3 bg-tertiary-fixed animate-pulse" />
      </div>
      <div className="p-stack-md font-mono-label text-mono-label space-y-4 max-h-64 overflow-y-auto">
        {entries.length === 0 && <div className="text-outline-variant">&gt; No recent agent activity.</div>}
        {entries.map((e, i) => (
          <div
            key={i}
            className={`border-l-2 pl-2 ${e.tone === 'orange' ? 'border-secondary-container' : 'border-tertiary-fixed'}`}
          >
            <span className="text-outline-variant block mb-1">{e.time}</span>
            <span className="text-surface">{e.text}</span>
          </div>
        ))}
        <div className="border-l-2 border-tertiary-fixed pl-2 text-tertiary-fixed">_</div>
      </div>
    </div>
  )
}
