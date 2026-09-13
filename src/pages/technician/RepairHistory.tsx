import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAsyncData, useDebounced } from '@/hooks/useAsyncData'
import { fetchRepairs } from '@/services/repairService'
import {
  Icon,
  LoadingState,
  ErrorState,
  EmptyState,
  StatusBadge,
} from '@/components/ui/primitives'
import { formatDate } from '@/lib/format'
import type { Repair, RepairPriority } from '@/types'

/** Technician Repair History per Stitch `technician_repair_history.html`. */
export default function TechnicianRepairHistory() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debounced = useDebounced(search)
  const [priority, setPriority] = useState<'ALL' | RepairPriority>('ALL')
  const [category, setCategory] = useState('ALL')

  const q = useAsyncData<Repair[]>(() => fetchRepairs({ scope: 'history', search: debounced }), [debounced])
  const repairs = q.data ?? []

  const filtered = useMemo(
    () =>
      repairs.filter(
        (r) =>
          (priority === 'ALL' || r.priority === priority) &&
          (category === 'ALL' || r.asset?.category === category),
      ),
    [repairs, priority, category],
  )

  const kpi = useMemo(() => {
    const total = repairs.length
    const resolved = repairs.filter((r) => r.status === 'RESOLVED').length
    const repeatAssets = new Map<string, number>()
    for (const r of repairs) repeatAssets.set(r.asset_id, (repeatAssets.get(r.asset_id) ?? 0) + 1)
    let repeat = 0
    repeatAssets.forEach((c) => {
      if (c >= 3) repeat++
    })
    const monthAgo = Date.now() - 30 * 86400000
    return {
      total,
      resolved,
      repeat,
      thisMonth: repairs.filter((r) => new Date(r.created_at).getTime() > monthAgo).length,
    }
  }, [repairs])

  return (
    <>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-stack-md mb-stack-lg">
        <div>
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold uppercase">
            REPAIR HISTORY
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">
            Review completed repairs, recurring failures, and past resolutions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-stack-md">
          <div className="relative flex items-center">
            <Icon name="search" className="absolute left-3 text-[20px] text-on-surface-variant" />
            <input
              className="bg-surface border-2 border-primary font-mono-label text-mono-label pl-9 pr-4 py-3 w-64 industrial-shadow focus:outline-none"
              placeholder="Search ticket, asset, issue, technician..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-stack-lg w-full">
        {/* KPIs */}
        <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-stack-md">
          <div className="bg-warm-cream border-[3px] border-primary industrial-shadow p-stack-md flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <span className="font-mono-label text-mono-label uppercase text-on-surface-variant font-bold">TOTAL REPAIRS</span>
              <span className="font-mono-label text-mono-label px-2 py-0.5 border border-primary bg-surface-container-high">ALL-TIME</span>
            </div>
            <div className="font-display-lg text-display-lg">{kpi.total}</div>
            <div className="font-mono-label text-mono-label text-on-surface-variant mt-1">All-time recorded</div>
          </div>
          <div className="bg-surface border-[3px] border-primary industrial-shadow p-stack-md flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <span className="font-mono-label text-mono-label uppercase font-bold text-primary">RESOLVED</span>
              <span className="font-mono-label text-mono-label px-2 py-0.5 border border-primary bg-white text-primary font-bold">
                {kpi.total ? Math.round((kpi.resolved / kpi.total) * 100) : 0}% RATE
              </span>
            </div>
            <div className="font-display-lg text-display-lg text-primary">{kpi.resolved}</div>
            <div className="font-mono-label text-mono-label text-on-surface-variant mt-1">Successfully closed</div>
          </div>
          <div className="bg-signal-orange text-primary border-[3px] border-primary industrial-shadow p-stack-md flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <span className="font-mono-label text-mono-label uppercase font-bold flex items-center gap-1">
                <Icon name="warning" className="text-[16px]" /> REPEAT FAILURES
              </span>
              <span className="font-mono-label text-mono-label px-2 py-0.5 border border-primary bg-white text-primary font-bold">FLAGGED</span>
            </div>
            <div className="font-display-lg text-display-lg">{kpi.repeat}</div>
            <div className="font-mono-label font-semibold mt-1">Recurring patterns</div>
          </div>
          <div className="bg-electric-yellow text-primary border-[3px] border-primary industrial-shadow p-stack-md flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <span className="font-mono-label text-mono-label uppercase font-bold">THIS MONTH</span>
              <span className="font-mono-label text-mono-label px-2 py-0.5 border border-primary bg-black text-electric-yellow font-bold">
                {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()}
              </span>
            </div>
            <div className="font-display-lg text-display-lg">{kpi.thisMonth}</div>
            <div className="font-mono-label font-semibold mt-1">Resolved this month</div>
          </div>
        </div>

        {/* Filters */}
        <div className="col-span-12 bg-warm-cream border-[3px] border-primary industrial-shadow p-stack-md">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-stack-md items-center">
            <div className="md:col-span-4">
              <label className="font-mono-label text-mono-label uppercase block mb-1 font-bold">Search Query</label>
              <div className="relative flex items-center">
                <Icon name="search" className="absolute left-3 text-[18px] text-on-surface-variant" />
                <input
                  className="w-full bg-white border-2 border-primary font-mono-label text-mono-label pl-9 pr-3 py-2 industrial-shadow focus:outline-none"
                  placeholder="Search ticket, asset, issue, technician..."
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="font-mono-label text-mono-label uppercase block mb-1 font-bold">Priority</label>
              <select
                className="w-full bg-white border-2 border-primary font-mono-label text-mono-label py-2 px-2 industrial-shadow focus:outline-none"
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'ALL' | RepairPriority)}
              >
                <option value="ALL">All</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="font-mono-label text-mono-label uppercase block mb-1 font-bold">Asset Category</label>
              <select
                className="w-full bg-white border-2 border-primary font-mono-label text-mono-label py-2 px-2 industrial-shadow focus:outline-none"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="ALL">All</option>
                {['Laptop', 'Monitor', 'Projector', 'Printer', 'Network', 'Phone'].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* History table */}
        <div className="col-span-12 bg-warm-cream border-[3px] border-primary industrial-shadow overflow-hidden">
          <div className="border-b-[3px] border-primary p-stack-md bg-electric-yellow flex justify-between items-center flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <h3 className="font-headline-md text-headline-md uppercase">HISTORICAL REPAIR RECORDS ({filtered.length} ENTRIES)</h3>
              <span className="bg-black text-electric-yellow font-mono-label text-mono-label px-2 py-1 uppercase font-bold">
                FILTERED AUDIT TRAIL
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            {q.loading ? (
              <div className="p-stack-md bg-surface">
                <LoadingState rows={4} />
              </div>
            ) : q.error ? (
              <div className="p-stack-md bg-surface">
                <ErrorState message={q.error} onRetry={q.refresh} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-stack-md bg-surface">
                <EmptyState icon="history" title="No repair history yet" hint="Completed and closed repairs will appear here." />
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b-[3px] border-primary font-mono-label text-mono-label uppercase">
                    {['TICKET', 'ASSET', 'ISSUE', 'RESOLUTION', 'STATUS', 'DATE', 'ACTION'].map((h, i, arr) => (
                      <th key={h} className={`p-stack-md ${i < arr.length - 1 ? 'border-r-[3px] border-primary' : ''}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="font-body-md">
                  {filtered.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b-2 border-primary hover:bg-black hover:text-warm-cream transition-colors cursor-pointer"
                      onClick={() => navigate(`/repairs/${r.id}`)}
                    >
                      <td className="p-stack-md border-r-2 border-primary font-bold">#{r.ticket_number}</td>
                      <td className="p-stack-md border-r-2 border-primary">
                        <div className="font-bold">{r.asset?.asset_tag}</div>
                        <div className="font-mono-label text-[12px] text-on-surface-variant">{r.asset?.name}</div>
                      </td>
                      <td className="p-stack-md border-r-2 border-primary">{r.title}</td>
                      <td className="p-stack-md border-r-2 border-primary">{r.resolution ?? r.diagnosis ?? '—'}</td>
                      <td className="p-stack-md border-r-2 border-primary">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="p-stack-md border-r-2 border-primary font-mono-label">
                        {formatDate(r.resolved_at ?? r.closed_at ?? r.created_at)}
                      </td>
                      <td className="p-stack-md text-center">
                        <span className="font-label-caps text-label-caps underline">[VIEW]</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
