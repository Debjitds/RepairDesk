import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAsyncData, useDebounced } from '@/hooks/useAsyncData'
import { fetchAssets, fetchAssetLocations, type AssetFilters } from '@/services/assetService'
import {
  Icon,
  LoadingState,
  ErrorState,
  EmptyState,
  StatusBadge,
} from '@/components/ui/primitives'
import { warrantyStatus, type Asset, type AssetStatus } from '@/types'

const CATEGORY_ICONS: Record<string, string> = {
  Laptop: 'laptop_chromebook',
  Monitor: 'desktop_windows',
  Projector: 'videocam',
  Printer: 'print',
  Phone: 'smartphone',
  Network: 'router',
  Other: 'devices_other',
}

/** Technician Assets per Stitch `technician_assets.html` — read/inspect directory. */
export default function TechnicianAssets() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debounced = useDebounced(search)
  const [status, setStatus] = useState<AssetStatus | 'ALL'>('ALL')
  const [category, setCategory] = useState('ALL')
  const [warranty, setWarranty] = useState('ALL')
  const [location, setLocation] = useState('ALL')

  const filters: AssetFilters = { search: debounced, status, category, location, warranty }
  const q = useAsyncData<Asset[]>(() => fetchAssets(filters), [debounced, status, category, location, warranty])
  const locsQ = useAsyncData<string[]>(() => fetchAssetLocations(), [])

  const assets = q.data ?? []
  const kpi = useMemo(
    () => ({
      total: assets.length,
      inRepair: assets.filter((a) => a.status === 'IN_REPAIR').length,
      repeated: assets.filter((a) => (a.repair_count ?? 0) >= 3).length,
      warranty: assets.filter((a) => {
        const ws = warrantyStatus(a)
        return ws === 'EXPIRING_SOON' || ws === 'EXPIRED'
      }).length,
    }),
    [assets],
  )

  return (
    <>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-stack-md mb-stack-lg">
        <div>
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold uppercase">ASSETS</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">
            Find equipment, inspect its history, and diagnose repair context.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-stack-md">
          <div className="relative flex items-center">
            <Icon name="search" className="absolute left-3 text-[20px] text-on-surface-variant" />
            <input
              className="bg-surface border-2 border-primary font-mono-label text-mono-label pl-9 pr-4 py-3 w-64 industrial-shadow focus:outline-none"
              placeholder="Quick search serial or ID..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-stack-lg w-full">
        {/* KPI row */}
        <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-stack-md">
          <div className="bg-warm-cream border-[3px] border-primary industrial-shadow p-stack-md flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <span className="font-mono-label text-mono-label uppercase text-on-surface-variant">TOTAL ASSETS</span>
              <span className="font-mono-label text-mono-label px-2 py-0.5 border border-primary bg-surface-container-high">
                ACTIVE POOL
              </span>
            </div>
            <span className="font-display-lg text-display-lg">{kpi.total}</span>
          </div>
          <div className="bg-signal-orange text-primary border-[3px] border-primary industrial-shadow p-stack-md flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <span className="font-mono-label text-mono-label uppercase font-bold">IN REPAIR</span>
              <span className="font-mono-label text-mono-label px-2 py-0.5 border border-primary bg-white text-primary font-bold">
                {kpi.inRepair} ACTIVE
              </span>
            </div>
            <span className="font-display-lg text-display-lg">{kpi.inRepair}</span>
          </div>
          <div className="bg-surface border-[3px] border-primary industrial-shadow p-stack-md flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <span className="font-mono-label text-mono-label uppercase text-signal-orange font-bold flex items-center gap-1">
                <Icon name="warning" className="text-[16px]" /> REPEATED FAILURES
              </span>
              <span className="font-mono-label text-mono-label px-2 py-0.5 border border-primary bg-signal-orange text-primary font-bold">
                HIGH PRIORITY
              </span>
            </div>
            <span className="font-display-lg text-display-lg text-signal-orange">{kpi.repeated}</span>
          </div>
          <div className="bg-electric-yellow text-primary border-[3px] border-primary industrial-shadow p-stack-md flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <span className="font-mono-label text-mono-label uppercase font-bold">WARRANTY WARNINGS</span>
              <span className="font-mono-label text-mono-label px-2 py-0.5 border border-primary bg-black text-electric-yellow font-bold">
                EXPIRING SOON
              </span>
            </div>
            <span className="font-display-lg text-display-lg">{kpi.warranty}</span>
          </div>
        </div>

        {/* Filter bar */}
        <div className="col-span-12 bg-warm-cream border-[3px] border-primary industrial-shadow p-stack-md">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-stack-md items-center">
            <div className="md:col-span-4">
              <label className="font-mono-label text-mono-label uppercase block mb-1 font-bold">Search Query</label>
              <div className="relative flex items-center">
                <Icon name="search" className="absolute left-3 text-[18px] text-on-surface-variant" />
                <input
                  className="w-full bg-white border-2 border-primary font-mono-label text-mono-label pl-9 pr-3 py-2 industrial-shadow focus:outline-none"
                  placeholder="Search asset name, ID, serial number..."
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="font-mono-label text-mono-label uppercase block mb-1 font-bold">Status</label>
              <select
                className="w-full bg-white border-2 border-primary font-mono-label text-mono-label py-2 px-2 industrial-shadow focus:outline-none"
                value={status}
                onChange={(e) => setStatus(e.target.value as AssetStatus | 'ALL')}
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="IN_REPAIR">In Repair</option>
                <option value="RETIRED">Retired</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="font-mono-label text-mono-label uppercase block mb-1 font-bold">Category</label>
              <select
                className="w-full bg-white border-2 border-primary font-mono-label text-mono-label py-2 px-2 industrial-shadow focus:outline-none"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                {['Laptop', 'Monitor', 'Projector', 'Printer', 'Phone', 'Network', 'Other'].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="font-mono-label text-mono-label uppercase block mb-1 font-bold">Warranty</label>
              <select
                className="w-full bg-white border-2 border-primary font-mono-label text-mono-label py-2 px-2 industrial-shadow focus:outline-none"
                value={warranty}
                onChange={(e) => setWarranty(e.target.value)}
              >
                <option value="ALL">All Warranties</option>
                <option value="ACTIVE">Active</option>
                <option value="EXPIRING_SOON">Expiring Soon</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="font-mono-label text-mono-label uppercase block mb-1 font-bold">Location</label>
              <select
                className="w-full bg-white border-2 border-primary font-mono-label text-mono-label py-2 px-2 industrial-shadow focus:outline-none"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                <option value="ALL">All Locations</option>
                {(locsQ.data ?? []).map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Directory */}
        <div className="col-span-12 bg-warm-cream border-[3px] border-primary industrial-shadow overflow-hidden">
          <div className="border-b-[3px] border-primary p-stack-md bg-electric-yellow flex justify-between items-center flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <h3 className="font-headline-md text-headline-md uppercase">ASSET DIRECTORY ({assets.length} RECORDS)</h3>
              <span className="bg-black text-electric-yellow font-mono-label text-mono-label px-2 py-1 uppercase font-bold">
                LIVE FILTERED
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
            ) : assets.length === 0 ? (
              <div className="p-stack-md bg-surface">
                <EmptyState icon="precision_manufacturing" title="No assets found" hint="Try a different search or filter." />
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b-[3px] border-primary font-mono-label text-mono-label uppercase">
                    {['ASSET', 'ASSET ID', 'CATEGORY', 'STATUS', 'WARRANTY', 'LOCATION', 'CURRENT REPAIR', 'ACTION'].map(
                      (h, i, arr) => (
                        <th key={h} className={`p-stack-md ${i < arr.length - 1 ? 'border-r-[3px] border-primary' : ''}`}>
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="font-body-md">
                  {assets.map((a) => {
                    const ws = warrantyStatus(a)
                    const repeated = (a.repair_count ?? 0) >= 3
                    return (
                      <tr
                        key={a.id}
                        className={`border-b-2 border-primary hover:bg-black hover:text-warm-cream transition-colors cursor-pointer ${repeated ? 'bg-electric-yellow/20' : ''}`}
                        onClick={() => navigate(`/assets/${a.id}`)}
                      >
                        <td className="p-stack-md border-r-2 border-primary">
                          <div className="flex items-center gap-3">
                            <Icon
                              name={CATEGORY_ICONS[a.category] ?? 'devices_other'}
                              className={`text-[24px] ${repeated ? 'text-signal-orange' : ''}`}
                            />
                            <div>
                              <div className="font-bold font-headline-md text-[18px]">{a.name}</div>
                              <div className="font-mono-label text-mono-label text-on-surface-variant">
                                {a.description ?? a.category} • SN: {a.serial_number ?? '—'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-stack-md border-r-2 border-primary font-mono-label font-bold">{a.asset_tag}</td>
                        <td className="p-stack-md border-r-2 border-primary font-mono-label uppercase">{a.category}</td>
                        <td className="p-stack-md border-r-2 border-primary">
                          <StatusBadge status={a.status === 'IN_REPAIR' ? 'IN_REPAIR' : a.status} />
                        </td>
                        <td className="p-stack-md border-r-2 border-primary">
                          {ws ? <StatusBadge status={ws} /> : <span className="font-mono-label text-[12px]">—</span>}
                        </td>
                        <td className="p-stack-md border-r-2 border-primary font-mono-label">{a.location ?? '—'}</td>
                        <td className="p-stack-md border-r-2 border-primary">
                          {a.open_repair_ticket ? (
                            <span className="bg-white text-primary px-2 py-1 font-mono-label text-mono-label border-2 border-primary font-bold">
                              #{a.open_repair_ticket}
                            </span>
                          ) : (
                            <span className="font-mono-label text-[12px] text-on-surface-variant">—</span>
                          )}
                        </td>
                        <td className="p-stack-md text-center">
                          <button className="bg-black text-white font-label-caps text-label-caps px-3 py-1 border-2 border-primary uppercase font-bold hover:bg-electric-yellow hover:text-primary transition-colors">
                            [ INSPECT ]
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
    </>
  )
}
