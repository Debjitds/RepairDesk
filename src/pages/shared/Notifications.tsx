import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useAsyncData } from '@/hooks/useAsyncData'
import {
  fetchNotifications,
  markNotificationsRead,
  clearReadNotifications,
} from '@/services/notificationService'
import {
  Icon,
  StatCard,
  LoadingState,
  ErrorState,
  EmptyState,
  NeoButton,
} from '@/components/ui/primitives'
import { formatRelative } from '@/lib/format'
import type { Notification } from '@/types'

const TYPE_META: Record<string, { icon: string; label: string; cls: string }> = {
  REPAIR_CREATED: { icon: 'add_task', label: 'New Repair', cls: 'bg-surface-container-high text-primary' },
  REPAIR_ASSIGNMENT: { icon: 'engineering', label: 'Technician Assigned', cls: 'bg-surface-container-high text-primary' },
  REPAIR_STATUS: { icon: 'autorenew', label: 'Repair Update', cls: 'bg-secondary-container text-on-secondary-container' },
  REPAIR_RESOLVED: { icon: 'task_alt', label: 'Repair Resolved', cls: 'bg-tertiary-fixed text-on-tertiary-fixed' },
  REPAIR_CLOSED: { icon: 'archive', label: 'Repair Closed', cls: 'bg-surface-container-highest text-on-surface-variant' },
  CRITICAL_REPAIR: { icon: 'warning', label: 'Critical Repair', cls: 'bg-secondary-container text-on-secondary-container' },
  ASSET_UPDATE: { icon: 'inventory_2', label: 'Asset Update', cls: 'bg-surface-container-high text-primary' },
  WARRANTY_WARNING: { icon: 'verified_user', label: 'Warranty Warning', cls: 'bg-tertiary-fixed-dim text-on-tertiary-fixed' },
  DEADLINE_REMINDER: { icon: 'schedule', label: 'Deadline Reminder', cls: 'bg-surface-container-high text-primary' },
  SYSTEM_NOTICE: { icon: 'info', label: 'System Notice', cls: 'bg-surface-container-highest text-on-surface-variant' },
}

