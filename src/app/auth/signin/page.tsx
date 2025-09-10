'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        // Get the updated session to verify authentication
        const session = await getSession()
        if (session) {
          router.push('/')
          router.refresh()
        }
      }
    } catch (error) {
      setError('An error occurred during sign in')
      console.error('Sign in error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <img 
              src="/media/20Highline_Primary-Logo_Blooms_RGB.png" 
              alt="Highline Logo" 
              className="auth-logo-image"
            />
          </div>
          <h1 className="auth-title">DataSpur Login</h1>
          <p className="auth-subtitle">Sign in to access your project management dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="auth-error">
              <span className="material-symbols-outlined">error</span>
              {error}
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="email" className="auth-label">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder="admin@dataspur.com"
              required
              disabled={loading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password" className="auth-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined rotating">hourglass_empty</span>
                Signing in...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">login</span>
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <div className="auth-demo-credentials">
            <h3>Demo Credentials</h3>
            <p><strong>Email:</strong> admin@dataspur.com</p>
            <p><strong>Password:</strong> admin123</p>
          </div>
          <div className="auth-info">
            <span className="material-symbols-outlined">info</span>
            Please change the default password after first login
          </div>
        </div>
      </div>
    </div>
  )
}