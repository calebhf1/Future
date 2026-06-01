import { useState } from 'react'
import { signIn, signUp } from '../lib/supabase'

export default function AuthPage() {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (mode === 'signin') {
      const { error } = await signIn(email, password)
      if (error) setError(error.message)
    } else {
      const { error } = await signUp(email, password)
      if (error) setError(error.message)
      else setMessage('Check your email for a confirmation link!')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--cream)' }}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16" style={{ background: 'var(--stone-800)' }}>
        <div>
          <div className="font-display text-4xl text-white mb-2">Future</div>
          <div style={{ color: 'var(--stone-400)', fontSize: '0.9rem' }}>Your family's financial home</div>
        </div>
        <div>
          <blockquote className="font-display text-2xl text-white leading-relaxed mb-6">
            "Beware of small expenses; a small leak will sink a great ship."
          </blockquote>
          <cite style={{ color: 'var(--stone-400)', fontSize: '0.85rem' }}>— Ben Franklin</cite>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Budget Categories', desc: 'Organize your spending' },
            { label: 'Transactions', desc: 'Track every dollar' },
            { label: 'Savings Goals', desc: 'Build your future' },
            { label: 'Income Tracking', desc: 'Know what comes in' },
          ].map(f => (
            <div key={f.label} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="text-white text-sm font-medium mb-1">{f.label}</div>
              <div style={{ color: 'var(--stone-400)', fontSize: '0.8rem' }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm fade-up">
          <div className="lg:hidden font-display text-3xl mb-8" style={{ color: 'var(--stone-800)' }}>Future</div>
          
          <h1 className="font-display text-3xl mb-2" style={{ color: 'var(--stone-800)' }}>
            {mode === 'signin' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--stone-600)' }}>
            {mode === 'signin'
              ? 'Sign in to manage your family budget'
              : 'Set up your shared family budget'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--stone-600)' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: 'var(--warm-white)',
                  border: '1.5px solid var(--stone-200)',
                  color: 'var(--stone-800)',
                  fontFamily: 'inherit'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--forest)'}
                onBlur={e => e.target.style.borderColor = 'var(--stone-200)'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--stone-600)' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: 'var(--warm-white)',
                  border: '1.5px solid var(--stone-200)',
                  color: 'var(--stone-800)',
                  fontFamily: 'inherit'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--forest)'}
                onBlur={e => e.target.style.borderColor = 'var(--stone-200)'}
              />
            </div>

            {error && (
              <div className="text-sm px-4 py-3 rounded-xl" style={{ background: 'var(--rust-light)', color: 'var(--rust)' }}>
                {error}
              </div>
            )}
            {message && (
              <div className="text-sm px-4 py-3 rounded-xl" style={{ background: 'var(--forest-muted)', color: 'var(--forest)' }}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-medium transition-all"
              style={{
                background: loading ? 'var(--stone-400)' : 'var(--stone-800)',
                color: 'var(--cream)',
                cursor: loading ? 'not-allowed' : 'pointer',
                border: 'none',
                fontFamily: 'inherit'
              }}
            >
              {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="text-sm text-center mt-6" style={{ color: 'var(--stone-600)' }}>
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); setMessage(null) }}
              className="font-medium underline underline-offset-2"
              style={{ color: 'var(--forest)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>

          <p className="text-xs text-center mt-8" style={{ color: 'var(--stone-400)' }}>
            Share your login with your spouse for shared access, or each create your own account using the same household.
          </p>
        </div>
      </div>
    </div>
  )
}
