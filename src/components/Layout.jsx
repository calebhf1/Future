import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ArrowLeftRight, PiggyBank, Tags, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { signOut } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/savings', label: 'Savings Goals', icon: PiggyBank },
  { to: '/categories', label: 'Categories', icon: Tags },
]

export default function Layout() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-7 border-b" style={{ borderColor: 'var(--stone-200)' }}>
        <div className="font-display text-2xl" style={{ color: 'var(--stone-800)' }}>Future</div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--stone-400)' }}>Family Budget</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive ? 'active-nav' : 'inactive-nav'
              }`
            }
            style={({ isActive }) => ({
              background: isActive ? 'var(--stone-800)' : 'transparent',
              color: isActive ? 'var(--cream)' : 'var(--stone-600)',
            })}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t" style={{ borderColor: 'var(--stone-200)' }}>
        <div className="px-4 py-2 mb-2">
          <div className="text-xs" style={{ color: 'var(--stone-400)' }}>Signed in as</div>
          <div className="text-sm font-medium truncate" style={{ color: 'var(--stone-600)' }}>{user?.email}</div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all"
          style={{ color: 'var(--stone-600)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--stone-100)'; e.currentTarget.style.color = 'var(--rust)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--stone-600)' }}
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--cream)' }}>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 border-r" style={{ background: 'var(--warm-white)', borderColor: 'var(--stone-200)' }}>
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-4 border-b" style={{ background: 'var(--warm-white)', borderColor: 'var(--stone-200)' }}>
        <div className="font-display text-xl" style={{ color: 'var(--stone-800)' }}>Future</div>
        <button onClick={() => setMobileOpen(!mobileOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stone-600)' }}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30" onClick={() => setMobileOpen(false)} style={{ background: 'rgba(0,0,0,0.3)' }}>
          <aside className="w-72 h-full border-r" style={{ background: 'var(--warm-white)', borderColor: 'var(--stone-200)' }} onClick={e => e.stopPropagation()}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto lg:pt-0 pt-16">
        <Outlet />
      </main>
    </div>
  )
}
