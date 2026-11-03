import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAsyncData, useDebounced } from '@/hooks/useAsyncData'
import { fetchRepairs } from '@/services/repairService'
import { Icon, LoadingState, ErrorState, EmptyState, StatusBadge } from '@/components/ui/primitives'
import { formatDate } from '@/lib/format'
import type { Repair, RepairStatus } from '@/types'

/**
 * Employee Repair History — a searchable, read-only view of the repair requests
 * the signed-in employee reported (open + completed). Employees reach it from the
 * sidebar; it is scoped to their own records via RLS (fetchRepairs reportedByMe).
 */
type HistoryFilter = 'ALL' | 'OPEN' | 'COMPLETED'

const FILTERS: { key: HistoryFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'OPEN', label: 'Open' },
  { key: 'COMPLETED', label: 'Completed' },
]

function matches(repair: Repair, f: HistoryFilter): boolean {
  const completed = ['RESOLVED', 'CLOSED'].includes(repair.status)
  if (f === 'COMPLETED') return completed
  if (f === 'OPEN') return !completed
  return true
}

export default function EmployeeRepairHistory() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debounced = useDebounced(search)
  const [filter, setFilter] = useState<HistoryFilter>('ALL')

  const q = useAsyncData<Repair[]>(
    () => fetchRepairs({ reportedByMe: true, search: debounced }),
    [debounced],
  )
  const repairs = q.data ?? []

  // Immediate client-side match so the list AND the count badge narrow as the user
  // types (independent of the debounced service query) — guarantees the search
  // actually filters rather than leaving the full record count unchanged.
  const term = search.trim().toLowerCase()
  const matchesTerm = (r: Repair) =>
    !term ||
    r.ticket_number.toLowerCase().includes(term) ||
    r.title.toLowerCase().includes(term) ||
    (r.asset?.asset_tag ?? '').toLowerCase().includes(term) ||
    (r.asset?.name ?? '').toLowerCase().includes(term) ||
    (r.technician?.full_name ?? '').toLowerCase().includes(term)

  const filtered = useMemo(() => repairs.filter((r) => matches(r, filter) && matchesTerm(r)), [repairs, filter, term])
  const countFor = (f: HistoryFilter) => repairs.filter((r) => matches(r, f) && matchesTerm(r)).length

  return (
    <>
      <header className="sticky top-[56px] md:top-0 z-30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-6">
        <div>
          <h1 className="font-headline-lg text-4xl font-black uppercase tracking-tight text-primary">REPAIR HISTORY</h1>
          <p className="font-body-md text-sm text-on-surface-variant font-mono-label mt-1">
            Search and review every repair request you have reported and its outcome.
          </p>
        </div>
      </header>

      <div className="space-y-gutter flex-1 pb-8">
        {/* Search + filter */}
        <div className="bg-warm-cream border-[3px] border-primary shadow-brutal p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[280px]">
            <Icon name="search" className="absolute left-3 top-2.5 text-on-surface-variant text-[20px]" />
            <input
              className="w-full bg-white border-[3px] border-primary pl-10 pr-4 py-2 font-mono-label text-sm text-primary placeholder-on-surface-variant focus:outline-none"
              placeholder="Search ticket, asset, issue, technician..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search repair history"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {FILTERS.map((s) => (
              <button
                key={s.key}
                className={`px-3 py-1.5 border-[3px] border-primary font-label-caps text-xs uppercase font-bold ${
                  filter === s.key
                    ? s.key === 'COMPLETED'
                      ? 'bg-electric-yellow text-black'
                      : s.key === 'OPEN'
                        ? 'bg-signal-orange text-black'
                        : 'bg-primary text-white'
                    : 'bg-white text-black hover:bg-surface-container-highest'
                }`}
                onClick={() => setFilter(s.key)}
              >
                {s.label} ({countFor(s.key)})
              </button>
            ))}
          </div>
        </div>

        {/* Records */}
        <div className="bg-warm-cream border-[3px] border-primary shadow-brutal overflow-hidden">
          <div className="p-4 border-b-[3px] border-primary bg-primary text-white flex justify-between items-center flex-wrap gap-2">
            <h2 className="font-headline-md text-headline-md">REPAIR RECORDS</h2>
            <div className="font-mono-label text-xs uppercase tracking-wider text-neutral-300">
              SHOWING {filtered.length} RECORDS
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
                  icon="history"
                  title={repairs.length === 0 ? 'No repair history yet' : 'No matching records'}
                  hint={
                    repairs.length === 0
                      ? "You haven't reported any issues yet."
                      : 'Try a different search term or filter.'
                  }
                />
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-electric-yellow border-b-[3px] border-primary text-black font-label-caps text-label-caps uppercase">
                    {['Ticket ID', 'Asset', 'Issue', 'Status', 'Resolution', 'Date', 'Action'].map((h) => (
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
                      <td className="p-4 font-mono-label font-bold text-primary group-hover:text-warm-cream">#{r.ticket_number}</td>
                      <td className="p-4 font-mono-label text-xs">
                        <div className="font-bold">{r.asset?.asset_tag ?? '—'}</div>
                        <div className="text-on-surface-variant group-hover:text-gray-400 text-[11px]">{r.asset?.name}</div>
                      </td>
                      <td className="p-4 font-bold">{r.title}</td>
                      <td className="p-4">
                        <StatusBadge status={r.status as RepairStatus} />
                      </td>
                      <td className="p-4 font-body-md text-[12px] text-on-surface-variant group-hover:text-gray-200">
                        {r.resolution ?? r.diagnosis ?? '—'}
                      </td>
                      <td className="p-4 font-mono-label text-xs">{formatDate(r.resolved_at ?? r.created_at)}</td>
                      <td className="p-4 text-center">
                        <button className="bg-white group-hover:bg-warm-cream group-hover:text-black text-primary px-3 py-1 border-[3px] border-primary font-label-caps text-[11px] uppercase font-bold shadow-brutal-sm">
                          VIEW
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
    </>
  )
}
