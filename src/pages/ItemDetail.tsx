import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { format } from 'date-fns'
import { ArrowLeft, Package, AlertTriangle } from 'lucide-react'
import type { Database } from '@/lib/database.types'

type Item = Database['public']['Tables']['items']['Row']
type Movement = Database['public']['Tables']['movements']['Row'] & {
  profiles: { display_name: string }
}
type Alert = Database['public']['Tables']['alert_log']['Row']

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>()
  const [item, setItem] = useState<Item | null>(null)
  const [movements, setMovements] = useState<Movement[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [activeTab, setActiveTab] = useState<'movements' | 'info' | 'alerts'>('movements')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadItemDetails()
    }
  }, [id])

  const loadItemDetails = async () => {
    if (!id) return

    try {
      setLoading(true)

      // Load item
      const { data: itemData, error: itemError } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .single()

      if (itemError) throw itemError
      setItem(itemData)

      // Load movements
      const { data: movementsData, error: movementsError } = await supabase
        .from('movements')
        .select(
          `
          *,
          profiles (display_name)
        `
        )
        .eq('item_id', id)
        .order('created_at', { ascending: false })

      if (movementsError) throw movementsError
      setMovements((movementsData as unknown as Movement[]) || [])

      // Load alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('alert_log')
        .select('*')
        .eq('item_id', id)
        .order('created_at', { ascending: false })

      if (alertsError) throw alertsError
      setAlerts(alertsData || [])
    } catch (error) {
      console.error('Error loading item details:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading item details...</div>
  }

  if (!item) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Item not found</p>
        <Link to="/items" className="text-primary-600 hover:text-primary-700 mt-2 inline-block">
          Back to Items
        </Link>
      </div>
    )
  }

  const isLowStock = item.current_qty <= item.min_threshold

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/items"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Items
        </Link>
      </div>

      {/* Item Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="bg-primary-100 rounded-lg p-3">
              <Package className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
              <p className="text-sm text-gray-500 mt-1">SKU: {item.sku}</p>
              <div className="flex items-center space-x-4 mt-2">
                <span
                  className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    item.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {item.status}
                </span>
                {isLowStock && (
                  <span className="inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Low Stock
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Current Stock</p>
            <p
              className={`text-3xl font-bold ${
                isLowStock ? 'text-red-600' : 'text-gray-900'
              }`}
            >
              {item.current_qty} <span className="text-lg">{item.unit}</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Threshold: {item.min_threshold} {item.unit}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
          <div>
            <p className="text-sm text-gray-500">Category</p>
            <p className="text-sm font-medium text-gray-900 mt-1">{item.category}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Unit</p>
            <p className="text-sm font-medium text-gray-900 mt-1">{item.unit}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Location</p>
            <p className="text-sm font-medium text-gray-900 mt-1">{item.location || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created</p>
            <p className="text-sm font-medium text-gray-900 mt-1">
              {format(new Date(item.created_at), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'movements', label: 'Movements' },
              { id: 'info', label: 'Item Info' },
              { id: 'alerts', label: 'Alerts History' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Movements Tab */}
          {activeTab === 'movements' && (
            <div className="space-y-4">
              {movements.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No movements recorded</p>
              ) : (
                <div className="space-y-3">
                  {movements.map((movement) => (
                    <div
                      key={movement.id}
                      className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
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
                          <span className="text-sm font-medium text-gray-900">
                            {movement.delta > 0 ? '+' : ''}
                            {movement.delta} {item.unit}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{movement.reason}</p>
                        {movement.ref_doc && (
                          <p className="text-xs text-gray-500 mt-1">
                            Ref: {movement.ref_doc}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>By: {movement.profiles.display_name}</span>
                          <span>
                            {format(new Date(movement.created_at), 'MMM d, yyyy HH:mm')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Info Tab */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                <p className="mt-1 text-sm text-gray-900">{item.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">SKU</h3>
                <p className="mt-1 text-sm text-gray-900">{item.sku}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Category</h3>
                <p className="mt-1 text-sm text-gray-900">{item.category}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Unit of Measurement</h3>
                <p className="mt-1 text-sm text-gray-900">{item.unit}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Current Quantity</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {item.current_qty} {item.unit}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Minimum Threshold</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {item.min_threshold} {item.unit}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Location</h3>
                <p className="mt-1 text-sm text-gray-900">{item.location || 'Not specified'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <p className="mt-1 text-sm text-gray-900 capitalize">{item.status}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Created At</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {format(new Date(item.created_at), 'MMMM d, yyyy HH:mm:ss')}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {format(new Date(item.updated_at), 'MMMM d, yyyy HH:mm:ss')}
                </p>
              </div>
            </div>
          )}

          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No alerts recorded</p>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {alert.alert_type === 'instant' ? 'Instant Alert' : 'Digest Alert'}
                        </p>
                        <p className="text-xs text-gray-600">
                          Sent via {alert.sent_via} on{' '}
                          {format(new Date(alert.created_at), 'MMM d, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
