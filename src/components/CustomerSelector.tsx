import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Plus } from 'lucide-react'
import type { Database } from '@/lib/database.types'

type Customer = Database['public']['Tables']['customers']['Row']

interface CustomerSelectorProps {
  value: string | null
  onChange: (customerId: string | null) => void
  onQuickAdd?: () => void
}

export default function CustomerSelector({ value, onChange, onQuickAdd }: CustomerSelectorProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('status', 'active')
        .order('name')

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Error loading customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedCustomer = customers.find(c => c.id === value)

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Customer / Recipient (Optional)
      </label>

      {/* Selected Customer Display */}
      {selectedCustomer && (
        <div className="p-2 bg-primary-50 border border-primary-200 rounded-md flex items-center justify-between">
          <div className="text-sm">
            <div className="font-medium text-gray-900">{selectedCustomer.name}</div>
            {selectedCustomer.email && (
              <div className="text-xs text-gray-500">{selectedCustomer.email}</div>
            )}
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs text-primary-600 hover:text-primary-800"
          >
            Clear
          </button>
        </div>
      )}

      {/* Search & Select */}
      {!selectedCustomer && (
        <div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          {/* Customer List */}
          {searchTerm && (
            <div className="mt-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md bg-white shadow-sm">
              {loading ? (
                <div className="p-3 text-sm text-gray-500 text-center">Loading...</div>
              ) : filteredCustomers.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 text-center">
                  No customers found
                  {onQuickAdd && (
                    <button
                      type="button"
                      onClick={onQuickAdd}
                      className="block w-full mt-2 text-primary-600 hover:text-primary-800 font-medium"
                    >
                      <Plus className="w-4 h-4 inline mr-1" />
                      Add new customer
                    </button>
                  )}
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => (
                    <li key={customer.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onChange(customer.id)
                          setSearchTerm('')
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors"
                      >
                        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                        {customer.email && (
                          <div className="text-xs text-gray-500">{customer.email}</div>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Quick Add Button */}
          {!searchTerm && onQuickAdd && (
            <button
              type="button"
              onClick={onQuickAdd}
              className="mt-2 w-full text-sm text-primary-600 hover:text-primary-800 flex items-center justify-center py-2 border border-dashed border-gray-300 rounded-md hover:border-primary-500"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add new customer
            </button>
          )}
        </div>
      )}

      <p className="text-xs text-gray-500">
        Link this movement to a customer for delivery tracking
      </p>
    </div>
  )
}
