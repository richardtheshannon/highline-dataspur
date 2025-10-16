/**
 * Google Ads Insights Engine
 * Analyzes campaign performance data and generates actionable insights
 */

export interface Campaign {
  id: string
  name: string
  status: 'enabled' | 'paused' | 'removed'
  impressions: number
  clicks: number
  conversions: number
  cost: number
  ctr: number
  conversionRate: number
  cpc: number
  cpa: number
}

export interface Insight {
  id: string
  type: 'success' | 'warning' | 'danger' | 'info'
  category: 'performance' | 'spending' | 'conversion' | 'efficiency'
  title: string
  description: string
  metric?: string
  value?: string
  recommendation?: string
  priority: number // 1-10, 10 being highest
  campaignId?: string
  campaignName?: string
}

export interface CampaignRanking {
  campaignId: string
  campaignName: string
  rank: number
  score: number
  metrics: {
    ctr: number
    ctrRank: number
    cvr: number
    cvrRank: number
    cpa: number
    cpaRank: number
    cpc: number
    cpcRank: number
    conversions: number
    conversionsRank: number
    cost: number
  }
  status: 'excellent' | 'good' | 'fair' | 'poor'
  color: string
}

/**
 * Generate insights from campaign data
 */
export function generateInsights(
  campaigns: Campaign[],
  totals: {
    impressions: number
    clicks: number
    conversions: number
    cost: number
    ctr: number
    conversionRate: number
    cpc: number
    cpa: number
  },
  targetCPA: number = 50,
  monthlyBudget: number = 5000
): Insight[] {
  const insights: Insight[] = []
  const enabledCampaigns = campaigns.filter(c => c.status === 'enabled')

  if (enabledCampaigns.length === 0) {
    return [{
      id: 'no-campaigns',
      type: 'info',
      category: 'performance',
      title: 'No Active Campaigns',
      description: 'You currently have no enabled campaigns running.',
      priority: 10
    }]
  }

  // 1. Top Performer Insight
  const topPerformer = findTopPerformer(enabledCampaigns)
  if (topPerformer) {
    insights.push({
      id: 'top-performer',
      type: 'success',
      category: 'performance',
      title: 'Top Performing Campaign',
      description: `${topPerformer.name} is your best performer with ${topPerformer.conversions} conversions at ${formatCurrency(topPerformer.cpa)} CPA.`,
      metric: 'Conversions',
      value: topPerformer.conversions.toString(),
      recommendation: topPerformer.cpa < targetCPA ?
        'Consider increasing budget for this high-performing campaign.' :
        'Monitor closely to maintain performance.',
      priority: 9,
      campaignId: topPerformer.id,
      campaignName: topPerformer.name
    })
  }

  // 2. High CPA Warning
  const highCPACampaigns = enabledCampaigns.filter(c => c.cpa > targetCPA && c.conversions > 0)
  if (highCPACampaigns.length > 0) {
    const worstCPA = highCPACampaigns.sort((a, b) => b.cpa - a.cpa)[0]
    insights.push({
      id: 'high-cpa-warning',
      type: 'danger',
      category: 'conversion',
      title: 'High Cost Per Acquisition',
      description: `${worstCPA.name} has a CPA of ${formatCurrency(worstCPA.cpa)}, which is ${Math.round((worstCPA.cpa / targetCPA - 1) * 100)}% above your target of ${formatCurrency(targetCPA)}.`,
      metric: 'CPA',
      value: formatCurrency(worstCPA.cpa),
      recommendation: 'Review ad copy, targeting, and landing page relevance. Consider pausing if performance doesn\'t improve.',
      priority: 8,
      campaignId: worstCPA.id,
      campaignName: worstCPA.name
    })
  }

  // 3. Low CTR Warning
  const lowCTRCampaigns = enabledCampaigns.filter(c => c.ctr < 1.0 && c.impressions > 100)
  if (lowCTRCampaigns.length > 0) {
    const worstCTR = lowCTRCampaigns.sort((a, b) => a.ctr - b.ctr)[0]
    insights.push({
      id: 'low-ctr-warning',
      type: 'warning',
      category: 'efficiency',
      title: 'Low Click-Through Rate',
      description: `${worstCTR.name} has a CTR of ${worstCTR.ctr.toFixed(2)}%, below the recommended 1% minimum.`,
      metric: 'CTR',
      value: `${worstCTR.ctr.toFixed(2)}%`,
      recommendation: 'Improve ad relevance, test new ad copy, and refine keyword targeting.',
      priority: 7,
      campaignId: worstCTR.id,
      campaignName: worstCTR.name
    })
  }

  // 4. High Spending with Low Conversions
  const avgCostPerCampaign = totals.cost / enabledCampaigns.length
  const highSpendLowConversion = enabledCampaigns.filter(
    c => c.cost > avgCostPerCampaign && c.conversionRate < 1.0
  )
  if (highSpendLowConversion.length > 0) {
    const worst = highSpendLowConversion.sort((a, b) => (b.cost / b.conversions) - (a.cost / a.conversions))[0]
    insights.push({
      id: 'high-spend-low-conversion',
      type: 'danger',
      category: 'spending',
      title: 'High Spend, Low Conversion Rate',
      description: `${worst.name} is spending ${formatCurrency(worst.cost)} but converting at only ${worst.conversionRate.toFixed(2)}%.`,
      metric: 'CVR',
      value: `${worst.conversionRate.toFixed(2)}%`,
      recommendation: 'Analyze search terms, exclude non-converting keywords, and optimize landing page.',
      priority: 8,
      campaignId: worst.id,
      campaignName: worst.name
    })
  }

  // 5. Efficient Campaign (Low CPA, High Conversions)
  const efficientCampaigns = enabledCampaigns.filter(
    c => c.cpa < targetCPA * 0.8 && c.conversions >= 5
  )
  if (efficientCampaigns.length > 0) {
    const best = efficientCampaigns.sort((a, b) => a.cpa - b.cpa)[0]
    insights.push({
      id: 'efficient-campaign',
      type: 'success',
      category: 'efficiency',
      title: 'Highly Efficient Campaign',
      description: `${best.name} is delivering conversions 20% below target CPA at ${formatCurrency(best.cpa)}.`,
      metric: 'CPA',
      value: formatCurrency(best.cpa),
      recommendation: 'Excellent performance! Consider scaling this campaign with increased budget.',
      priority: 7,
      campaignId: best.id,
      campaignName: best.name
    })
  }

  // 6. Budget Pacing Alert
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const totalDays = endOfMonth.getDate()
  const elapsedDays = now.getDate()
  const percentElapsed = (elapsedDays / totalDays) * 100
  const percentSpent = (totals.cost / monthlyBudget) * 100

  if (percentSpent > percentElapsed + 15) {
    insights.push({
      id: 'budget-overspending',
      type: 'danger',
      category: 'spending',
      title: 'Budget Overspending Detected',
      description: `You've spent ${percentSpent.toFixed(0)}% of your monthly budget with ${percentElapsed.toFixed(0)}% of the month elapsed.`,
      metric: 'Budget',
      value: formatCurrency(totals.cost),
      recommendation: 'Reduce daily budgets or pause underperforming campaigns to avoid exceeding monthly budget.',
      priority: 9
    })
  } else if (percentSpent < percentElapsed - 15) {
    insights.push({
      id: 'budget-underspending',
      type: 'warning',
      category: 'spending',
      title: 'Budget Underspending',
      description: `You've only spent ${percentSpent.toFixed(0)}% of your budget with ${percentElapsed.toFixed(0)}% of the month elapsed.`,
      metric: 'Budget',
      value: formatCurrency(totals.cost),
      recommendation: 'Consider increasing daily budgets for high-performing campaigns to maximize reach.',
      priority: 6
    })
  }

  // 7. Zero Conversions Warning
  const zeroConversionCampaigns = enabledCampaigns.filter(c => c.conversions === 0 && c.clicks > 20)
  if (zeroConversionCampaigns.length > 0) {
    insights.push({
      id: 'zero-conversions',
      type: 'danger',
      category: 'conversion',
      title: 'Campaigns With Zero Conversions',
      description: `${zeroConversionCampaigns.length} campaign(s) have clicks but no conversions. Total wasted spend: ${formatCurrency(zeroConversionCampaigns.reduce((sum, c) => sum + c.cost, 0))}.`,
      metric: 'Conversions',
      value: '0',
      recommendation: 'Verify conversion tracking setup. If tracking is correct, pause these campaigns immediately.',
      priority: 10
    })
  }

  // 8. High Impression Share Opportunity
  const highImpressionCampaigns = enabledCampaigns.filter(c => c.impressions > totals.impressions * 0.3)
  if (highImpressionCampaigns.length > 0 && totals.ctr > 2.0) {
    const campaign = highImpressionCampaigns[0]
    insights.push({
      id: 'scale-opportunity',
      type: 'info',
      category: 'performance',
      title: 'Growth Opportunity Detected',
      description: `${campaign.name} is driving ${Math.round((campaign.impressions / totals.impressions) * 100)}% of total impressions with strong CTR.`,
      metric: 'Impressions',
      value: formatNumber(campaign.impressions),
      recommendation: 'Campaign is showing strong engagement. Consider expanding keyword targeting or increasing budget.',
      priority: 6,
      campaignId: campaign.id,
      campaignName: campaign.name
    })
  }

  // Sort by priority (highest first)
  return insights.sort((a, b) => b.priority - a.priority)
}

