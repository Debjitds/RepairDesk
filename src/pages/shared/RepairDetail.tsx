import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useAsyncData } from '@/hooks/useAsyncData'
import {
  fetchRepair,
  fetchRepairNotes,
  fetchRepairHistory,
  assignTechnician,
  updateRepairStatus,
  addRepairNote,
  fetchTechnicians,
} from '@/services/repairService'
import { fetchAssetRepairHistory } from '@/services/repairService'
import {
  Icon,
  LoadingState,
  ErrorState,
  EmptyState,
  StatusBadge,
  NeoButton,
  FormError,
  FormSuccess,
  Field,
  inputCls,
} from '@/components/ui/primitives'
import { dueLabel, formatDate, formatRelative } from '@/lib/format'
import type { Repair, RepairHistoryEntry, RepairNote, RepairStatus, User } from '@/types'

/** Allowed next statuses per lifecycle + role. */
function allowedTransitions(status: RepairStatus, role: string): RepairStatus[] {
  const map: Record<RepairStatus, RepairStatus[]> = {
    OPEN: ['ASSIGNED'],
    ASSIGNED: ['DIAGNOSING'],
    DIAGNOSING: ['IN_REPAIR', 'RESOLVED'],
    IN_REPAIR: ['RESOLVED'],
    RESOLVED: ['CLOSED', 'IN_REPAIR'],
    CLOSED: [],
  }
  const next = map[status] ?? []
  if (role === 'TECHNICIAN') return next.filter((s) => ['DIAGNOSING', 'IN_REPAIR', 'RESOLVED'].includes(s))
  if (role === 'ADMIN' || role === 'MANAGER') return next
  return []
}

