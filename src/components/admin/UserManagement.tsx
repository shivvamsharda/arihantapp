import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Mail, Shield, UserX, UserPlus, Check, X, Clock } from 'lucide-react'
import type { Database } from '@/lib/database.types'
import { format } from 'date-fns'
import UserCard from '@/components/mobile/UserCard'

type Profile = Database['public']['Tables']['profiles']['Row']
type Invitation = Database['public']['Tables']['user_invitations']['Row']

interface User extends Profile {
  email: string
  last_sign_in_at: string | null
}

export default function UserManagement() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'viewer' | 'staff' | 'admin'>('viewer')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadUsers()
    loadInvitations()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      // Fetch profiles with auth.users data
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError

      // Fetch corresponding auth users
      const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers()

      if (authError) {
        console.error('Error fetching auth users:', authError)
      }

      // Merge profile and auth data
      const mergedUsers: User[] = profiles.map(profile => {
        const authUser = authUsers?.find(au => au.id === profile.user_id)
        return {
          ...profile,
          email: authUser?.email || 'Unknown',
          last_sign_in_at: authUser?.last_sign_in_at || null
        }
      })

      setUsers(mergedUsers)
    } catch (error) {
      console.error('Error loading users:', error)
      alert('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const loadInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .select(`
          *,
          profiles:invited_by (display_name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setInvitations(data || [])
    } catch (error) {
      console.error('Error loading invitations:', error)
    }
  }

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    try {
      setSubmitting(true)

      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const userExists = existingUsers?.users.some(u => u.email === inviteEmail)

      if (userExists) {
        alert('User with this email already exists')
        return
      }

      // Check if invitation already exists
      const { data: existingInvite } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('email', inviteEmail)
        .eq('status', 'pending')
        .single()

      if (existingInvite) {
        alert('Pending invitation already exists for this email')
        return
      }

      // Create invitation record
      const { error: inviteError } = await supabase
        .from('user_invitations')
        .insert({
          email: inviteEmail,
          role: inviteRole,
          invited_by: currentUser.id
        })

      if (inviteError) throw inviteError

      // Send magic link via Supabase Auth
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: inviteEmail,
        options: {
          emailRedirectTo: window.location.origin
        }
      })

      if (authError) {
        console.error('Error sending invite email:', authError)
        // Don't fail completely - invitation is created
      }

      alert(`Invitation sent to ${inviteEmail}`)
      setInviteEmail('')
      setInviteRole('viewer')
      setShowInviteModal(false)
      loadInvitations()
    } catch (error) {
      console.error('Error inviting user:', error)
      alert('Failed to send invitation')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChangeRole = async (userId: string, newRole: 'viewer' | 'staff' | 'admin') => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', userId)

      if (error) throw error
      alert('Role updated successfully')
      loadUsers()
    } catch (error) {
      console.error('Error updating role:', error)
      alert('Failed to update role')
    }
  }

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!confirm('Revoke this invitation?')) return

    try {
      const { error } = await supabase
        .from('user_invitations')
        .update({ status: 'revoked' })
        .eq('id', invitationId)

      if (error) throw error
      loadInvitations()
    } catch (error) {
      console.error('Error revoking invitation:', error)
      alert('Failed to revoke invitation')
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'staff': return 'bg-blue-100 text-blue-800'
      case 'viewer': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" /> Pending
        </span>
      case 'accepted':
        return <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          <Check className="w-3 h-3 mr-1" /> Accepted
        </span>
      case 'expired':
        return <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
          <X className="w-3 h-3 mr-1" /> Expired
        </span>
      case 'revoked':
        return <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          <UserX className="w-3 h-3 mr-1" /> Revoked
        </span>
      default:
        return null
    }
  }

  if (loading) {
    return <div>Loading users...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">User Management</h2>
          <p className="text-sm text-gray-500 mt-1">Manage staff access and permissions</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center px-4 py-3 md:py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 min-h-[44px]"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Invite User</span>
          <span className="sm:hidden">Invite</span>
        </button>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {users.map((user) => (
          <UserCard
            key={user.user_id}
            user={user}
            currentUserId={currentUser?.id || ''}
            onChangeRole={handleChangeRole}
          />
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Sign In
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.user_id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{user.display_name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.last_sign_in_at
                    ? format(new Date(user.last_sign_in_at), 'MMM d, yyyy HH:mm')
                    : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {user.user_id !== currentUser?.id && (
                    <select
                      value={user.role}
                      onChange={(e) => handleChangeRole(user.user_id, e.target.value as any)}
                      className="text-sm border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  )}
                  {user.user_id === currentUser?.id && (
                    <span className="text-gray-400 text-xs">(You)</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Pending Invitations</h3>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invitations.map((invitation) => (
                <tr key={invitation.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invitation.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(invitation.role)}`}>
                      {invitation.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(invitation.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(invitation.expires_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {invitation.status === 'pending' && (
                      <button
                        onClick={() => handleRevokeInvitation(invitation.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-0 md:p-4">
          <div className="relative w-full h-full md:h-auto md:max-w-md bg-white md:rounded-lg shadow-lg overflow-y-auto">
            <div className="sticky top-0 bg-white z-10 p-5 md:p-4 border-b md:border-none flex justify-between items-center">
              <h3 className="text-lg md:text-base font-medium text-gray-900">Invite New User</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-500 p-2"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleInviteUser} className="space-y-5 md:space-y-4 p-5 md:p-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <div className="mt-1 relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="user@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <div className="mt-1 relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="viewer">Viewer (Read-only)</option>
                    <option value="staff">Staff (Can record movements)</option>
                    <option value="admin">Admin (Full access)</option>
                  </select>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {inviteRole === 'viewer' && 'Can view all data but cannot make changes'}
                  {inviteRole === 'staff' && 'Can record stock movements and view data'}
                  {inviteRole === 'admin' && 'Full system access including user management'}
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                >
                  {submitting ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
