import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Sidebar } from '@/components/layout/Sidebar'
import { registerNativeWebmcpTools } from '@/mcp/registerTools'
import LandingPage from '@/pages/public/LandingPage'
import AuthPage from '@/pages/auth/AuthPage'
import AdminDashboard from '@/pages/admin/Dashboard'
import AdminAssets from '@/pages/admin/Assets'
import AdminRepairHistory from '@/pages/admin/RepairHistory'
import NotificationsPage from '@/pages/shared/Notifications'
import SettingsPage from '@/pages/shared/Settings'
import TechnicianDashboard from '@/pages/technician/Dashboard'
import TechnicianMyRepairs from '@/pages/technician/MyRepairs'
import TechnicianAssets from '@/pages/technician/Assets'
import TechnicianRepairHistory from '@/pages/technician/RepairHistory'
import EmployeeDashboard from '@/pages/employee/Dashboard'
import EmployeeMyIssues from '@/pages/employee/MyIssues'
import EmployeeMyAssets from '@/pages/employee/MyAssets'
import RepairDetailPage from '@/pages/shared/RepairDetail'
import AssetDetailPage from '@/pages/shared/AssetDetail'
import type { AppRole } from '@/types'

/** Splash shown while auth/session is resolving. */
function BootScreen() {
  return (
    <div className="min-h-screen bg-surface grid-pattern flex items-center justify-center">
      <div className="bg-surface border-2 border-primary industrial-shadow px-8 py-6 flex items-center gap-3">
        <span className="material-symbols-outlined text-[32px] text-primary animate-pulse">precision_manufacturing</span>
        <div className="font-headline-md text-[24px] font-black tracking-tighter uppercase text-primary">
          RepairDesk
        </div>
      </div>
    </div>
  )
}

/** Route guard: requires session + profile; restricts by allowed roles. */
function RequireAuth({ roles, children }: { roles?: AppRole[]; children: React.ReactNode }) {
  const { initializing, session, user } = useAuth()

  if (initializing) return <BootScreen />
  if (!session) return <Navigate to="/auth" replace />
  if (!user) {
    // Authenticated in Supabase but no application profile — treat as unauthorized
    return (
      <div className="min-h-screen bg-surface grid-pattern flex items-center justify-center p-6">
        <div className="bg-surface border-2 border-primary industrial-shadow p-stack-lg max-w-md">
          <h1 className="font-headline-md text-headline-md font-bold uppercase mb-2">No Application Profile</h1>
          <p className="font-body-md text-on-surface-variant mb-4">
            Your account is authenticated but has not been added to a RepairDesk organization yet. Ask an
            administrator to onboard your account.
          </p>
        </div>
      </div>
    )
  }
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

/** Redirect signed-in users away from public pages. */
function PublicOnly({ children }: { children: React.ReactNode }) {
  const { initializing, session } = useAuth()
  if (initializing) return <BootScreen />
  if (session) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth()
  return (
    <div className="min-h-screen bg-surface text-on-surface font-body-md grid-pattern">
      {user && <Sidebar role={user.role} onSignOut={() => void signOut()} />}
      <main className="md:ml-64 py-stack-lg px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto min-h-screen">
        {children}
      </main>
    </div>
  )
}

export default function App() {
  const { user } = useAuth()
  const role = user?.role

  // Native WebMCP registration: expose the existing tool layer through the
  // browser's document.modelContext API once the user is authenticated.
  // Handlers resolve the live Supabase session per execution, so logout,
  // session refresh, and role changes are enforced at execute time.
  useEffect(() => {
    if (!user) return
    void registerNativeWebmcpTools()
  }, [user])

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/"
        element={
          <PublicOnly>
            <LandingPage />
          </PublicOnly>
        }
      />
      <Route
        path="/auth"
        element={
          <PublicOnly>
            <AuthPage />
          </PublicOnly>
        }
      />

      {/* Shared authenticated */}
      <Route path="/dashboard" element={<RequireAuth>{<AppShell>{role === 'TECHNICIAN' ? <TechnicianDashboard /> : role === 'EMPLOYEE' ? <EmployeeDashboard /> : <AdminDashboard />}</AppShell>}</RequireAuth>} />
      <Route path="/notifications" element={<RequireAuth><AppShell><NotificationsPage /></AppShell></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth><AppShell><SettingsPage /></AppShell></RequireAuth>} />
      <Route path="/repairs/:id" element={<RequireAuth><AppShell><RepairDetailPage /></AppShell></RequireAuth>} />

      {/* Admin / Manager */}
      <Route path="/assets" element={<RequireAuth roles={['ADMIN', 'MANAGER']}><AppShell><AdminAssets /></AppShell></RequireAuth>} />
      <Route path="/repair-history" element={<RequireAuth roles={['ADMIN', 'MANAGER', 'TECHNICIAN']}><AppShell>{role === 'TECHNICIAN' ? <TechnicianRepairHistory /> : <AdminRepairHistory />}</AppShell></RequireAuth>} />

      {/* Technician */}
      <Route path="/my-repairs" element={<RequireAuth roles={['TECHNICIAN']}><AppShell><TechnicianMyRepairs /></AppShell></RequireAuth>} />
      <Route path="/tech-assets" element={<RequireAuth roles={['TECHNICIAN']}><AppShell><TechnicianAssets /></AppShell></RequireAuth>} />

      {/* Employee */}
      <Route path="/my-issues" element={<RequireAuth roles={['EMPLOYEE']}><AppShell><EmployeeMyIssues /></AppShell></RequireAuth>} />
      <Route path="/my-assets" element={<RequireAuth roles={['EMPLOYEE']}><AppShell><EmployeeMyAssets /></AppShell></RequireAuth>} />

      {/* Asset detail: role-aware content */}
      <Route path="/assets/:id" element={<RequireAuth><AppShell><AssetDetailPage /></AppShell></RequireAuth>} />

      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/'} replace />} />
    </Routes>
  )
}
