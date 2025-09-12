'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ApiConfig {
  id?: string
  configured: boolean
  status: string
  name?: string
  clientId?: string
  hasClientSecret?: boolean
  hasDeveloperToken?: boolean
  hasApiKey?: boolean
  tokenExpiry?: string
  createdAt?: string
  updatedAt?: string
}

interface Campaign {
  id: string
  name: string
  status: string
  budget: number
  spend: number
  impressions: number
  clicks: number
  conversions: number
  ctr: number
  cpc: number
  conversionRate: number
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

export default function GoogleAdWordsPage() {
  const router = useRouter()
  const [apiKey, setApiKey] = useState('')
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [developerToken, setDeveloperToken] = useState('')
  const [config, setConfig] = useState<ApiConfig>({ configured: false, status: 'not_configured' })
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [showCampaigns, setShowCampaigns] = useState(false)
  const [activities, setActivities] = useState<ApiActivity[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(false)

  useEffect(() => {
    fetchConfiguration()
    fetchRecentActivities()
  }, [])

  const fetchRecentActivities = async () => {
    setActivitiesLoading(true)
    try {
      const response = await fetch('/api/apis/google-adwords/activities?limit=5')
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
      const response = await fetch('/api/apis/google-adwords')
      if (response.ok) {
        const data = await response.json()
        console.log('🔍 Fetched configuration:', data) // Debug log
        setConfig(data)
      } else {
        console.error('❌ API response not ok:', response.status, response.statusText)
        // If the response is not ok, check if it's a 404 (no config) vs other errors
        if (response.status === 404 || response.status === 400) {
          // No configuration found - keep default state
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
      const response = await fetch('/api/apis/google-adwords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientId,
          clientSecret,
          developerToken,
          apiKey: apiKey || undefined
        })
      })

      if (response.ok) {
        const data = await response.json()
        setConfig(data)
        setClientId('')
        setClientSecret('')
        setDeveloperToken('')
        setApiKey('')
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
      const response = await fetch('/api/apis/google-adwords/test-connection', {
        method: 'POST'
      })
      
      const result = await response.json()
      if (result.success) {
        alert(`Connection successful! ${result.details}`)
        await fetchConfiguration() // Refresh config to get updated status
        await fetchRecentActivities() // Refresh activities to show the test
      } else {
        alert(`Connection failed: ${result.details}`)
        await fetchRecentActivities() // Refresh activities to show the failed test
      }
    } catch (error) {
      console.error('Test connection error:', error)
      alert('Failed to test connection')
    } finally {
      setTesting(false)
    }
  }

  const handleFetchCampaigns = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/apis/google-adwords/campaigns')
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns)
        setShowCampaigns(true)
        await fetchRecentActivities() // Refresh activities to show the fetch
      } else {
        const error = await response.json()
        alert(`Failed to fetch campaigns: ${error.error}`)
      }
    } catch (error) {
      console.error('Fetch campaigns error:', error)
      alert('Failed to fetch campaigns')
    } finally {
      setLoading(false)
    }
  }

  const handleClearConfiguration = async () => {
    if (!confirm('Are you sure you want to delete the API configuration?')) return
    
    try {
      const response = await fetch('/api/apis/google-adwords', {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setConfig({ configured: false, status: 'not_configured' })
        setClientId('')
        setClientSecret('')
        setDeveloperToken('')
        setApiKey('')
        setCampaigns([])
        setShowCampaigns(false)
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
      case 'CAMPAIGN_FETCH':
      case 'DATA_SYNC':
        return 'sync'
      case 'KEYWORD_UPDATE':
        return 'edit'
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
              <h1 className="create-project-title">Google AdWords API</h1>
              <p className="create-project-subtitle">Configure and manage your Google AdWords integration</p>
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
                  <p className="detail-value">v13.0</p>
                </div>
                <div className="detail-item">
                  <h4 className="form-label">Rate Limit</h4>
                  <p className="detail-value">15,000 requests/day</p>
                </div>
                <div className="detail-item">
                  <h4 className="form-label">Documentation</h4>
                  <a 
                    href="https://developers.google.com/google-ads/api/docs/start"
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
                  onClick={handleFetchCampaigns}
                  disabled={config.status !== 'active' || loading}
                  className="form-btn form-btn-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined">download</span>
                  {loading ? 'Loading...' : 'Fetch Campaigns'}
                </button>
                <button 
                  onClick={() => setShowCampaigns(!showCampaigns)}
                  disabled={campaigns.length === 0}
                  className="form-btn form-btn-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined">analytics</span>
                  {showCampaigns ? 'Hide' : 'View'} Analytics
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
                  <div className="form-field form-field-full">
                    <label className="form-label" htmlFor="developerToken">
                      Developer Token *
                    </label>
                    <input
                      type="password"
                      id="developerToken"
                      value={developerToken}
                      onChange={(e) => setDeveloperToken(e.target.value)}
                      className="form-input"
                      placeholder={config.hasDeveloperToken && !developerToken ? "xxxxxxxxxxxxxxxx (saved)" : "Enter your developer token"}
                      required
                    />
                    <p className="text-xs mt-1 opacity-70">Your Google Ads API developer token</p>
                  </div>

                  <div className="form-field">
                    <label className="form-label" htmlFor="clientId">
                      Client ID *
                    </label>
                    <input
                      type="text"
                      id="clientId"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="form-input"
                      placeholder={config.clientId && !clientId ? `xxxxxxxx${config.clientId.slice(-4)} (saved)` : "Your OAuth2 client ID"}
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label className="form-label" htmlFor="clientSecret">
                      Client Secret *
                    </label>
                    <input
                      type="password"
                      id="clientSecret"
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                      className="form-input"
                      placeholder={config.hasClientSecret && !clientSecret ? "xxxxxxxxxxxxxxxx (saved)" : "Your OAuth2 client secret"}
                      required
                    />
                  </div>

                  <div className="form-field form-field-full">
                    <label className="form-label" htmlFor="apiKey">
                      API Key (Optional)
                    </label>
                    <input
                      type="password"
                      id="apiKey"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="form-input"
                      placeholder={config.hasApiKey && !apiKey ? "xxxxxxxxxxxxxxxx (saved)" : "Optional API key for additional features"}
                    />
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

            {/* Campaigns Analytics */}
            {showCampaigns && campaigns.length > 0 && (
              <div className="form-section">
                <h3 className="form-section-title">
                  <span className="material-symbols-outlined">campaign</span>
                  Campaign Analytics
                </h3>
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-lg">{campaign.name}</h4>
                        <span className={`status-badge ${
                          campaign.status === 'ENABLED' ? 'status-active' :
                          campaign.status === 'PAUSED' ? 'status-inactive' : 'status-error'
                        }`}>
                          {campaign.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="detail-item">
                          <h5 className="form-label">Budget</h5>
                          <p className="detail-value">${campaign.budget.toLocaleString()}</p>
                        </div>
                        <div className="detail-item">
                          <h5 className="form-label">Spend</h5>
                          <p className="detail-value">${campaign.spend.toLocaleString()}</p>
                        </div>
                        <div className="detail-item">
                          <h5 className="form-label">Impressions</h5>
                          <p className="detail-value">{campaign.impressions.toLocaleString()}</p>
                        </div>
                        <div className="detail-item">
                          <h5 className="form-label">Clicks</h5>
                          <p className="detail-value">{campaign.clicks.toLocaleString()}</p>
                        </div>
                        <div className="detail-item">
                          <h5 className="form-label">CTR</h5>
                          <p className="detail-value">{campaign.ctr.toFixed(2)}%</p>
                        </div>
                        <div className="detail-item">
                          <h5 className="form-label">CPC</h5>
                          <p className="detail-value">${campaign.cpc.toFixed(2)}</p>
                        </div>
                        <div className="detail-item">
                          <h5 className="form-label">Conversions</h5>
                          <p className="detail-value">{campaign.conversions}</p>
                        </div>
                        <div className="detail-item">
                          <h5 className="form-label">Conv. Rate</h5>
                          <p className="detail-value">{campaign.conversionRate.toFixed(2)}%</p>
                        </div>
                      </div>
                      
                      <div className="text-sm opacity-70">
                        Period: {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
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