import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Link } from 'react-router-dom'
import { Package, AlertTriangle, TrendingUp, Archive } from 'lucide-react'
import { format } from 'date-fns'
import type { Database } from '@/lib/database.types'
import ItemCard from '@/components/mobile/ItemCard'
import MovementCard from '@/components/mobile/MovementCard'

type Item = Database['public']['Tables']['items']['Row']
type Movement = Database['public']['Tables']['movements']['Row'] & {
  items: Pick<Item, 'name' | 'sku' | 'unit'>
  profiles: { display_name: string }
}

interface Stats {
  totalItems: number
  activeItems: number
  lowStockCount: number
  recentMovements: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalItems: 0,
    activeItems: 0,
    lowStockCount: 0,
    recentMovements: 0,
  })
  const [lowStockItems, setLowStockItems] = useState<Item[]>([])
  const [recentMovements, setRecentMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Fetch stats
      const [
        { count: totalItems },
        { count: activeItems },
        { data: lowStock },
        { count: movements },
      ] = await Promise.all([
        supabase.from('items').select('*', { count: 'exact', head: true }),
        supabase
          .from('items')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active'),
        supabase
          .from('items')
          .select('*')
          .eq('status', 'active')
          .lte('current_qty', supabase.rpc('min_threshold')),
        supabase.from('movements').select('*', { count: 'exact', head: true }),
      ])

      setStats({
        totalItems: totalItems || 0,
        activeItems: activeItems || 0,
        lowStockCount: lowStock?.length || 0,
        recentMovements: movements || 0,
      })

      // Fetch low stock items (simplified query)
      const { data: lowStockData } = await supabase
        .from('items')
        .select('*')
        .eq('status', 'active')
        .order('current_qty', { ascending: true })
        .limit(5)

      setLowStockItems(lowStockData || [])

      // Fetch recent movements
      const { data: movementsData } = await supabase
        .from('movements')
        .select(
          `
          *,
          items (name, sku),
          profiles (display_name)
        `
        )
        .order('created_at', { ascending: false })
        .limit(10)

      setRecentMovements((movementsData as unknown as Movement[]) || [])
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading dashboard...</div>
  }

  const statCards = [
    {
      name: 'Total SKUs',
      value: stats.totalItems,
      icon: Package,
      color: 'bg-blue-500',
    },
    {
      name: 'Active SKUs',
      value: stats.activeItems,
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      name: 'Low Stock Items',
      value: stats.lowStockCount,
      icon: AlertTriangle,
      color: 'bg-orange-500',
    },
    {
      name: 'Archived Items',
      value: stats.totalItems - stats.activeItems,
      icon: Archive,
      color: 'bg-gray-500',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your inventory status
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className={`${stat.color} rounded-md p-3`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Low Stock Items */}
      <div>
        <div className="px-4 md:px-6 py-4 bg-white md:bg-transparent">
          <h2 className="text-lg font-medium text-gray-900">Low Stock Items</h2>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {lowStockItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-white rounded-lg">No low stock items</div>
          ) : (
            lowStockItems.map((item) => (
              <Link key={item.id} to={`/items/${item.id}`} className="block">
                <ItemCard
                  item={item}
                  onEdit={() => {}}
                  onArchive={() => {}}
                  onRestore={() => {}}
                  canEdit={false}
                />
              </Link>
            ))
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white shadow rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Qty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Threshold
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lowStockItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No low stock items
                  </td>
                </tr>
              ) : (
                lowStockItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <Link to={`/items/${item.id}`} className="hover:text-primary-600">
                        {item.sku}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.current_qty} {item.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.min_threshold} {item.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.category}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* Recent Movements */}
      <div>
        <div className="px-4 md:px-6 py-4 bg-white md:bg-transparent">
          <h2 className="text-lg font-medium text-gray-900">Recent Movements</h2>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {recentMovements.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-white rounded-lg">No movements yet</div>
          ) : (
            recentMovements.map((movement) => (
              <MovementCard key={movement.id} movement={movement} />
            ))
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white shadow rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentMovements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No movements yet
                  </td>
                </tr>
              ) : (
                recentMovements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {movement.items.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
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
                      {movement.delta > 0 ? '+' : ''}
                      {movement.delta}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {movement.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {movement.profiles.display_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(movement.created_at), 'MMM d, yyyy HH:mm')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  )
}
