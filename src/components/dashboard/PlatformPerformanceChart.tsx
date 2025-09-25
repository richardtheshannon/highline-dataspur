'use client'

import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import DocumentedTitle from '@/components/help/DocumentedTitle'
import { platformPerformanceDoc } from '@/data/helpDocumentation'

// Platform colors
const PLATFORM_COLORS: Record<string, string> = {
  'Google AdWords': '#FF6B35',
  'Google Adwords': '#FF6B35', // Handle both cases
  'Facebook Ads': '#1877F2',
  'Twitter Ads': '#1DA1F2',
  'LinkedIn Ads': '#0077B5',
  'Instagram': '#E4405F',
  'TikTok': '#25D366'
}

// Generate colors for campaigns
const generateCampaignColor = (campaignName: string, index: number): string => {
  // Use a consistent color scheme for campaigns
  const campaignColors = [
    '#4F46E5', // Indigo
    '#059669', // Emerald
    '#DC2626', // Red
    '#7C3AED', // Violet
    '#DB2777', // Pink
    '#EA580C', // Orange
    '#0284C7', // Sky
    '#16A34A'  // Green
  ]

  // If it's a Google Ads campaign, use variations of the primary color
  if (campaignName.toLowerCase().includes('call') || campaignName.toLowerCase().includes('lead')) {
    return '#FF8B35' // Lighter orange for Call Lead Focus
  }
  if (campaignName.toLowerCase().includes('website') || campaignName.toLowerCase().includes('performance')) {
    return '#FF4F35' // Darker orange for Website traffic
  }

  return campaignColors[index % campaignColors.length]
}

interface PlatformMetrics {
  chartData: any[]
  insights: {
    topPerformer: string | null
    topValue: number
    growthTrend: 'positive' | 'negative' | 'neutral'
    totalPlatforms: number
  }
  connectedPlatforms: Array<{
    provider: string
    name: string
    status: string
  }>
}

