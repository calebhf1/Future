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
  const to = `${year}-${String(month).padStart(2, '0')}-31`
  const { data, error } = await supabase
    .from('transactions')
    .select('*, budget_categories(name, color, icon)')
    .eq('user_id', userId)
    .gte('date', from)
    .lte('date', to)
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