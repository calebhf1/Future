import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Pencil, X } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.jsx'
import { getCategories, upsertCategory, deleteCategory } from '../lib/supabase'

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const CATEGORY_ICONS = ['🛒', '🍔', '🏠', '🚗', '💊', '👕', '🎬', '✈️', '📱', '⚡', '💧', '🐾', '👶', '🎓', '💪', '☕', '🎁', '🔧', '💅', '🎮', '🚲', '☕', '🍽️', '🍝', '🧋', '🧘‍♀️']
const CATEGORY_COLORS = [
  '#2D5016', '#C4511A', '#B8860B', '#6B8F6B', '#3D2E25',
  '#8B4513', '#4A7C28', '#D2691E', '#556B2F', '#8B6914',
  '#5F9EA0', '#CD853F', '#2E8B57', '#A0522D', '#6B8E23',
]

const DEFAULT_CATEGORIES = [
  { name: 'Groceries', icon: '🛒', color: '#2D5016', budget_amount: 600 },
  { name: 'Dining Out', icon: '🍔', color: '#C4511A', budget_amount: 200 },
  { name: 'Housing', icon: '🏠', color: '#3D2E25', budget_amount: 2000 },
  { name: 'Transportation', icon: '🚗', color: '#B8860B', budget_amount: 400 },
  { name: 'Healthcare', icon: '💊', color: '#6B8F6B', budget_amount: 150 },
  { name: 'Entertainment', icon: '🎬', color: '#4A7C28', budget_amount: 100 },
  { name: 'Utilities', icon: '⚡', color: '#8B4513', budget_amount: 200 },
  { name: 'Clothing', icon: '👕', color: '#556B2F', budget_amount: 100 },
]

