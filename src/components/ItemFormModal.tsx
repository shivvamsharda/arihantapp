import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { X } from 'lucide-react'
import type { Database } from '@/lib/database.types'

type Item = Database['public']['Tables']['items']['Row']

interface ItemFormModalProps {
  item: Item | null
  onClose: () => void
  onSuccess: () => void
}

export default function ItemFormModal({ item, onClose, onSuccess }: ItemFormModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    sku: item?.sku || '',
    name: item?.name || '',
    category: item?.category || '',
    unit: item?.unit || '',
    current_qty: item?.current_qty?.toString() || '0',
    min_threshold: item?.min_threshold?.toString() || '0',
    location: item?.location || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const itemData = {
        sku: formData.sku.trim(),
        name: formData.name.trim(),
        category: formData.category.trim(),
        unit: formData.unit.trim(),
        current_qty: parseFloat(formData.current_qty),
        min_threshold: parseFloat(formData.min_threshold),
        location: formData.location.trim() || null,
      }

      if (item) {
        // Update existing item
        const { error } = await supabase
          .from('items')
          .update(itemData)
          .eq('id', item.id)

        if (error) throw error
      } else {
        // Create new item
        const { data: newItem, error } = await supabase
          .from('items')
          .insert([itemData])
          .select()
          .single()

        if (error) throw error

        // Create opening balance movement if initial quantity > 0
        if (parseFloat(formData.current_qty) !== 0 && user) {
          await supabase.from('movements').insert([
            {
              item_id: newItem.id,
              type: 'adjust',
              delta: parseFloat(formData.current_qty),
              reason: 'Opening balance',
              user_id: user.id,
            },
          ])
        }
      }

      onSuccess()
    } catch (error) {
      console.error('Error saving item:', error)
      alert(error instanceof Error ? error.message : 'Failed to save item')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-0 md:p-4">
      <div className="relative w-full h-full md:h-auto md:max-w-md bg-white md:rounded-lg shadow-lg overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 p-5 md:p-4 border-b md:border-none flex justify-between items-center">
          <h3 className="text-lg md:text-base font-medium text-gray-900">
            {item ? 'Edit Item' : 'Add New Item'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 p-2"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 md:space-y-4 p-5 md:p-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              SKU <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              disabled={!!item}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Category <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Unit <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              placeholder="e.g., pcs, kg, liters"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          {!item && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Initial Quantity
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.current_qty}
                onChange={(e) =>
                  setFormData({ ...formData, current_qty: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Minimum Threshold
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.min_threshold}
              onChange={(e) =>
                setFormData({ ...formData, min_threshold: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : item ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
