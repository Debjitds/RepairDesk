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
import { dueLabel, formatRelative } from '@/lib/format'
import { supabase } from '@/lib/supabase'
import type { Repair, RepairStatus, WebmcpExecution } from '@/types'

/** Technician My Repairs per Stitch `technician_my_repair.html`. */
export default function TechnicianMyRepairs() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debounced = useDebounced(search)
  const [status, setStatus] = useState<'ALL' | RepairStatus>('ALL')

  const q = useAsyncData<Repair[]>(() => fetchRepairs({ assignedToMe: true, search: debounced }), [debounced])
  const webmcpQ = useAsyncData<WebmcpExecution[]>(async () => {
    const { data, error } = await supabase
      .from('webmcp_tool_executions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(6)
    if (error) throw error
    return (data ?? []) as WebmcpExecution[]
  }, [])

  const repairs = q.data ?? []
  const filtered = useMemo(
    () => (status === 'ALL' ? repairs : repairs.filter((r) => r.status === status)),
    [repairs, status],
  )

  const active = repairs.filter((r) => !['RESOLVED', 'CLOSED'].includes(r.status))
  const kpi = {
    assigned: active.length,
    critical: active.filter((r) => r.priority === 'CRITICAL').length,
    inRepair: active.filter((r) => r.status === 'IN_REPAIR').length,
    completed: repairs.filter((r) => ['RESOLVED', 'CLOSED'].includes(r.status)).length,
  }

  const currentAssetRepair = active[0]

  return (
    <>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-stack-md mb-stack-lg">
        <div>
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold uppercase">
            My Repairs
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">
            Focus on the repairs assigned to you.
          </p>
        </div>
        <div className="flex flex-wrap gap-stack-md">
          <div className="relative flex items-center">
            <Icon name="search" className="absolute left-3 text-[20px] text-on-surface-variant" />
            <input
              className="bg-surface border-2 border-primary font-mono-label text-mono-label pl-9 pr-4 py-3 w-64 industrial-shadow focus:outline-none"
              placeholder="Search asset, ticket, issue..."
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
            <span className="font-mono-label text-mono-label uppercase text-on-surface-variant mb-2">ASSIGNED TO ME</span>
            <span className="font-display-lg text-display-lg">{kpi.assigned}</span>
          </div>
          <div className="bg-signal-orange text-primary border-[3px] border-primary industrial-shadow p-stack-md flex flex-col">
            <span className="font-mono-label text-mono-label uppercase mb-2 font-bold">CRITICAL</span>
            <span className="font-display-lg text-display-lg">{kpi.critical}</span>
          </div>
          <div className="bg-electric-yellow text-primary border-[3px] border-primary industrial-shadow p-stack-md flex flex-col">
            <span className="font-mono-label text-mono-label uppercase mb-2 font-bold">IN REPAIR</span>
            <span className="font-display-lg text-display-lg">{kpi.inRepair}</span>
          </div>
          <div className="bg-warm-cream border-[3px] border-primary industrial-shadow p-stack-md flex flex-col">
            <span className="font-mono-label text-mono-label uppercase text-on-surface-variant mb-2">COMPLETED</span>
            <span className="font-display-lg text-display-lg">{kpi.completed}</span>
          </div>
        </div>

        {/* Assigned repairs table */}
        <div className="col-span-12 bg-warm-cream border-[3px] border-primary industrial-shadow overflow-hidden">
          <div className="border-b-[3px] border-primary p-stack-md bg-white flex justify-between items-center flex-wrap gap-2">
            <h3 className="font-headline-md text-headline-md uppercase">MY ASSIGNED REPAIRS</h3>
            <div className="flex gap-1">
              {(['ALL', 'ASSIGNED', 'DIAGNOSING', 'IN_REPAIR', 'RESOLVED'] as const).map((s) => (
                <button
                  key={s}
                  className={`px-3 py-1 border-2 border-primary font-label-caps text-xs uppercase font-bold ${
                    status === s ? 'bg-primary text-white' : 'bg-white text-black hover:bg-surface-container-highest'
                  }`}
                  onClick={() => setStatus(s)}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
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
                  icon="build"
                  title="No assigned repairs"
                  hint="Repairs dispatched to you will appear here."
                />
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-electric-yellow border-b-[3px] border-primary font-mono-label text-mono-label uppercase">
                    {['ID', 'Asset', 'Issue', 'Priority', 'Status', 'Due', 'Action'].map((h, i, arr) => (
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
                        {r.asset?.name} ({r.asset?.asset_tag})
                      </td>
                      <td className="p-stack-md border-r-2 border-primary">{r.title}</td>
                      <td className={`p-stack-md border-r-2 border-primary font-bold ${r.priority === 'CRITICAL' ? 'text-signal-orange' : ''}`}>
                        {r.priority}
                      </td>
                      <td className="p-stack-md border-r-2 border-primary">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="p-stack-md border-r-2 border-primary font-bold">{dueLabel(r.due_date)}</td>
                      <td className="p-stack-md">
                        <span className="font-label-caps text-label-caps underline">[VIEW]</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Secondary panels */}
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-stack-lg">
          {/* Current asset context */}
          <div className="bg-warm-cream border-[3px] border-primary industrial-shadow flex flex-col h-full">
            <div className="border-b-[3px] border-primary p-stack-md bg-white">
              <h3 className="font-label-caps text-label-caps uppercase">CURRENT ASSET CONTEXT</h3>
            </div>
            {currentAssetRepair?.asset ? (
              <div className="p-stack-md flex-1 bg-surface-dim">
                <h4 className="font-headline-md text-headline-md mb-1">{currentAssetRepair.asset.asset_tag}</h4>
                <p className="font-body-md mb-4">{currentAssetRepair.asset.name}</p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <span className="font-mono-label text-mono-label uppercase block mb-1">Status</span>
                    <StatusBadge status={currentAssetRepair.asset.status === 'IN_REPAIR' ? 'IN_REPAIR' : currentAssetRepair.asset.status} />
                  </div>
                  <div>
                    <span className="font-mono-label text-mono-label uppercase block mb-1">Warranty</span>
                    <StatusBadge status={warrantyLabel(currentAssetRepair.asset)} />
                  </div>
                  <div>
                    <span className="font-mono-label text-mono-label uppercase block mb-1">Past Repairs</span>
                    <span className="font-body-lg font-bold">{currentAssetRepair.asset.repair_count ?? 0}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-stack-md flex-1 flex items-center justify-center">
                <span className="font-mono-label text-mono-label text-on-surface-variant">No active repair.</span>
              </div>
            )}
            <button
              className="w-full p-stack-md font-label-caps text-label-caps uppercase hover:bg-black hover:text-white transition-colors text-center border-t-[3px] border-primary"
              onClick={() => currentAssetRepair && navigate(`/assets/${currentAssetRepair.asset_id}`)}
            >
              [VIEW FULL HISTORY]
            </button>
          </div>

          {/* Recent repair history (own) */}
          <div className="bg-warm-cream border-[3px] border-primary industrial-shadow flex flex-col h-full">
            <div className="border-b-[3px] border-primary p-stack-md bg-white">
              <h3 className="font-label-caps text-label-caps uppercase">RECENT REPAIR HISTORY</h3>
            </div>
            <div className="flex-1 flex flex-col">
              {repairs.filter((r) => ['RESOLVED', 'CLOSED'].includes(r.status)).slice(0, 3).map((r) => (
                <div
                  key={r.id}
                  className="flex justify-between items-center p-stack-md border-b-2 border-primary cursor-pointer hover:bg-surface-container-high"
                  onClick={() => navigate(`/repairs/${r.id}`)}
                >
                  <span className="font-mono-label text-mono-label font-bold">#{r.ticket_number}</span>
                  <span className="font-body-md flex-1 mx-4">{r.asset?.asset_tag}</span>
                  <span className="text-sm bg-surface-container-high px-2 border border-primary">{r.status}</span>
                </div>
              ))}
              {repairs.filter((r) => ['RESOLVED', 'CLOSED'].includes(r.status)).length === 0 && (
                <div className="p-stack-md text-on-surface-variant font-body-md text-sm">No completed repairs yet.</div>
              )}
            </div>
          </div>

          {/* WebMCP activity */}
          <div className="bg-warm-cream border-[3px] border-primary industrial-shadow flex flex-col h-full bg-black text-warm-cream md:col-span-2">
            <div className="border-b-[3px] border-primary p-stack-md flex justify-between items-center">
              <h3 className="font-label-caps text-label-caps uppercase text-warm-cream">WEBMCP ACTIVITY</h3>
              <div className="w-3 h-3 bg-electric-yellow animate-pulse" />
            </div>
            <div className="p-stack-md flex-1 font-mono-label text-mono-label overflow-y-auto flex flex-col gap-3 dark-log-scroll">
              {(webmcpQ.data ?? []).length === 0 && <div className="text-neutral-400">&gt; No recent agent activity.</div>}
              {(webmcpQ.data ?? []).map((e) => (
                <div key={e.id} className={`flex gap-4 ${e.success ? 'opacity-70' : 'text-signal-orange'}`}>
                  <span className="text-electric-yellow">{formatRelative(e.created_at)}</span>
                  <span>&gt; Agent {e.success ? 'ran' : 'failed'} {e.tool_name}</span>
                </div>
              ))}
              <div className="flex gap-4">
                <span className="text-electric-yellow">_</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function warrantyLabel(asset: { warranty_end: string | null }): string {
  if (!asset.warranty_end) return 'UNKNOWN'
  const end = new Date(asset.warranty_end)
  const now = new Date()
  const days = (end.getTime() - now.getTime()) / 86400000
  if (days < 0) return 'EXPIRED'
  if (days <= 30) return 'EXPIRING SOON'
  return 'ACTIVE'
}
