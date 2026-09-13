import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAsyncData, useDebounced } from '@/hooks/useAsyncData'
import { fetchAssets, fetchAssetLocations, saveAsset, type AssetFilters } from '@/services/assetService'
import { fetchOrgUsers } from '@/services/notificationService'
import {
  Icon,
  StatCard,
  StatusBadge,
  LoadingState,
  ErrorState,
  EmptyState,
  NeoButton,
  FormError,
  Field,
  inputCls,
} from '@/components/ui/primitives'
import { formatDate } from '@/lib/format'
import { warrantyStatus, type Asset, type AssetStatus, type User } from '@/types'

/** Admin/Manager Assets per Stitch `admin_assets.html`. */
export default function AdminAssets() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounced(search)
  const [status, setStatus] = useState<AssetStatus | 'ALL'>('ALL')
  const [category, setCategory] = useState('ALL')
  const [location, setLocation] = useState('ALL')
  const [assigned, setAssigned] = useState<'ALL' | 'Assigned' | 'Unassigned'>('ALL')
  const [warranty, setWarranty] = useState('ALL')
  const [selected, setSelected] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  const filters: AssetFilters = { search: debouncedSearch, status, category, location, assigned, warranty }

  const assetsQ = useAsyncData<Asset[]>(() => fetchAssets(filters), [debouncedSearch, status, category, location, assigned, warranty])
  const locsQ = useAsyncData<string[]>(() => fetchAssetLocations(), [])
  const usersQ = useAsyncData<User[]>(() => fetchOrgUsers(), [])

  const assets = assetsQ.data ?? []
  const selectedAsset = useMemo(() => assets.find((a) => a.id === selected) ?? null, [assets, selected])

  const kpi = useMemo(
    () => ({
      total: assets.length,
      active: assets.filter((a) => a.status === 'ACTIVE').length,
      inRepair: assets.filter((a) => a.status === 'IN_REPAIR').length,
      retired: assets.filter((a) => a.status === 'RETIRED').length,
      warrantyWarnings: assets.filter((a) => {
        const ws = warrantyStatus(a)
        return ws === 'EXPIRING_SOON' || ws === 'EXPIRED'
      }).length,
    }),
    [assets],
  )

  if (assetsQ.error) return <ErrorState message={assetsQ.error} onRetry={assetsQ.refresh} />

  return (
    <>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-stack-md mb-stack-lg">
        <div>
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold tracking-tight uppercase">
            Assets
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">
            Manage company equipment, ownership, status, and repair context.
          </p>
        </div>
        <div className="flex flex-wrap gap-stack-md">
          <NeoButton tone="surface" onClick={() => setAddOpen(true)}>
            <Icon name="add" className="text-[20px]" /> Add Asset
          </NeoButton>
        </div>
      </header>

      {/* KPI cards */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-stack-md mb-stack-lg">
        <StatCard label="Total Assets" value={kpi.total} />
        <StatCard label="Active" value={kpi.active} />
        <StatCard label="In Repair" value={kpi.inRepair} tone="orange" icon="build" />
        <StatCard label="Retired" value={kpi.retired} />
        <StatCard label="Warranty Warnings" value={kpi.warrantyWarnings} tone="yellow" icon="warning" />
      </section>

      {/* Search & filters */}
      <section className="bg-surface border-2 border-primary industrial-shadow p-stack-md mb-stack-lg flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-stack-md items-stretch">
          <div className="flex-grow flex items-center border-2 border-primary bg-surface-container-lowest px-3 py-2">
            <Icon name="search" className="text-outline mr-2 text-[20px]" />
            <input
              className="w-full bg-transparent border-none p-0 focus:ring-0 text-body-md text-primary placeholder-on-surface-variant font-body-md"
              placeholder="Search asset name, ID, serial number..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <SelectFilter label="Location:" value={location} onChange={setLocation} options={['ALL', ...(locsQ.data ?? [])]} />
            <SelectFilter label="Assignment:" value={assigned} onChange={(v) => setAssigned(v as 'ALL' | 'Assigned' | 'Unassigned')} options={['ALL', 'Assigned', 'Unassigned']} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-outline-variant text-label-caps text-[12px]">
          <span className="font-bold uppercase tracking-wider text-on-surface-variant mr-2">Filters:</span>
          <FilterChip active={status === 'ALL'} onClick={() => setStatus('ALL')} label="Status: All" />
          <FilterChip active={status === 'ACTIVE'} onClick={() => setStatus('ACTIVE')} label="Active" />
          <FilterChip active={status === 'IN_REPAIR'} onClick={() => setStatus('IN_REPAIR')} label="In Repair" />
          <FilterChip active={status === 'RETIRED'} onClick={() => setStatus('RETIRED')} label="Retired" />
          <span className="border-2 border-primary bg-surface px-3 py-1 font-bold cursor-pointer uppercase hover:bg-surface-container-highest" onClick={() => setCategory(category === 'ALL' ? 'Laptop' : 'ALL')}>
            Category: {category}
          </span>
          <span className="border-2 border-primary bg-surface px-3 py-1 font-bold cursor-pointer uppercase hover:bg-surface-container-highest" onClick={() => setWarranty(warranty === 'ALL' ? 'EXPIRING_SOON' : 'ALL')}>
            Warranty: {warranty === 'ALL' ? 'All' : warranty}
          </span>
          <span className="border border-outline bg-surface-container-highest px-2 py-1 font-mono-label text-[10px] text-on-surface-variant">
            Showing {assets.length} assets
          </span>
        </div>
      </section>

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        {/* Directory table */}
        <section className="md:col-span-8 flex flex-col gap-stack-md">
          <div className="bg-surface border-2 border-primary industrial-shadow overflow-hidden">
            <div className="border-b-2 border-primary p-stack-md bg-surface-container-highest flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Icon name="inventory_2" className="text-[24px]" />
                <h2 className="font-headline-md text-[20px] font-bold m-0 uppercase tracking-tight">Asset Directory</h2>
              </div>
              <span className="font-label-caps text-[12px] uppercase tracking-wider bg-surface border border-primary px-2 py-1 font-bold">
                Live Synced
              </span>
            </div>
            <div className="overflow-x-auto">
              {assetsQ.loading ? (
                <div className="p-stack-md">
                  <LoadingState rows={4} />
                </div>
              ) : assets.length === 0 ? (
                <div className="p-stack-md">
                  <EmptyState
                    icon="inventory_2"
                    title="No assets found"
                    hint="Try adjusting your filters, or add a new asset."
                    action={
                      <NeoButton onClick={() => setAddOpen(true)}>
                        <Icon name="add" /> Add Asset
                      </NeoButton>
                    }
                  />
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-primary font-label-caps text-label-caps text-on-surface-variant bg-surface-container">
                      {['Asset ID', 'Asset', 'Category', 'Status', 'Assigned To', 'Location', 'Warranty', 'Last Repair', 'Action'].map(
                        (h, i, arr) => (
                          <th key={h} className={`p-stack-sm text-[12px] ${i < arr.length - 1 ? 'border-r-2 border-primary' : ''}`}>
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline">
                    {assets.map((a) => {
                      const ws = warrantyStatus(a)
                      const repeated = (a.repair_count ?? 0) >= 3
                      return (
                        <tr
                          key={a.id}
                          className={`hover:bg-surface-container-highest transition-colors cursor-pointer ${repeated ? 'bg-surface-container-highest/40 border-l-4 border-l-secondary-container' : ''}`}
                          onClick={() => setSelected(a.id)}
                        >
                          <td className="p-stack-sm border-r border-outline font-mono-label text-mono-label font-bold text-primary">
                            {a.asset_tag}
                          </td>
                          <td className="p-stack-sm border-r border-outline">
                            <div className="font-body-md font-bold text-[14px]">{a.name}</div>
                            {repeated && (
                              <div className="mt-1 inline-flex items-center gap-1 bg-secondary-container/20 text-secondary border border-secondary px-2 py-0.5 font-label-caps text-[10px] uppercase font-bold">
                                <Icon name="warning" className="text-[12px]" /> {a.repair_count} repairs in 6 mos
                              </div>
                            )}
                          </td>
                          <td className="p-stack-sm border-r border-outline font-body-md text-[13px]">{a.category}</td>
                          <td className="p-stack-sm border-r border-outline">
                            <StatusBadge status={a.status === 'IN_REPAIR' ? 'IN_REPAIR' : a.status} />
                          </td>
                          <td className="p-stack-sm border-r border-outline font-body-md text-[13px]">
                            {a.assigned_user?.full_name ?? <span className="italic text-on-surface-variant">Unassigned</span>}
                          </td>
                          <td className="p-stack-sm border-r border-outline font-body-md text-[13px]">{a.location ?? '—'}</td>
                          <td className="p-stack-sm border-r border-outline">
                            {ws ? <StatusBadge status={ws} /> : <span className="font-body-md text-[12px] text-on-surface-variant">—</span>}
                          </td>
                          <td className="p-stack-sm border-r border-outline font-mono-label text-[12px]">
                            {a.last_repair_at ? formatDate(a.last_repair_at) : '—'}
                          </td>
                          <td className="p-stack-sm">
                            <div className="flex items-center gap-1">
                              <button
                                className="bg-tertiary text-surface px-2 py-1 font-label-caps text-[10px] uppercase border border-primary font-bold hover:bg-secondary-container transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  navigate(`/assets/${a.id}`)
                                }}
                              >
                                View
                              </button>
                              <button
                                className="bg-surface text-primary px-2 py-1 font-label-caps text-[10px] uppercase border border-primary font-bold hover:bg-surface-container-highest transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  navigate(`/assets/${a.id}`)
                                }}
                              >
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>

        {/* Inspection drawer */}
        <section className="md:col-span-4 flex flex-col gap-stack-md">
          {selectedAsset ? (
            <div className="bg-surface border-2 border-primary industrial-shadow p-stack-md flex flex-col gap-4">
              <div className="border-b-2 border-primary pb-2 flex justify-between items-start">
                <div>
                  <span className="font-mono-label text-[12px] uppercase text-secondary-container font-bold block">
                    Selected Inspection
                  </span>
                  <h3 className="font-headline-md text-[18px] font-bold text-primary m-0">{selectedAsset.asset_tag}</h3>
                  <p className="font-body-md text-[13px] text-on-surface-variant">{selectedAsset.name}</p>
                </div>
                <StatusBadge status={selectedAsset.status === 'IN_REPAIR' ? 'IN_REPAIR' : selectedAsset.status} />
              </div>

              <div className="grid grid-cols-2 gap-2 text-[12px] font-mono-label bg-surface-container-low p-2 border border-outline">
                <Meta label="Serial Number" value={selectedAsset.serial_number ?? '—'} />
                <Meta label="Category" value={selectedAsset.category} />
                <Meta label="Assigned To" value={selectedAsset.assigned_user?.full_name ?? 'Unassigned'} />
                <Meta label="Location" value={selectedAsset.location ?? '—'} />
                <Meta label="Purchase Date" value={formatDate(selectedAsset.purchase_date)} />
                <Meta
                  label="Warranty End"
                  value={`${formatDate(selectedAsset.warranty_end)}${warrantyStatus(selectedAsset) === 'EXPIRED' ? ' (Expired)' : ''}`}
                  danger={warrantyStatus(selectedAsset) === 'EXPIRED'}
                />
                <Meta label="Last Repair" value={formatDate(selectedAsset.last_repair_at)} />
                <Meta label="Current Ticket" value={selectedAsset.open_repair_ticket ? `#${selectedAsset.open_repair_ticket}` : '—'} accent />
              </div>

              {(selectedAsset.repair_count ?? 0) >= 3 && (
                <div className="border-2 border-primary bg-secondary-container/15 p-3 flex flex-col gap-1">
                  <div className="flex items-center gap-1 text-secondary font-label-caps text-[12px] uppercase font-bold">
                    <Icon name="warning" className="text-[16px]" /> Repeated Failure Pattern
                  </div>
                  <p className="font-body-md text-[12px] text-on-surface leading-tight">
                    Asset {selectedAsset.asset_tag} has logged <strong>{selectedAsset.repair_count} repairs</strong>{' '}
                    recently. Review history before further repairs.
                  </p>
                  <Link className="font-label-caps text-[11px] text-secondary font-bold underline uppercase mt-1" to="/repair-history">
                    View Repair History →
                  </Link>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-1">
                {selectedAsset.open_repair_id && (
                  <Link
                    to={`/repairs/${selectedAsset.open_repair_id}`}
                    className="w-full bg-secondary-container text-on-secondary-container border-2 border-primary py-2 font-label-caps text-label-caps uppercase font-bold industrial-shadow hover:brightness-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Icon name="build" className="text-[18px]" /> View Current Repair (#{selectedAsset.open_repair_ticket})
                  </Link>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button className="bg-surface text-primary border-2 border-primary py-2 font-label-caps text-[12px] uppercase font-bold hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-1">
                    <Icon name="edit" className="text-[16px]" /> Edit Asset
                  </button>
                  <Link
                    to={`/assets/${selectedAsset.id}`}
                    className="bg-surface text-primary border-2 border-primary py-2 font-label-caps text-[12px] uppercase font-bold hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-1"
                  >
                    <Icon name="history" className="text-[16px]" /> Full History
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon="visibility"
              title="No asset selected"
              hint="Select a row in the directory to inspect details, warranty, and repair context."
            />
          )}
        </section>
      </div>

      {addOpen && (
        <AssetFormModal
          onClose={() => setAddOpen(false)}
          onSaved={() => {
            setAddOpen(false)
            assetsQ.refresh()
          }}
          employees={(usersQ.data ?? []).filter((u) => u.role === 'EMPLOYEE')}
        />
      )}
    </>
  )
}

function Meta({ label, value, danger, accent }: { label: string; value: string; danger?: boolean; accent?: boolean }) {
  return (
    <div>
      <span className="text-on-surface-variant block text-[10px] uppercase">{label}</span>
      <span className={`font-bold ${danger ? 'text-error' : accent ? 'text-secondary' : 'text-primary'}`}>{value}</span>
    </div>
  )
}

function SelectFilter({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <div className="flex items-center border-2 border-primary bg-surface px-3 py-2 text-label-caps font-label-caps text-[12px] uppercase">
      <span className="text-on-surface-variant mr-1">{label}</span>
      <select
        className="bg-transparent border-none p-0 pr-4 text-primary font-bold focus:ring-0 uppercase cursor-pointer"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o === 'ALL' ? 'All' : o}
          </option>
        ))}
      </select>
    </div>
  )
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <span
      className={`border-2 border-primary px-3 py-1 font-bold cursor-pointer uppercase ${active ? 'bg-tertiary text-surface' : 'bg-surface hover:bg-surface-container-highest'}`}
      onClick={onClick}
    >
      {label}
    </span>
  )
}

/** Add/Edit asset modal form. */
export function AssetFormModal({
  asset,
  employees,
  onClose,
  onSaved,
}: {
  asset?: Asset | null
  employees: User[]
  onClose: () => void
  onSaved: () => void
}) {
  const [tag, setTag] = useState(asset?.asset_tag ?? '')
  const [name, setName] = useState(asset?.name ?? '')
  const [category, setCategory] = useState<string>(asset?.category ?? 'Laptop')
  const [serial, setSerial] = useState(asset?.serial_number ?? '')
  const [description, setDescription] = useState(asset?.description ?? '')
  const [assignedTo, setAssignedTo] = useState(asset?.assigned_to ?? '')
  const [status, setStatus] = useState<AssetStatus>(asset?.status ?? 'ACTIVE')
  const [location, setLocation] = useState(asset?.location ?? '')
  const [purchaseDate, setPurchaseDate] = useState(asset?.purchase_date ?? '')
  const [warrantyStart, setWarrantyStart] = useState(asset?.warranty_start ?? '')
  const [warrantyEnd, setWarrantyEnd] = useState(asset?.warranty_end ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (tag.trim().length < 2 || name.trim().length < 2) {
      setError('Asset tag and name are required.')
      return
    }
    setBusy(true)
    try {
      await saveAsset({
        id: asset?.id ?? null,
        asset_tag: tag.trim(),
        name: name.trim(),
        category,
        serial_number: serial || null,
        description: description || null,
        assigned_to: assignedTo || null,
        status,
        location: location || null,
        purchase_date: purchaseDate || null,
        warranty_start: warrantyStart || null,
        warranty_end: warrantyEnd || null,
      })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save asset')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-primary/60 flex items-center justify-center p-4 overflow-y-auto" role="dialog" aria-modal="true">
      <form
        className="bg-surface border-2 border-primary industrial-shadow w-full max-w-2xl my-8"
        onSubmit={submit}
      >
        <div className="border-b-2 border-primary p-stack-md bg-tertiary-fixed text-on-tertiary-fixed flex justify-between items-center">
          <h2 className="font-headline-md text-[20px] font-bold uppercase tracking-tight flex items-center gap-2">
            <Icon name="precision_manufacturing" /> {asset ? 'Edit Asset' : 'Add New Asset'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="hover:opacity-70">
            <Icon name="close" />
          </button>
        </div>
        <div className="p-stack-lg space-y-stack-md max-h-[70vh] overflow-y-auto">
          <FormError message={error} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
            <Field label="Asset Tag *">
              <input className={inputCls} value={tag} onChange={(e) => setTag(e.target.value)} placeholder="LAP-019" required />
            </Field>
            <Field label="Asset Name *">
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Dell Latitude 7450" required />
            </Field>
            <Field label="Category">
              <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
                {['Laptop', 'Monitor', 'Projector', 'Printer', 'Phone', 'Network', 'Other'].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Serial Number">
              <input className={inputCls} value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="SN-1042-LT" />
            </Field>
            <Field label="Assigned To (Employee)">
              <select className={inputCls} value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
                <option value="">Unassigned</option>
                {employees.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as AssetStatus)}>
                <option value="ACTIVE">Active</option>
                <option value="IN_REPAIR">In Repair</option>
                <option value="RETIRED">Retired</option>
              </select>
            </Field>
            <Field label="Location">
              <input className={inputCls} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Engineering" />
            </Field>
            <Field label="Purchase Date">
              <input className={inputCls} type="date" value={purchaseDate ?? ''} onChange={(e) => setPurchaseDate(e.target.value)} />
            </Field>
            <Field label="Warranty Start">
              <input className={inputCls} type="date" value={warrantyStart ?? ''} onChange={(e) => setWarrantyStart(e.target.value)} />
            </Field>
            <Field label="Warranty End">
              <input className={inputCls} type="date" value={warrantyEnd ?? ''} onChange={(e) => setWarrantyEnd(e.target.value)} />
            </Field>
          </div>
          <Field label="Description">
            <textarea className={inputCls} rows={2} value={description ?? ''} onChange={(e) => setDescription(e.target.value)} placeholder="Optional equipment notes" />
          </Field>
        </div>
        <div className="border-t-2 border-primary p-stack-md bg-surface-container flex justify-end gap-2">
          <NeoButton tone="surface" onClick={onClose} type="button">
            Cancel
          </NeoButton>
          <NeoButton type="submit" disabled={busy}>
            <Icon name="save" /> {busy ? 'Saving…' : 'Save Asset'}
          </NeoButton>
        </div>
      </form>
    </div>
  )
}
