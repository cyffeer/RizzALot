import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './state/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Discover from './pages/Discover'
import Matches from './pages/Matches'
import Chat from './pages/Chat'
import Questions from './pages/Questions'
import Layout from './components/Layout'

function ProtectedRoute({ children }) {
  const { token, user } = useAuth()
  const loc = useLocation()
  if (!token) return <Navigate to="/login" replace />
  // Force onboarding if profileComplete is false, except on the questions page
  if (user && user.profileComplete === false && loc.pathname !== '/questions') {
    return <Navigate to="/questions" replace />
  }
  return children
}

export default function App() {
  const { token } = useAuth()
  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/matches" element={<ProtectedRoute><Matches /></ProtectedRoute>} />
        <Route path="/chat/:matchId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/questions" element={<ProtectedRoute><Questions /></ProtectedRoute>} />
        <Route path="/" element={<ProtectedRoute><Discover /></ProtectedRoute>} />
      </Routes>
    </Layout>
  )
}
