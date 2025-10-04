import { Package, Edit, Archive, ArchiveRestore } from 'lucide-react'
import type { Database } from '@/lib/database.types'

type Item = Database['public']['Tables']['items']['Row']

interface ItemCardProps {
  item: Item
  onEdit: (item: Item) => void
  onArchive: (item: Item) => void
  onRestore: (item: Item) => void
  canEdit: boolean
}

export default function ItemCard({ item, onEdit, onArchive, onRestore, canEdit }: ItemCardProps) {
  const isLowStock = item.current_qty <= item.min_threshold

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onEdit(item)
  }

  const handleArchive = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onArchive(item)
  }

  const handleRestore = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onRestore(item)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <div className="flex-shrink-0 mt-1">
            <Package className="h-5 w-5 text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-medium text-gray-900 truncate">{item.name}</h3>
            <p className="text-sm text-gray-500">{item.sku}</p>
          </div>
        </div>
        {canEdit && (
          <button
            onClick={handleEdit}
            className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600"
          >
            <Edit className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-xs text-gray-500">Category</p>
          <p className="text-sm font-medium text-gray-900">{item.category}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Location</p>
          <p className="text-sm font-medium text-gray-900">{item.location || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Current Stock</p>
          <p className={`text-sm font-medium ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
            {item.current_qty} {item.unit}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Min Threshold</p>
          <p className="text-sm font-medium text-gray-900">
            {item.min_threshold} {item.unit}
          </p>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              item.status === 'active'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {item.status}
          </span>
          {isLowStock && (
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
              Low Stock
            </span>
          )}
        </div>

        {/* Archive/Restore Button */}
        {canEdit && (
          <button
            onClick={item.status === 'active' ? handleArchive : handleRestore}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
          >
            {item.status === 'active' ? (
              <>
                <Archive className="h-4 w-4 mr-1" />
                Archive
              </>
            ) : (
              <>
                <ArchiveRestore className="h-4 w-4 mr-1" />
                Restore
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
