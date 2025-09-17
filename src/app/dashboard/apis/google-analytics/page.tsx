'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ApiConfig {
  id?: string
  configured: boolean
  status: string
  name?: string
  measurementId?: string
  hasApiSecret?: boolean
  propertyId?: string
  viewId?: string
  tokenExpiry?: string
  createdAt?: string
  updatedAt?: string
}

interface AnalyticsData {
  id: string
  name: string
  type: string
  sessions: number
  users: number
  pageviews: number
  bounceRate: number
  avgSessionDuration: number
  goalCompletions: number
  conversionRate: number
  revenue: number
  startDate: string
  endDate: string
}

interface ApiActivity {
  id: string
  type: string
  status: string
  title: string
  description?: string
  metadata?: any
  createdAt: string
  timeAgo: string
}

export default function GoogleAnalyticsPage() {
  const router = useRouter()
  const [measurementId, setMeasurementId] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [propertyId, setPropertyId] = useState('')
  const [viewId, setViewId] = useState('')
  const [config, setConfig] = useState<ApiConfig>({ configured: false, status: 'not_configured' })
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([])
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [activities, setActivities] = useState<ApiActivity[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(false)

  useEffect(() => {
    fetchConfiguration()
    fetchRecentActivities()
  }, [])

  const fetchRecentActivities = async () => {
    setActivitiesLoading(true)
    try {
      const response = await fetch('/api/apis/google-analytics/activities?limit=5')
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error)
    } finally {
      setActivitiesLoading(false)
    }
  }

  const fetchConfiguration = async () => {
    try {
      const response = await fetch('/api/apis/google-analytics')
      if (response.ok) {
        const data = await response.json()
        console.log('🔍 Fetched configuration:', data)
        setConfig(data)
      } else {
        console.error('❌ API response not ok:', response.status, response.statusText)
        if (response.status === 404 || response.status === 400) {
          console.log('ℹ️ No configuration found, keeping default state')
        } else {
          console.error('❌ Unexpected error response:', await response.text())
        }
      }
    } catch (error) {
      console.error('❌ Failed to fetch configuration:', error)
    }
  }

  const handleSaveConfiguration = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch('/api/apis/google-analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          measurementId,
          apiSecret,
          propertyId: propertyId || undefined,
          viewId: viewId || undefined
        })
      })

      if (response.ok) {
        const data = await response.json()
        setConfig(data)
        setMeasurementId('')
        setApiSecret('')
        setPropertyId('')
        setViewId('')
        alert('Configuration saved successfully!')
      } else {
        const error = await response.json()
        alert(`Failed to save configuration: ${error.error}`)
      }
    } catch (error) {
      console.error('Save configuration error:', error)
      alert('Failed to save configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    try {
      const response = await fetch('/api/apis/google-analytics/test-connection', {
        method: 'POST'
      })
      
      const result = await response.json()
      if (result.success) {
        alert(`Connection successful! ${result.details}`)
        await fetchConfiguration()
        await fetchRecentActivities()
      } else {
        alert(`Connection failed: ${result.details}`)
        await fetchRecentActivities()
      }
    } catch (error) {
      console.error('Test connection error:', error)
      alert('Failed to test connection')
    } finally {
      setTesting(false)
    }
  }

  const handleFetchAnalytics = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/apis/google-analytics/reports')
      if (response.ok) {
        const data = await response.json()
        setAnalyticsData(data.reports)
        setShowAnalytics(true)
        await fetchRecentActivities()
      } else {
        const error = await response.json()
        alert(`Failed to fetch analytics: ${error.error}`)
      }
    } catch (error) {
      console.error('Fetch analytics error:', error)
      alert('Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }

  const handleClearConfiguration = async () => {
    if (!confirm('Are you sure you want to delete the API configuration?')) return
    
    try {
      const response = await fetch('/api/apis/google-analytics', {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setConfig({ configured: false, status: 'not_configured' })
        setMeasurementId('')
        setApiSecret('')
        setPropertyId('')
        setViewId('')
        setAnalyticsData([])
        setShowAnalytics(false)
        alert('Configuration deleted successfully')
      }
    } catch (error) {
      console.error('Delete configuration error:', error)
      alert('Failed to delete configuration')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500'
      case 'warning':
        return 'bg-orange-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusIcon = (type: string, status: string) => {
    if (status === 'error') return 'error'
    if (status === 'warning') return 'warning'
    
    switch (type) {
      case 'CONNECTION_TEST':
        return 'check_circle'
      case 'REPORT_FETCH':
      case 'DATA_SYNC':
        return 'sync'
      case 'GOAL_UPDATE':
        return 'flag'
      case 'RATE_LIMIT_WARNING':
        return 'warning'
      default:
        return 'check_circle'
    }
  }

  return (
    <div className="projects-page">
      <div className="create-project-container">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()}
              className="action-btn action-btn-view"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 className="create-project-title">Google Analytics API</h1>
              <p className="create-project-subtitle">Configure and manage your Google Analytics integration</p>
            </div>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-3 gap-6 items-start" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', alignItems: 'start' }}>
          
          {/* Left Column - Configuration Status & Info */}
          <div className="main-content-left">
            {/* API Status */}
            <div className="form-section">
              <h3 className="form-section-title">
                <span className="material-symbols-outlined">api</span>
                API Status
              </h3>
              <div className="status-badges-container">
                <span className={`status-badge ${
                  config.status === 'active' ? 'status-active' : 
                  config.status === 'error' ? 'status-error' : 
                  'status-inactive'
                }`}>
                  {config.status === 'active' ? 'Connected' : 
                   config.status === 'error' ? 'Error' :
                   config.status === 'inactive' ? 'Configured (Inactive)' :
                   'Not Connected'}
                </span>
              </div>
              {config.configured && (
                <div className="mt-4">
                  {config.status === 'active' && (
                    <p className="text-sm text-green-500">✓ API is configured and ready to use</p>
                  )}
                  {config.status === 'inactive' && (
                    <p className="text-sm text-yellow-500">⚠ Configuration saved but not tested</p>
                  )}
                  {config.status === 'error' && (
                    <p className="text-sm text-red-500">✗ API connection failed</p>
                  )}
                  <div className="text-xs mt-2 opacity-70">
                    Last updated: {config.updatedAt ? new Date(config.updatedAt).toLocaleString() : 'Never'}
                  </div>
                </div>
              )}
            </div>

            {/* API Information */}
            <div className="form-section">
              <h3 className="form-section-title">
                <span className="material-symbols-outlined">info</span>
                API Information
              </h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <h4 className="form-label">API Version</h4>
                  <p className="detail-value">GA4 Data API</p>
                </div>
                <div className="detail-item">
                  <h4 className="form-label">Rate Limit</h4>
                  <p className="detail-value">200,000 tokens/day</p>
                </div>
                <div className="detail-item">
                  <h4 className="form-label">Documentation</h4>
                  <a 
                    href="https://developers.google.com/analytics/devguides/reporting/data/v1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="detail-link"
                  >
                    View Docs
                    <span className="material-symbols-outlined">open_in_new</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="form-section">
              <h3 className="form-section-title">
                <span className="material-symbols-outlined">flash_on</span>
                Quick Actions
              </h3>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={handleTestConnection}
                  disabled={!config.configured || testing}
                  className="form-btn form-btn-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {testing ? (
                    <span className="material-symbols-outlined animate-spin">sync</span>
                  ) : (
                    <span className="material-symbols-outlined">sync</span>
                  )}
                  {testing ? 'Testing...' : 'Test Connection'}
                </button>
                <button 
                  onClick={handleFetchAnalytics}
                  disabled={config.status !== 'active' || loading}
                  className="form-btn form-btn-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined">download</span>
                  {loading ? 'Loading...' : 'Fetch Reports'}
                </button>
                <button 
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  disabled={analyticsData.length === 0}
                  className="form-btn form-btn-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined">analytics</span>
                  {showAnalytics ? 'Hide' : 'View'} Analytics
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Configuration Form */}
          <div className="main-content-right">
            <div className="form-section">
              <h3 className="form-section-title">
                <span className="material-symbols-outlined">settings</span>
                API Configuration
              </h3>
              
              <form onSubmit={handleSaveConfiguration} className="space-y-6">
                <div className="form-grid">
                  <div className="form-field">
                    <label className="form-label" htmlFor="measurementId">
                      Measurement ID *
                    </label>
                    <input
                      type="text"
                      id="measurementId"
                      value={measurementId}
                      onChange={(e) => setMeasurementId(e.target.value)}
                      className="form-input"
                      placeholder={config.measurementId && !measurementId ? `${config.measurementId.slice(0, 3)}xxxxx${config.measurementId.slice(-2)} (saved)` : "G-XXXXXXXXXX"}
                      required
                    />
                    <p className="text-xs mt-1 opacity-70">Your GA4 measurement ID</p>
                  </div>

                  <div className="form-field">
                    <label className="form-label" htmlFor="apiSecret">
                      API Secret *
                    </label>
                    <input
                      type="password"
                      id="apiSecret"
                      value={apiSecret}
                      onChange={(e) => setApiSecret(e.target.value)}
                      className="form-input"
                      placeholder={config.hasApiSecret && !apiSecret ? "xxxxxxxxxxxxxxxx (saved)" : "Your API secret"}
                      required
                    />
                    <p className="text-xs mt-1 opacity-70">GA4 Measurement Protocol API secret</p>
                  </div>

                  <div className="form-field">
                    <label className="form-label" htmlFor="propertyId">
                      Property ID (Optional)
                    </label>
                    <input
                      type="text"
                      id="propertyId"
                      value={propertyId}
                      onChange={(e) => setPropertyId(e.target.value)}
                      className="form-input"
                      placeholder={config.propertyId && !propertyId ? `${config.propertyId} (saved)` : "123456789"}
                    />
                    <p className="text-xs mt-1 opacity-70">GA4 property ID for advanced features</p>
                  </div>

                  <div className="form-field">
                    <label className="form-label" htmlFor="viewId">
                      Data Stream ID (Optional)
                    </label>
                    <input
                      type="text"
                      id="viewId"
                      value={viewId}
                      onChange={(e) => setViewId(e.target.value)}
                      className="form-input"
                      placeholder={config.viewId && !viewId ? `${config.viewId} (saved)` : "1234567890"}
                    />
                    <p className="text-xs mt-1 opacity-70">Data stream ID for specific tracking</p>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={handleClearConfiguration}
                    disabled={!config.configured || loading}
                    className="form-btn form-btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Clear Configuration
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="form-btn form-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined">save</span>
                    {loading ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </form>
            </div>

            {/* Recent Activity */}
            <div className="form-section">
              <h3 className="form-section-title">
                <span className="material-symbols-outlined">history</span>
                Recent API Activity
                <button 
                  onClick={fetchRecentActivities}
                  disabled={activitiesLoading}
                  className="ml-auto text-xs opacity-60 hover:opacity-100 disabled:opacity-40"
                  title="Refresh activities"
                >
                  <span className={`material-symbols-outlined text-sm ${activitiesLoading ? 'animate-spin' : ''}`}>
                    refresh
                  </span>
                </button>
              </h3>
              <div className="timeline-events-container">
                {activitiesLoading ? (
                  <div className="text-center py-8 opacity-60">
                    <span className="material-symbols-outlined animate-spin">sync</span>
                    <p className="mt-2">Loading recent activity...</p>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-8 opacity-60">
                    <span className="material-symbols-outlined">history_off</span>
                    <p className="mt-2">No recent activity found</p>
                    <p className="text-xs mt-1">Activity will appear here after using the API</p>
                  </div>
                ) : (
                  activities.map((activity, index) => (
                    <div key={activity.id} className="timeline-event-item">
                      <div className="timeline-event-connector">
                        <div className={`timeline-event-dot ${getStatusColor(activity.status)}`}>
                          <span className="material-symbols-outlined timeline-event-icon">
                            {getStatusIcon(activity.type, activity.status)}
                          </span>
                        </div>
                        {index < activities.length - 1 && <div className="timeline-event-line"></div>}
                      </div>
                      <div className="timeline-event-content">
                        <h4 className="timeline-event-title">{activity.title}</h4>
                        <div className="timeline-event-date">{activity.timeAgo}</div>
                        {activity.description && (
                          <p className="timeline-event-description">{activity.description}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Analytics Reports */}
            {showAnalytics && analyticsData.length > 0 && (
              <div className="form-section">
                <h3 className="form-section-title">
                  <span className="material-symbols-outlined">insights</span>
                  Analytics Reports
                </h3>
                <div className="space-y-4">
                  {analyticsData.map((report) => (
                    <div key={report.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-lg">{report.name}</h4>
                        <span className={`status-badge ${
                          report.type === 'REALTIME' ? 'status-active' :
                          report.type === 'STANDARD' ? 'status-inactive' : 'status-error'
                        }`}>
                          {report.type}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="detail-item">
                          <h5 className="form-label">Sessions</h5>
                          <p className="detail-value">{report.sessions.toLocaleString()}</p>
                        </div>
                        <div className="detail-item">
                          <h5 className="form-label">Users</h5>
                          <p className="detail-value">{report.users.toLocaleString()}</p>
                        </div>
                        <div className="detail-item">
                          <h5 className="form-label">Pageviews</h5>
                          <p className="detail-value">{report.pageviews.toLocaleString()}</p>
                        </div>
                        <div className="detail-item">
                          <h5 className="form-label">Bounce Rate</h5>
                          <p className="detail-value">{report.bounceRate.toFixed(2)}%</p>
                        </div>
                        <div className="detail-item">
                          <h5 className="form-label">Avg Session</h5>
                          <p className="detail-value">{Math.floor(report.avgSessionDuration / 60)}m {report.avgSessionDuration % 60}s</p>
                        </div>
                        <div className="detail-item">
                          <h5 className="form-label">Goals</h5>
                          <p className="detail-value">{report.goalCompletions}</p>
                        </div>
                        <div className="detail-item">
                          <h5 className="form-label">Conv. Rate</h5>
                          <p className="detail-value">{report.conversionRate.toFixed(2)}%</p>
                        </div>
                        <div className="detail-item">
                          <h5 className="form-label">Revenue</h5>
                          <p className="detail-value">${report.revenue.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="text-sm opacity-70">
                        Period: {new Date(report.startDate).toLocaleDateString()} - {new Date(report.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}