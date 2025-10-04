import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Link } from 'react-router-dom'
import {
  Plus,
  Search,
  ArrowUp,
  ArrowDown,
  Edit,
  Archive,
  ArchiveRestore,
} from 'lucide-react'
import type { Database } from '@/lib/database.types'
import ItemFormModal from '@/components/ItemFormModal'
import MovementModal from '@/components/MovementModal'
import ItemCard from '@/components/mobile/ItemCard'

type Item = Database['public']['Tables']['items']['Row']

export default function Items() {
  const { isAdmin, isStaff, isViewer } = useAuth()
  const canRecordMovements = isAdmin || isStaff
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('active')
  const [categories, setCategories] = useState<string[]>([])

  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [movementType, setMovementType] = useState<'in' | 'out' | 'adjust'>('in')

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  useEffect(() => {
    loadItems()
    loadCategories()
  }, [searchTerm, categoryFilter, statusFilter])

  const loadCategories = async () => {
    const { data } = await supabase
      .from('items')
      .select('category')
      .order('category')

    const uniqueCategories = [...new Set(data?.map((item: { category: string }) => item.category) || [])]
    setCategories(uniqueCategories as string[])
  }

  const loadItems = async () => {
    try {
      setLoading(true)
      let query = supabase.from('items').select('*')

      if (searchTerm) {
        query = query.or(`sku.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`)
      }

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter)
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error('Error loading items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleArchive = async (item: Item) => {
    if (!confirm(`Are you sure you want to archive ${item.name}?`)) return

    try {
      const { error } = await supabase
        .from('items')
        .update({ status: 'archived' })
        .eq('id', item.id)

      if (error) throw error
      loadItems()
    } catch (error) {
      console.error('Error archiving item:', error)
      alert('Failed to archive item')
    }
  }

  const handleRestore = async (item: Item) => {
    try {
      const { error } = await supabase
        .from('items')
        .update({ status: 'active' })
        .eq('id', item.id)

      if (error) throw error
      loadItems()
    } catch (error) {
      console.error('Error restoring item:', error)
      alert('Failed to restore item')
    }
  }

  const openMovementModal = (item: Item, type: 'in' | 'out' | 'adjust') => {
    setSelectedItem(item)
    setMovementType(type)
    setIsMovementModalOpen(true)
  }

  const openEditModal = (item: Item) => {
    setSelectedItem(item)
    setIsItemModalOpen(true)
  }

  const openAddModal = () => {
    setSelectedItem(null)
    setIsItemModalOpen(true)
  }

  // Pagination
  const totalPages = Math.ceil(items.length / itemsPerPage)
  const paginatedItems = items.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Items</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your inventory items
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center px-4 py-3 md:py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 min-h-[44px]"
          >
            <Plus className="h-5 w-5 mr-2" />
            <span className="hidden sm:inline">Add Item</span>
            <span className="sm:hidden">Add</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by SKU or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'archived')}
            className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Desktop Table / Mobile Cards */}
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : paginatedItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No items found</div>
        ) : (
          paginatedItems.map((item) => (
            <div key={item.id}>
              <ItemCard
                item={item}
                onEdit={() => openEditModal(item)}
                onArchive={() => handleArchive(item)}
                onRestore={() => handleRestore(item)}
                canEdit={isAdmin}
              />
            </div>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white shadow rounded-lg overflow-hidden">
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
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Qty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Threshold
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    No items found
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <Link to={`/items/${item.id}`} className="hover:text-primary-600">
                        {item.sku}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span
                        className={
                          item.current_qty <= item.min_threshold
                            ? 'text-red-600 font-semibold'
                            : ''
                        }
                      >
                        {item.current_qty} {item.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.min_threshold} {item.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {item.status === 'active' && canRecordMovements && (
                        <>
                          <button
                            onClick={() => openMovementModal(item, 'in')}
                            className="text-green-600 hover:text-green-900"
                            title="Stock In"
                          >
                            <ArrowDown className="h-4 w-4 inline" />
                          </button>
                          <button
                            onClick={() => openMovementModal(item, 'out')}
                            className="text-red-600 hover:text-red-900"
                            title="Stock Out"
                          >
                            <ArrowUp className="h-4 w-4 inline" />
                          </button>
                          <button
                            onClick={() => openMovementModal(item, 'adjust')}
                            className="text-blue-600 hover:text-blue-900"
                            title="Adjust"
                          >
                            Adjust
                          </button>
                        </>
                      )}
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => openEditModal(item)}
                            className="text-primary-600 hover:text-primary-900"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4 inline" />
                          </button>
                          {item.status === 'active' ? (
                            <button
                              onClick={() => handleArchive(item)}
                              className="text-gray-600 hover:text-gray-900"
                              title="Archive"
                            >
                              <Archive className="h-4 w-4 inline" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRestore(item)}
                              className="text-green-600 hover:text-green-900"
                              title="Restore"
                            >
                              <ArchiveRestore className="h-4 w-4 inline" />
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, items.length)}
                  </span>{' '}
                  of <span className="font-medium">{items.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {isItemModalOpen && (
        <ItemFormModal
          item={selectedItem}
          onClose={() => {
            setIsItemModalOpen(false)
            setSelectedItem(null)
          }}
          onSuccess={() => {
            loadItems()
            setIsItemModalOpen(false)
            setSelectedItem(null)
          }}
        />
      )}

      {isMovementModalOpen && selectedItem && (
        <MovementModal
          item={selectedItem}
          type={movementType}
          onClose={() => {
            setIsMovementModalOpen(false)
            setSelectedItem(null)
          }}
          onSuccess={() => {
            loadItems()
            setIsMovementModalOpen(false)
            setSelectedItem(null)
          }}
        />
      )}
    </div>
  )
}
