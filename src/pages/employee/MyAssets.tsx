import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAsyncData, useDebounced } from '@/hooks/useAsyncData'
import { fetchAssets, type AssetFilters } from '@/services/assetService'
import { ReportIssueModal } from '@/pages/employee/Dashboard'
import { Icon, LoadingState, ErrorState, EmptyState, StatusBadge } from '@/components/ui/primitives'
import { warrantyStatus, type Asset, type AssetStatus } from '@/types'

/** Employee My Assets per Stitch `employee_my_assets.html`. */
export default function EmployeeMyAssets() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debounced = useDebounced(search)
  const [status, setStatus] = useState<'ALL' | AssetStatus>('ALL')
  const [category, setCategory] = useState('ALL')
  const [reportOpen, setReportOpen] = useState(false)

  const filters: AssetFilters = { search: debounced, status: status === 'ALL' ? 'ALL' : status, category }
  const q = useAsyncData<Asset[]>(() => fetchAssets(filters), [debounced, status, category])

  const assets = q.data ?? []
  const categories = useMemo(() => [...new Set(assets.map((a) => a.category))], [assets])

  const countFor = (s: AssetStatus) => assets.filter((a) => a.status === s).length

  return (
    <>
      <header className="sticky top-[56px] md:top-0 z-30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-6">
        <div>
          <h1 className="font-headline-lg text-4xl font-black uppercase tracking-tight text-primary">MY ASSETS</h1>
          <p className="font-body-md text-sm text-on-surface-variant font-mono-label mt-1">
            Equipment currently assigned to you. Live status &amp; warranty overview.
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
        {/* Search & filters */}
        <div className="bg-surface-container-low border-2 border-primary p-4 shadow-brutal space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[280px]">
              <div className="relative flex-1">
                <Icon name="search" className="absolute left-3 top-2.5 text-on-surface-variant text-[20px]" />
                <input
                  className="w-full bg-white border-2 border-primary pl-10 pr-4 py-2 font-mono-label text-sm text-primary placeholder-on-surface-variant focus:outline-none"
                  placeholder="Search asset name or ID..."
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t-2 border-primary pt-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono-label text-xs uppercase text-on-surface-variant font-bold">STATUS:</span>
              {(['ALL', 'ACTIVE', 'IN_REPAIR', 'RETIRED'] as const).map((s) => (
                <button
                  key={s}
                  className={`px-3 py-1 border-2 border-primary font-label-caps text-xs uppercase font-bold cursor-pointer ${
                    status === s
                      ? s === 'IN_REPAIR'
                        ? 'bg-signal-orange text-black'
                        : 'bg-primary text-white'
                      : 'bg-white text-black hover:bg-surface-container-highest'
                  }`}
                  onClick={() => setStatus(s)}
                >
                  {s === 'ALL' ? 'ALL' : s.replace('_', ' ')}
                  {s !== 'ALL' && ` (${countFor(s)})`}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono-label text-xs uppercase text-on-surface-variant font-bold">CATEGORY:</span>
              <button
                className={`px-3 py-1 border-2 border-primary font-label-caps text-xs uppercase cursor-pointer ${
                  category === 'ALL' ? 'bg-primary text-white' : 'bg-white text-black hover:bg-surface-container-highest'
                }`}
                onClick={() => setCategory('ALL')}
              >
                ALL
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  className={`px-3 py-1 border-2 border-primary font-label-caps text-xs uppercase cursor-pointer ${
                    category === c ? 'bg-primary text-white' : 'bg-white text-black hover:bg-surface-container-highest'
                  }`}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Assets table */}
        <div className="bg-warm-cream border-[3px] border-primary shadow-brutal overflow-hidden">
          <div className="p-4 border-b-[3px] border-primary bg-primary text-white flex justify-between items-center">
            <h2 className="font-headline-md text-headline-md">ASSIGNED ASSETS</h2>
            <div className="font-mono-label text-xs uppercase tracking-wider text-neutral-300">
              SHOWING {assets.length} DEVICES
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
            ) : assets.length === 0 ? (
              <div className="p-4 bg-surface">
                <EmptyState
                  icon="precision_manufacturing"
                  title="No assets assigned"
                  hint="Assets assigned to you by your organization will appear here."
                />
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-electric-yellow border-b-[3px] border-primary text-black font-label-caps text-label-caps uppercase">
                    {['Asset', 'Asset ID', 'Category', 'Status', 'Warranty', 'Location', 'Assigned', 'Action'].map((h) => (
                      <th key={h} className="p-4">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="font-body-md text-body-md divide-y divide-black">
                  {assets.map((a) => {
                    const ws = warrantyStatus(a)
                    return (
                      <tr
                        key={a.id}
                        className="hover:bg-primary hover:text-warm-cream group transition-colors cursor-pointer"
                        onClick={() => navigate(`/assets/${a.id}`)}
                      >
                        <td className="p-4">
                          <div className="font-bold text-primary group-hover:text-warm-cream">{a.name}</div>
                          <div className="font-mono-label text-[11px] text-on-surface-variant group-hover:text-gray-400">
                            {a.description ?? a.category}
                          </div>
                        </td>
                        <td className="p-4 font-mono-label font-bold text-primary group-hover:text-warm-cream">
                          {a.asset_tag}
                        </td>
                        <td className="p-4 font-mono-label text-xs uppercase">{a.category}</td>
                        <td className="p-4">
                          <StatusBadge status={a.status === 'IN_REPAIR' ? 'IN_REPAIR' : a.status} />
                        </td>
                        <td className="p-4">
                          {ws ? (
                            <span
                              className={`inline-block px-2.5 py-0.5 border-[3px] border-primary font-mono-label text-[11px] font-bold uppercase ${
                                ws === 'EXPIRED'
                                  ? 'bg-primary text-white'
                                  : ws === 'EXPIRING_SOON'
                                    ? 'bg-signal-orange text-black'
                                    : 'bg-electric-yellow text-black'
                              }`}
                            >
                              {ws.replace('_', ' ')}
                            </span>
                          ) : (
                            <span className="font-mono-label text-xs text-on-surface-variant">—</span>
                          )}
                        </td>
                        <td className="p-4 font-mono-label text-xs">{a.location ?? '—'}</td>
                        <td className="p-4 font-mono-label text-xs font-bold">You</td>
                        <td className="p-4 text-center">
                          <button className="bg-white group-hover:bg-warm-cream group-hover:text-black text-primary px-3 py-1 border-[3px] border-primary font-label-caps text-[11px] uppercase font-bold shadow-brutal-sm">
                            VIEW
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {reportOpen && (
        <ReportIssueModal
          assets={assets}
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
