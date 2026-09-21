import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useAsyncData } from '@/hooks/useAsyncData'
import { fetchRepairs, fetchTechnicianWorkload } from '@/services/repairService'
import { fetchAssets } from '@/services/assetService'
import { Icon, StatCard, StatusBadge, LoadingState, ErrorState, WebmcpLog } from '@/components/ui/primitives'
import { formatRelative } from '@/lib/format'
import { supabase } from '@/lib/supabase'
import type { Asset, Repair, WebmcpExecution } from '@/types'

/**
 * Admin/Manager Dashboard per Stitch `admin_dashboard.html`:
 * KPI row (5), urgent repairs table, repeated-failure + warranty warning cards,
 * WebMCP log, technician workload bars.
 */
export default function AdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const repairsQ = useAsyncData<Repair[]>(() => fetchRepairs({}), [])
  const assetsQ = useAsyncData<Asset[]>(() => fetchAssets({}), [])
  const workloadQ = useAsyncData(() => fetchTechnicianWorkload(), [])
  const webmcpQ = useAsyncData<WebmcpExecution[]>(async () => {
    const { data, error } = await supabase
      .from('webmcp_tool_executions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    if (error) throw error
    return (data ?? []) as WebmcpExecution[]
  }, [user?.id, user?.role, user?.organization_id])

  const repairs = repairsQ.data ?? []
  const assets = assetsQ.data ?? []

  const kpi = useMemo(() => {
    const open = repairs.filter((r) => r.status === 'OPEN').length
    const critical = repairs.filter((r) => r.priority === 'CRITICAL' && !['RESOLVED', 'CLOSED'].includes(r.status)).length
    const inRepair = repairs.filter((r) => r.status === 'IN_REPAIR' || r.status === 'DIAGNOSING').length
    const resolved = repairs.filter((r) => ['RESOLVED', 'CLOSED'].includes(r.status)).length
    return { open, critical, inRepair, resolved }
  }, [repairs])

  const urgent = useMemo(
    () =>
      repairs
        .filter((r) => !['RESOLVED', 'CLOSED'].includes(r.status) && (r.priority === 'CRITICAL' || r.priority === 'HIGH'))
        .sort((a, b) => (a.priority === b.priority ? 0 : a.priority === 'CRITICAL' ? -1 : 1))
        .slice(0, 5),
    [repairs],
  )

  const repeatedFailures = useMemo(() => {
    const sixMo = Date.now() - 182 * 86400000
    return assets.filter((a) => {
      if (!a.repair_count) return false
      return (a.repair_count ?? 0) >= 3 || new Date(a.last_repair_at ?? 0).getTime() > sixMo
    })
  }, [assets])

  const warrantyWarnings = useMemo(() => {
    const in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
    return assets.filter((a) => a.warranty_end && a.warranty_end.slice(0, 10) <= in30)
  }, [assets])

  const maxLoad = Math.max(1, ...(workloadQ.data ?? []).map((w) => w.activeCount))

  if (repairsQ.loading || assetsQ.loading) return <LoadingState rows={6} />
  if (repairsQ.error) return <ErrorState message={repairsQ.error} onRetry={repairsQ.refresh} />
  if (assetsQ.error) return <ErrorState message={assetsQ.error} onRetry={assetsQ.refresh} />

  return (
    <>
      {/* Header & actions */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-stack-md mb-stack-lg">
        <div>
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold">Operations Overview</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">
            {user?.role === 'ADMIN' ? 'Admin' : 'Manager'} Dashboard — real-time metrics
          </p>
        </div>
        <div className="flex flex-wrap gap-stack-md">
          <NeoBtnLink to="/assets">Add Asset</NeoBtnLink>
          <button
            className="bg-secondary-container text-on-secondary-container px-4 py-2 border-2 border-primary industrial-shadow industrial-shadow-active font-label-caps text-label-caps uppercase flex items-center gap-2 hover:brightness-95"
            onClick={() => navigate('/assets')}
          >
            <Icon name="construction" /> New Repair
          </button>
        </div>
      </header>

      {/* KPI section */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-stack-md mb-stack-lg">
        <StatCard label="Total Assets" value={assets.length} />
        <StatCard label="Open Repairs" value={kpi.open} />
        <StatCard label="Critical" value={kpi.critical} tone="orange" icon="warning" />
        <StatCard label="In Repair" value={kpi.inRepair} />
        <StatCard label="Resolved" value={kpi.resolved} tone="yellow" icon="check_circle" />
      </section>

      {/* Content grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        {/* Left column */}
        <section className="md:col-span-8 flex flex-col gap-stack-md">
          {/* Urgent repairs */}
          <div className="bg-surface border-2 border-primary industrial-shadow">
            <div className="border-b-2 border-primary p-stack-md bg-tertiary-fixed text-on-tertiary-fixed flex justify-between items-center">
              <h2 className="font-headline-md text-[24px] font-bold m-0 uppercase tracking-tight">Urgent Repairs</h2>
              <Icon name="priority_high" />
            </div>
            <div className="p-0">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-primary font-label-caps text-label-caps text-on-surface-variant bg-surface-container-highest">
                    <th className="p-stack-sm border-r-2 border-primary">Ticket</th>
                    <th className="p-stack-sm border-r-2 border-primary">Asset</th>
                    <th className="p-stack-sm border-r-2 border-primary">Status</th>
                    <th className="p-stack-sm">Assignee</th>
                  </tr>
                </thead>
                <tbody>
                  {urgent.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-stack-md text-center text-on-surface-variant font-body-md">
                        No urgent repairs right now.
                      </td>
                    </tr>
                  )}
                  {urgent.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-outline hover:bg-tertiary hover:text-surface transition-colors cursor-pointer"
                      onClick={() => navigate(`/repairs/${r.id}`)}
                    >
                      <td className="p-stack-sm border-r border-outline font-mono-label text-mono-label">#{r.ticket_number}</td>
                      <td className="p-stack-sm border-r border-outline font-body-md text-body-md">
                        {r.asset?.name ?? '—'}
                      </td>
                      <td className="p-stack-sm border-r border-outline">
                        <StatusBadge status={r.priority} />
                      </td>
                      <td className="p-stack-sm font-body-md text-body-md">
                        {r.technician?.full_name ?? 'Unassigned'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Assets needing attention */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md mt-stack-sm">
            <div className="bg-surface border-2 border-primary p-stack-md industrial-shadow">
              <h3 className="font-label-caps text-label-caps uppercase border-b-2 border-primary pb-2 mb-4 flex items-center gap-2 text-secondary">
                <Icon name="autorenew" className="text-[18px]" /> Repeated Failure
              </h3>
              <p className="font-body-md text-body-md">
                {repeatedFailures.length} asset{repeatedFailures.length === 1 ? '' : 's'} show recurring issues.
              </p>
              <Link
                to="/repair-history"
                className="mt-4 w-full inline-flex justify-center bg-surface text-primary border-2 border-primary py-2 font-label-caps text-label-caps uppercase hover:bg-primary hover:text-surface transition-colors"
              >
                Review
              </Link>
            </div>
            <div className="bg-surface border-2 border-primary p-stack-md industrial-shadow">
              <h3 className="font-label-caps text-label-caps uppercase border-b-2 border-primary pb-2 mb-4 flex items-center gap-2">
                <Icon name="verified_user" className="text-[18px]" /> Warranty Warning
              </h3>
              <p className="font-body-md text-body-md">
                {warrantyWarnings.length} asset{warrantyWarnings.length === 1 ? '' : 's'} approaching warranty
                expiration.
              </p>
              <Link
                to="/assets"
                className="mt-4 w-full inline-flex justify-center bg-surface text-primary border-2 border-primary py-2 font-label-caps text-label-caps uppercase hover:bg-primary hover:text-surface transition-colors"
              >
                Review
              </Link>
            </div>
          </div>
        </section>

        {/* Right column */}
        <section className="md:col-span-4 flex flex-col gap-stack-md">
          <WebmcpLog
            entries={(webmcpQ.data ?? []).map((e) => ({
              time: formatRelative(e.created_at),
              text: `${e.success ? 'Agent ran' : 'Agent failed'} ${e.tool_name}${e.error_message ? ' — ' + e.error_message : ''}`,
              tone: e.success ? undefined : 'orange',
            }))}
          />

          {/* Technician workload */}
          <div className="bg-surface border-2 border-primary industrial-shadow p-stack-md">
            <h2 className="font-label-caps text-label-caps uppercase border-b-2 border-primary pb-2 mb-4">
              Tech Workload
            </h2>
            <div className="space-y-4">
              {(workloadQ.data ?? []).length === 0 && (
                <p className="font-body-md text-sm text-on-surface-variant">No technicians yet.</p>
              )}
              {(workloadQ.data ?? []).map((w) => (
                <div key={w.technician.id}>
                  <div className="flex justify-between font-mono-label text-mono-label mb-1">
                    <span>{w.technician.full_name}</span>
                    <span>
                      {w.activeCount} Active
                      {w.criticalCount > 0 && <span className="text-secondary font-bold"> ({w.criticalCount} crit)</span>}
                    </span>
                  </div>
                  <div className="w-full bg-surface-container-highest h-4 border border-primary">
                    <div
                      className={`h-full border-r border-primary ${w.criticalCount > 0 ? 'bg-secondary-container' : 'bg-tertiary-fixed'}`}
                      style={{ width: `${Math.round((w.activeCount / maxLoad) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

function NeoBtnLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className={`bg-surface text-primary px-4 py-2 border-2 border-primary industrial-shadow industrial-shadow-active font-label-caps text-label-caps uppercase flex items-center gap-2`}
    >
      {children}
    </Link>
  )
}
