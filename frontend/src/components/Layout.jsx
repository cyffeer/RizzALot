import { useState } from 'react'
import Logo from './Logo'
import Button from './Button'
import { Link } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'

export default function Layout({ children }) {
  const { token, logout } = useAuth()
  const [open, setOpen] = useState(false)
  return (
    <div className="min-h-full">
      <header className="border-b border-gray-200 bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container-app flex h-16 items-center justify-between">
          <Link to="/"><Logo /></Link>
          <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-gray-700">
            <Link className="hover:text-gray-900" to="/">Discover</Link>
            <Link className="hover:text-gray-900" to="/matches">Matches</Link>
            <Link className="hover:text-gray-900" to="/profile">Profile</Link>
          </nav>
          <div className="hidden md:flex items-center gap-2">
            {token ? (
              <Button variant="outline" onClick={logout}>Logout</Button>
            ) : (
              <>
                <Link to="/login" className="btn-outline">Login</Link>
                <Link to="/register" className="btn-primary">Register</Link>
              </>
            )}
          </div>
          <button
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md ring-1 ring-gray-300 hover:bg-gray-50"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            ☰
          </button>
        </div>
        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="container-app py-3 flex flex-col gap-2 text-sm">
              <Link className="py-2" to="/" onClick={() => setOpen(false)}>Discover</Link>
              <Link className="py-2" to="/matches" onClick={() => setOpen(false)}>Matches</Link>
              <Link className="py-2" to="/profile" onClick={() => setOpen(false)}>Profile</Link>
              <div className="pt-2">
                {token ? (
                  <Button variant="outline" className="w-full" onClick={() => { setOpen(false); logout() }}>Logout</Button>
                ) : (
                  <div className="flex gap-2">
                    <Link to="/login" className="btn-outline flex-1" onClick={() => setOpen(false)}>Login</Link>
                    <Link to="/register" className="btn-primary flex-1" onClick={() => setOpen(false)}>Register</Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>
      <main className="container-app py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        {children}
      </main>
      <footer className="mt-10 border-t border-gray-200 py-8 text-center text-sm text-gray-600">
        Built with ❤️ for everyone · Rizz-A-Lot
      </footer>
    </div>
  )
}
