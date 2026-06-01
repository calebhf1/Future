import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { Plus, Trash2, Pencil, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.jsx'
import { getTransactions, addTransaction, updateTransaction, deleteTransaction, getCategories, getIncome, upsertIncome, deleteIncome } from '../lib/supabase'

const parseDate = (str) => {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const inputClass = "w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
const inputStyle = { background: 'var(--cream)', border: '1.5px solid var(--stone-200)', color: 'var(--stone-800)', fontFamily: 'inherit' }

const PAID_BY_OPTIONS = [
  { value: 'both', label: '👫 Both' },
  { value: 'caleb', label: '👤 Caleb' },
  { value: 'lily', label: '👤 Lily' },
]

const PaidByToggle = ({ value, onChange }) => (
  <div className="flex gap-2">
    {PAID_BY_OPTIONS.map(opt => (
      <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
        className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
        style={{
          border: '1.5px solid',
          borderColor: value === opt.value ? 'var(--stone-800)' : 'var(--stone-200)',
          background: value === opt.value ? 'var(--stone-800)' : 'transparent',
          color: value === opt.value ? 'var(--cream)' : 'var(--stone-500)',
          cursor: 'pointer', fontFamily: 'inherit'
        }}>
        {opt.label}
      </button>
    ))}
  </div>
)

const emptyForm = () => ({ description: '', amount: '', category_id: '', date: format(new Date(), 'yyyy-MM-dd'), notes: '', paid_by: 'both' })

export default function TransactionsPage() {
  const { user } = useAuth()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [transactions, setTransactions] = useState([])
  const [income, setIncome] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('expenses')
  const [showModal, setShowModal] = useState(false)
  const [showIncomeModal, setShowIncomeModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [incomeForm, setIncomeForm] = useState({ source: '', amount: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const [txRes, incRes, catRes] = await Promise.all([
      getTransactions(user.id, month, year),
      getIncome(user.id, month, year),
      getCategories(user.id),
    ])
    setTransactions(txRes.data || [])
    setIncome(incRes.data || [])
    setCategories(catRes.data || [])
    setLoading(false)
  }, [user, month, year])

  useEffect(() => { load() }, [load])

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm())
    setShowModal(true)
  }

  const openEdit = (t) => {
    setEditing(t)
    setForm({
      description: t.description,
      amount: t.amount,
      category_id: t.category_id || '',
      date: t.date,
      notes: t.notes || '',
    })
    setShowModal(true)
  }

  const handleSaveTx = async (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      description: form.description,
      amount: parseFloat(form.amount),
      date: form.date,
      category_id: form.category_id || null,
      notes: form.notes,
      paid_by: form.paid_by || 'both',
    }
    if (editing) {
      await updateTransaction(editing.id, payload)
    } else {
      await addTransaction({ ...payload, type: 'expense', user_id: user.id })
    }
    setShowModal(false)
    await load()
    setSaving(false)
  }

  const handleAddIncome = async (e) => {
    e.preventDefault()
    setSaving(true)
    await upsertIncome({ ...incomeForm, amount: parseFloat(incomeForm.amount), user_id: user.id, month, year })
    setShowIncomeModal(false)
    setIncomeForm({ source: '', amount: '', notes: '' })
    await load()
    setSaving(false)
  }

  const handleDeleteTx = async (id) => {
    await deleteTransaction(id)
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  const handleDeleteIncome = async (id) => {
    await deleteIncome(id)
    setIncome(prev => prev.filter(i => i.id !== id))
  }

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y-1) } else setMonth(m => m-1) }
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y+1) } else setMonth(m => m+1) }
  const monthLabel = format(new Date(year, month - 1, 1), 'MMMM yyyy')

  const totalIncome = income.reduce((s, i) => s + Number(i.amount), 0)
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8 fade-up">
        <div>
          <h1 className="font-display text-3xl lg:text-4xl" style={{ color: 'var(--stone-800)' }}>Transactions</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--stone-400)' }}>Track every dollar in and out</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 rounded-xl border" style={{ border: '1px solid var(--stone-200)', background: 'var(--warm-white)', cursor: 'pointer', color: 'var(--stone-600)' }}><ChevronLeft size={16} /></button>
          <span className="font-medium text-sm min-w-[120px] text-center" style={{ color: 'var(--stone-800)' }}>{monthLabel}</span>
          <button onClick={nextMonth} className="p-2 rounded-xl border" style={{ border: '1px solid var(--stone-200)', background: 'var(--warm-white)', cursor: 'pointer', color: 'var(--stone-600)' }}><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 fade-up-2">
        <div className="p-5 rounded-2xl border" style={{ background: 'var(--forest-muted)', borderColor: '#c8e0b8' }}>
          <div className="text-xs mb-1" style={{ color: 'var(--forest)' }}>Total Income</div>
          <div className="font-mono text-2xl font-medium" style={{ color: 'var(--forest)' }}>{fmt(totalIncome)}</div>
        </div>
        <div className="p-5 rounded-2xl border" style={{ background: 'var(--rust-light)', borderColor: '#f0c4b0' }}>
          <div className="text-xs mb-1" style={{ color: 'var(--rust)' }}>Total Expenses</div>
          <div className="font-mono text-2xl font-medium" style={{ color: 'var(--rust)' }}>{fmt(totalExpenses)}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 fade-up-3">
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--stone-100)' }}>
          {['expenses', 'income'].map(t => (
            <button key={t} onClick={() => setTab(t)} className="px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all"
              style={{ background: tab === t ? 'var(--warm-white)' : 'transparent', color: tab === t ? 'var(--stone-800)' : 'var(--stone-400)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              {t}
            </button>
          ))}
        </div>
        <button onClick={() => tab === 'expenses' ? openAdd() : setShowIncomeModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: 'var(--stone-800)', color: 'var(--cream)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          <Plus size={14} /> Add {tab === 'expenses' ? 'Expense' : 'Income'}
        </button>
      </div>

      <div className="rounded-2xl border overflow-hidden fade-up-4" style={{ background: 'var(--warm-white)', borderColor: 'var(--stone-200)' }}>
        {loading ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--stone-400)' }}>Loading…</div>
        ) : tab === 'expenses' ? (
          transactions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-3xl mb-3">💸</div>
              <div className="text-sm" style={{ color: 'var(--stone-400)' }}>No expenses yet this month</div>
            </div>
          ) : transactions.map(t => (
            <div key={t.id} className="flex items-center justify-between px-5 py-4 border-b last:border-0 group" style={{ borderColor: 'var(--stone-100)' }}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0" style={{ background: 'var(--stone-100)' }}>
                  {t.budget_categories?.icon || '💰'}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: 'var(--stone-800)' }}>{t.description}</div>
                  <div className="text-xs" style={{ color: 'var(--stone-400)' }}>
                    {t.budget_categories?.name || 'Uncategorized'} · {format(parseDate(t.date), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                <div className="font-mono text-sm font-medium" style={{ color: 'var(--rust)' }}>-${Number(t.amount).toFixed(2)}</div>
                <button onClick={() => openEdit(t)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stone-400)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--stone-800)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--stone-400)'}
                ><Pencil size={13} /></button>
                <button onClick={() => handleDeleteTx(t.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stone-400)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--rust)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--stone-400)'}
                ><Trash2 size={13} /></button>
              </div>
            </div>
          ))
        ) : (
          income.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-3xl mb-3">💵</div>
              <div className="text-sm" style={{ color: 'var(--stone-400)' }}>No income recorded this month</div>
            </div>
          ) : income.map(inc => (
            <div key={inc.id} className="flex items-center justify-between px-5 py-4 border-b last:border-0 group" style={{ borderColor: 'var(--stone-100)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0" style={{ background: 'var(--forest-muted)' }}>💵</div>
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--stone-800)' }}>{inc.source}</div>
                  {inc.notes && <div className="text-xs" style={{ color: 'var(--stone-400)' }}>{inc.notes}</div>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="font-mono text-sm font-medium" style={{ color: 'var(--forest)' }}>+{fmt(inc.amount)}</div>
                <button onClick={() => handleDeleteIncome(inc.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stone-400)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--rust)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--stone-400)'}
                ><Trash2 size={13} /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md rounded-2xl p-6 fade-up" style={{ background: 'var(--warm-white)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl" style={{ color: 'var(--stone-800)' }}>{editing ? 'Edit Expense' : 'Add Expense'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stone-400)' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveTx} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--stone-600)' }}>Description</label>
                <input className={inputClass} style={inputStyle} placeholder="What was it? (e.g. Whole Foods)"
                  value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}
                  required autoFocus
                  autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--stone-600)' }}>Amount ($)</label>
                  <input className={inputClass} style={inputStyle} type="number" step="0.01" min="0" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} required />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--stone-600)' }}>Date</label>
                  <input className={inputClass} style={inputStyle} type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--stone-600)' }}>Category</label>
                <select className={inputClass} style={inputStyle} value={form.category_id} onChange={e => setForm(f => ({...f, category_id: e.target.value}))}>
                  <option value="">Uncategorized</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--stone-600)' }}>Notes (optional)</label>
                <input className={inputClass} style={inputStyle} placeholder="Any notes…" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} />
              </div>
              <PaidByToggle value={form.paid_by} onChange={v => setForm(f => ({...f, paid_by: v}))} />
              <button type="submit" disabled={saving} className="w-full py-3 rounded-xl text-sm font-medium"
                style={{ background: 'var(--stone-800)', color: 'var(--cream)', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Expense'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showIncomeModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setShowIncomeModal(false)}>
          <div className="w-full max-w-md rounded-2xl p-6 fade-up" style={{ background: 'var(--warm-white)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl" style={{ color: 'var(--stone-800)' }}>Add Income</h2>
              <button onClick={() => setShowIncomeModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stone-400)' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddIncome} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--stone-600)' }}>Source</label>
                <input className={inputClass} style={inputStyle} placeholder="e.g. Salary, Freelance" value={incomeForm.source} onChange={e => setIncomeForm(f => ({...f, source: e.target.value}))} required autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--stone-600)' }}>Amount ($)</label>
                <input className={inputClass} style={inputStyle} type="number" step="0.01" min="0" placeholder="0.00" value={incomeForm.amount} onChange={e => setIncomeForm(f => ({...f, amount: e.target.value}))} required />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--stone-600)' }}>Notes (optional)</label>
                <input className={inputClass} style={inputStyle} placeholder="Any notes…" value={incomeForm.notes} onChange={e => setIncomeForm(f => ({...f, notes: e.target.value}))} />
              </div>
              <button type="submit" disabled={saving} className="w-full py-3 rounded-xl text-sm font-medium"
                style={{ background: 'var(--forest)', color: 'white', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : 'Add Income'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}