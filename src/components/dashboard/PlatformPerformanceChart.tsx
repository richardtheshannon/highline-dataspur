'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import DocumentedTitle from '@/components/help/DocumentedTitle'
import { platformPerformanceDoc } from '@/data/helpDocumentation'

// Platform colors
const PLATFORM_COLORS: Record<string, string> = {
  'Google AdWords': '#FF6B35',
  'Facebook Ads': '#1877F2',
  'Twitter Ads': '#1DA1F2',
  'LinkedIn Ads': '#0077B5',
  'Instagram': '#E4405F',
  'TikTok': '#25D366'
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

  // Get all platform names from the data
  const platforms = metrics.connectedPlatforms.map(p => {
    // Format provider name for display
    const displayName = p.provider.replace('_', ' ').split(' ')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ')
    return displayName
  })

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
          Monthly conversions across {metrics.insights.totalPlatforms} connected platform{metrics.insights.totalPlatforms !== 1 ? 's' : ''}
        </p>
      </div>
      
      <div style={{ width: '100%', height: '400px', marginTop: '1rem' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={metrics.chartData}
            margin={{
              top: 10,
              right: 20,
              left: 30,
              bottom: 40,
            }}
          >
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
              contentStyle={{
                backgroundColor: 'var(--background-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '12px'
              }}
              labelStyle={{ color: 'var(--text-primary)' }}
              formatter={(value: any, name: any) => [`${value.toLocaleString()}`, name]}
            />
            <Legend 
              wrapperStyle={{ 
                paddingTop: '10px',
                fontSize: '11px',
                color: 'var(--text-secondary)'
              }}
            />
            {platforms.map((platform) => (
              <Line 
                key={platform}
                type="monotone" 
                dataKey={platform}
                stroke={PLATFORM_COLORS[platform] || '#888888'}
                strokeWidth={2}
                dot={{ fill: PLATFORM_COLORS[platform] || '#888888', strokeWidth: 1, r: 3 }}
                activeDot={{ r: 5, stroke: PLATFORM_COLORS[platform] || '#888888', strokeWidth: 2 }}
              />
            ))}
          </LineChart>
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