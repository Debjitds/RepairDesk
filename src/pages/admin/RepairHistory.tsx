import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAsyncData, useDebounced } from '@/hooks/useAsyncData'
import { fetchRepairs } from '@/services/repairService'
import {
  Icon,
  StatCard,
  StatusBadge,
  LoadingState,
  ErrorState,
  EmptyState,
} from '@/components/ui/primitives'
import { formatDate } from '@/lib/format'
import type { Repair, RepairPriority } from '@/types'

/** Admin/Manager Repair History per Stitch `admin_repair_history.html`. */
export default function AdminRepairHistory() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debounced = useDebounced(search)
  const [status, setStatus] = useState<string>('All')
  const [priority, setPriority] = useState<'All' | RepairPriority>('All')
  const [technician, setTechnician] = useState('All')

  const q = useAsyncData<Repair[]>(() => fetchRepairs({ scope: 'history', search: debounced }), [debounced])

  const repairs = q.data ?? []
  const filtered = useMemo(
    () =>
      repairs.filter(
        (r) =>
          (status === 'All' || r.status === status) &&
          (priority === 'All' || r.priority === priority) &&
          (technician === 'All' || r.technician?.full_name === technician),
      ),
    [repairs, status, priority, technician],
  )

  const kpi = useMemo(() => {
    const total = repairs.length
    const resolved = repairs.filter((r) => r.status === 'RESOLVED').length
    const closed = repairs.filter((r) => r.status === 'CLOSED').length
    const monthAgo = Date.now() - 30 * 86400000
    const thisMonth = repairs.filter((r) => new Date(r.created_at).getTime() > monthAgo).length
    return { total, resolved, closed, thisMonth }
  }, [repairs])

  const repeatAssets = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of repairs) counts.set(r.asset_id, (counts.get(r.asset_id) ?? 0) + 1)
    let n = 0
    counts.forEach((c) => {
      if (c >= 3) n++
    })
    return n
  }, [repairs])

  const technicians = useMemo(
    () => [...new Set(repairs.map((r) => r.technician?.full_name).filter(Boolean))] as string[],
    [repairs],
  )

  return (
    <>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-stack-md mb-stack-lg">
        <div>
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold tracking-tight uppercase">
            Repair History
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">
            Review completed repairs, resolutions, and recurring equipment failures.
          </p>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-5 gap-stack-md mb-stack-lg">
        <StatCard label="Total Repairs" value={kpi.total} sublabel="Archive Lifetime" />
        <StatCard label="Resolved" value={kpi.resolved} sublabel={`${kpi.total ? Math.round((kpi.resolved / kpi.total) * 100) : 0}% Rate`} />
        <StatCard label="Closed" value={kpi.closed} sublabel="Compliant" />
        <StatCard label="Repeat Failures" value={repeatAssets} tone="orange" icon="warning" sublabel="High Risk" />
        <StatCard label="This Month" value={kpi.thisMonth} tone="yellow" icon="calendar_today" />
      </section>

      {/* Filters */}
      <div className="bg-surface border-2 border-primary industrial-shadow p-stack-md mb-stack-lg">
        <div className="flex flex-col gap-stack-md">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-grow relative flex items-center">
              <Icon name="search" className="absolute left-3 text-outline text-[20px]" />
              <input
                className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border-2 border-primary font-body-md text-[14px] text-primary placeholder-on-surface-variant outline-none focus:bg-surface"
                placeholder="Search ticket, asset, issue, technician..."
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-primary/20">
            <FilterSelect label="Status" value={status} onChange={setStatus} options={['All', 'RESOLVED', 'CLOSED']} />
            <FilterSelect label="Priority" value={priority} onChange={(v) => setPriority(v as 'All' | RepairPriority)} options={['All', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW']} />
            <FilterSelect label="Asset Category" value="All" onChange={() => {}} options={['All']} disabled />
            <FilterSelect label="Technician" value={technician} onChange={setTechnician} options={['All', ...technicians]} />
          </div>
        </div>
      </div>

      {/* History table */}
      <div className="bg-surface border-2 border-primary industrial-shadow">
        <div className="border-b-2 border-primary p-stack-md bg-surface-container-highest flex justify-between items-center">
          <h2 className="font-headline-md text-[20px] font-bold uppercase tracking-tight">Historical Repair Records</h2>
          <span className="font-mono-label text-[12px] font-bold bg-primary text-surface px-2 py-0.5">
            {filtered.length} ENTRIES
          </span>
        </div>
        <div className="overflow-x-auto">
          {q.loading ? (
            <div className="p-stack-md">
              <LoadingState rows={4} />
            </div>
          ) : q.error ? (
            <div className="p-stack-md">
              <ErrorState message={q.error} onRetry={q.refresh} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-stack-md">
              <EmptyState icon="history" title="No repair history yet" hint="Completed and closed repairs will appear here." />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-primary font-label-caps text-[11px] text-on-surface-variant bg-surface-container-low">
                  {['Ticket', 'Asset', 'Issue / Resolution', 'Priority', 'Status', 'Tech', 'Date', 'Action'].map((h, i, arr) => (
                    <th key={h} className={`p-stack-sm ${i < arr.length - 1 ? 'border-r border-outline' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-outline hover:bg-tertiary hover:text-surface transition-colors cursor-pointer"
                    onClick={() => navigate(`/repairs/${r.id}`)}
                  >
                    <td className="p-stack-sm border-r border-outline font-mono-label text-[12px] font-bold text-primary">
                      #{r.ticket_number}
                    </td>
                    <td className="p-stack-sm border-r border-outline">
                      <div className="font-body-md text-[13px] font-bold leading-tight">{r.asset?.asset_tag}</div>
                      <div className="text-[11px] text-on-surface-variant">{r.asset?.name}</div>
                      {(r.asset && (r.asset.repair_count ?? 0) >= 3) && (
                        <span className="inline-block mt-1 bg-secondary-container text-on-secondary-container px-1.5 font-label-caps text-[9px] uppercase border border-primary font-bold">
                          Repeat Failure
                        </span>
                      )}
                    </td>
                    <td className="p-stack-sm border-r border-outline text-[12px]">
                      <div className="font-bold">{r.title}</div>
                      <div className="text-on-surface-variant text-[11px]">{r.resolution ?? r.diagnosis ?? '—'}</div>
                    </td>
                    <td className="p-stack-sm border-r border-outline">
                      <StatusBadge status={r.priority} />
                    </td>
                    <td className="p-stack-sm border-r border-outline">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="p-stack-sm border-r border-outline font-body-md text-[12px]">
                      {r.technician?.full_name ?? '—'}
                    </td>
                    <td className="p-stack-sm border-r border-outline font-mono-label text-[11px]">
                      {formatDate(r.resolved_at ?? r.closed_at ?? r.created_at)}
                    </td>
                    <td className="p-stack-sm text-center">
                      <button className="bg-primary text-surface px-2 py-1 font-label-caps text-[10px] uppercase border border-primary hover:bg-secondary transition-colors">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-mono-label text-[10px] uppercase font-bold text-on-surface-variant">{label}</label>
      <select
        className="w-full px-2 py-1.5 bg-surface-container-lowest border-2 border-primary text-[12px] font-mono-label font-bold disabled:opacity-50"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o === 'All' ? 'All' : o}
          </option>
        ))}
      </select>
    </div>
  )
}
