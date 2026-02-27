import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  PlusCircle,
  FolderOpen,
  BarChart3,
  Settings,
  TrendingUp,
  Database,
  Wifi,
} from 'lucide-react'
import { isSupabaseConfigured } from '../lib/supabase'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/new-trade', icon: PlusCircle, label: 'New Trade' },
  { to: '/positions', icon: FolderOpen, label: 'Positions' },
  { to: '/analysis', icon: BarChart3, label: 'Analysis' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Layout() {
  const connected = isSupabaseConfigured()

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>
            <span className="logo-icon">
              <TrendingUp size={18} color="white" />
            </span>
            <span>TradeLog</span>
          </h1>
          <div className="subtitle">Options Journal</div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={`connection-indicator ${connected ? 'connected' : 'local'}`}>
          {connected ? <Wifi size={14} /> : <Database size={14} />}
          <span>{connected ? 'Supabase' : 'Local Storage'}</span>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
