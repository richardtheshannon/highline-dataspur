import React from 'react'
import { Insight } from '@/lib/adsInsightsEngine'

interface InsightsPanelProps {
  insights: Insight[]
  onInsightClick?: (insight: Insight) => void
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({ insights, onInsightClick }) => {
  if (insights.length === 0) {
    return (
      <div className="dashboard-card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', color: 'var(--accent)' }}>
              lightbulb
            </span>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '500', color: 'var(--text-primary)' }}>
              Smart Insights
            </h3>
          </div>
        </div>
        <div className="card-content" style={{ padding: '2rem', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--text-secondary)', opacity: 0.5 }}>
            psychology
          </span>
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
            No insights available yet. Start running campaigns to get actionable recommendations.
          </p>
        </div>
      </div>
    )
  }

  const getInsightIcon = (type: Insight['type'], category: Insight['category']): string => {
    switch (category) {
      case 'performance':
        return type === 'success' ? 'trending_up' : 'monitoring'
      case 'spending':
        return type === 'danger' ? 'payments' : 'account_balance_wallet'
      case 'conversion':
        return type === 'danger' ? 'warning' : 'task_alt'
      case 'efficiency':
        return type === 'success' ? 'speed' : 'tune'
      default:
        return 'info'
    }
  }

  const getInsightColor = (type: Insight['type']): string => {
    switch (type) {
      case 'success':
        return '#10b981'
      case 'warning':
        return '#f59e0b'
      case 'danger':
        return '#ef4444'
      case 'info':
        return '#3b82f6'
    }
  }

  const getInsightBgColor = (type: Insight['type']): string => {
    switch (type) {
      case 'success':
        return '#10b98110'
      case 'warning':
        return '#f59e0b10'
      case 'danger':
        return '#ef444410'
      case 'info':
        return '#3b82f610'
    }
  }

  return (
    <div className="dashboard-card">
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', color: 'var(--accent)' }}>
            lightbulb
          </span>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '500', color: 'var(--text-primary)' }}>
            Smart Insights
          </h3>
        </div>
        <div style={{
          padding: '0.25rem 0.75rem',
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: '500',
          background: 'var(--accent-bg)',
          color: 'var(--accent)'
        }}>
          {insights.length} insight{insights.length !== 1 ? 's' : ''}
        </div>
      </div>
      <div className="card-content" style={{ padding: '0' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {insights.slice(0, 6).map((insight, index) => (
            <div
              key={insight.id}
              onClick={() => onInsightClick?.(insight)}
              style={{
                padding: '1rem',
                borderBottom: index < Math.min(insights.length, 6) - 1 ? '1px solid var(--border-color)' : 'none',
                cursor: onInsightClick ? 'pointer' : 'default',
                transition: 'background 0.2s ease',
                background: 'transparent'
              }}
              onMouseEnter={(e) => {
                if (onInsightClick) {
                  e.currentTarget.style.background = 'var(--hover-bg)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                {/* Icon */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  background: getInsightBgColor(insight.type),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <span className="material-symbols-outlined" style={{
                    fontSize: '1.25rem',
                    color: getInsightColor(insight.type)
                  }}>
                    {getInsightIcon(insight.type, insight.category)}
                  </span>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Title and Category */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                    <h4 style={{
                      margin: 0,
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: 'var(--text-primary)'
                    }}>
                      {insight.title}
                    </h4>
                    <span style={{
                      fontSize: '0.625rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: getInsightColor(insight.type),
                      padding: '0.125rem 0.5rem',
                      borderRadius: '8px',
                      background: getInsightBgColor(insight.type)
                    }}>
                      {insight.category}
                    </span>
                  </div>

                  {/* Description */}
                  <p style={{
                    margin: '0 0 0.5rem 0',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.4'
                  }}>
                    {insight.description}
                  </p>

                  {/* Metric Display */}
                  {insight.metric && insight.value && (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.25rem 0.75rem',
                      background: 'var(--background-secondary)',
                      borderRadius: '6px',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        {insight.metric}:
                      </span>
                      <span style={{
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        color: getInsightColor(insight.type)
                      }}>
                        {insight.value}
                      </span>
                    </div>
                  )}

                  {/* Recommendation */}
                  {insight.recommendation && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.5rem',
                      padding: '0.75rem',
                      background: getInsightBgColor(insight.type),
                      borderRadius: '6px',
                      borderLeft: `3px solid ${getInsightColor(insight.type)}`
                    }}>
                      <span className="material-symbols-outlined" style={{
                        fontSize: '1rem',
                        color: getInsightColor(insight.type),
                        flexShrink: 0
                      }}>
                        tips_and_updates
                      </span>
                      <p style={{
                        margin: 0,
                        fontSize: '0.75rem',
                        color: 'var(--text-primary)',
                        lineHeight: '1.4',
                        fontWeight: '500'
                      }}>
                        {insight.recommendation}
                      </p>
                    </div>
                  )}

                  {/* Campaign Name */}
                  {insight.campaignName && (
                    <div style={{
                      marginTop: '0.5rem',
                      fontSize: '0.7rem',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>
                        campaign
                      </span>
                      {insight.campaignName}
                    </div>
                  )}
                </div>

                {/* Priority Badge */}
                {insight.priority >= 8 && (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: insight.priority >= 9 ? '#ef4444' : '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <span className="material-symbols-outlined" style={{
                      fontSize: '1rem',
                      color: 'white'
                    }}>
                      priority_high
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Show More Button */}
        {insights.length > 6 && (
          <div style={{
            padding: '0.75rem',
            borderTop: '1px solid var(--border-color)',
            textAlign: 'center'
          }}>
            <button
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent)',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--hover-bg)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              View {insights.length - 6} more insight{insights.length - 6 !== 1 ? 's' : ''}
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .card-content {
            font-size: 0.875rem;
          }
        }
      `}</style>
    </div>
  )
}

export default InsightsPanel
