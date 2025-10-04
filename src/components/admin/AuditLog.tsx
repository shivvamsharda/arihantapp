import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import type { Database } from '@/lib/database.types'
import MovementCard from '@/components/mobile/MovementCard'

type Movement = Database['public']['Tables']['movements']['Row'] & {
  items: { name: string; sku: string; unit: string }
  profiles: { display_name: string }
  customers: { name: string } | null
}

export default function AuditLog() {
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAuditLog()
  }, [])

  const loadAuditLog = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('movements')
        .select(`
          *,
          items (name, sku),
          profiles (display_name),
          customers (name)
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setMovements((data as unknown as Movement[]) || [])
    } catch (error) {
      console.error('Error loading audit log:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading audit log...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">Audit Log</h2>
        <p className="text-sm text-gray-500 mt-1">Complete movement history with user attribution</p>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {movements.map((movement) => (
          <MovementCard key={movement.id} movement={movement} />
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {movements.map((movement) => (
              <tr key={movement.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(movement.created_at), 'MMM d, yyyy HH:mm')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {movement.items.name}
                  <div className="text-xs text-gray-500">{movement.items.sku}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      movement.type === 'in'
                        ? 'bg-green-100 text-green-800'
                        : movement.type === 'out'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {movement.type.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {movement.delta > 0 ? '+' : ''}{movement.delta}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {movement.profiles.display_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {movement.customers?.name || '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                  {movement.reason}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