export default function PlatformPerformanceChart() {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPlatformMetrics()
  }, [])

  const fetchPlatformMetrics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/apis/platform-metrics')

      if (!response.ok) {
        throw new Error('Failed to fetch platform metrics')
      }

      const data = await response.json()
      console.log('Platform metrics data:', data) // Debug log
      console.log('Connected platforms count:', data.connectedPlatforms?.length)
      console.log('Connected platforms:', data.connectedPlatforms)
      console.log('Chart data length:', data.chartData?.length)
      console.log('Chart data sample:', data.chartData?.slice(0, 3))
      console.log('First chart data item keys:', Object.keys(data.chartData?.[0] || {}))
      console.log('Sample values:', data.chartData?.[0])
      console.log('Insights:', data.insights)
      setMetrics(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching platform metrics:', err)
      setError('Failed to load platform metrics')
      setMetrics(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="chart-container">
        <div className="chart-header">
          <DocumentedTitle 
            className="chart-title"
            title="Platform Performance Analytics"
            documentation={platformPerformanceDoc}
            as="h2"
          />
          <p className="chart-subtitle">Loading platform data...</p>
        </div>
        <div style={{ width: '100%', height: '400px', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="material-symbols-outlined animate-spin" style={{ fontSize: '2rem', color: 'var(--text-secondary)' }}>refresh</span>
        </div>
      </div>
    )
  }

  if (error || !metrics || metrics.connectedPlatforms.length === 0) {
    return (
      <div className="chart-container">
        <div className="chart-header">
          <DocumentedTitle 
            className="chart-title"
            title="Platform Performance Analytics"
            documentation={platformPerformanceDoc}
            as="h2"
          />
          <p className="chart-subtitle">Connect advertising platforms to see performance metrics</p>
        </div>
        <div style={{ width: '100%', height: '400px', marginTop: '1rem' }}>
          <div className="empty-state" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined empty-icon" style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.3 }}>analytics</span>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>No Connected Platforms</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '400px' }}>
              Connect your advertising platforms to see performance analytics. Start by connecting Google AdWords, Facebook Ads, or other platforms.
            </p>
            <button 
              onClick={() => window.location.href = '/dashboard/apis'}
              className="form-btn form-btn-primary"
              style={{ marginTop: '1.5rem' }}
            >
              <span className="material-symbols-outlined" style={{ marginRight: '0.5rem' }}>add_circle</span>
              Connect Platform
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Get all platform names from the data - use the keys from chartData instead of deriving from provider
  const platforms = Object.keys(metrics.chartData[0] || {}).filter(key => key !== 'name')
  console.log('Platform names from chart data:', platforms)


  return (
    <div className="chart-container">
      <div className="chart-header">
        <DocumentedTitle 
          className="chart-title"
          title="Platform Performance Analytics"
          documentation={platformPerformanceDoc}
          as="h2"
        />
        <p className="chart-subtitle">
          Monthly conversions across {platforms.length} metric{platforms.length !== 1 ? 's' : ''} from {metrics.insights.totalPlatforms} connected platform{metrics.insights.totalPlatforms !== 1 ? 's' : ''}
        </p>
      </div>
      
      <div style={{ width: '100%', height: '400px', marginTop: '1rem' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={metrics.chartData}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 40,
            }}
          >
            <defs>
              {platforms.map((platform, index) => {
                const color = PLATFORM_COLORS[platform] || generateCampaignColor(platform, index)
                return (
                  <linearGradient key={`gradient-${platform}`} id={`color-${platform.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
                  </linearGradient>
                )
              })}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
            <XAxis
              dataKey="name"
              stroke="var(--text-secondary)"
              fontSize={12}
              tickMargin={10}
            />
            <YAxis
              stroke="var(--text-secondary)"
              fontSize={12}
              tickMargin={10}
              tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value.toString()}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div style={{
                      background: 'var(--card-bg)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '0.75rem',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}>
                      <p style={{ color: 'var(--text-primary)', margin: 0, fontWeight: 500, marginBottom: '0.5rem' }}>{label}</p>
                      {payload.map((entry: any, index: number) => (
                        <p key={index} style={{
                          color: entry.color,
                          margin: 0,
                          marginBottom: '0.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <span style={{
                            width: '12px',
                            height: '12px',
                            background: entry.color,
                            borderRadius: '2px'
                          }}></span>
                          <span style={{ fontSize: '0.875rem' }}>
                            {entry.dataKey}: {entry.value?.toLocaleString()} conversions
                          </span>
                        </p>
                      ))}
                    </div>
                  )
                }
                return null
              }}
            />
            <Legend
              wrapperStyle={{
                paddingTop: '15px',
                fontSize: '12px',
                color: 'var(--text-secondary)'
              }}
            />
            {platforms.map((platform, index) => {
              const color = PLATFORM_COLORS[platform] || generateCampaignColor(platform, index)
              return (
                <Area
                  key={platform}
                  type="monotone"
                  dataKey={platform}
                  stackId="1"
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#color-${platform.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '')})`}
                />
              )
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="chart-insights" style={{ marginTop: '1rem' }}>
        <div className="insight-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          {metrics.insights.topPerformer && (
            <div className="insight-card">
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: '600' }}>Top Performer</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>
                {metrics.insights.topPerformer} leads with {metrics.insights.topValue >= 1000 ? 
                  `${(metrics.insights.topValue / 1000).toFixed(1)}K` : 
                  metrics.insights.topValue.toString()} conversions
              </p>
            </div>
          )}
          <div className="insight-card">
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: '600' }}>Connected Platforms</h4>
            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>
              {metrics.insights.totalPlatforms} platform{metrics.insights.totalPlatforms !== 1 ? 's' : ''} actively monitored
            </p>
          </div>
          {metrics.insights.growthTrend && (
            <div className="insight-card">
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: '600' }}>Growth Trend</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>
                {metrics.insights.growthTrend === 'positive' ? 'Positive momentum across platforms' :
                 metrics.insights.growthTrend === 'negative' ? 'Declining trend - review strategy' :
                 'Stable performance across platforms'}
              </p>
            </div>
          )}
          <div className="insight-card">
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: '600' }}>Platform Status</h4>
            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>
              All connected platforms are {metrics.connectedPlatforms.every(p => p.status === 'ACTIVE') ? 'active' : 'configured'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}