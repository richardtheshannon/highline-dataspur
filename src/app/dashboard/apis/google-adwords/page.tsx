'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function GoogleAdWordsPage() {
  const router = useRouter()
  const [apiKey, setApiKey] = useState('')
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [developerToken, setDeveloperToken] = useState('')
  const [isConfigured, setIsConfigured] = useState(false)

  const handleSaveConfiguration = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically save the configuration to your backend
    setIsConfigured(true)
  }

  return (
    <div className="safe-margin">
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
                <span className={`status-badge ${isConfigured ? 'status-active' : 'status-inactive'}`}>
                  {isConfigured ? 'Connected' : 'Not Connected'}
                </span>
              </div>
              {isConfigured && (
                <div className="mt-4">
                  <p className="text-sm text-green-500">✓ API is configured and ready to use</p>
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
                <button className="form-btn form-btn-secondary w-full">
                  <span className="material-symbols-outlined">sync</span>
                  Test Connection
                </button>
                <button className="form-btn form-btn-secondary w-full">
                  <span className="material-symbols-outlined">download</span>
                  Export Data
                </button>
                <button className="form-btn form-btn-secondary w-full">
                  <span className="material-symbols-outlined">analytics</span>
                  View Analytics
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
                      placeholder="Enter your developer token"
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
                      placeholder="Your OAuth2 client ID"
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
                      placeholder="Your OAuth2 client secret"
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
                      placeholder="Optional API key for additional features"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setApiKey('')
                      setClientId('')
                      setClientSecret('')
                      setDeveloperToken('')
                      setIsConfigured(false)
                    }}
                    className="form-btn form-btn-secondary"
                  >
                    Clear Configuration
                  </button>
                  <button
                    type="submit"
                    className="form-btn form-btn-primary"
                  >
                    <span className="material-symbols-outlined">save</span>
                    Save Configuration
                  </button>
                </div>
              </form>
            </div>

            {/* Recent Activity */}
            <div className="form-section">
              <h3 className="form-section-title">
                <span className="material-symbols-outlined">history</span>
                Recent API Activity
              </h3>
              <div className="timeline-events-container">
                <div className="timeline-event-item">
                  <div className="timeline-event-connector">
                    <div className="timeline-event-dot bg-green-500">
                      <span className="material-symbols-outlined timeline-event-icon">check_circle</span>
                    </div>
                    <div className="timeline-event-line"></div>
                  </div>
                  <div className="timeline-event-content">
                    <h4 className="timeline-event-title">Campaign data synced</h4>
                    <div className="timeline-event-date">2 hours ago</div>
                    <p className="timeline-event-description">Successfully synced 15 campaigns</p>
                  </div>
                </div>
                
                <div className="timeline-event-item">
                  <div className="timeline-event-connector">
                    <div className="timeline-event-dot bg-blue-500">
                      <span className="material-symbols-outlined timeline-event-icon">sync</span>
                    </div>
                    <div className="timeline-event-line"></div>
                  </div>
                  <div className="timeline-event-content">
                    <h4 className="timeline-event-title">Keywords updated</h4>
                    <div className="timeline-event-date">5 hours ago</div>
                    <p className="timeline-event-description">Updated 250 keyword bids</p>
                  </div>
                </div>
                
                <div className="timeline-event-item">
                  <div className="timeline-event-connector">
                    <div className="timeline-event-dot bg-orange-500">
                      <span className="material-symbols-outlined timeline-event-icon">warning</span>
                    </div>
                  </div>
                  <div className="timeline-event-content">
                    <h4 className="timeline-event-title">Rate limit warning</h4>
                    <div className="timeline-event-date">Yesterday</div>
                    <p className="timeline-event-description">Approaching daily API limit (14,500/15,000)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}