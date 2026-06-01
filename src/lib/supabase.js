import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── Auth ──────────────────────────────────────────────────────────
export const signUp = (email, password) =>
  supabase.auth.signUp({ email, password })

export const signIn = (email, password) =>
  supabase.auth.signInWithPassword({ email, password })

export const signOut = () => supabase.auth.signOut()

export const getSession = () => supabase.auth.getSession()

// ── Budget Categories ─────────────────────────────────────────────
export const getCategories = async (userId) => {
  const { data, error } = await supabase
    .from('budget_categories')
    .select('*')
    .eq('user_id', userId)
    .order('name')
  return { data, error }
}

export const upsertCategory = async (category) => {
  const { data, error } = await supabase
    .from('budget_categories')
    .upsert(category)
    .select()
    .single()
  return { data, error }
}

export const deleteCategory = async (id) => {
  const { error } = await supabase
    .from('budget_categories')
    .delete()
    .eq('id', id)
  return { error }
}

// ── Transactions ──────────────────────────────────────────────────
export const getTransactions = async (userId, month, year) => {
  const from = `${year}-${String(month).padStart(2, '0')}-01`
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const to = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`
  const { data, error } = await supabase
    .from('transactions')
    .select('*, budget_categories(name, color, icon)')
    .eq('user_id', userId)
    .gte('date', from)
    .lt('date', to)
    .order('date', { ascending: false })
  return { data, error }
}

export const addTransaction = async (tx) => {
  const { data, error } = await supabase
    .from('transactions')
    .insert(tx)
    .select()
    .single()
  return { data, error }
}

export const updateTransaction = async (id, updates) => {
  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export const deleteTransaction = async (id) => {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
  return { error }
}

// ── Income ────────────────────────────────────────────────────────
export const getIncome = async (userId, month, year) => {
  const { data, error } = await supabase
    .from('income')
    .select('*')
    .eq('user_id', userId)
    .eq('month', month)
    .eq('year', year)
  return { data, error }
}

export const upsertIncome = async (income) => {
  const { data, error } = await supabase
    .from('income')
    .upsert(income)
    .select()
    .single()
  return { data, error }
}

export const deleteIncome = async (id) => {
  const { error } = await supabase.from('income').delete().eq('id', id)
  return { error }
}

// ── Savings Goals ─────────────────────────────────────────────────
export const getSavingsGoals = async (userId) => {
  const { data, error } = await supabase
    .from('savings_goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at')
  return { data, error }
}

export const upsertSavingsGoal = async (goal) => {
  const { data, error } = await supabase
    .from('savings_goals')
    .upsert(goal)
    .select()
    .single()
  return { data, error }
}

export const deleteSavingsGoal = async (id) => {
  const { error } = await supabase.from('savings_goals').delete().eq('id', id)
  return { error }
}

// ── Recurring Transactions ────────────────────────────────────────
export const getRecurringTransactions = async (userId) => {
  const { data, error } = await supabase
    .from('recurring_transactions')
    .select('*, budget_categories(name, color, icon)')
    .eq('user_id', userId)
    .eq('active', true)
    .order('created_at')
  return { data, error }
}

export const addRecurringTransaction = async (tx) => {
  const { data, error } = await supabase
    .from('recurring_transactions')
    .insert(tx)
    .select()
    .single()
  return { data, error }
}

export const deleteRecurringTransaction = async (id) => {
  const { error } = await supabase
    .from('recurring_transactions')
    .update({ active: false })
    .eq('id', id)
  return { error }
}

// Check if a recurring transaction has already been posted for a given month/year
export const getPostedRecurring = async (userId, month, year) => {
  const { data, error } = await supabase
    .from('transactions')
    .select('recurring_id')
    .eq('user_id', userId)
    .not('recurring_id', 'is', null)
    .gte('date', `${year}-${String(month).padStart(2,'0')}-01`)
    .lt('date', `${month === 12 ? year+1 : year}-${String(month === 12 ? 1 : month+1).padStart(2,'0')}-01`)
  return { data, error }
}

// Auto-post any recurring transactions due this month that haven't been posted yet
export const syncRecurringTransactions = async (userId, month, year) => {
  const { data: recurring } = await getRecurringTransactions(userId)
  if (!recurring?.length) return

  const { data: posted } = await getPostedRecurring(userId, month, year)
  const postedIds = new Set((posted || []).map(p => p.recurring_id))

  const now = new Date(year, month - 1, 1)
  const toPost = recurring.filter(r => {
    if (postedIds.has(r.id)) return false
    // Check if this recurring tx is due this month based on frequency + start date
    const start = new Date(r.start_date)
    if (start > new Date(year, month - 1, 28)) return false
    if (r.frequency === 'monthly') return true
    if (r.frequency === 'weekly' || r.frequency === 'biweekly') return true
    return false
  })

  for (const r of toPost) {
    const day = new Date(r.start_date).getDate()
    const date = `${year}-${String(month).padStart(2,'0')}-${String(Math.min(day, 28)).padStart(2,'0')}`
    await addTransaction({
      description: r.description,
      amount: r.amount,
      date,
      type: 'expense',
      category_id: r.category_id,
      user_id: userId,
      recurring_id: r.id,
      notes: `Auto-posted (${r.frequency})`,
    })
  }
}