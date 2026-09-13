import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useAsyncData } from '@/hooks/useAsyncData'
import { fetchOrgUsers, adminUpdateUser, updateOwnProfile } from '@/services/notificationService'
import {
  Icon,
  LoadingState,
  ErrorState,
  EmptyState,
  NeoButton,
  FormError,
  FormSuccess,
  Field,
  inputCls,
} from '@/components/ui/primitives'
import { initials } from '@/lib/format'
import type { AppRole, User } from '@/types'
import { ROLE_LABEL } from '@/types'

type Tab = 'profile' | 'users' | 'notifications' | 'security'

/**
 * Settings page per Stitch `admin-settings.html` / `technician_settings.html` /
 * `employee_settings.html`. Shared shell; sections adapt to role permissions.
 */
export default function SettingsPage() {
  const { user, signOut, updatePassword } = useAuth()
  const role = user?.role
  const isManager = role === 'MANAGER'
  const isAdmin = role === 'ADMIN'

  const availableTabs: Tab[] = isAdmin
    ? ['profile', 'users', 'notifications', 'security']
    : ['profile', 'notifications', 'security']
  const [tab, setTab] = useState<Tab>('profile')

  const usersQ = useAsyncData<User[]>(() => (isAdmin || isManager ? fetchOrgUsers() : Promise.resolve([])), [])

  return (
    <>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-stack-md mb-stack-lg">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold uppercase tracking-tight">
              Settings
            </h1>
            {isAdmin && (
              <span className="bg-tertiary-fixed text-on-tertiary-fixed px-2 py-1 font-label-caps text-[10px] uppercase border-2 border-primary font-bold industrial-shadow">
                Admin Control
              </span>
            )}
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {isAdmin
              ? 'Manage users, roles, system preferences, and your account.'
              : isManager
                ? 'Manage your profile and operational preferences.'
                : 'Manage your account, security, and personal workspace preferences.'}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-surface-container-high border-2 border-primary px-3 py-2 industrial-shadow">
          <span className="w-2.5 h-2.5 bg-tertiary-fixed border border-primary animate-pulse inline-block" />
          <span className="font-mono-label text-[12px] font-bold tracking-tight text-primary uppercase">
            [ WEBMCP READY ] Agent actions follow permissions
          </span>
        </div>
      </header>

      {/* Sub-nav tabs */}
      <div className="flex flex-wrap gap-2 mb-stack-lg border-b-2 border-primary pb-stack-sm">
        {availableTabs.map((t) => (
          <button
            key={t}
            className={`px-4 py-2 font-label-caps text-label-caps uppercase font-bold border-2 transition-colors ${
              tab === t
                ? 'bg-primary text-surface border-primary industrial-shadow'
                : 'bg-surface text-primary border-primary hover:bg-surface-container-highest'
            }`}
            onClick={() => setTab(t)}
          >
            {t === 'users' ? 'Users & Roles' : t === 'profile' ? 'Profile' : t === 'notifications' ? 'Notifications' : 'Security'}
          </button>
        ))}
      </div>

      {tab === 'profile' && <ProfileTab />}
      {tab === 'users' && isAdmin && <UsersTab usersQ={usersQ} />}
      {tab === 'notifications' && <NotificationsPrefsTab />}
      {tab === 'security' && <SecurityTab onChangePassword={updatePassword} onSignOut={() => void signOut()} />}
    </>
  )
}

// ---------------- Profile ----------------

