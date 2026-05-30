import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { TrendingUp, TrendingDown, DollarSign, Target, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { useAuth } from '../hooks/useAuth.jsx'
import { getTransactions, getIncome, getSavingsGoals, getCategories, addTransaction } from '../lib/supabase'

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

export default function DashboardPage() {
  const { user } = useAuth()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [transactions, setTransactions] = useState([])
  const [income, setIncome] = useState([])
  const [goals, setGoals] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [quickForm, setQuickForm] = useState({ description: '', amount: '', category_id: '', date: format(new Date(), 'yyyy-MM-dd'), type: 'expense' })
  const [quickSaving, setQuickSaving] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const [txRes, incRes, goalRes, catRes] = await Promise.all([
      getTransactions(user.id, month, year),
      getIncome(user.id, month, year),
      getSavingsGoals(user.id),
      getCategories(user.id),
    ])
    setTransactions(txRes.data || [])
    setIncome(incRes.data || [])
    setGoals(goalRes.data || [])
    setCategories(catRes.data || [])
    setLoading(false)
  }, [user, month, year])

  useEffect(() => { load() }, [load])

  const handleQuickAdd = async (e) => {
    e.preventDefault()
    setQuickSaving(true)
    await addTransaction({
      ...quickForm,
      amount: parseFloat(quickForm.amount),
      user_id: user.id,
      category_id: quickForm.category_id || null,
    })
    setShowQuickAdd(false)
    setQuickForm({ description: '', amount: '', category_id: '', date: format(new Date(), 'yyyy-MM-dd'), type: 'expense' })
    await load()
    setQuickSaving(false)
  }

  const totalIncome = income.reduce((s, i) => s + Number(i.amount), 0)
  const totalSpent = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const totalSaved = transactions.filter(t => t.type === 'savings').reduce((s, t) => s + Number(t.amount), 0)
  const remaining = totalIncome - totalSpent - totalSaved
  const totalGoalTarget = goals.reduce((s, g) => s + Number(g.target_amount), 0)
  const totalGoalSaved = goals.reduce((s, g) => s + Number(g.current_amount), 0)

  const spendingByCategory = categories.map(cat => {
    const spent = transactions
      .filter(t => t.category_id === cat.id && t.type === 'expense')
      .reduce((s, t) => s + Number(t.amount), 0)
    return { name: cat.name, value: spent, color: cat.color || '#6B5B4E', budget: Number(cat.budget_amount || 0) }
  }).filter(c => c.value > 0)

  const budgetData = categories
    .filter(c => Number(c.budget_amount) > 0)
    .map(cat => ({
      name: cat.name.length > 10 ? cat.name.slice(0, 10) + '…' : cat.name,
      budget: Number(cat.budget_amount),
      spent: transactions.filter(t => t.category_id === cat.id && t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
    }))

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const monthLabel = format(new Date(year, month - 1, 1), 'MMMM yyyy')

  const inputStyle = { background: 'var(--cream)', border: '1.5px solid var(--stone-200)', color: 'var(--stone-800)', fontFamily: 'inherit' }
  const inputClass = "w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"

  const StatCard = ({ icon: Icon, label, value, sub, color, delay }) => (
    <div className={`p-6 rounded-2xl border fade-up-${delay}`} style={{ background: 'var(--warm-white)', borderColor: 'var(--stone-200)' }}>
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 rounded-xl" style={{ background: color + '22' }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <div className="font-mono text-2xl font-medium mb-1" style={{ color: 'var(--stone-800)' }}>{value}</div>
      <div className="text-sm" style={{ color: 'var(--stone-600)' }}>{label}</div>
      {sub && <div className="text-xs mt-1" style={{ color: 'var(--stone-400)' }}>{sub}</div>}
    </div>
  )

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-64">
      <div className="text-sm" style={{ color: 'var(--stone-400)' }}>Loading…</div>
    </div>
  )

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 fade-up">
        <div>
          <h1 className="font-display text-3xl lg:text-4xl" style={{ color: 'var(--stone-800)' }}>Overview</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--stone-400)' }}>Your family's financial snapshot</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-2 rounded-xl border transition-all" style={{ border: '1px solid var(--stone-200)', background: 'var(--warm-white)', cursor: 'pointer', color: 'var(--stone-600)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--stone-100)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--warm-white)'}
          ><ChevronLeft size={16} /></button>
          <span className="font-medium text-sm min-w-[120px] text-center" style={{ color: 'var(--stone-800)' }}>{monthLabel}</span>
          <button onClick={nextMonth} className="p-2 rounded-xl border transition-all" style={{ border: '1px solid var(--stone-200)', background: 'var(--warm-white)', cursor: 'pointer', color: 'var(--stone-600)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--stone-100)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--warm-white)'}
          ><ChevronRight size={16} /></button>
        </div>
      </div>

      {/* Big Add Transaction Button */}
      <button
        onClick={() => setShowQuickAdd(true)}
        className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl mb-6 fade-up-2 transition-all"
        style={{
          background: 'var(--stone-800)',
          color: 'var(--cream)',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: '1rem',
          fontWeight: '500',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--stone-600)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--stone-800)'}
      >
        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
          <Plus size={16} />
        </div>
        Add Transaction
      </button>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={TrendingUp} label="Total Income" value={fmt(totalIncome)} color="var(--forest)" delay="2" />
        <StatCard icon={TrendingDown} label="Total Spent" value={fmt(totalSpent)} sub={totalIncome > 0 ? `${Math.round(totalSpent/totalIncome*100)}% of income` : ''} color="var(--rust)" delay="3" />
        <StatCard icon={PiggyBank2} label="Saved" value={fmt(totalSaved)} color="var(--gold)" delay="4" />
        <StatCard icon={DollarSign} label="Remaining" value={fmt(remaining)} sub={remaining < 0 ? 'Over budget!' : 'Available'} color={remaining >= 0 ? 'var(--forest)' : 'var(--rust)'} delay="4" />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="p-6 rounded-2xl border fade-up-2" style={{ background: 'var(--warm-white)', borderColor: 'var(--stone-200)' }}>
          <h2 className="font-display text-lg mb-4" style={{ color: 'var(--stone-800)' }}>Spending by Category</h2>
          {spendingByCategory.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm" style={{ color: 'var(--stone-400)' }}>No expenses this month</div>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={spendingByCategory} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                    {spendingByCategory.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {spendingByCategory.slice(0, 6).map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                      <span style={{ color: 'var(--stone-600)' }}>{c.name}</span>
                    </div>
                    <span className="font-mono font-medium" style={{ color: 'var(--stone-800)' }}>{fmt(c.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 rounded-2xl border fade-up-3" style={{ background: 'var(--warm-white)', borderColor: 'var(--stone-200)' }}>
          <h2 className="font-display text-lg mb-4" style={{ color: 'var(--stone-800)' }}>Budget vs Actual</h2>
          {budgetData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm" style={{ color: 'var(--stone-400)' }}>Set budgets in Categories to see comparison</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={budgetData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--stone-200)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--stone-400)', fontFamily: 'DM Sans' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--stone-400)', fontFamily: 'DM Mono' }} />
                <Tooltip formatter={(v) => fmt(v)} contentStyle={{ fontFamily: 'DM Sans', fontSize: '12px', border: '1px solid var(--stone-200)', borderRadius: '8px' }} />
                <Bar dataKey="budget" name="Budget" fill="var(--stone-200)" radius={[4,4,0,0]} />
                <Bar dataKey="spent" name="Spent" fill="var(--stone-800)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Savings Goals */}
      {goals.length > 0 && (
        <div className="p-6 rounded-2xl border fade-up-4" style={{ background: 'var(--warm-white)', borderColor: 'var(--stone-200)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg" style={{ color: 'var(--stone-800)' }}>Savings Goals</h2>
            <span className="text-sm font-mono" style={{ color: 'var(--stone-600)' }}>{fmt(totalGoalSaved)} / {fmt(totalGoalTarget)}</span>
          </div>
          <div className="space-y-4">
            {goals.map(g => {
              const pct = Math.min(100, Math.round(Number(g.current_amount) / Number(g.target_amount) * 100))
              return (
                <div key={g.id}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-medium" style={{ color: 'var(--stone-800)' }}>{g.name}</span>
                    <span className="font-mono text-xs" style={{ color: 'var(--stone-600)' }}>{fmt(g.current_amount)} / {fmt(g.target_amount)} · {pct}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--stone-100)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct >= 100 ? 'var(--forest)' : 'var(--gold)' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div className="mt-6 p-6 rounded-2xl border fade-up-4" style={{ background: 'var(--warm-white)', borderColor: 'var(--stone-200)' }}>
        <h2 className="font-display text-lg mb-4" style={{ color: 'var(--stone-800)' }}>Recent Transactions</h2>
        {transactions.length === 0 ? (
          <div className="text-sm py-6 text-center" style={{ color: 'var(--stone-400)' }}>No transactions this month yet.</div>
        ) : (
          <div className="space-y-2">
            {transactions.slice(0, 8).map(t => (
              <div key={t.id} className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: 'var(--stone-100)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm" style={{ background: 'var(--stone-100)' }}>
                    {t.budget_categories?.icon || '💰'}
                  </div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--stone-800)' }}>{t.description}</div>
                    <div className="text-xs" style={{ color: 'var(--stone-400)' }}>{t.budget_categories?.name || 'Uncategorized'} · {format(new Date(t.date), 'MMM d')}</div>
                  </div>
                </div>
                <div className="font-mono text-sm font-medium" style={{ color: t.type === 'income' ? 'var(--forest)' : t.type === 'savings' ? 'var(--gold)' : 'var(--rust)' }}>
                  {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowQuickAdd(false)}>
          <div className="w-full max-w-md rounded-2xl p-6 fade-up" style={{ background: 'var(--warm-white)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl" style={{ color: 'var(--stone-800)' }}>Add Transaction</h2>
              <button onClick={() => setShowQuickAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stone-400)' }}><X size={18} /></button>
            </div>

            {/* Expense / Savings toggle */}
            <div className="flex gap-1 p-1 rounded-xl mb-4" style={{ background: 'var(--stone-100)' }}>
              {['expense', 'savings'].map(t => (
                <button key={t} onClick={() => setQuickForm(f => ({...f, type: t}))}
                  className="flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all"
                  style={{ background: quickForm.type === t ? 'var(--warm-white)' : 'transparent', color: quickForm.type === t ? 'var(--stone-800)' : 'var(--stone-400)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {t === 'expense' ? '💸 Expense' : '🐖 Savings'}
                </button>
              ))}
            </div>

            <form onSubmit={handleQuickAdd} className="space-y-3">
              <input className={inputClass} style={inputStyle} placeholder="What was it? (e.g. Whole Foods)" value={quickForm.description} onChange={e => setQuickForm(f => ({...f, description: e.target.value}))} required autoFocus />
              <div className="grid grid-cols-2 gap-3">
                <input className={inputClass} style={inputStyle} type="number" step="0.01" min="0" placeholder="Amount ($)" value={quickForm.amount} onChange={e => setQuickForm(f => ({...f, amount: e.target.value}))} required />
                <input className={inputClass} style={inputStyle} type="date" value={quickForm.date} onChange={e => setQuickForm(f => ({...f, date: e.target.value}))} required />
              </div>
              <select className={inputClass} style={inputStyle} value={quickForm.category_id} onChange={e => setQuickForm(f => ({...f, category_id: e.target.value}))}>
                <option value="">No category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
              <button type="submit" disabled={quickSaving} className="w-full py-3.5 rounded-xl font-medium text-sm mt-1"
                style={{ background: 'var(--stone-800)', color: 'var(--cream)', border: 'none', cursor: quickSaving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: quickSaving ? 0.7 : 1, fontSize: '0.95rem' }}>
                {quickSaving ? 'Saving…' : 'Add Transaction'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function PiggyBank2({ size, style }) {
  return <Target size={size} style={style} />
}