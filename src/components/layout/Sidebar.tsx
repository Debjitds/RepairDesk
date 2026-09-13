import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Icon } from '@/components/ui/primitives'
import { initials } from '@/lib/format'
import { ROLE_LABEL, type AppRole } from '@/types'

export interface NavItem {
  to: string
  label: string
  icon: string
}

const NAV: Record<string, NavItem[]> = {
  ADMIN: [
    { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { to: '/assets', label: 'Assets', icon: 'precision_manufacturing' },
    { to: '/repair-history', label: 'Repair History', icon: 'history' },
    { to: '/notifications', label: 'Notifications', icon: 'notifications' },
    { to: '/settings', label: 'Settings', icon: 'settings' },
  ],
  MANAGER: [
    { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { to: '/assets', label: 'Assets', icon: 'precision_manufacturing' },
    { to: '/repair-history', label: 'Repair History', icon: 'history' },
    { to: '/notifications', label: 'Notifications', icon: 'notifications' },
    { to: '/settings', label: 'Settings', icon: 'settings' },
  ],
  TECHNICIAN: [
    { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { to: '/my-repairs', label: 'My Repairs', icon: 'build' },
    { to: '/tech-assets', label: 'Assets', icon: 'precision_manufacturing' },
    { to: '/repair-history', label: 'Repair History', icon: 'history' },
    { to: '/notifications', label: 'Notifications', icon: 'notifications' },
    { to: '/settings', label: 'Settings', icon: 'settings' },
  ],
  EMPLOYEE: [
    { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { to: '/my-issues', label: 'My Issues', icon: 'report_problem' },
    { to: '/my-assets', label: 'My Assets', icon: 'precision_manufacturing' },
    { to: '/notifications', label: 'Notifications', icon: 'notifications' },
    { to: '/settings', label: 'Settings', icon: 'settings' },
  ],
}

export function Sidebar({ role, onSignOut }: { role: AppRole; onSignOut: () => void }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const items = NAV[role] ?? NAV.EMPLOYEE

  useEffect(() => {
    // Close the mobile drawer on navigation
    setMobileOpen(false)
  }, [window.location.pathname])

  const navList = (
    <div className="flex flex-col gap-stack-sm font-label-caps text-label-caps">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/dashboard'}
          className={({ isActive }) =>
            isActive
              ? 'flex items-center gap-3 px-4 py-3 bg-tertiary text-surface border-2 border-primary industrial-shadow font-bold transition-colors duration-200'
              : 'flex items-center gap-3 px-4 py-3 text-on-surface hover:bg-surface-container-highest border-2 border-transparent hover:border-primary transition-all duration-200'
          }
        >
          <Icon name={item.icon} className="text-[20px]" />
          {item.label}
        </NavLink>
      ))}
    </div>
  )

  const footer = (
    <div className="flex items-center gap-3 p-4 border-t-2 border-primary bg-surface-container-low">
      <div className="w-10 h-10 rounded-full border-2 border-primary overflow-hidden bg-secondary-container flex items-center justify-center shrink-0">
        <span className="font-label-caps text-[12px] text-on-secondary-container font-bold">
          {user ? initials(user.full_name) : <Icon name="person" />}
        </span>
      </div>
      <div className="flex-grow min-w-0">
        <div className="font-bold text-primary text-[14px] leading-tight truncate">{user?.full_name ?? '—'}</div>
        <div className="text-on-surface-variant text-[12px] font-label-caps uppercase tracking-wider truncate">
          {user ? ROLE_LABEL[user.role] : ''}
        </div>
      </div>
      <button
        className="hover:text-secondary transition-colors"
        title="Sign out"
        aria-label="Sign out"
        onClick={() => onSignOut()}
      >
        <Icon name="logout" className="text-[20px]" />
      </button>
    </div>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-50 bg-surface border-b-2 border-primary flex items-center justify-between px-4 py-3">
        <div className="font-headline-md text-[20px] font-black tracking-tighter text-primary flex items-center gap-2">
          <Icon name="precision_manufacturing" className="text-[24px]" />
          RepairDesk
        </div>
        <button
          className="p-2 border-2 border-primary bg-surface industrial-shadow industrial-shadow-active"
          aria-label="Toggle navigation"
          onClick={() => setMobileOpen((o) => !o)}
        >
          <Icon name={mobileOpen ? 'close' : 'menu'} className="text-[22px] text-primary" />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-x-0 top-[58px] z-40 bg-surface border-b-2 border-primary p-stack-md flex flex-col gap-stack-md">
          {navList}
          <div className="border-t-2 border-primary pt-2">{footer}</div>
        </div>
      )}
      <div className="md:hidden h-[58px]" aria-hidden="true" />

      {/* Desktop sidebar — fixed 256px per Stitch/TRD */}
      <aside className="hidden md:flex bg-surface text-primary fixed top-0 left-0 h-screen w-64 z-50 border-r-[3px] border-tertiary flex-col justify-between min-h-screen">
        <div className="p-stack-md">
          <div
            className="font-headline-md text-[28px] font-black tracking-tighter text-primary mb-stack-lg flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/dashboard')}
          >
            <Icon name="precision_manufacturing" className="text-[32px]" />
            RepairDesk
          </div>
          {navList}
        </div>
        {footer}
      </aside>
    </>
  )
}
