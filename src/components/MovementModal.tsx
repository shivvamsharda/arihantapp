import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { X, AlertTriangle } from 'lucide-react'
import type { Database } from '@/lib/database.types'
import CustomerSelector from '@/components/CustomerSelector'

type Item = Database['public']['Tables']['items']['Row']

interface MovementModalProps {
  item: Item
  type: 'in' | 'out' | 'adjust'
  onClose: () => void
  onSuccess: () => void
}

export default function MovementModal({
  item,
  type,
  onClose,
  onSuccess,
}: MovementModalProps) {
  const { user, isAdmin } = useAuth()
  const [loading, setLoading] = useState(false)
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [refDoc, setRefDoc] = useState('')
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [deliveryNote, setDeliveryNote] = useState('')
  const [allowNegative, setAllowNegative] = useState(false)

  const calculateDelta = () => {
    const qty = parseFloat(quantity)
    if (isNaN(qty)) return 0

    switch (type) {
      case 'in':
        return Math.abs(qty)
      case 'out':
        return -Math.abs(qty)
      case 'adjust':
        return qty
      default:
        return 0
    }
  }

  const wouldBeNegative = () => {
    const delta = calculateDelta()
    return item.current_qty + delta < 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      alert('You must be logged in to record movements')
      return
    }

    const delta = calculateDelta()

    if (delta === 0) {
      alert('Quantity cannot be zero')
      return
    }

    // Check for negative stock
    if (wouldBeNegative() && !isAdmin) {
      alert('This movement would result in negative stock. Only admins can override this.')
      return
    }

    if (wouldBeNegative() && isAdmin && !allowNegative) {
      alert('This movement would result in negative stock. Please check "Allow negative stock" to proceed.')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.from('movements').insert([
        {
          item_id: item.id,
          type,
          delta,
          reason: reason.trim(),
          ref_doc: refDoc.trim() || null,
          user_id: user.id,
          customer_id: customerId,
          delivery_note: deliveryNote.trim() || null,
        },
      ])

      if (error) throw error
      onSuccess()
    } catch (error) {
      console.error('Error recording movement:', error)
      alert(error instanceof Error ? error.message : 'Failed to record movement')
    } finally {
      setLoading(false)
    }
  }

  const getTitle = () => {
    switch (type) {
      case 'in':
        return 'Stock In'
      case 'out':
        return 'Stock Out'
      case 'adjust':
        return 'Adjust Stock'
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-0 md:p-4">
      <div className="relative w-full h-full md:h-auto md:max-w-md bg-white md:rounded-lg shadow-lg overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 p-5 md:p-4 border-b md:border-none flex justify-between items-center">
          <h3 className="text-lg md:text-base font-medium text-gray-900">{getTitle()}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500 p-2">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-5 md:p-4">
          <div className="mb-5 md:mb-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Item:</span> {item.name} ({item.sku})
            </p>
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-medium">Current Stock:</span> {item.current_qty}{' '}
              {item.unit}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 md:space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {type === 'adjust' ? 'Adjustment Amount' : 'Quantity'}{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={type === 'adjust' ? 'Use +/- for increase/decrease' : ''}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
            {quantity && (
              <p className="mt-1 text-sm text-gray-500">
                New stock will be:{' '}
                <span
                  className={
                    wouldBeNegative() ? 'text-red-600 font-semibold' : 'font-medium'
                  }
                >
                  {item.current_qty + calculateDelta()} {item.unit}
                </span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="Explain why this movement is being made..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Reference Document
            </label>
            <input
              type="text"
              value={refDoc}
              onChange={(e) => setRefDoc(e.target.value)}
              placeholder="PO number, invoice, etc."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          {/* Customer Selection - Only for OUT movements */}
          {type === 'out' && (
            <>
              <CustomerSelector
                value={customerId}
                onChange={setCustomerId}
              />

              {customerId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Delivery Note
                  </label>
                  <textarea
                    value={deliveryNote}
                    onChange={(e) => setDeliveryNote(e.target.value)}
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="Additional delivery information..."
                  />
                </div>
              )}
            </>
          )}

          {wouldBeNegative() && isAdmin && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-yellow-800 font-medium">
                    Warning: Negative Stock
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    This movement will result in negative stock levels.
                  </p>
                  <label className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      checked={allowNegative}
                      onChange={(e) => setAllowNegative(e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-yellow-800">
                      Allow negative stock (Admin override)
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

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
                disabled={loading || (wouldBeNegative() && isAdmin && !allowNegative)}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {loading ? 'Recording...' : 'Record Movement'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
