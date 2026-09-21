import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useAsyncData } from '@/hooks/useAsyncData'
import { createRepairTicket, fetchRepairs } from '@/services/repairService'
import { fetchAssets } from '@/services/assetService'
import { supabase } from '@/lib/supabase'
import {
  Icon,
  LoadingState,
  ErrorState,
  EmptyState,
  StatusBadge,
  Field,
  inputCls,
  FormError,
  NeoButton,
} from '@/components/ui/primitives'
import { dueLabel, formatRelative, initials } from '@/lib/format'
import { type Asset, type Repair, type RepairPriority, type WebmcpExecution } from '@/types'

const CATEGORY_ICONS: Record<string, string> = {
  Laptop: 'laptop_mac',
  Monitor: 'desktop_windows',
  Projector: 'videocam',
  Printer: 'print',
  Phone: 'smartphone',
  Network: 'router',
  Other: 'devices_other',
}

/** Employee Dashboard per Stitch `employee_dashboard.html`. */
export default function EmployeeDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [reportOpen, setReportOpen] = useState(false)

  const repairsQ = useAsyncData<Repair[]>(() => fetchRepairs({ reportedByMe: true }), [])
  const assetsQ = useAsyncData<Asset[]>(() => fetchAssets({}), [])
  const webmcpQ = useAsyncData<WebmcpExecution[]>(async () => {
      const { data, error } = await supabase
        .from('webmcp_tool_executions')
        .select('*')
        .eq('actor_id', user?.id ?? '')
        .order('created_at', { ascending: false })
        .limit(4)
    if (error) throw error
    return (data ?? []) as WebmcpExecution[]
  }, [user?.id])

  const repairs = repairsQ.data ?? []
  const assets = assetsQ.data ?? []

  const kpi = {
    assets: assets.length,
    openIssues: repairs.filter((r) => !['RESOLVED', 'CLOSED'].includes(r.status)).length,
    inRepair: repairs.filter((r) => ['DIAGNOSING', 'IN_REPAIR'].includes(r.status)).length,
    resolved: repairs.filter((r) => ['RESOLVED', 'CLOSED'].includes(r.status)).length,
  }

  const currentRepair = repairs.find((r) => !['RESOLVED', 'CLOSED'].includes(r.status))
  const recentTickets = repairs.slice(0, 4)

  if (repairsQ.loading) return <LoadingState rows={6} />
  if (repairsQ.error) return <ErrorState message={repairsQ.error} onRetry={repairsQ.refresh} />
  if (assetsQ.error) return <ErrorState message={assetsQ.error} onRetry={assetsQ.refresh} />

  return (
    <>
      {/* Header */}
      <header className="sticky top-[56px] md:top-0 z-30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-0 py-6">
        <div>
          <h1 className="font-headline-lg text-4xl font-black uppercase tracking-tight text-primary">MY WORKSPACE</h1>
          <p className="font-body-md text-sm text-on-surface-variant font-mono-label mt-1">
            Employee Dashboard • Equipment, repair requests &amp; live updates
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
        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
          <div className="bg-warm-cream p-6 border-[3px] border-primary shadow-brutal flex flex-col justify-between h-32">
            <div className="font-label-caps text-label-caps uppercase text-on-surface-variant">MY ASSETS</div>
            <div className="font-display-lg text-display-lg text-primary">{kpi.assets}</div>
          </div>
          <div className="bg-warm-cream p-6 border-[3px] border-primary shadow-brutal flex flex-col justify-between h-32">
            <div className="font-label-caps text-label-caps uppercase text-on-surface-variant">OPEN ISSUES</div>
            <div className="font-display-lg text-display-lg text-primary">{kpi.openIssues}</div>
          </div>
          <div className="bg-signal-orange p-6 border-[3px] border-primary shadow-brutal flex flex-col justify-between h-32">
            <div className="font-label-caps text-label-caps uppercase text-black font-bold">IN REPAIR</div>
            <div className="font-display-lg text-display-lg text-black font-bold">{kpi.inRepair}</div>
          </div>
          <div className="bg-electric-yellow p-6 border-[3px] border-primary shadow-brutal flex flex-col justify-between h-32">
            <div className="font-label-caps text-label-caps uppercase text-black font-bold">RESOLVED</div>
            <div className="font-display-lg text-display-lg text-black font-bold">{kpi.resolved}</div>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Left column */}
          <div className="lg:col-span-5 space-y-gutter">
            {/* MY ASSETS panel */}
            <div className="bg-warm-cream border-[3px] border-primary shadow-brutal flex flex-col">
              <div className="p-4 border-b-[3px] border-primary bg-electric-yellow">
                <h2 className="font-headline-md text-headline-md text-black">MY ASSETS</h2>
              </div>
              <div className="flex-1 p-0 flex flex-col">
                {assets.length === 0 && (
                  <div className="p-4">
                    <EmptyState icon="precision_manufacturing" title="No assigned assets" hint="Assets assigned to you will appear here." />
                  </div>
                )}
                {assets.map((a, i) => (
                  <div
                    key={a.id}
                    className={`p-2.5 ${i < assets.length - 1 ? 'border-b border-black' : ''} flex justify-between items-center hover:bg-primary hover:text-warm-cream group transition-colors cursor-pointer`}
                    onClick={() => navigate(`/assets/${a.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 flex items-center justify-center border-[2px] border-primary ${a.status === 'IN_REPAIR' ? 'bg-signal-orange' : 'bg-white'}`}
                      >
                        <Icon name={CATEGORY_ICONS[a.category] ?? 'devices_other'} className="text-black text-[20px]" />
                      </div>
                      <div>
                        <div className="font-label-caps text-sm">{a.asset_tag}</div>
                        <div className={`font-mono-label text-xs ${a.status === 'IN_REPAIR' ? 'text-error' : 'text-on-surface-variant'}`}>
                          {a.status === 'IN_REPAIR' ? 'In Repair' : 'Active'}
                        </div>
                      </div>
                    </div>
                    <button className="bg-transparent group-hover:bg-warm-cream group-hover:text-black text-primary px-3 py-1.5 border-[2px] border-primary font-label-caps text-xs uppercase transition-colors">
                      VIEW
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* WebMCP log (dark) */}
            <div className="border-[3px] border-primary bg-black text-white p-4 shadow-brutal flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-700">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-electric-yellow inline-block animate-pulse" />
                  <span className="font-headline-md text-xs font-bold uppercase tracking-wider text-electric-yellow">
                    WEBMCP LOG
                  </span>
                </div>
                <span className="text-[10px] font-mono-label text-neutral-400">AGENT READY</span>
              </div>
              <div className="dark-log-scroll space-y-1.5 font-mono-label text-[11px] leading-tight text-neutral-300 max-h-64 overflow-y-auto">
                {(webmcpQ.data ?? []).length === 0 && <div>&gt; No recent agent activity.</div>}
                {(webmcpQ.data ?? []).map((e) => (
                  <div key={e.id} className="flex items-start gap-2">
                    <span className="text-signal-orange font-semibold">{formatRelative(e.created_at)}</span>
                    <span>&gt; Agent {e.success ? 'ran' : 'failed'} {e.tool_name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-7 space-y-gutter">
            {/* MY REPAIR REQUESTS table */}
            <div className="bg-warm-cream border-[3px] border-primary shadow-brutal overflow-hidden">
              <div className="p-4 border-b-[3px] border-primary bg-primary text-white flex justify-between items-center">
                <h2 className="font-headline-md text-headline-md">MY REPAIR REQUESTS</h2>
                <span className="font-mono-label text-xs uppercase text-neutral-300">{repairs.length} TOTAL</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-electric-yellow border-b-[3px] border-primary text-black font-label-caps text-label-caps uppercase">
                      <th className="p-4 w-1/4">Ticket ID</th>
                      <th className="p-4 w-1/3">Issue</th>
                      <th className="p-4 w-1/4">Status</th>
                      <th className="p-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="font-body-md text-body-md">
                    {recentTickets.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-4">
                          <EmptyState
                            icon="report_problem"
                            title="No repair requests yet"
                            hint="Report an issue with one of your assets to get started."
                            action={
                              <NeoButton onClick={() => setReportOpen(true)}>
                                <Icon name="add_circle" /> Report an Issue
                              </NeoButton>
                            }
                          />
                        </td>
                      </tr>
                    )}
                    {recentTickets.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-black hover:bg-primary hover:text-warm-cream group transition-colors cursor-pointer"
                        onClick={() => navigate(`/repairs/${r.id}`)}
                      >
                        <td className="p-4 font-mono-label text-mono-label font-bold">#{r.ticket_number}</td>
                        <td className="p-4">{r.title}</td>
                        <td className="p-4">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="p-4">
                          <button className="bg-white group-hover:bg-warm-cream group-hover:text-black text-primary px-3 py-1 border-[2px] border-primary font-label-caps text-[10px] uppercase">
                            DETAILS
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
              {/* ASSIGNED TECHNICIAN card */}
              <div className="bg-warm-cream border-[3px] border-primary shadow-brutal flex flex-col h-full">
                <div className="p-4 border-b-[3px] border-primary bg-white flex justify-between items-center">
                  <h2 className="font-headline-md text-headline-md">TECHNICIAN</h2>
                  <Icon name="engineering" className="text-signal-orange" />
                </div>
                <div className="p-4 flex flex-col items-center text-center gap-2 flex-1">
                  {currentRepair?.technician ? (
                    <>
                      <div className="w-16 h-16 border-[3px] border-primary bg-signal-orange flex items-center justify-center">
                        <span className="font-headline-md text-2xl font-black text-black">
                          {initials(currentRepair.technician.full_name)}
                        </span>
                      </div>
                      <div>
                        <div className="font-headline-md text-[20px] font-bold leading-tight">
                          {currentRepair.technician.full_name}
                        </div>
                        <div className="font-mono-label text-mono-label text-on-surface-variant uppercase mt-0.5">
                          Hardware Technician
                        </div>
                      </div>
                      <div className="w-full pt-2.5 mt-1 border-t-[3px] border-primary">
                        <div className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-0.5">
                          Working On
                        </div>
                        <div className="font-mono-label text-mono-label font-bold text-base">
                          #{currentRepair.ticket_number}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="py-8">
                      <EmptyState
                        icon="engineering"
                        title="No technician assigned"
                        hint={currentRepair ? 'A technician will be assigned soon.' : 'No active repair request.'}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* RECENT UPDATES feed */}
              <div className="bg-warm-cream border-[3px] border-primary shadow-brutal flex flex-col h-full">
                <div className="p-4 border-b-[3px] border-primary bg-white">
                  <h2 className="font-headline-md text-headline-md">RECENT UPDATES</h2>
                </div>
                <div className="p-3.5 space-y-2 flex-1 overflow-y-auto">
                  {repairs.length === 0 && (
                    <p className="font-body-md text-sm text-on-surface-variant">Updates will appear here.</p>
                  )}
                  {repairs.slice(0, 4).map((r) => (
                    <div key={r.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-3.5 h-3.5 border-[2px] border-primary ${r.status === 'IN_REPAIR' || r.status === 'DIAGNOSING' ? 'bg-signal-orange' : r.status === 'RESOLVED' ? 'bg-electric-yellow' : 'bg-white'}`}
                        />
                        <div className="w-0.5 h-full bg-black my-1" />
                      </div>
                      <div className="pb-2">
                        <div className="font-mono-label text-mono-label text-on-surface-variant text-[10px] uppercase">
                          {formatRelative(r.updated_at)}
                        </div>
                        <div className="font-body-md text-sm mt-0.5 leading-snug">
                          Repair <span className="font-bold">#{r.ticket_number}</span> is now{' '}
                          <StatusBadge status={r.status} /> — due {dueLabel(r.due_date)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {reportOpen && (
        <ReportIssueModal
          assets={assets}
          onClose={() => setReportOpen(false)}
          onCreated={() => {
            setReportOpen(false)
            repairsQ.refresh()
          }}
        />
      )}
    </>
  )
}

/** Report Issue modal — employee selects own asset, describes issue, creates ticket (OPEN). */
export function ReportIssueModal({
  assets,
  onClose,
  onCreated,
}: {
  assets: Asset[]
  onClose: () => void
  onCreated: () => void
}) {
  const [assetId, setAssetId] = useState(assets[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<RepairPriority>('MEDIUM')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!assetId) {
      setError('Select the asset with the problem.')
      return
    }
    if (title.trim().length < 3) {
      setError('Describe the issue in the title (at least 3 characters).')
      return
    }
    if (description.trim().length < 3) {
      setError('Add a short description of the problem.')
      return
    }
    setBusy(true)
    try {
      await createRepairTicket({
        asset_id: assetId,
        title: title.trim(),
        description: description.trim(),
        priority,
      })
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit issue')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-primary/60 flex items-center justify-center p-4 overflow-y-auto" role="dialog" aria-modal="true">
      <form className="bg-surface border-[3px] border-primary shadow-brutal w-full max-w-lg my-8" onSubmit={submit}>
        <div className="border-b-[3px] border-primary p-4 bg-primary text-white flex justify-between items-center">
          <h2 className="font-headline-md text-lg font-bold uppercase flex items-center gap-2">
            <Icon name="report_problem" /> REPORT AN ISSUE
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="hover:opacity-70">
            <Icon name="close" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <FormError message={error} />
          <Field label="Asset with the problem">
            <select className={inputCls} value={assetId} onChange={(e) => setAssetId(e.target.value)} required>
              <option value="" disabled>
                Select an asset…
              </option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.asset_tag} — {a.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Issue title">
            <input
              className={inputCls}
              placeholder="e.g. Laptop is overheating"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
            />
          </Field>
          <Field label="Describe the problem">
            <textarea
              className={inputCls}
              rows={4}
              placeholder="What happens? When did it start? Any error messages?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={4000}
              required
            />
          </Field>
          <Field label="Priority">
            <select className={inputCls} value={priority} onChange={(e) => setPriority(e.target.value as RepairPriority)}>
              <option value="LOW">Low — cosmetic / minor</option>
              <option value="MEDIUM">Medium — affects normal use</option>
              <option value="HIGH">High — blocking work</option>
              <option value="CRITICAL">Critical — safety hazard / total failure</option>
            </select>
          </Field>
          <p className="font-mono-label text-[11px] text-on-surface-variant">
            A technician will be assigned by your repair team. You cannot select a technician yourself.
          </p>
        </div>
        <div className="border-t-[3px] border-primary p-4 bg-surface-container flex justify-end gap-2">
          <NeoButton tone="surface" onClick={onClose} type="button">
            Cancel
          </NeoButton>
          <NeoButton type="submit" disabled={busy}>
            <Icon name="send" /> {busy ? 'Submitting…' : 'Submit Issue'}
          </NeoButton>
        </div>
      </form>
    </div>
  )
}
