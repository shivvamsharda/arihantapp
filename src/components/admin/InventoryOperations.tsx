import { Download, Upload, Archive } from 'lucide-react'

export default function InventoryOperations() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">Inventory Operations</h2>
        <p className="text-sm text-gray-500 mt-1">Bulk operations and data management</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* CSV Import */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Upload className="h-6 w-6 text-primary-600 mr-2" />
            <h3 className="text-md font-medium text-gray-900">Import Items</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Bulk import inventory items from CSV file
          </p>
          <button
            disabled
            className="w-full px-4 py-2 bg-gray-100 text-gray-400 rounded-md cursor-not-allowed"
          >
            Coming Soon
          </button>
        </div>

        {/* CSV Export */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Download className="h-6 w-6 text-primary-600 mr-2" />
            <h3 className="text-md font-medium text-gray-900">Export Data</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Export items and movements to CSV
          </p>
          <button
            disabled
            className="w-full px-4 py-2 bg-gray-100 text-gray-400 rounded-md cursor-not-allowed"
          >
            Coming Soon
          </button>
        </div>

        {/* Archived Items */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Archive className="h-6 w-6 text-primary-600 mr-2" />
            <h3 className="text-md font-medium text-gray-900">Archived Items</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            View and restore archived inventory
          </p>
          <button
            disabled
            className="w-full px-4 py-2 bg-gray-100 text-gray-400 rounded-md cursor-not-allowed"
          >
            Coming Soon
          </button>
        </div>
      </div>
    </div>
  )
}
