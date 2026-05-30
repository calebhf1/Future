import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Pencil, X, Target } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.jsx'
import { getSavingsGoals, upsertSavingsGoal, deleteSavingsGoal } from '../lib/supabase'

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const GOAL_EMOJIS = ['🏠', '✈️', '🚗', '📚', '💍', '🎓', '🏖️', '🛋️', '💻', '🎉', '🏥', '🐣', '🌟', '💰', '🎁']

export default function SavingsPage() {
  const { user } = useAuth()
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', target_amount: '', current_amount: '', icon: '🏠', notes: '', target_date: '' })

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await getSavingsGoals(user.id)
    setGoals(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const openNew = () => {
    setEditing(null)
    setForm({ name: '', target_amount: '', current_amount: '0', icon: '🏠', notes: '', target_date: '' })
    setShowModal(true)
  }

  const openEdit = (g) => {
    setEditing(g)
    setForm({ name: g.name, target_amount: g.target_amount, current_amount: g.current_amount, icon: g.icon || '🏠', notes: g.notes || '', target_date: g.target_date || '' })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    await upsertSavingsGoal({
      ...(editing ? { id: editing.id } : {}),
      name: form.name,
      target_amount: parseFloat(form.target_amount),
      current_amount: parseFloat(form.current_amount || 0),
      icon: form.icon,
      notes: form.notes,
      target_date: form.target_date || null,
      user_id: user.id,
    })
    setShowModal(false)
    await load()
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this savings goal?')) return
    await deleteSavingsGoal(id)
    setGoals(prev => prev.filter(g => g.id !== id))
  }

  const totalTarget = goals.reduce((s, g) => s + Number(g.target_amount), 0)
  const totalSaved = goals.reduce((s, g) => s + Number(g.current_amount), 0)
  const overallPct = totalTarget > 0 ? Math.round(totalSaved / totalTarget * 100) : 0

  const inputClass = "w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
  const inputStyle = { background: 'var(--cream)', border: '1.5px solid var(--stone-200)', color: 'var(--stone-800)', fontFamily: 'inherit' }

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 fade-up">
        <div>
          <h1 className="font-display text-3xl lg:text-4xl" style={{ color: 'var(--stone-800)' }}>Savings Goals</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--stone-400)' }}>Build toward your dreams together</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: 'var(--stone-800)', color: 'var(--cream)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          <Plus size={14} /> New Goal
        </button>
      </div>

      {/* Overall progress */}
      {goals.length > 0 && (
        <div className="p-6 rounded-2xl border mb-6 fade-up-2" style={{ background: 'var(--gold-light)', borderColor: '#e8d080' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-display text-lg" style={{ color: 'var(--stone-800)' }}>Overall Progress</div>
              <div className="text-sm" style={{ color: 'var(--stone-600)' }}>{goals.length} goal{goals.length !== 1 ? 's' : ''}</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-2xl font-medium" style={{ color: 'var(--gold)' }}>{fmt(totalSaved)}</div>
              <div className="text-xs" style={{ color: 'var(--stone-600)' }}>of {fmt(totalTarget)} · {overallPct}%</div>
            </div>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${overallPct}%`, background: 'var(--gold)' }} />
          </div>
        </div>
      )}

      {/* Goals grid */}
      {loading ? (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--stone-400)' }}>Loading…</div>
      ) : goals.length === 0 ? (
        <div className="text-center py-20 fade-up-3">
          <div className="text-5xl mb-4">🎯</div>
          <div className="font-display text-xl mb-2" style={{ color: 'var(--stone-800)' }}>No savings goals yet</div>
          <div className="text-sm mb-6" style={{ color: 'var(--stone-400)' }}>Set goals for vacations, a new car, emergency fund, and more</div>
          <button onClick={openNew} className="px-6 py-3 rounded-xl text-sm font-medium"
            style={{ background: 'var(--stone-800)', color: 'var(--cream)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            Create your first goal
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4 fade-up-3">
          {goals.map(g => {
            const pct = Math.min(100, Math.round(Number(g.current_amount) / Number(g.target_amount) * 100))
            const remaining = Number(g.target_amount) - Number(g.current_amount)
            return (
              <div key={g.id} className="p-6 rounded-2xl border group" style={{ background: 'var(--warm-white)', borderColor: 'var(--stone-200)' }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: 'var(--stone-100)' }}>{g.icon || '🏠'}</div>
                    <div>
                      <div className="font-medium" style={{ color: 'var(--stone-800)' }}>{g.name}</div>
                      {g.target_date && <div className="text-xs" style={{ color: 'var(--stone-400)' }}>By {new Date(g.target_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(g)} className="p-1.5 rounded-lg" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stone-400)' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--stone-800)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--stone-400)'}
                    ><Pencil size={13} /></button>
                    <button onClick={() => handleDelete(g.id)} className="p-1.5 rounded-lg" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stone-400)' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--rust)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--stone-400)'}
                    ><Trash2 size={13} /></button>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex items-end justify-between mb-1.5">
                    <span className="font-mono text-xl font-medium" style={{ color: pct >= 100 ? 'var(--forest)' : 'var(--gold)' }}>{fmt(g.current_amount)}</span>
                    <span className="font-mono text-sm" style={{ color: 'var(--stone-400)' }}>{fmt(g.target_amount)}</span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--stone-100)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct >= 100 ? 'var(--forest)' : 'var(--gold)' }} />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: 'var(--stone-400)' }}>{pct}% complete</span>
                  {pct < 100 && <span style={{ color: 'var(--stone-600)' }}>{fmt(remaining)} to go</span>}
                  {pct >= 100 && <span style={{ color: 'var(--forest)' }}>🎉 Goal reached!</span>}
                </div>

                {g.notes && <p className="text-xs mt-3 pt-3 border-t" style={{ color: 'var(--stone-400)', borderColor: 'var(--stone-100)' }}>{g.notes}</p>}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md rounded-2xl p-6 fade-up" style={{ background: 'var(--warm-white)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl" style={{ color: 'var(--stone-800)' }}>{editing ? 'Edit Goal' : 'New Savings Goal'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stone-400)' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Emoji picker */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--stone-600)' }}>Icon</label>
                <div className="flex flex-wrap gap-2">
                  {GOAL_EMOJIS.map(emoji => (
                    <button key={emoji} type="button" onClick={() => setForm(f => ({...f, icon: emoji}))}
                      className="w-9 h-9 rounded-lg text-lg transition-all"
                      style={{ background: form.icon === emoji ? 'var(--stone-800)' : 'var(--stone-100)', border: 'none', cursor: 'pointer' }}>
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--stone-600)' }}>Goal Name</label>
                <input className={inputClass} style={inputStyle} placeholder="e.g. Hawaii Vacation" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--stone-600)' }}>Target ($)</label>
                  <input className={inputClass} style={inputStyle} type="number" step="1" min="0" placeholder="5000" value={form.target_amount} onChange={e => setForm(f => ({...f, target_amount: e.target.value}))} required />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--stone-600)' }}>Saved So Far ($)</label>
                  <input className={inputClass} style={inputStyle} type="number" step="1" min="0" placeholder="0" value={form.current_amount} onChange={e => setForm(f => ({...f, current_amount: e.target.value}))} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--stone-600)' }}>Target Date (optional)</label>
                <input className={inputClass} style={inputStyle} type="date" value={form.target_date} onChange={e => setForm(f => ({...f, target_date: e.target.value}))} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--stone-600)' }}>Notes (optional)</label>
                <input className={inputClass} style={inputStyle} placeholder="Why this goal matters…" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} />
              </div>
              <button type="submit" disabled={saving} className="w-full py-3 rounded-xl text-sm font-medium"
                style={{ background: 'var(--stone-800)', color: 'var(--cream)', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : editing ? 'Update Goal' : 'Create Goal'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