function ProfileTab() {
  const { user, refreshUser } = useAuth()
  const [fullName, setFullName] = useState(user?.full_name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setSuccess(null)
    try {
      await updateOwnProfile({ full_name: fullName, department: user?.department ?? null, phone: phone || null })
      await refreshUser()
      setSuccess('Profile updated successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter mb-stack-lg">
      <div className="md:col-span-7 flex flex-col gap-stack-md">
        <div className="bg-surface-container border-2 border-primary industrial-shadow">
          <div className="border-b-2 border-primary p-stack-md bg-surface flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Icon name="badge" className="text-[20px]" />
              <h2 className="font-headline-md text-[20px] font-bold uppercase tracking-tight">Profile Settings</h2>
            </div>
            <span className="font-mono-label text-[11px] text-on-surface-variant uppercase tracking-wider">
              {user?.email}
            </span>
          </div>
          <form className="p-stack-md space-y-4" onSubmit={save}>
            <FormError message={error} />
            <FormSuccess message={success} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
              <Field label="Full Name">
                <input className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </Field>
              <Field label="Phone">
                <input className={inputCls} value={phone ?? ''} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-stack-md pt-2">
              <Field label="Role" hint="Managed by Admin">
                <div className="bg-surface-dim border-2 border-primary p-2 font-mono-label text-[13px] font-bold text-primary flex items-center justify-between">
                  <span>{user ? ROLE_LABEL[user.role] : '—'}</span>
                  <Icon name="lock" className="text-[16px]" />
                </div>
              </Field>
              <Field label="Department" hint="Managed by Admin">
                <div className="bg-surface-dim border-2 border-primary p-2 font-body-md text-[13px] text-on-surface">
                  {user?.department ?? '—'}
                </div>
              </Field>
              <Field label="Organization">
                <div className="bg-surface-dim border-2 border-primary p-2 font-body-md text-[13px] text-on-surface">
                  RepairDesk
                </div>
              </Field>
            </div>
            <div className="pt-4 flex items-center justify-between border-t-2 border-primary">
              <span className="font-mono-label text-[11px] text-on-surface-variant">
                Account active since {new Date(user?.created_at ?? Date.now()).toLocaleDateString()}
              </span>
              <NeoButton type="submit" disabled={busy}>
                <Icon name="save" className="text-[18px]" /> {busy ? 'Saving…' : 'Save Changes'}
              </NeoButton>
            </div>
          </form>
        </div>
      </div>

      <div className="md:col-span-5 flex flex-col gap-stack-md">
        <div className="bg-surface border-2 border-primary industrial-shadow">
          <div className="border-b-2 border-primary p-stack-md bg-surface-container-high flex justify-between items-center">
            <h3 className="font-label-caps text-label-caps uppercase font-bold flex items-center gap-2">
              <Icon name="security" className="text-[18px]" /> Account & Access
            </h3>
          </div>
          <div className="p-stack-md space-y-3">
            <div className="flex justify-between items-center text-[13px] border-b border-outline pb-2">
              <span className="font-label-caps text-[12px] uppercase text-on-surface-variant">Current Session</span>
              <span className="font-mono-label text-[12px] font-bold text-primary flex items-center gap-1.5">
                <span className="w-2 h-2 bg-secondary-container inline-block" /> {user?.email.split('@')[1] ?? '—'}
              </span>
            </div>
            <div className="flex justify-between items-center text-[13px] border-b border-outline pb-2">
              <span className="font-label-caps text-[12px] uppercase text-on-surface-variant">Role</span>
              <span className="bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 border border-primary font-label-caps text-[10px] uppercase font-bold">
                {user ? ROLE_LABEL[user.role] : '—'}
              </span>
            </div>
            <div className="flex justify-between items-start text-[13px] pb-1">
              <span className="font-label-caps text-[12px] uppercase text-on-surface-variant">Application ID</span>
              <span className="font-mono-label text-[11px] text-on-surface">{user?.id.slice(0, 8).toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------- Users & Roles (Admin only) ----------------

function UsersTab({ usersQ }: { usersQ: { data: User[] | null; loading: boolean; error: string | null; refresh: () => void } }) {
  const [editing, setEditing] = useState<string | null>(null)
  const [editRole, setEditRole] = useState<AppRole>('EMPLOYEE')
  const [editDept, setEditDept] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function saveUser(u: User) {
    setBusy(true)
    setError(null)
    setSuccess(null)
    try {
      await adminUpdateUser({ user_id: u.id, role: editRole, department: editDept || null, is_active: u.is_active })
      setEditing(null)
      setSuccess(`Updated ${u.full_name}.`)
      usersQ.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user')
    } finally {
      setBusy(false)
    }
  }

  const users = usersQ.data ?? []

  return (
    <section className="mb-stack-lg bg-surface border-2 border-primary industrial-shadow">
      <div className="border-b-2 border-primary p-stack-md bg-tertiary-fixed text-on-tertiary-fixed flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Icon name="group" className="text-[22px]" />
          <h2 className="font-headline-md text-[20px] font-bold uppercase tracking-tight">
            User Directory & Roles ({users.length} Users)
          </h2>
        </div>
      </div>
      <FormError message={error} />
      <FormSuccess message={success} />
      <div className="overflow-x-auto">
        {usersQ.loading ? (
          <div className="p-stack-md">
            <LoadingState rows={3} />
          </div>
        ) : usersQ.error ? (
          <div className="p-stack-md">
            <ErrorState message={usersQ.error} onRetry={usersQ.refresh} />
          </div>
        ) : users.length === 0 ? (
          <div className="p-stack-md">
            <EmptyState icon="group" title="No users found" />
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-primary font-label-caps text-[12px] uppercase text-on-surface-variant bg-surface-container-highest">
                <th className="p-stack-sm border-r-2 border-primary">User Name</th>
                <th className="p-stack-sm border-r-2 border-primary">Email</th>
                <th className="p-stack-sm border-r-2 border-primary">Assigned Role</th>
                <th className="p-stack-sm border-r-2 border-primary">Status</th>
                <th className="p-stack-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-body-md text-[13px]">
              {users.map((u) => (
                <tr key={u.id} className="border-b border-primary hover:bg-surface-container-highest transition-colors">
                  <td className="p-stack-sm border-r border-primary font-bold flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container font-label-caps text-[10px] flex items-center justify-center font-bold border border-primary">
                      {initials(u.full_name)}
                    </span>
                    {u.full_name}
                  </td>
                  <td className="p-stack-sm border-r border-primary font-mono-label text-mono-label">{u.email}</td>
                  <td className="p-stack-sm border-r border-primary font-mono-label font-bold text-primary">
                    {ROLE_LABEL[u.role].toUpperCase()}
                  </td>
                  <td className="p-stack-sm border-r border-primary">
                    <span className="bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 border border-primary font-label-caps text-[10px] uppercase font-bold">
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-stack-sm text-right space-x-2 font-label-caps text-[11px] uppercase">
                    {editing === u.id ? (
                      <>
                        <select
                          className="border-2 border-primary bg-surface px-1 py-0.5 font-mono-label text-[11px] font-bold"
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as AppRole)}
                        >
                          {(['ADMIN', 'MANAGER', 'TECHNICIAN', 'EMPLOYEE'] as AppRole[]).map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                        <input
                          className="border-2 border-primary bg-surface px-1 py-0.5 font-mono-label text-[11px] w-24"
                          placeholder="Dept"
                          value={editDept}
                          onChange={(e) => setEditDept(e.target.value)}
                        />
                        <button
                          className="px-2 py-1 bg-primary text-surface border border-primary hover:bg-secondary transition-colors font-bold"
                          disabled={busy}
                          onClick={() => void saveUser(u)}
                        >
                          Save
                        </button>
                        <button
                          className="px-2 py-1 bg-surface border border-primary hover:bg-surface-container-highest transition-colors"
                          onClick={() => setEditing(null)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        className="px-2 py-1 bg-surface border border-primary hover:bg-primary hover:text-surface transition-colors font-bold"
                        onClick={() => {
                          setEditing(u.id)
                          setEditRole(u.role)
                          setEditDept(u.department ?? '')
                        }}
                      >
                        Edit Role
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}

// ---------------- Notification preferences (UI prefs persisted client-side for MVP) ----------------

function NotificationsPrefsTab() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem('rd_notif_prefs') ?? '{}')
    } catch {
      return {}
    }
  })

  const items = [
    { key: 'repair_status', title: 'Repair Status Updates', desc: 'Real-time alerts when repair milestones advance' },
    { key: 'assignment', title: 'Technician Assignment', desc: 'Notice when a technician claims your open ticket' },
    { key: 'resolved', title: 'Repair Resolved', desc: 'Immediate ping when hardware is ready' },
    { key: 'warranty', title: 'Warranty Warnings', desc: 'Alerts before warranty expiration' },
    { key: 'system', title: 'System Notices', desc: 'Maintenance and operational broadcasts' },
  ]

  function toggle(key: string) {
    const next = { ...prefs, [key]: !(prefs[key] ?? true) }
    setPrefs(next)
    localStorage.setItem('rd_notif_prefs', JSON.stringify(next))
  }

  return (
    <div className="bg-surface-container-low border-2 border-primary industrial-shadow max-w-2xl">
      <div className="p-4 border-b-2 border-primary bg-primary text-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Icon name="tune" className="text-[20px]" />
          <h2 className="font-headline-md text-lg font-bold uppercase tracking-tight">NOTIFICATION PREFERENCES</h2>
        </div>
        <span className="font-mono-label text-xs uppercase tracking-wider text-warm-cream">DISPATCH RULES</span>
      </div>
      <div className="p-5 space-y-4">
        <p className="font-mono-label text-xs text-on-surface-variant">Control alerts delivered to your dashboard.</p>
        <div className="space-y-3">
          {items.map((it) => {
            const on = prefs[it.key] ?? true
            return (
              <div key={it.key} className="p-3 bg-white border-2 border-primary flex items-center justify-between">
                <div>
                  <div className="font-label-caps text-xs uppercase font-bold text-primary">{it.title}</div>
                  <div className="font-mono-label text-[11px] text-on-surface-variant">{it.desc}</div>
                </div>
                <button
                  className={`px-3 py-1 font-label-caps text-xs uppercase font-black border-2 border-primary shadow-[2px_2px_0px_0px_rgba(29,28,22,1)] cursor-pointer ${
                    on ? 'bg-electric-yellow text-black' : 'bg-surface-container-highest text-on-surface-variant'
                  }`}
                  onClick={() => toggle(it.key)}
                >
                  [ {on ? 'ON' : 'OFF'} ]
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ---------------- Security ----------------

function SecurityTab({
  onChangePassword,
  onSignOut,
}: {
  onChangePassword: (pw: string) => Promise<void>
  onSignOut: () => void
}) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (next.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }
    if (next !== confirm) {
      setError('New passwords do not match.')
      return
    }
    setBusy(true)
    try {
      await onChangePassword(next)
      setSuccess('Password updated successfully.')
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start max-w-4xl">
      <div className="bg-surface-container-low border-2 border-primary industrial-shadow">
        <div className="p-4 border-b-2 border-primary bg-primary text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Icon name="security" className="text-[20px]" />
            <h2 className="font-headline-md text-lg font-bold uppercase tracking-tight">SECURITY</h2>
          </div>
          <span className="font-mono-label text-xs uppercase tracking-wider text-warm-cream">CREDENTIALS</span>
        </div>
        <form className="p-5 space-y-4" onSubmit={submit}>
          <FormError message={error} />
          <FormSuccess message={success} />
          <Field label="Current Password">
            <input className={`${inputCls} bg-white`} type="password" placeholder="••••••••••••" value={current} onChange={(e) => setCurrent(e.target.value)} />
          </Field>
          <Field label="New Password">
            <input className={`${inputCls} bg-white`} type="password" placeholder="Minimum 8 characters" value={next} onChange={(e) => setNext(e.target.value)} required />
          </Field>
          <Field label="Confirm New Password">
            <input className={`${inputCls} bg-white`} type="password" placeholder="Re-enter new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </Field>
          <div>
            <button
              className="px-5 py-2.5 bg-black text-white font-label-caps text-xs uppercase font-bold border-2 border-primary industrial-shadow hover:bg-surface-container-highest hover:text-black transition-all cursor-pointer flex items-center gap-2"
              type="submit"
              disabled={busy}
            >
              <Icon name="key" className="text-[16px]" /> [ {busy ? 'UPDATING…' : 'UPDATE PASSWORD'} ]
            </button>
          </div>
        </form>
      </div>

      <div className="bg-surface-container-low border-2 border-primary industrial-shadow border-l-[8px] border-l-signal-orange">
        <div className="p-4 border-b-2 border-primary bg-[#1A1A1A] text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-signal-orange text-black font-label-caps text-[11px] font-extrabold uppercase border border-black">
              SESSION MANAGEMENT
            </span>
          </div>
          <span className="font-mono-label text-[11px] text-[#ff8a65] font-bold uppercase">ACCOUNT</span>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="font-label-caps text-xs uppercase font-bold text-primary">Sign out of this device</div>
              <p className="font-mono-label text-xs text-on-surface-variant">End your current RepairDesk session.</p>
            </div>
            <button
              className="px-4 py-2.5 bg-signal-orange text-black font-label-caps text-xs uppercase font-bold border-2 border-primary industrial-shadow hover:bg-warm-cream transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
              onClick={onSignOut}
            >
              <Icon name="logout" className="text-[16px]" /> [ SIGN OUT ]
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
