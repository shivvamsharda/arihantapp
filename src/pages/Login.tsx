import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { isSupabaseConfigured } from '@/lib/supabase'
import { Mail, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'

export default function Login() {
  const { user, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      await signIn(email)
      setMessage({
        type: 'success',
        text: 'Check your email for the magic link!',
      })
      setEmail('')
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to send magic link',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Arihant Inventory
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>

        {!isSupabaseConfigured && (
          <div className="rounded-lg bg-yellow-50 border-2 border-yellow-200 p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Supabase Not Configured
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>To use this application, you need to:</p>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Create a Supabase project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline">supabase.com</a></li>
                    <li>Copy <code className="bg-yellow-100 px-1 py-0.5 rounded">.env.example</code> to <code className="bg-yellow-100 px-1 py-0.5 rounded">.env</code></li>
                    <li>Add your Supabase URL and anon key to <code className="bg-yellow-100 px-1 py-0.5 rounded">.env</code></li>
                    <li>Run the SQL scripts in the <code className="bg-yellow-100 px-1 py-0.5 rounded">supabase/</code> folder</li>
                  </ol>
                  <p className="mt-2">See <code className="bg-yellow-100 px-1 py-0.5 rounded">README.md</code> for detailed instructions.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full pl-10 px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm"
                placeholder="Email address"
              />
            </div>
          </div>

          {message && (
            <div
              className={clsx(
                'rounded-lg p-4 text-sm',
                message.type === 'success'
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              )}
            >
              {message.text}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Magic Link'}
            </button>
          </div>

          <p className="text-xs text-center text-gray-500">
            We'll send you a magic link to sign in without a password
          </p>
        </form>
      </div>
    </div>
  )
}
