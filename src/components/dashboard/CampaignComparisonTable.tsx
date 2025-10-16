import React from 'react'
import { CampaignRanking } from '@/lib/adsInsightsEngine'
import DocumentedTitle from '@/components/help/DocumentedTitle'
import { campaignRankingsDoc } from '@/data/helpDocumentation'

interface CampaignComparisonTableProps {
  rankings: CampaignRanking[]
  onCampaignClick?: (campaignId: string) => void
}

const CampaignComparisonTable: React.FC<CampaignComparisonTableProps> = ({ rankings, onCampaignClick }) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatPercentage = (value: number): string => {
    return value.toFixed(2) + '%'
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toFixed(0)
  }

  const getRankBadgeColor = (rank: number, total: number): string => {
    const percentile = rank / total
    if (percentile <= 0.25) return '#10b981' // Top 25% - Green
    if (percentile <= 0.5) return '#3b82f6'  // Top 50% - Blue
    if (percentile <= 0.75) return '#f59e0b' // Top 75% - Orange
    return '#ef4444' // Bottom 25% - Red
  }

  const getMetricRankBadge = (rank: number, total: number) => {
    const color = getRankBadgeColor(rank, total)
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: `${color}20`,
        color: color,
        fontSize: '0.7rem',
        fontWeight: '700'
      }}>
        {rank}
      </span>
    )
  }

  if (rankings.length === 0) {
    return (
      <div className="dashboard-card">
        <div className="card-header">
          <DocumentedTitle
            className=""
            icon="leaderboard"
            title="Campaign Performance Rankings"
            documentation={campaignRankingsDoc}
            as="h3"
          />
        </div>
        <div className="card-content" style={{ padding: '2rem', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--text-secondary)', opacity: 0.5 }}>
            bar_chart
          </span>
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
            No active campaigns to compare yet.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-card">
      <div className="card-header">
        <DocumentedTitle
          className=""
          icon="leaderboard"
          title="Campaign Performance Rankings"
          documentation={campaignRankingsDoc}
          as="h3"
        />
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--text-secondary)'
        }}>
          {rankings.length} campaign{rankings.length !== 1 ? 's' : ''} compared
        </div>
      </div>
      <div className="card-content" style={{ padding: '0', overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.875rem'
        }}>
          <thead>
            <tr style={{
              background: 'var(--background-secondary)',
              borderBottom: '2px solid var(--border-color)'
            }}>
              <th style={{
                padding: '0.75rem 1rem',
                textAlign: 'left',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                position: 'sticky',
                left: 0,
                background: 'var(--background-secondary)',
                zIndex: 1
              }}>
                Rank
              </th>
              <th style={{
                padding: '0.75rem 1rem',
                textAlign: 'left',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                minWidth: '180px'
              }}>
                Campaign
              </th>
              <th style={{
                padding: '0.75rem 1rem',
                textAlign: 'center',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Status
              </th>
              <th style={{
                padding: '0.75rem 1rem',
                textAlign: 'right',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.125rem' }}>
                  <span>Conversions</span>
                  <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>& Rank</span>
                </div>
              </th>
              <th style={{
                padding: '0.75rem 1rem',
                textAlign: 'right',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.125rem' }}>
                  <span>CPA</span>
                  <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>& Rank</span>
                </div>
              </th>
              <th style={{
                padding: '0.75rem 1rem',
                textAlign: 'right',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.125rem' }}>
                  <span>CVR</span>
                  <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>& Rank</span>
                </div>
              </th>
              <th style={{
                padding: '0.75rem 1rem',
                textAlign: 'right',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.125rem' }}>
                  <span>CTR</span>
                  <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>& Rank</span>
                </div>
              </th>
              <th style={{
                padding: '0.75rem 1rem',
                textAlign: 'right',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.125rem' }}>
                  <span>Cost</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((ranking, index) => (
              <tr
                key={ranking.campaignId}
                onClick={() => onCampaignClick?.(ranking.campaignId)}
                style={{
                  borderBottom: index < rankings.length - 1 ? '1px solid var(--border-color)' : 'none',
                  cursor: onCampaignClick ? 'pointer' : 'default',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (onCampaignClick) {
                    e.currentTarget.style.background = 'var(--hover-bg)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                {/* Rank */}
                <td style={{
                  padding: '0.75rem 1rem',
                  position: 'sticky',
                  left: 0,
                  background: 'inherit',
                  zIndex: 1
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: `${ranking.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '0.875rem',
                    color: ranking.color
                  }}>
                    {ranking.rank}
                  </div>
                </td>

                {/* Campaign Name */}
                <td style={{
                  padding: '0.75rem 1rem',
                  fontWeight: '500',
                  color: 'var(--text-primary)'
                }}>
                  <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ranking.campaignName}>
                    {ranking.campaignName}
                  </div>
                </td>

                {/* Status Badge */}
                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    background: `${ranking.color}20`,
                    color: ranking.color
                  }}>
                    {ranking.status}
                  </span>
                </td>

                {/* Conversions */}
                <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                      {formatNumber(ranking.metrics.conversions)}
                    </span>
                    {getMetricRankBadge(ranking.metrics.conversionsRank, rankings.length)}
                  </div>
                </td>

                {/* CPA */}
                <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                      {formatCurrency(ranking.metrics.cpa)}
                    </span>
                    {getMetricRankBadge(ranking.metrics.cpaRank, rankings.length)}
                  </div>
                </td>

                {/* CVR */}
                <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                      {formatPercentage(ranking.metrics.cvr)}
                    </span>
                    {getMetricRankBadge(ranking.metrics.cvrRank, rankings.length)}
                  </div>
                </td>

                {/* CTR */}
                <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                      {formatPercentage(ranking.metrics.ctr)}
                    </span>
                    {getMetricRankBadge(ranking.metrics.ctrRank, rankings.length)}
                  </div>
                </td>

                {/* Cost */}
                <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                    {formatCurrency(ranking.metrics.cost)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div style={{
        padding: '1rem',
        borderTop: '1px solid var(--border-color)',
        background: 'var(--background-secondary)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          flexWrap: 'wrap',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>info</span>
            <span>Rankings based on conversions (30%), CPA (30%), CVR (20%), CTR (10%), CPC (10%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }}></div>
              <span>Excellent</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#3b82f6' }}></div>
              <span>Good</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }}></div>
              <span>Fair</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }}></div>
              <span>Poor</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          table {
            font-size: 0.75rem;
          }
          th, td {
            padding: 0.5rem !important;
          }
        }
      `}</style>
    </div>
  )
}

export default CampaignComparisonTable
