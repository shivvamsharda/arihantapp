import { useState } from 'react'
import { Users, UserCog, Package, FileText } from 'lucide-react'
import UserManagement from '@/components/admin/UserManagement'
import CustomerManagement from '@/components/admin/CustomerManagement'
import InventoryOperations from '@/components/admin/InventoryOperations'
import AuditLog from '@/components/admin/AuditLog'

type Tab = 'users' | 'customers' | 'inventory' | 'audit'

export default function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>('users')

  const tabs = [
    { id: 'users' as Tab, name: 'User Management', icon: UserCog },
    { id: 'customers' as Tab, name: 'Customers', icon: Users },
    { id: 'inventory' as Tab, name: 'Inventory Ops', icon: Package },
    { id: 'audit' as Tab, name: 'Audit Log', icon: FileText },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage users, customers, and system operations
        </p>
      </div>

      {/* Mobile Dropdown */}
      <div className="md:hidden">
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value as Tab)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        >
          {tabs.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.name}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop Tabs */}
      <div className="hidden md:block border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon
                  className={`
                    -ml-0.5 mr-2 h-5 w-5
                    ${
                      activeTab === tab.id
                        ? 'text-primary-500'
                        : 'text-gray-400 group-hover:text-gray-500'
                    }
                  `}
                />
                {tab.name}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'customers' && <CustomerManagement />}
        {activeTab === 'inventory' && <InventoryOperations />}
        {activeTab === 'audit' && <AuditLog />}
      </div>
    </div>
  )
}
