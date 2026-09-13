import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAsyncData, useDebounced } from '@/hooks/useAsyncData'
import { fetchRepairs } from '@/services/repairService'
import { ReportIssueModal } from '@/pages/employee/Dashboard'
import {
  Icon,
  LoadingState,
  ErrorState,
  EmptyState,
  StatusBadge,
  NeoButton,
} from '@/components/ui/primitives'
import { formatDate } from '@/lib/format'
import type { Asset, Repair, RepairStatus } from '@/types'
import { fetchAssets } from '@/services/assetService'

const OPEN_STATUSES: ('ALL' | RepairStatus)[] = ['ALL', 'OPEN', 'ASSIGNED', 'DIAGNOSING', 'IN_REPAIR', 'RESOLVED', 'CLOSED']

/** Employee My Issues per Stitch `employee_my_issue.html`. */
export default function EmployeeMyIssues() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debounced = useDebounced(search)
  const [statusFilter, setStatusFilter] = useState<'ALL' | RepairStatus>('ALL')
  const [reportOpen, setReportOpen] = useState(false)

  const q = useAsyncData<Repair[]>(() => fetchRepairs({ reportedByMe: true, search: debounced }), [debounced])
  const assetsQ = useAsyncData<Asset[]>(() => fetchAssets({}), [])

  const repairs = q.data ?? []
  const filtered = useMemo(
    () => (statusFilter === 'ALL' ? repairs : repairs.filter((r) => r.status === statusFilter)),
    [repairs, statusFilter],
  )

  const kpi = {
    open: repairs.filter((r) => !['RESOLVED', 'CLOSED'].includes(r.status)).length,
    inRepair: repairs.filter((r) => ['DIAGNOSING', 'IN_REPAIR'].includes(r.status)).length,
    waiting: repairs.filter((r) => ['OPEN', 'ASSIGNED'].includes(r.status)).length,
    resolved: repairs.filter((r) => ['RESOLVED', 'CLOSED'].includes(r.status)).length,
  }

  return (
    <>
      {/* Header */}
      <header className="sticky top-[56px] md:top-0 z-30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-6">
        <div>
          <h1 className="font-headline-lg text-4xl font-black uppercase tracking-tight text-primary">MY ISSUES</h1>
          <p className="font-body-md text-sm text-on-surface-variant font-mono-label mt-1">
            Track every repair request you've submitted • Live updates &amp; technician progress
          </p>
        </div>
        <button
          className="bg-signal-orange text-black font-label-caps text-sm font-bold uppercase px-5 py-2.5 border-2 border-primary shadow-brutal hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all duration-100 flex items-center gap-2 cursor-pointer"
          onClick={() => setReportOpen(true)}
        >
          <Icon name="add_circle" className="text-[18px]" fill />
          + REPORT AN ISSUE
        </button>
      </header>

      <div className="space-y-gutter flex-1 pb-8">
        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
          <div className="bg-warm-cream p-6 border-[3px] border-primary shadow-brutal flex flex-col justify-between h-32">
            <div className="font-label-caps text-label-caps uppercase text-on-surface-variant">MY OPEN ISSUES</div>
            <div className="font-display-lg text-display-lg text-primary">{kpi.open}</div>
          </div>
          <div className="bg-signal-orange p-6 border-[3px] border-primary shadow-brutal flex flex-col justify-between h-32">
            <div className="font-label-caps text-label-caps uppercase text-black font-bold">IN REPAIR</div>
            <div className="font-display-lg text-display-lg text-black font-bold">{kpi.inRepair}</div>
          </div>
          <div className="bg-warm-cream p-6 border-[3px] border-primary shadow-brutal flex flex-col justify-between h-32">
            <div className="font-label-caps text-label-caps uppercase text-on-surface-variant">WAITING</div>
            <div className="font-display-lg text-display-lg text-primary">{kpi.waiting}</div>
          </div>
          <div className="bg-electric-yellow p-6 border-[3px] border-primary shadow-brutal flex flex-col justify-between h-32">
            <div className="font-label-caps text-label-caps uppercase text-black font-bold">RESOLVED</div>
            <div className="font-display-lg text-display-lg text-black font-bold">{kpi.resolved}</div>
          </div>
        </div>

        {/* Search & filter bar */}
        <div className="bg-warm-cream border-[3px] border-primary shadow-brutal p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <div className="relative flex-1">
              <Icon name="search" className="absolute left-3 top-2.5 text-on-surface-variant text-[20px]" />
              <input
                className="w-full bg-white border-[3px] border-primary pl-10 pr-4 py-2 font-mono-label text-sm text-primary placeholder-on-surface-variant focus:outline-none"
                placeholder="Search issue, asset, or ticket..."
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono-label text-xs uppercase text-on-surface-variant font-bold mr-1">STATUS:</span>
            {OPEN_STATUSES.map((s) => (
              <button
                key={s}
                className={`px-3 py-1.5 border-[3px] border-primary font-label-caps text-xs uppercase font-bold ${
                  statusFilter === s
                    ? s === 'IN_REPAIR'
                      ? 'bg-signal-orange text-black'
                      : s === 'RESOLVED' || s === 'CLOSED'
                        ? 'bg-electric-yellow text-black'
                        : 'bg-primary text-white'
                    : 'bg-white text-black hover:bg-surface-container-highest'
                }`}
                onClick={() => setStatusFilter(s)}
              >
                {s.replace('_', ' ')}
                {s === 'ALL' && ` (${repairs.length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Issues table */}
        <div className="bg-warm-cream border-[3px] border-primary shadow-brutal overflow-hidden">
          <div className="p-4 border-b-[3px] border-primary bg-primary text-white flex justify-between items-center flex-wrap gap-2">
            <h2 className="font-headline-md text-headline-md">MY REPAIR ISSUES</h2>
            <div className="font-mono-label text-xs uppercase tracking-wider text-neutral-300">
              SHOWING {filtered.length} REQUESTS
            </div>
          </div>
          <div className="overflow-x-auto">
            {q.loading ? (
              <div className="p-4 bg-surface">
                <LoadingState rows={3} />
              </div>
            ) : q.error ? (
              <div className="p-4 bg-surface">
                <ErrorState message={q.error} onRetry={q.refresh} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-4 bg-surface">
                <EmptyState
                  icon="report_problem"
                  title="No issues found"
                  hint={repairs.length === 0 ? "You haven't reported any issues yet." : 'Try a different status filter.'}
                  action={
                    <NeoButton onClick={() => setReportOpen(true)}>
                      <Icon name="add_circle" /> Report an Issue
                    </NeoButton>
                  }
                />
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-electric-yellow border-b-[3px] border-primary text-black font-label-caps text-label-caps uppercase">
                    {['Ticket ID', 'Asset', 'Issue', 'Priority', 'Status', 'Technician', 'Date', 'Action'].map((h) => (
                      <th key={h} className="p-4">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="font-body-md text-body-md divide-y divide-black">
                  {filtered.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-primary hover:text-warm-cream group transition-colors cursor-pointer"
                      onClick={() => navigate(`/repairs/${r.id}`)}
                    >
                      <td className="p-4 font-mono-label font-bold text-primary group-hover:text-warm-cream">
                        #{r.ticket_number}
                      </td>
                      <td className="p-4 font-mono-label text-xs">
                        <div className="font-bold">{r.asset?.asset_tag}</div>
                        <div className="text-on-surface-variant group-hover:text-gray-400 text-[11px]">{r.asset?.name}</div>
                      </td>
                      <td className="p-4 font-bold">{r.title}</td>
                      <td className="p-4">
                        <StatusBadge status={r.priority} />
                      </td>
                      <td className="p-4">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="p-4 font-mono-label text-xs">
                        {r.technician ? (
                          <div>
                            <div className="font-bold">{r.technician.full_name}</div>
                            <div className="text-on-surface-variant group-hover:text-gray-400 text-[10px]">
                              Technician
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-error font-bold">Unassigned</div>
                            <div className="text-on-surface-variant group-hover:text-gray-400 text-[10px]">
                              Pending Dispatch
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-mono-label text-xs">{formatDate(r.created_at)}</td>
                      <td className="p-4 text-center">
                        <button className="bg-white group-hover:bg-warm-cream group-hover:text-black text-primary px-3 py-1 border-[3px] border-primary font-label-caps text-[11px] uppercase font-bold shadow-brutal-sm">
                          DETAILS
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {reportOpen && (
        <ReportIssueModal
          assets={assetsQ.data ?? []}
          onClose={() => setReportOpen(false)}
          onCreated={() => {
            setReportOpen(false)
            q.refresh()
          }}
        />
      )}
    </>
  )
}