export default function CategoriesPage() {
  const { user } = useAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', icon: '🛒', color: '#2D5016', budget_amount: '' })
  const [seedLoading, setSeedLoading] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await getCategories(user.id)
    setCategories(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const openNew = () => {
    setEditing(null)
    setForm({ name: '', icon: '🛒', color: '#2D5016', budget_amount: '' })
    setShowModal(true)
  }

  const openEdit = (c) => {
    setEditing(c)
    setForm({ name: c.name, icon: c.icon || '🛒', color: c.color || '#2D5016', budget_amount: c.budget_amount || '' })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    await upsertCategory({
      ...(editing ? { id: editing.id } : {}),
      name: form.name,
      icon: form.icon,
      color: form.color,
      budget_amount: form.budget_amount ? parseFloat(form.budget_amount) : null,
      user_id: user.id,
    })
    setShowModal(false)
    await load()
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this category? Transactions using it will become uncategorized.')) return
    await deleteCategory(id)
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  const handleSeedDefaults = async () => {
    setSeedLoading(true)
    for (const cat of DEFAULT_CATEGORIES) {
      await upsertCategory({ ...cat, user_id: user.id })
    }
    await load()
    setSeedLoading(false)
  }

  const inputClass = "w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
  const inputStyle = { background: 'var(--cream)', border: '1.5px solid var(--stone-200)', color: 'var(--stone-800)', fontFamily: 'inherit' }

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 fade-up">
        <div>
          <h1 className="font-display text-3xl lg:text-4xl" style={{ color: 'var(--stone-800)' }}>Categories</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--stone-400)' }}>Organize spending with budgets per category</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: 'var(--stone-800)', color: 'var(--cream)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          <Plus size={14} /> New Category
        </button>
      </div>

      {/* Seed defaults prompt */}
      {!loading && categories.length === 0 && (
        <div className="p-6 rounded-2xl border mb-6 text-center fade-up-2" style={{ background: 'var(--stone-100)', borderColor: 'var(--stone-200)', borderStyle: 'dashed' }}>
          <div className="text-3xl mb-3">📂</div>
          <div className="font-medium mb-1" style={{ color: 'var(--stone-800)' }}>No categories yet</div>
          <div className="text-sm mb-4" style={{ color: 'var(--stone-400)' }}>Start from scratch or load common household categories</div>
          <button onClick={handleSeedDefaults} disabled={seedLoading}
            className="px-5 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: 'var(--stone-800)', color: 'var(--cream)', border: 'none', cursor: seedLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {seedLoading ? 'Loading…' : 'Load default categories'}
          </button>
        </div>
      )}

      {/* Categories list */}
      {loading ? (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--stone-400)' }}>Loading…</div>
      ) : categories.length > 0 && (
        <div className="rounded-2xl border overflow-hidden fade-up-3" style={{ background: 'var(--warm-white)', borderColor: 'var(--stone-200)' }}>
          {categories.map((c, i) => (
            <div key={c.id} className="flex items-center justify-between px-5 py-4 border-b last:border-0 group" style={{ borderColor: 'var(--stone-100)' }}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: c.color + '22' }}>
                  {c.icon || '📦'}
                </div>
                <div>
                  <div className="font-medium text-sm" style={{ color: 'var(--stone-800)' }}>{c.name}</div>
                  {c.budget_amount ? (
                    <div className="text-xs" style={{ color: 'var(--stone-400)' }}>Budget: {fmt(c.budget_amount)}/mo</div>
                  ) : (
                    <div className="text-xs" style={{ color: 'var(--stone-400)' }}>No budget set</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(c)} className="p-2 rounded-lg text-xs" style={{ background: 'var(--stone-100)', border: 'none', cursor: 'pointer', color: 'var(--stone-600)' }}>
                  <Pencil size={13} />
                </button>
                <button onClick={() => handleDelete(c.id)} className="p-2 rounded-lg" style={{ background: 'var(--rust-light)', border: 'none', cursor: 'pointer', color: 'var(--rust)' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Total budgeted */}
      {categories.some(c => c.budget_amount) && (
        <div className="mt-4 flex justify-end fade-up-4">
          <div className="text-sm" style={{ color: 'var(--stone-600)' }}>
            Total budgeted: <span className="font-mono font-medium" style={{ color: 'var(--stone-800)' }}>
              {fmt(categories.reduce((s, c) => s + Number(c.budget_amount || 0), 0))}/mo
            </span>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md rounded-2xl p-6 fade-up" style={{ background: 'var(--warm-white)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl" style={{ color: 'var(--stone-800)' }}>{editing ? 'Edit Category' : 'New Category'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stone-400)' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Icon */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--stone-600)' }}>Icon</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_ICONS.map(emoji => (
                    <button key={emoji} type="button" onClick={() => setForm(f => ({...f, icon: emoji}))}
                      className="w-9 h-9 rounded-lg text-lg transition-all"
                      style={{ background: form.icon === emoji ? 'var(--stone-800)' : 'var(--stone-100)', border: 'none', cursor: 'pointer' }}>
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              {/* Color */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--stone-600)' }}>Color</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_COLORS.map(color => (
                    <button key={color} type="button" onClick={() => setForm(f => ({...f, color}))}
                      className="w-7 h-7 rounded-full transition-all"
                      style={{ background: color, border: form.color === color ? '3px solid var(--stone-800)' : '3px solid transparent', cursor: 'pointer' }} />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--stone-600)' }}>Category Name</label>
                <input className={inputClass} style={inputStyle} placeholder="e.g. Groceries" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--stone-600)' }}>Monthly Budget ($) — optional</label>
                <input className={inputClass} style={inputStyle} type="number" step="1" min="0" placeholder="e.g. 500" value={form.budget_amount} onChange={e => setForm(f => ({...f, budget_amount: e.target.value}))} />
              </div>
              <button type="submit" disabled={saving} className="w-full py-3 rounded-xl text-sm font-medium"
                style={{ background: 'var(--stone-800)', color: 'var(--cream)', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : editing ? 'Update' : 'Create Category'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
