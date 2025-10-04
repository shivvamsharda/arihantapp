import { User, Shield } from 'lucide-react'
import { format } from 'date-fns'

interface UserCardProps {
  user: {
    user_id: string
    display_name: string
    email: string
    role: 'admin' | 'staff' | 'viewer'
    last_sign_in_at: string | null
  }
  currentUserId: string
  onChangeRole: (userId: string, newRole: 'admin' | 'staff' | 'viewer') => void
}

export default function UserCard({ user, currentUserId, onChangeRole }: UserCardProps) {
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'staff':
        return 'bg-blue-100 text-blue-800'
      case 'viewer':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-start space-x-3 mb-3">
        <div className="flex-shrink-0 mt-1">
          <User className="h-5 w-5 text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-medium text-gray-900 truncate">{user.display_name}</h3>
          <p className="text-sm text-gray-500 truncate">{user.email}</p>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-2 mb-3">
        <div>
          <p className="text-xs text-gray-500">Last Sign In</p>
          <p className="text-sm text-gray-900">
            {user.last_sign_in_at
              ? format(new Date(user.last_sign_in_at), 'MMM d, yyyy HH:mm')
              : 'Never'}
          </p>
        </div>
      </div>

      {/* Role Selector */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
          <Shield className="h-3 w-3 mr-1" />
          {user.role}
        </span>

        {user.user_id !== currentUserId ? (
          <select
            value={user.role}
            onChange={(e) => onChangeRole(user.user_id, e.target.value as any)}
            className="text-sm border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="viewer">Viewer</option>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        ) : (
          <span className="text-xs text-gray-400">(You)</span>
        )}
      </div>
    </div>
  )
}
