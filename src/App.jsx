import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth.jsx'
import AuthPage from './pages/AuthPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import TransactionsPage from './pages/TransactionsPage.jsx'
import SavingsPage from './pages/SavingsPage.jsx'
import CategoriesPage from './pages/CategoriesPage.jsx'
import Layout from './components/Layout.jsx'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
      <div className="text-center">
        <div className="font-display text-3xl mb-2" style={{ color: 'var(--stone-800)' }}>Future</div>
        <div className="text-sm" style={{ color: 'var(--stone-400)' }}>Loading...</div>
      </div>
    </div>
  )
  return user ? children : <Navigate to="/auth" replace />
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="savings" element={<SavingsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
