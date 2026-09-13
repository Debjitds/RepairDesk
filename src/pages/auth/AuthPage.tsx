import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Icon, FormError } from '@/components/ui/primitives'
import { rpcErrorMessage } from '@/lib/permissions'

/**
 * Authentication page per Stitch `authpage.html`:
 * left visual/brand panel + right auth card with Log In / Sign Up tabs.
 */
export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email.trim() || !password) {
      setError('Please enter your email address and password.')
      return
    }
    if (mode === 'signup') {
      if (fullName.trim().length < 2) {
        setError('Please enter your full name.')
        return
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters.')
        return
      }
    }
    setBusy(true)
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password)
        navigate('/dashboard', { replace: true })
      } else {
        await signUp(email.trim(), password, fullName.trim())
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      setError(
        err instanceof Error && err.message.includes('Invalid login credentials')
          ? 'Invalid email or password. Please try again.'
          : rpcErrorMessage(err as { message?: string }),
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col md:flex-row antialiased">
      {/* Left Side: Visual / Brand Context */}
      <div className="relative w-full md:w-[55%] h-[40vh] md:h-screen bg-primary overflow-hidden flex flex-col justify-end">
        {/* CSS line-art texture in lieu of external image */}
        <div
          className="absolute inset-0 z-0 opacity-40"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, transparent 0 46px, rgba(245,240,230,0.06) 46px 48px), repeating-linear-gradient(-45deg, transparent 0 46px, rgba(245,240,230,0.05) 46px 48px), radial-gradient(rgba(211,240,0,0.08) 1.5px, transparent 1.5px)',
            backgroundSize: 'auto, auto, 24px 24px',
          }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/50 to-transparent z-[1]" aria-hidden="true" />
        <div className="relative z-10 p-margin-mobile md:p-margin-desktop mb-margin-mobile md:mb-margin-desktop">
          <div className="border-2 border-on-primary/20 backdrop-blur-sm p-stack-lg inline-block bg-primary/40">
            <h1 className="font-display-lg text-display-lg text-on-primary uppercase mb-stack-sm tracking-tighter">
              REPAIRDESK
            </h1>
            <p className="font-headline-md text-headline-md-mobile md:text-headline-md text-primary-fixed-dim">
              Repair operations, without the chaos.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side: Authentication Panel */}
      <div className="relative w-full md:w-[45%] min-h-[60vh] md:h-screen bg-inverse-on-surface flex flex-col justify-center items-center p-margin-mobile md:p-margin-desktop">
        <div className="absolute inset-0 micro-dot-bg opacity-50 z-0" aria-hidden="true" />
        <div className="relative z-10 w-full max-w-md">
          {/* Mobile Branding */}
          <div className="md:hidden flex items-center justify-center mb-stack-lg border-2 border-primary bg-background py-stack-sm px-stack-md hard-shadow inline-flex mx-auto">
            <Icon name="handyman" className="mr-2 font-bold" fill />
            <span className="font-label-caps text-label-caps text-primary tracking-tighter uppercase">REPAIRDESK</span>
          </div>

          {/* Back link */}
          <div className="mb-stack-sm flex items-center">
            <Link
              to="/"
              className="inline-flex items-center font-mono-label text-mono-label text-primary hover:text-secondary uppercase transition-colors group"
            >
              <Icon name="arrow_back" className="text-sm mr-2 transition-transform group-hover:-translate-x-1" />
              Back to landing page
            </Link>
          </div>

          {/* Auth Card */}
          <div className="bg-background border-2 border-primary hard-shadow flex flex-col">
            <div className="border-b-2 border-primary p-stack-md flex justify-between items-center bg-surface-container">
              <span className="font-mono-label text-mono-label text-on-surface-variant uppercase">System Access</span>
              <Icon name="lock" className="text-outline" fill />
            </div>

            <div className="p-stack-lg bg-surface-bright">
              {/* Tabs */}
              <div className="flex border-2 border-primary mb-stack-lg overflow-hidden bg-surface-variant">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`flex-1 py-stack-sm font-label-caps text-label-caps uppercase border-r-2 border-primary transition-colors ${
                    mode === 'login' ? 'bg-secondary-container text-on-primary' : 'text-on-surface hover:bg-surface-dim'
                  }`}
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className={`flex-1 py-stack-sm font-label-caps text-label-caps uppercase transition-colors ${
                    mode === 'signup'
                      ? 'bg-secondary-container text-on-primary'
                      : 'text-on-surface hover:bg-surface-dim'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              <div className="mb-stack-lg">
                <h2 className="font-headline-md text-headline-md text-primary mb-stack-sm">
                  {mode === 'login' ? 'Welcome back.' : 'Create your account.'}
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  {mode === 'login'
                    ? 'Manage your repair operations from one place.'
                    : 'Join your organization on RepairDesk.'}
                </p>
              </div>

              <form className="space-y-stack-md" onSubmit={handleSubmit}>
                {mode === 'signup' && (
                  <div className="flex flex-col">
                    <label htmlFor="full-name" className="font-label-caps text-label-caps text-primary mb-stack-sm uppercase">
                      Full Name
                    </label>
                    <div className="relative">
                      <input
                        id="full-name"
                        name="full-name"
                        className="w-full bg-surface-bright border-2 border-primary p-stack-sm font-body-md text-primary auth-input"
                        placeholder="Jordan Blake"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        autoComplete="name"
                      />
                      <Icon name="badge" className="absolute right-3 top-1/2 -translate-y-1/2 text-outline" />
                    </div>
                  </div>
                )}

                <div className="flex flex-col">
                  <label htmlFor="email" className="font-label-caps text-label-caps text-primary mb-stack-sm uppercase">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      name="email"
                      className="w-full bg-surface-bright border-2 border-primary p-stack-sm font-body-md text-primary auth-input"
                      placeholder="technician@repairdesk.io"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                    <Icon name="mail" className="absolute right-3 top-1/2 -translate-y-1/2 text-outline" />
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex justify-between items-baseline mb-stack-sm">
                    <label htmlFor="password" className="font-label-caps text-label-caps text-primary uppercase">
                      Password
                    </label>
                    {mode === 'login' && (
                      <span className="font-mono-label text-mono-label text-secondary hover:underline cursor-pointer">
                        Forgot?
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      className="w-full bg-surface-bright border-2 border-primary p-stack-sm font-body-md text-primary auth-input pr-12"
                      placeholder="••••••••"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      required
                    />
                    <button
                      aria-label="Toggle password visibility"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors focus:outline-none"
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      <Icon name={showPassword ? 'visibility_off' : 'visibility'} />
                    </button>
                  </div>
                </div>

                {mode === 'login' && (
                  <div className="flex items-center mt-stack-sm">
                    <input
                      id="remember-me"
                      name="remember-me"
                      className="h-4 w-4 rounded-none border-2 border-primary text-secondary-container focus:ring-primary focus:ring-offset-0 bg-surface-bright"
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    <label className="ml-2 block font-body-md text-body-md text-on-surface" htmlFor="remember-me">
                      Remember this device
                    </label>
                  </div>
                )}

                <FormError message={error} />

                <div className="mt-stack-lg space-y-stack-sm flex flex-col">
                  <button
                    className="w-full bg-secondary-container text-on-primary border-2 border-primary py-stack-sm font-label-caps text-label-caps uppercase hard-shadow flex items-center justify-center group disabled:opacity-50"
                    type="submit"
                    disabled={busy}
                  >
                    {busy ? 'Please wait…' : mode === 'login' ? 'Log In' : 'Sign Up'}
                    {!busy && (
                      <Icon name="arrow_forward" className="ml-2 group-hover:translate-x-1 transition-transform" />
                    )}
                  </button>

                  <div className="relative flex py-5 items-center">
                    <div className="flex-grow border-t-2 border-primary" />
                    <span className="flex-shrink-0 mx-4 text-on-surface-variant font-mono-label text-mono-label">OR</span>
                    <div className="flex-grow border-t-2 border-primary" />
                  </div>

                  <button
                    className="w-full bg-surface-bright text-primary border-2 border-primary py-stack-sm font-label-caps text-label-caps uppercase hard-shadow hover:bg-surface-variant transition-colors flex items-center justify-center"
                    type="button"
                    disabled
                    title="OAuth providers can be enabled by your administrator"
                  >
                    <svg className="w-5 h-5 mr-2 opacity-50" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                    </svg>
                    Continue with Google
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="mt-stack-md text-center">
            <p className="font-mono-label text-mono-label text-on-surface-variant">SECURE CONNECTION ESTABLISHED</p>
          </div>
        </div>
      </div>
    </div>
  )
}