/** Notifications page — shared across roles; adapts title per role per Stitch files. */
export default function NotificationsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [search, setSearch] = useState('')

  const q = useAsyncData<Notification[]>(() => fetchNotifications(), [])
  const notifications = q.data ?? []

  const filtered = useMemo(
    () =>
      notifications.filter(
        (n) =>
          (filter === 'ALL' || (filter === 'UNREAD' ? !n.is_read : n.is_read)) &&
          (typeFilter === 'ALL' ||
            (typeFilter === 'REPAIRS'
              ? n.type.startsWith('REPAIR') || n.type === 'CRITICAL_REPAIR'
              : typeFilter === 'ASSETS'
                ? n.type === 'ASSET_UPDATE' || n.type === 'WARRANTY_WARNING'
                : n.type === 'SYSTEM_NOTICE' || n.type === 'DEADLINE_REMINDER')) &&
          (!search ||
            n.title.toLowerCase().includes(search.toLowerCase()) ||
            n.message.toLowerCase().includes(search.toLowerCase())),
      ),
    [notifications, filter, typeFilter, search],
  )

  const kpi = useMemo(() => {
    const unread = notifications.filter((n) => !n.is_read).length
    const today = notifications.filter(
      (n) => new Date(n.created_at).toDateString() === new Date().toDateString(),
    ).length
    const week = notifications.filter((n) => Date.now() - new Date(n.created_at).getTime() < 7 * 86400000).length
    return { unread, today, week }
  }, [notifications])

  async function markAllRead() {
    await markNotificationsRead(null)
    q.refresh()
  }

  async function markOneRead(id: string) {
    await markNotificationsRead([id])
    q.refresh()
  }

  async function clearRead() {
    await clearReadNotifications()
    q.refresh()
  }

  function openRelated(n: Notification) {
    if (n.related_repair_id) navigate(`/repairs/${n.related_repair_id}`)
    else if (n.related_asset_id) navigate(`/assets/${n.related_asset_id}`)
  }

  const isManagerView = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  return (
    <>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-stack-md mb-stack-lg">
        <div>
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold tracking-tight uppercase">
            Notifications
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">
            {isManagerView
              ? 'System alerts, repair activity, asset warnings, and operational updates.'
              : 'Updates about your assets, repairs, and requests. Real-time operational alerts.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NeoButton tone="surface" onClick={() => void clearRead()}>
            <Icon name="done_all" className="text-[20px]" /> Clear Read
          </NeoButton>
          <NeoButton tone="yellow" onClick={() => void markAllRead()}>
            <Icon name="mark_email_read" className="text-[20px]" /> Mark All As Read
          </NeoButton>
        </div>
      </header>

      {/* KPI cards */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-stack-md mb-stack-lg">
        <StatCard label="Unread" value={String(kpi.unread).padStart(2, '0')} tone="yellow" icon="mark_email_unread" sublabel="Requires Action" />
        <StatCard label="Critical Alerts" value={notifications.filter((n) => n.type === 'CRITICAL_REPAIR').length} tone="orange" icon="warning" sublabel="High Risk" />
        <StatCard label="Repair Updates" value={notifications.filter((n) => n.type.startsWith('REPAIR')).length} icon="build" sublabel="In Queue" />
        <StatCard label="Asset Alerts" value={notifications.filter((n) => n.type === 'ASSET_UPDATE' || n.type === 'WARRANTY_WARNING').length} icon="inventory_2" sublabel="Hardware" />
        <StatCard label="Today" value={kpi.today} icon="today" sublabel="Past 24h" />
      </section>

      {/* Search + filters */}
      <div className="bg-surface border-2 border-primary industrial-shadow p-stack-md mb-stack-lg">
        <div className="flex flex-col md:flex-row gap-stack-md items-center">
          <div className="flex-grow relative w-full">
            <Icon name="search" className="absolute left-3 text-outline text-[20px]" />
            <input
              className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border-2 border-primary font-body-md text-[14px] text-primary placeholder-on-surface-variant outline-none"
              placeholder="Search notifications..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1 w-full md:w-auto">
            {(['ALL', 'UNREAD', 'READ'] as const).map((f) => (
              <button
                key={f}
                className={`px-3 py-2 border-2 font-label-caps text-label-caps uppercase font-bold flex-1 md:flex-none ${
                  filter === f ? 'bg-primary text-surface border-primary' : 'bg-surface text-on-surface border-primary hover:bg-surface-container-highest'
                }`}
                onClick={() => setFilter(f)}
              >
                {f === 'ALL' ? 'All' : f === 'UNREAD' ? `Unread (${kpi.unread})` : 'Read'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-primary/20">
          <span className="font-mono-label text-xs uppercase text-on-surface-variant font-bold">TYPE:</span>
          {[
            { key: 'ALL', label: 'All Types' },
            { key: 'REPAIRS', label: 'Repairs' },
            { key: 'ASSETS', label: 'Assets' },
            { key: 'SYSTEM', label: 'System' },
          ].map((t) => (
            <button
              key={t.key}
              className={`px-3 py-1.5 border-2 border-primary font-label-caps text-xs uppercase font-bold ${
                typeFilter === t.key ? 'bg-tertiary text-white' : 'bg-white text-black hover:bg-surface-container-highest'
              }`}
              onClick={() => setTypeFilter(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="bg-surface border-2 border-primary industrial-shadow">
        <div className="border-b-2 border-primary p-stack-md bg-surface-container-highest flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Icon name="notifications_active" className="text-[20px] text-primary" />
            <h2 className="font-headline-md text-[20px] font-bold uppercase tracking-tight">
              {isManagerView ? 'Operational Feed' : 'Your Notifications'}
            </h2>
          </div>
          <span className="font-mono-label text-[12px] font-bold bg-primary text-surface px-2 py-0.5">
            {filtered.length} ALERTS
          </span>
        </div>
        <div className="divide-y-2 divide-primary">
          {q.loading ? (
            <div className="p-stack-md">
              <LoadingState rows={3} />
            </div>
          ) : q.error ? (
            <div className="p-stack-md">
              <ErrorState message={q.error} onRetry={q.refresh} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-stack-md">
              <EmptyState
                icon="notifications_off"
                title="No notifications"
                hint={filter === 'UNREAD' ? 'You are all caught up.' : 'Notifications will appear here as events occur.'}
              />
            </div>
          ) : (
            filtered.map((n) => {
              const meta = TYPE_META[n.type] ?? TYPE_META.SYSTEM_NOTICE
              return (
                <div
                  key={n.id}
                  className={`p-stack-md transition-colors flex flex-col gap-3 cursor-pointer ${n.is_read ? 'hover:bg-surface-container-highest' : 'bg-surface-container-low/60 hover:bg-surface-container-highest'}`}
                  onClick={() => {
                    if (!n.is_read) void markOneRead(n.id)
                    openRelated(n)
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`${meta.cls} px-2 py-0.5 font-label-caps text-[10px] uppercase border border-primary font-bold flex items-center gap-1`}
                      >
                        <Icon name={meta.icon} className="text-[14px]" />
                        {meta.label}
                      </span>
                      {!n.is_read && (
                        <span className="bg-tertiary-fixed text-on-tertiary-fixed px-1.5 py-0.5 font-label-caps text-[9px] uppercase border border-primary font-bold">
                          Unread
                        </span>
                      )}
                    </div>
                    <span className="font-mono-label text-[11px] text-on-surface-variant font-bold">
                      {formatRelative(n.created_at)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-headline-md text-[16px] font-bold text-primary">{n.title}</h3>
                    <p className="font-body-md text-[13px] text-on-surface-variant mt-1">{n.message}</p>
                  </div>
                  {(n.related_repair || n.related_asset) && (
                    <div className="flex flex-wrap items-center gap-2 font-mono-label text-[11px] text-on-surface-variant bg-surface p-2 border border-primary/30">
                      {n.related_repair && (
                        <span>
                          Ticket: <strong className="text-primary">#{n.related_repair.ticket_number}</strong>
                        </span>
                      )}
                      {n.related_asset && (
                        <span>
                          Asset: <strong className="text-primary">{n.related_asset.asset_tag}</strong>
                        </span>
                      )}
                      <span className="ml-auto flex items-center gap-1 text-secondary font-bold uppercase">
                        Open <Icon name="arrow_forward" className="text-[14px]" />
                      </span>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}