/**
 * Find the top performing campaign based on efficiency score
 */
function findTopPerformer(campaigns: Campaign[]): Campaign | null {
  if (campaigns.length === 0) return null

  const campaignsWithConversions = campaigns.filter(c => c.conversions > 0)
  if (campaignsWithConversions.length === 0) {
    // If no conversions, return campaign with highest CTR
    return campaigns.sort((a, b) => b.ctr - a.ctr)[0]
  }

  // Score based on: conversion rate (40%), low CPA (40%), CTR (20%)
  const scored = campaignsWithConversions.map(c => ({
    campaign: c,
    score: (c.conversionRate * 0.4) + ((100 / (c.cpa || 100)) * 0.4) + (c.ctr * 0.2)
  }))

  return scored.sort((a, b) => b.score - a.score)[0].campaign
}

/**
 * Rank campaigns by overall performance
 */
export function rankCampaigns(campaigns: Campaign[]): CampaignRanking[] {
  const enabledCampaigns = campaigns.filter(c => c.status === 'enabled')

  if (enabledCampaigns.length === 0) return []

  // Calculate ranks for each metric
  const ctrRanked = [...enabledCampaigns].sort((a, b) => b.ctr - a.ctr)
  const cvrRanked = [...enabledCampaigns].sort((a, b) => b.conversionRate - a.conversionRate)
  const cpaRanked = [...enabledCampaigns].sort((a, b) => a.cpa - b.cpa) // Lower is better
  const cpcRanked = [...enabledCampaigns].sort((a, b) => a.cpc - b.cpc) // Lower is better
  const conversionsRanked = [...enabledCampaigns].sort((a, b) => b.conversions - a.conversions)

  const rankings: CampaignRanking[] = enabledCampaigns.map(campaign => {
    const ctrRank = ctrRanked.findIndex(c => c.id === campaign.id) + 1
    const cvrRank = cvrRanked.findIndex(c => c.id === campaign.id) + 1
    const cpaRank = cpaRanked.findIndex(c => c.id === campaign.id) + 1
    const cpcRank = cpcRanked.findIndex(c => c.id === campaign.id) + 1
    const conversionsRank = conversionsRanked.findIndex(c => c.id === campaign.id) + 1

    // Calculate overall score (lower is better)
    // Weight: conversions (30%), CPA (30%), CVR (20%), CTR (10%), CPC (10%)
    const score = (conversionsRank * 0.3) + (cpaRank * 0.3) + (cvrRank * 0.2) + (ctrRank * 0.1) + (cpcRank * 0.1)

    // Determine status and color
    let status: 'excellent' | 'good' | 'fair' | 'poor'
    let color: string

    if (score <= enabledCampaigns.length * 0.25) {
      status = 'excellent'
      color = '#10b981' // green
    } else if (score <= enabledCampaigns.length * 0.5) {
      status = 'good'
      color = '#3b82f6' // blue
    } else if (score <= enabledCampaigns.length * 0.75) {
      status = 'fair'
      color = '#f59e0b' // orange
    } else {
      status = 'poor'
      color = '#ef4444' // red
    }

    return {
      campaignId: campaign.id,
      campaignName: campaign.name,
      rank: 0, // Will be set after sorting
      score,
      metrics: {
        ctr: campaign.ctr,
        ctrRank,
        cvr: campaign.conversionRate,
        cvrRank,
        cpa: campaign.cpa,
        cpaRank,
        cpc: campaign.cpc,
        cpcRank,
        conversions: campaign.conversions,
        conversionsRank,
        cost: campaign.cost
      },
      status,
      color
    }
  })

  // Sort by score and assign final ranks
  rankings.sort((a, b) => a.score - b.score)
  rankings.forEach((ranking, index) => {
    ranking.rank = index + 1
  })

  return rankings
}

/**
 * Helper formatting functions
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toFixed(0)
}
