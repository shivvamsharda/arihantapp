import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  LayoutDashboard,
  Package,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import clsx from 'clsx'

export default function Layout() {
  const { profile, signOut, isAdmin } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Items', href: '/items', icon: Package },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  ]

  if (isAdmin) {
    navigation.push({ name: 'Admin', href: '/admin', icon: Settings })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 inset-x-0 bg-white border-b border-gray-200 z-30">
        <div className="flex items-center justify-between h-16 px-4">
          <h1 className="text-lg font-bold text-gray-900">Arihant</h1>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-gray-600 bg-opacity-50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="fixed right-0 top-0 bottom-0 w-64 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">
              {/* Close button */}
              <div className="flex items-center justify-between h-16 px-4 border-b">
                <h2 className="font-semibold text-gray-900">Menu</h2>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-md text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* User info */}
              <div className="p-4 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {profile?.display_name}
                </p>
                <p className="text-xs text-gray-500 capitalize mt-1">
                  {profile?.role}
                </p>
              </div>

              {/* Sign out */}
              <div className="p-4">
                <button
                  onClick={() => {
                    signOut()
                    setMobileMenuOpen(false)
                  }}
                  className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">Arihant Inventory</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  )
                }
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {profile?.display_name}
                </p>
                <p className="text-xs text-gray-500 capitalize">{profile?.role}</p>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-30">
        <nav className="flex justify-around">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center justify-center flex-1 py-3 text-xs font-medium transition-colors min-h-[56px]',
                  isActive
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-600 hover:bg-gray-50'
                )
              }
            >
              <item.icon className="h-6 w-6 mb-1" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="pt-16 pb-20 md:pt-0 md:pb-0 md:pl-64">
        <main className="p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
