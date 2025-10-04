import { Users, Mail, Phone, MapPin, Edit, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import type { Database } from '@/lib/database.types'

type Customer = Database['public']['Tables']['customers']['Row']

interface CustomerCardProps {
  customer: Customer
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
  onToggleStatus: (customer: Customer) => void
}

export default function CustomerCard({ customer, onEdit, onDelete, onToggleStatus }: CustomerCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${
      customer.status === 'inactive' ? 'opacity-75' : ''
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <div className="flex-shrink-0 mt-1">
            <Users className="h-5 w-5 text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-medium text-gray-900 truncate">{customer.name}</h3>
            <p className="text-xs text-gray-500">
              Added {format(new Date(customer.created_at), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={() => onEdit(customer)}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(customer)}
            className="p-2 text-red-400 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-3">
        {customer.email && (
          <div className="flex items-center text-sm text-gray-600">
            <Mail className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
            <span className="truncate">{customer.email}</span>
          </div>
        )}
        {customer.phone && (
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
            <span>{customer.phone}</span>
          </div>
        )}
        {customer.address && (
          <div className="flex items-start text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0 mt-0.5" />
            <span className="break-words">{customer.address}</span>
          </div>
        )}
        {!customer.email && !customer.phone && !customer.address && (
          <p className="text-sm text-gray-400">No contact information</p>
        )}
      </div>

      {/* Status */}
      <div className="pt-3 border-t border-gray-100">
        <button
          onClick={() => onToggleStatus(customer)}
          className={`w-full inline-flex justify-center px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            customer.status === 'active'
              ? 'bg-green-100 text-green-800 hover:bg-green-200'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          {customer.status === 'active' ? 'Active' : 'Inactive'} - Tap to toggle
        </button>
      </div>
    </div>
  )
}
