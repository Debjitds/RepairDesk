import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAsyncData } from '@/hooks/useAsyncData'
import { fetchRepairs } from '@/services/repairService'
import { fetchAssets } from '@/services/assetService'
import { supabase } from '@/lib/supabase'
import {
  Icon,
  LoadingState,
  ErrorState,
  EmptyState,
  StatusBadge,
  WebmcpLog,
} from '@/components/ui/primitives'
import { dueLabel, formatRelative } from '@/lib/format'
import type { Asset, Repair, WebmcpExecution } from '@/types'

/**
 * Technician Dashboard per Stitch `technician_dashboard.html`:
 * KPI row (4), Today's Work numbered list, assets needing attention bento,
 * recent activity, urgent repairs sidebar, WebMCP activity, upcoming deadlines.
 */
export default function TechnicianDashboard() {
  const navigate = useNavigate()
  const repairsQ = useAsyncData<Repair[]>(() => fetchRepairs({ assignedToMe: true }), [])
  const assetsQ = useAsyncData<Asset[]>(() => fetchAssets({}), [])
  const webmcpQ = useAsyncData<WebmcpExecution[]>(async () => {
    const { data, error } = await supabase
      .from('webmcp_tool_executions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    if (error) throw error
    return (data ?? []) as WebmcpExecution[]
  }, [])

  const repairs = repairsQ.data ?? []

  const kpi = useMemo(
    () => ({
      assigned: repairs.filter((r) => !['RESOLVED', 'CLOSED'].includes(r.status)).length,
      critical: repairs.filter((r) => r.priority === 'CRITICAL' && !['RESOLVED', 'CLOSED'].includes(r.status)).length,
      inRepair: repairs.filter((r) => ['DIAGNOSING', 'IN_REPAIR'].includes(r.status)).length,
      dueToday: repairs.filter((r) => r.due_date && new Date(r.due_date).toDateString() === new Date().toDateString()).length,
    }),
    [repairs],
  )

  const today = useMemo(
    () =>
      repairs
        .filter((r) => !['RESOLVED', 'CLOSED'].includes(r.status))
        .sort((a) => (a.priority === 'CRITICAL' ? -1 : 1))
        .slice(0, 3),
    [repairs],
  )

  const recent = useMemo(
    () => repairs.filter((r) => ['RESOLVED', 'CLOSED'].includes(r.status)).slice(0, 4),
    [repairs],
  )

  const attention = useMemo(() => {
    const all = assetsQ.data ?? []
    const flagged: Array<{ asset: Asset; label: string; tone: 'orange' | 'default' }> = []
    for (const a of all) {
      if ((a.repair_count ?? 0) >= 3) flagged.push({ asset: a, label: 'Repeated Failure', tone: 'orange' })
      else if (a.warranty_end && new Date(a.warranty_end).getTime() < Date.now() + 30 * 86400000)
        flagged.push({ asset: a, label: 'Warranty Warning', tone: 'orange' })
      else if (a.status === 'IN_REPAIR') flagged.push({ asset: a, label: 'In Repair', tone: 'default' })
      if (flagged.length >= 3) break
    }
    return flagged
  }, [assetsQ.data])

  const urgent = useMemo(
    () => repairs.filter((r) => r.priority === 'CRITICAL' && !['RESOLVED', 'CLOSED'].includes(r.status)).slice(0, 4),
    [repairs],
  )

  const deadlines = useMemo(
    () =>
      repairs
        .filter((r) => !['RESOLVED', 'CLOSED'].includes(r.status) && r.due_date)
        .sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''))
        .slice(0, 3),
    [repairs],
  )

  if (repairsQ.loading) return <LoadingState rows={6} />
  if (repairsQ.error) return <ErrorState message={repairsQ.error} onRetry={repairsQ.refresh} />

  return (
    <>
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-stack-md border-primary pb-stack-sm mb-stack-lg">
        <div>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary uppercase">
            Technician Overview
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">
            Your repair workload, priorities, and activity at a glance.
          </p>
        </div>
        <Link
          to="/my-repairs"
          className="bg-secondary-container text-on-secondary-container font-label-caps text-label-caps px-6 py-4 border-[3px] border-primary industrial-shadow industrial-shadow-active uppercase flex items-center gap-2 hover:brightness-95"
        >
          <Icon name="build" /> My Repairs
        </Link>
      </header>

      {/* KPI Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-gutter mb-stack-lg">
        <div className="bg-surface border-[3px] border-primary p-stack-md industrial-shadow flex flex-col justify-between h-32">
          <div className="font-mono-label text-mono-label text-on-surface-variant uppercase">Assigned To Me</div>
          <div className="font-display-lg text-display-lg text-primary">{kpi.assigned}</div>
        </div>
        <div className="bg-secondary-container border-[3px] border-primary p-stack-md industrial-shadow flex flex-col justify-between h-32">
          <div className="font-mono-label text-mono-label text-on-secondary-container uppercase">Critical</div>
          <div className="font-display-lg text-display-lg text-on-secondary-container">{kpi.critical}</div>
        </div>
        <div className="bg-tertiary-fixed border-[3px] border-primary p-stack-md industrial-shadow flex flex-col justify-between h-32">
          <div className="font-mono-label text-mono-label text-on-tertiary-fixed uppercase">In Repair</div>
          <div className="font-display-lg text-display-lg text-on-tertiary-fixed">{kpi.inRepair}</div>
        </div>
        <div className="bg-surface border-[3px] border-primary p-stack-md industrial-shadow flex flex-col justify-between h-32">
          <div className="font-mono-label text-mono-label text-on-surface-variant uppercase">Due Today</div>
          <div className="font-display-lg text-display-lg text-primary">{kpi.dueToday}</div>
        </div>
      </section>

      {/* Main grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Left column */}
        <div className="lg:col-span-2 flex flex-col gap-gutter">
          {/* Today's Work */}
          <div className="bg-surface border-[3px] border-primary industrial-shadow">
            <div className="bg-tertiary-fixed border-b-[3px] border-primary px-stack-md py-stack-sm">
              <h2 className="font-label-caps text-label-caps text-on-tertiary-fixed uppercase">Today's Work</h2>
            </div>
            <div className="p-stack-md flex flex-col gap-stack-md">
              {today.length === 0 && (
                <p className="font-body-md text-body-md text-on-surface-variant">
                  No assigned repairs right now — check back when dispatch assigns work.
                </p>
              )}
              {today.map((r, i) => (
                <div
                  key={r.id}
                  className={`flex gap-stack-md items-start ${i < today.length - 1 ? 'border-b-[2px] border-dashed border-outline-variant pb-stack-sm' : ''} cursor-pointer`}
                  onClick={() => navigate(`/repairs/${r.id}`)}
                >
                  <div className={`font-headline-md text-headline-md ${r.priority === 'CRITICAL' ? 'text-secondary-container' : 'text-primary'}`}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-label-caps text-label-caps text-primary uppercase">{r.asset?.name ?? r.title}</h3>
                      <StatusBadge status={r.priority} />
                    </div>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-1">{r.title}</p>
                    <div className="flex items-center gap-2 mt-2 font-mono-label text-mono-label text-on-surface-variant">
                      <Icon name="event" className="text-[16px]" /> Due {dueLabel(r.due_date)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assets Needing Attention */}
          <div>
            <h2 className="font-label-caps text-label-caps text-primary uppercase mb-stack-sm pl-2 border-l-[4px] border-primary">
              Assets Needing Attention
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-stack-md">
              {attention.length === 0 && (
                <div className="md:col-span-3">
                  <EmptyState icon="task_alt" title="Nothing flagged" hint="No assets currently need special attention." />
                </div>
              )}
              {attention.map(({ asset, label, tone }) => (
                <div
                  key={asset.id}
                  className={`bg-surface-container border-[3px] border-primary p-stack-md industrial-shadow flex flex-col justify-between ${tone === 'orange' ? 'border-b-4 border-b-secondary-container' : ''}`}
                >
                  <div>
                    <div className="font-mono-label text-mono-label text-on-surface-variant mb-1">{asset.asset_tag}</div>
                    <div
                      className={`font-label-caps text-label-caps uppercase ${tone === 'orange' ? 'text-secondary-container' : 'text-primary'}`}
                    >
                      {label}
                    </div>
                  </div>
                  <button
                    className="mt-4 text-left font-mono-label text-mono-label text-primary uppercase hover:underline flex items-center gap-1"
                    onClick={() => navigate(`/assets/${asset.id}`)}
                  >
                    View Asset <Icon name="arrow_forward" className="text-[14px]" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-surface border-[3px] border-primary industrial-shadow">
            <div className="border-b-[3px] border-primary px-stack-md py-stack-sm flex justify-between items-center">
              <h2 className="font-label-caps text-label-caps text-primary uppercase">Recent Activity</h2>
              <Link to="/repair-history" className="font-mono-label text-mono-label text-primary uppercase hover:underline">
                View All
              </Link>
            </div>
            <ul className="divide-y-[2px] divide-primary">
              {recent.length === 0 && (
                <li className="p-stack-sm px-stack-md text-on-surface-variant font-body-md text-sm">
                  No completed repairs yet.
                </li>
              )}
              {recent.map((r) => (
                <li
                  key={r.id}
                  className="p-stack-sm px-stack-md flex justify-between items-center hover:bg-surface-container transition-colors cursor-pointer"
                  onClick={() => navigate(`/repairs/${r.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <Icon name="history" className="text-outline" />
                    <span className="font-body-md text-body-md">
                      #{r.ticket_number} {r.asset?.name ?? ''}
                    </span>
                  </div>
                  <span className="font-mono-label text-mono-label px-2 py-1 border-[2px] border-primary bg-surface-container-high">
                    {r.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-gutter">
          {/* Urgent Repairs */}
          <div className="bg-surface border-[3px] border-primary industrial-shadow flex flex-col">
            <div className="bg-secondary-container border-b-[3px] border-primary px-stack-md py-stack-sm">
              <h2 className="font-label-caps text-label-caps text-on-secondary-container uppercase">Urgent Repairs</h2>
            </div>
            <div className="p-stack-md flex-1 flex flex-col gap-stack-sm">
              {urgent.length === 0 && (
                <span className="font-mono-label text-mono-label text-on-surface-variant">No urgent repairs.</span>
              )}
              {urgent.map((r) => (
                <div
                  key={r.id}
                  className="border-[2px] border-primary p-stack-sm bg-surface-bright flex justify-between items-center cursor-pointer"
                  onClick={() => navigate(`/repairs/${r.id}`)}
                >
                  <span className="font-mono-label text-mono-label font-bold">#{r.ticket_number}</span>
                  <Icon name="warning" className="text-secondary-container" />
                </div>
              ))}
            </div>
            <div className="p-stack-md border-t-[3px] border-primary bg-surface-container-low">
              <Link
                to="/my-repairs"
                className="w-full bg-primary text-on-primary font-label-caps text-label-caps py-3 border-[2px] border-primary hover:bg-inverse-surface transition-colors uppercase inline-flex justify-center"
              >
                [View Repairs]
              </Link>
            </div>
          </div>

          {/* WebMCP Activity */}
          <WebmcpLog
            title="WebMCP Activity"
            entries={(webmcpQ.data ?? []).map((e) => ({
              time: formatRelative(e.created_at),
              text: `${e.success ? 'Agent ran' : 'Agent failed'} ${e.tool_name}`,
              tone: e.success ? undefined : 'orange',
            }))}
          />

          {/* Upcoming Deadlines */}
          <div className="bg-surface border-[3px] border-primary industrial-shadow flex flex-col">
            <div className="border-b-[3px] border-primary px-stack-md py-stack-sm">
              <h2 className="font-label-caps text-label-caps text-primary uppercase">Upcoming Deadlines</h2>
            </div>
            <div className="p-stack-md flex flex-col gap-stack-sm">
              {deadlines.length === 0 && (
                <span className="font-mono-label text-mono-label text-on-surface-variant">No upcoming deadlines.</span>
              )}
              {deadlines.map((r) => (
                <div
                  key={r.id}
                  className={`flex items-center gap-3 border-l-[3px] pl-3 py-1 cursor-pointer ${r.priority === 'CRITICAL' ? 'border-secondary-container' : 'border-primary'}`}
                  onClick={() => navigate(`/repairs/${r.id}`)}
                >
                  <div className="font-mono-label text-mono-label text-on-surface-variant w-16">
                    {r.due_date ? new Date(r.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                  </div>
                  <div className="font-body-md text-body-md">{r.asset?.asset_tag} — {r.title}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