/** Repair detail page — cross-role workflow hub (shared shell, role-aware actions). */
export default function RepairDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const role = user?.role

  const repairQ = useAsyncData<Repair | null>(() => fetchRepair(id!), [id])
  const notesQ = useAsyncData<RepairNote[]>(() => fetchRepairNotes(id!), [id])
  const historyQ = useAsyncData<RepairHistoryEntry[]>(() => fetchRepairHistory(id!), [id])
  const techsQ = useAsyncData<User[]>(() => (role === 'ADMIN' || role === 'MANAGER' ? fetchTechnicians() : Promise.resolve([])), [])
  const assetHistoryQ = useAsyncData<Repair[]>(() => fetchAssetRepairHistory(repairQ.data?.asset_id ?? ''), [repairQ.data?.asset_id])

  const [assignTech, setAssignTech] = useState('')
  const [note, setNote] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [resolution, setResolution] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const repair = repairQ.data
  if (repairQ.loading) return <LoadingState rows={6} />
  if (repairQ.error) return <ErrorState message={repairQ.error} onRetry={repairQ.refresh} />
  if (!repair)
    return (
      <EmptyState
        icon="search_off"
        title="Repair not found"
        hint="It may have been removed, or you may not have access."
        action={<NeoButton tone="surface" onClick={() => navigate(-1)}>Go back</NeoButton>}
      />
    )

  const isManagerView = role === 'ADMIN' || role === 'MANAGER'
  const isAssignedTech = role === 'TECHNICIAN' && repair.assigned_technician_id === user?.id
  const canWork = isManagerView || isAssignedTech
  const transitions = allowedTransitions(repair.status, role ?? 'EMPLOYEE')
  const assetTag = repair.asset?.asset_tag ?? '—'

  async function doAssign() {
    if (!assignTech || !repair) return
    setBusy(true)
    setError(null)
    setSuccess(null)
    try {
      await assignTechnician(repair.id, assignTech)
      setSuccess('Technician assigned.')
      repairQ.refresh()
      historyQ.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to assign')
    } finally {
      setBusy(false)
    }
  }

  async function doStatus(newStatus: RepairStatus) {
    if (!repair) return
    setBusy(true)
    setError(null)
    setSuccess(null)
    try {
      await updateRepairStatus({
        repair_id: repair.id,
        new_status: newStatus,
        note: note || null,
        diagnosis: diagnosis || null,
        resolution: resolution || null,
      })
      setSuccess(`Status updated to ${newStatus}.`)
      setNote('')
      setDiagnosis('')
      setResolution('')
      repairQ.refresh()
      notesQ.refresh()
      historyQ.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update status')
    } finally {
      setBusy(false)
    }
  }

  async function doAddNote() {
    if (!repair || note.trim().length < 1) return
    setBusy(true)
    setError(null)
    setSuccess(null)
    try {
      await addRepairNote(repair.id, note.trim())
      setNote('')
      setSuccess('Note added.')
      notesQ.refresh()
      historyQ.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add note')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-stack-md mb-stack-lg">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold uppercase tracking-tight">
              #{repair.ticket_number}
            </h1>
            <StatusBadge status={repair.status} />
            <StatusBadge status={repair.priority} />
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">{repair.title}</p>
        </div>
        <NeoButton tone="surface" onClick={() => navigate(-1)}>
          <Icon name="arrow_back" /> Back
        </NeoButton>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        {/* Left: ticket details + workflow */}
        <div className="md:col-span-8 flex flex-col gap-stack-md">
          {/* Details panel */}
          <div className="bg-surface border-2 border-primary industrial-shadow">
            <div className="border-b-2 border-primary p-stack-md bg-surface-container-highest flex justify-between items-center">
              <h2 className="font-headline-md text-[20px] font-bold uppercase tracking-tight flex items-center gap-2">
                <Icon name="build" className="text-[22px]" /> Repair Details
              </h2>
              <span className="font-mono-label text-[11px] text-on-surface-variant uppercase">
                Reported {formatRelative(repair.reported_at)}
              </span>
            </div>
            <div className="p-stack-md space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[12px] font-mono-label bg-surface-container-low p-2 border border-outline">
                <div>
                  <span className="text-on-surface-variant block text-[10px] uppercase">Asset</span>
                  <button
                    className="font-bold text-primary underline"
                    onClick={() => navigate(`/assets/${repair.asset_id}`)}
                  >
                    {assetTag}
                  </button>
                </div>
                <div>
                  <span className="text-on-surface-variant block text-[10px] uppercase">Reporter</span>
                  <span className="font-bold text-primary">{repair.reporter?.full_name ?? '—'}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block text-[10px] uppercase">Technician</span>
                  <span className="font-bold text-primary">{repair.technician?.full_name ?? 'Unassigned'}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block text-[10px] uppercase">Due</span>
                  <span className="font-bold text-primary">{dueLabel(repair.due_date)}</span>
                </div>
              </div>
              <div>
                <h3 className="font-label-caps text-[12px] uppercase font-bold mb-1">Issue Description</h3>
                <p className="font-body-md text-sm text-on-surface whitespace-pre-wrap">{repair.description}</p>
              </div>
              {repair.diagnosis && (
                <div>
                  <h3 className="font-label-caps text-[12px] uppercase font-bold mb-1">Diagnosis</h3>
                  <p className="font-body-md text-sm text-on-surface whitespace-pre-wrap">{repair.diagnosis}</p>
                </div>
              )}
              {repair.resolution && (
                <div>
                  <h3 className="font-label-caps text-[12px] uppercase font-bold mb-1">Resolution</h3>
                  <p className="font-body-md text-sm text-on-surface whitespace-pre-wrap">{repair.resolution}</p>
                </div>
              )}
            </div>
          </div>

          {/* Lifecycle / actions */}
          {canWork && transitions.length > 0 && (
            <div className="bg-surface border-2 border-primary industrial-shadow">
              <div className="border-b-2 border-primary p-stack-md bg-surface-container-highest flex justify-between items-center">
                <h2 className="font-headline-md text-[20px] font-bold uppercase tracking-tight flex items-center gap-2">
                  <Icon name="construction" className="text-[22px]" /> Workflow Actions
                </h2>
                <span className="font-mono-label text-[10px] uppercase text-on-surface-variant">
                  {repair.status} → next step
                </span>
              </div>
              <div className="p-stack-md space-y-4">
                <FormError message={error} />
                <FormSuccess message={success} />

                {/* Assign technician (manager/admin, OPEN/ASSIGNED) */}
                {isManagerView && ['OPEN', 'ASSIGNED'].includes(repair.status) && (
                  <div className="border-2 border-primary bg-surface-container-low p-stack-md flex flex-col md:flex-row gap-2 md:items-end">
                    <div className="flex-1">
                      <Field label="Assign Technician">
                        <select className={inputCls} value={assignTech} onChange={(e) => setAssignTech(e.target.value)}>
                          <option value="">Select technician…</option>
                          {(techsQ.data ?? []).map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.full_name}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                    <NeoButton onClick={doAssign} disabled={busy || !assignTech}>
                      <Icon name="engineering" /> Assign
                    </NeoButton>
                  </div>
                )}

                {/* Diagnosis / resolution inputs when relevant */}
                {(isAssignedTech || isManagerView) && ['ASSIGNED', 'DIAGNOSING', 'IN_REPAIR'].includes(repair.status) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
                    <Field label="Diagnosis (optional)">
                      <textarea
                        className={inputCls}
                        rows={2}
                        placeholder="Root cause identified…"
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                      />
                    </Field>
                    <Field label="Resolution (required to resolve)">
                      <textarea
                        className={inputCls}
                        rows={2}
                        placeholder="What fixed the issue…"
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                      />
                    </Field>
                  </div>
                )}

                <Field label="Note (attached to status change)">
                  <textarea
                    className={inputCls}
                    rows={2}
                    placeholder="Add a note for this transition…"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </Field>

                <div className="flex flex-wrap gap-2">
                  {transitions.map((s) => (
                    <NeoButton
                      key={s}
                      tone={s === 'RESOLVED' ? 'yellow' : s === 'CLOSED' ? 'dark' : 'orange'}
                      onClick={() => void doStatus(s)}
                      disabled={busy || (s === 'RESOLVED' && resolution.trim().length < 3)}
                      title={
                        s === 'RESOLVED' && resolution.trim().length < 3 ? 'Enter a resolution first' : undefined
                      }
                    >
                      <Icon name={STATUS_ICONS[s] ?? 'arrow_forward'} /> Move to {s.replace('_', ' ')}
                    </NeoButton>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="bg-surface border-2 border-primary industrial-shadow">
            <div className="border-b-2 border-primary p-stack-md bg-surface-container-highest flex justify-between items-center">
              <h2 className="font-headline-md text-[20px] font-bold uppercase tracking-tight">Repair Notes</h2>
              <span className="font-mono-label text-[12px] font-bold bg-primary text-surface px-2 py-0.5">
                {(notesQ.data ?? []).length}
              </span>
            </div>
            <div className="p-stack-md space-y-3">
              {canWork && (
                <div className="flex flex-col md:flex-row gap-2 md:items-start">
                  <textarea
                    className={`${inputCls} flex-1`}
                    rows={2}
                    placeholder="Add a repair note…"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <NeoButton tone="surface" onClick={doAddNote} disabled={busy || !note.trim()}>
                    <Icon name="sticky_note_2" /> Add Note
                  </NeoButton>
                </div>
              )}
              {(notesQ.data ?? []).length === 0 && (
                <p className="font-body-md text-sm text-on-surface-variant">No notes yet.</p>
              )}
              {(notesQ.data ?? []).map((n) => (
                <div key={n.id} className="border-l-4 border-primary bg-surface-container-low p-3">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-label-caps text-[12px] uppercase font-bold text-primary">
                      {n.author?.full_name ?? 'Unknown'}
                    </span>
                    <span className="font-mono-label text-[10px] text-on-surface-variant uppercase">
                      {formatRelative(n.created_at)}
                    </span>
                  </div>
                  <p className="font-body-md text-sm whitespace-pre-wrap">{n.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: history + asset context */}
        <div className="md:col-span-4 flex flex-col gap-stack-md">
          {/* Timeline */}
          <div className="bg-surface border-2 border-primary industrial-shadow">
            <div className="border-b-2 border-primary p-stack-md bg-tertiary-fixed text-on-tertiary-fixed">
              <h2 className="font-label-caps text-label-caps uppercase">Repair Timeline</h2>
            </div>
            <div className="p-stack-md flex flex-col gap-3">
              {(historyQ.data ?? []).length === 0 && (
                <p className="font-body-md text-sm text-on-surface-variant">No history yet.</p>
              )}
              {(historyQ.data ?? []).map((h) => (
                <div key={h.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-primary border border-primary" />
                    <div className="w-0.5 flex-1 bg-outline-variant my-1" />
                  </div>
                  <div className="pb-2">
                    <div className="font-mono-label text-[10px] text-on-surface-variant uppercase">
                      {formatRelative(h.created_at)} — {h.actor?.full_name ?? 'System'}
                    </div>
                    <div className="font-body-md text-sm mt-0.5">{h.description}</div>
                    {h.previous_status && h.new_status && (
                      <div className="mt-1 flex items-center gap-1">
                        <StatusBadge status={h.previous_status} />
                        <Icon name="arrow_forward" className="text-[12px] text-on-surface-variant" />
                        <StatusBadge status={h.new_status} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Asset context */}
          <div className="bg-surface border-2 border-primary industrial-shadow p-stack-md">
            <h2 className="font-label-caps text-label-caps uppercase border-b-2 border-primary pb-2 mb-3 flex items-center gap-2">
              <Icon name="precision_manufacturing" className="text-[18px]" /> Asset Context
            </h2>
            <div className="space-y-2 font-mono-label text-[12px]">
              <div className="flex justify-between">
                <span className="text-on-surface-variant uppercase">Asset</span>
                <span className="font-bold text-primary">{assetTag}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant uppercase">Name</span>
                <span className="font-bold text-primary">{repair.asset?.name ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant uppercase">Status</span>
                <StatusBadge status={repair.asset?.status === 'IN_REPAIR' ? 'IN_REPAIR' : repair.asset?.status ?? 'ACTIVE'} />
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant uppercase">Past Repairs</span>
                <span className="font-bold text-primary">{(assetHistoryQ.data ?? []).length}</span>
              </div>
            </div>
            <button
              className="mt-3 w-full bg-surface text-primary border-2 border-primary py-2 font-label-caps text-[12px] uppercase font-bold hover:bg-primary hover:text-surface transition-colors"
              onClick={() => navigate(`/assets/${repair.asset_id}`)}
            >
              View Asset Details
            </button>
          </div>

          {/* Previous repairs for this asset */}
          <div className="bg-surface border-2 border-primary industrial-shadow">
            <div className="border-b-2 border-primary p-stack-md bg-surface-container-highest">
              <h2 className="font-label-caps text-label-caps uppercase">Previous Repairs for {assetTag}</h2>
            </div>
            <div className="divide-y divide-outline">
              {(assetHistoryQ.data ?? []).length === 0 && (
                <div className="p-stack-md text-sm text-on-surface-variant font-body-md">No previous repairs.</div>
              )}
              {(assetHistoryQ.data ?? []).slice(0, 5).map((r) => (
                <div
                  key={r.id}
                  className="p-3 flex justify-between items-center hover:bg-surface-container-highest cursor-pointer"
                  onClick={() => navigate(`/repairs/${r.id}`)}
                >
                  <div>
                    <span className="font-mono-label text-[11px] font-bold">#{r.ticket_number}</span>
                    <div className="font-body-md text-xs text-on-surface-variant">{r.title}</div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={r.status} />
                    <div className="font-mono-label text-[10px] text-on-surface-variant mt-1">
                      {formatDate(r.resolved_at ?? r.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const STATUS_ICONS: Partial<Record<RepairStatus, string>> = {
  ASSIGNED: 'engineering',
  DIAGNOSING: 'troubleshoot',
  IN_REPAIR: 'build',
  RESOLVED: 'task_alt',
  CLOSED: 'archive',
}
