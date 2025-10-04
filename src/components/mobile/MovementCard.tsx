import { ArrowUpCircle, ArrowDownCircle, Activity } from 'lucide-react'
import { format } from 'date-fns'
import type { Database } from '@/lib/database.types'

type Movement = Database['public']['Tables']['movements']['Row'] & {
  items: { name: string; sku: string; unit: string }
}

interface MovementCardProps {
  movement: Movement
}

export default function MovementCard({ movement }: MovementCardProps) {
  const getIcon = () => {
    switch (movement.type) {
      case 'in':
        return <ArrowUpCircle className="h-5 w-5 text-green-600" />
      case 'out':
        return <ArrowDownCircle className="h-5 w-5 text-red-600" />
      case 'adjust':
        return <Activity className="h-5 w-5 text-blue-600" />
    }
  }

  const getTypeColor = () => {
    switch (movement.type) {
      case 'in':
        return 'bg-green-100 text-green-800'
      case 'out':
        return 'bg-red-100 text-red-800'
      case 'adjust':
        return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">{movement.items.name}</h3>
            <p className="text-xs text-gray-500">{movement.items.sku}</p>
          </div>
        </div>
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor()}`}>
          {movement.type.toUpperCase()}
        </span>
      </div>

      {/* Quantity */}
      <div className="mb-3">
        <p className="text-xs text-gray-500 mb-1">Quantity Change</p>
        <p className="text-lg font-semibold text-gray-900">
          {movement.delta > 0 ? '+' : ''}
          {movement.delta} {movement.items.unit}
        </p>
      </div>

      {/* Reason */}
      <div className="mb-3">
        <p className="text-xs text-gray-500 mb-1">Reason</p>
        <p className="text-sm text-gray-900">{movement.reason}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          {format(new Date(movement.created_at), 'MMM d, yyyy HH:mm')}
        </p>
        {movement.ref_doc && (
          <p className="text-xs text-gray-500">Ref: {movement.ref_doc}</p>
        )}
      </div>
    </div>
  )
}
