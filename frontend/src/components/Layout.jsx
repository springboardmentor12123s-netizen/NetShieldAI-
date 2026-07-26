import { Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Shield, LogOut } from 'lucide-react'

export default function Layout() {
  const { user, logout } = useAuth()
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 mr-6">
            <Shield className="w-6 h-6 text-emerald-400" />
            <span className="font-bold text-lg">NetShield AI</span>
          </div>
          <div className="flex gap-4">
            <a href="/" className="hover:text-emerald-400 text-sm font-medium transition">Dashboard</a>
            <a href="/models" className="hover:text-emerald-400 text-sm font-medium transition">AI Models</a>
            <a href="/threats" className="hover:text-emerald-400 text-sm font-medium transition">Threat Intel</a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-300">{user?.email}</span>
          <button onClick={logout} className="flex items-center gap-1 text-sm hover:text-emerald-400 transition">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </nav>
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full"><Outlet /></main>
    </div>
  )
}
