import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useAsyncData } from '@/hooks/useAsyncData'
import { fetchAsset } from '@/services/assetService'
import { fetchAssetRepairHistory } from '@/services/repairService'
import {
  Icon,
  LoadingState,
  ErrorState,
  EmptyState,
  StatusBadge,
  NeoButton,
} from '@/components/ui/primitives'
import { formatDate } from '@/lib/format'
import { warrantyStatus, type Repair } from '@/types'

/** Asset detail page — role-aware view used by all roles from various contexts. */
export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const assetQ = useAsyncData(() => fetchAsset(id!), [id])
  const historyQ = useAsyncData<Repair[]>(() => fetchAssetRepairHistory(id!), [id])

  const asset = assetQ.data
  if (assetQ.loading) return <LoadingState rows={5} />
  if (assetQ.error) return <ErrorState message={assetQ.error} onRetry={assetQ.refresh} />
  if (!asset)
    return (
      <EmptyState
        icon="search_off"
        title="Asset not found"
        hint="It may have been removed, or you may not have access."
        action={<NeoButton tone="surface" onClick={() => navigate(-1)}>Go back</NeoButton>}
      />
    )

  const ws = warrantyStatus(asset)
  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER'
  const repeated = (asset.repair_count ?? 0) >= 3

  return (
    <>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-stack-md mb-stack-lg">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold uppercase tracking-tight">
              {asset.asset_tag}
            </h1>
            <StatusBadge status={asset.status === 'IN_REPAIR' ? 'IN_REPAIR' : asset.status} />
            {repeated && (
              <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 font-label-caps text-[10px] uppercase border border-primary font-bold flex items-center gap-1">
                <Icon name="warning" className="text-[12px]" /> Repeated Failure
              </span>
            )}
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">{asset.name}</p>
        </div>
        <div className="flex gap-2">
          {asset.open_repair_id && (
            <NeoButton onClick={() => navigate(`/repairs/${asset.open_repair_id}`)}>
              <Icon name="build" /> Current Repair (#{asset.open_repair_ticket})
            </NeoButton>
          )}
          <NeoButton tone="surface" onClick={() => navigate(-1)}>
            <Icon name="arrow_back" /> Back
          </NeoButton>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        {/* Metadata */}
        <div className="md:col-span-7 flex flex-col gap-stack-md">
          <div className="bg-surface border-2 border-primary industrial-shadow p-stack-md flex flex-col gap-4">
            <div className="border-b-2 border-primary pb-2">
              <span className="font-mono-label text-[12px] uppercase text-secondary-container font-bold block">
                Asset Information
              </span>
              <h3 className="font-headline-md text-[18px] font-bold text-primary m-0">{asset.name}</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[12px] font-mono-label bg-surface-container-low p-2 border border-outline">
              <Meta label="Serial Number" value={asset.serial_number ?? '—'} />
              <Meta label="Category" value={asset.category} />
              <Meta label="Assigned To" value={asset.assigned_user?.full_name ?? 'Unassigned'} />
              <Meta label="Location" value={asset.location ?? '—'} />
              <Meta label="Purchase Date" value={formatDate(asset.purchase_date)} />
              <Meta
                label="Warranty End"
                value={`${formatDate(asset.warranty_end)}${ws ? ` (${ws.replace('_', ' ').toLowerCase()})` : ''}`}
                danger={ws === 'EXPIRED'}
              />
              <Meta label="Last Repair" value={formatDate(asset.last_repair_at)} />
              <Meta label="Total Repairs" value={String(asset.repair_count ?? 0)} />
            </div>
            {asset.description && (
              <p className="font-body-md text-sm text-on-surface border-t-2 border-primary pt-3">{asset.description}</p>
            )}
            {repeated && (
              <div className="border-2 border-primary bg-secondary-container/15 p-3 flex flex-col gap-1">
                <div className="flex items-center gap-1 text-secondary font-label-caps text-[12px] uppercase font-bold">
                  <Icon name="warning" className="text-[16px]" /> Repeated Failure Pattern
                </div>
                <p className="font-body-md text-[12px] text-on-surface leading-tight">
                  Asset {asset.asset_tag} has logged <strong>{asset.repair_count} repairs</strong>. Review the history
                  below before further repairs.
                </p>
              </div>
            )}
            {canManage && (
              <div className="flex flex-col gap-2 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <button className="bg-surface text-primary border-2 border-primary py-2 font-label-caps text-[12px] uppercase font-bold hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-1">
                    <Icon name="edit" className="text-[16px]" /> Edit Asset
                  </button>
                  <button
                    className="bg-surface text-primary border-2 border-primary py-2 font-label-caps text-[12px] uppercase font-bold hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-1"
                    onClick={() => navigate('/assets')}
                  >
                    <Icon name="inventory_2" className="text-[16px]" /> Directory
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Repair history */}
        <div className="md:col-span-5">
          <div className="bg-surface border-2 border-primary industrial-shadow">
            <div className="border-b-2 border-primary p-stack-md bg-surface-container-highest flex justify-between items-center">
              <h2 className="font-label-caps text-label-caps uppercase">Repair History</h2>
              <span className="font-mono-label text-[11px] text-on-surface-variant uppercase">
                {(historyQ.data ?? []).length} records
              </span>
            </div>
            <div className="divide-y divide-outline">
              {historyQ.loading && (
                <div className="p-stack-md">
                  <LoadingState rows={2} />
                </div>
              )}
              {historyQ.error && (
                <div className="p-stack-md">
                  <ErrorState message={historyQ.error} onRetry={historyQ.refresh} />
                </div>
              )}
              {!historyQ.loading && (historyQ.data ?? []).length === 0 && (
                <div className="p-stack-md">
                  <EmptyState icon="history" title="No repair history" hint="Completed repairs for this asset will appear here." />
                </div>
              )}
              {(historyQ.data ?? []).map((r) => (
                <div
                  key={r.id}
                  className="p-3 hover:bg-surface-container-highest cursor-pointer transition-colors"
                  onClick={() => navigate(`/repairs/${r.id}`)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono-label text-[11px] font-bold text-primary">#{r.ticket_number}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="font-body-md text-xs text-on-surface mt-1">{r.title}</div>
                  {r.resolution && (
                    <div className="font-body-md text-[11px] text-on-surface-variant mt-0.5">{r.resolution}</div>
                  )}
                  <div className="font-mono-label text-[10px] text-on-surface-variant mt-1 uppercase">
                    {formatDate(r.resolved_at ?? r.created_at)} — {r.technician?.full_name ?? 'Unassigned'}
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

function Meta({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div>
      <span className="text-on-surface-variant block text-[10px] uppercase">{label}</span>
      <span className={`font-bold ${danger ? 'text-error' : 'text-primary'}`}>{value}</span>
    </div>
  )
}
