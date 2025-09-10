'use client'

import { useState, useEffect } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Initialize accent color from localStorage on mount
  useEffect(() => {
    const savedAccentColor = localStorage.getItem('accentColor')
    const defaultAccentColor = '#315C4D'
    const accentColor = savedAccentColor || defaultAccentColor
    
    // Apply accent color to CSS custom properties
    const root = document.documentElement
    root.style.setProperty('--accent', accentColor)
    root.style.setProperty('--accent-hover', adjustColorBrightness(accentColor, -20))
  }, [])

  const adjustColorBrightness = (color: string, percent: number) => {
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = (num >> 16) + amt
    const G = (num >> 8 & 0x00FF) + amt
    const B = (num & 0x0000FF) + amt
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255))
      .toString(16).slice(1)
  }

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
          <p className="auth-subtitle">Unified DataOps & Project Intelligence Platform</p>
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

      </div>
    </div>
  )
}