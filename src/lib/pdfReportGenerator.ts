import { jsPDF } from 'jspdf'

interface Campaign {
  id: string
  name: string
  status: string
  impressions: number
  clicks: number
  conversions: number
  cost: number
  ctr: number
  conversionRate: number
  cpc: number
  cpa: number
}

interface Totals {
  impressions: number
  clicks: number
  conversions: number
  cost: number
  ctr: number
  conversionRate: number
  cpc: number
  cpa: number
}

interface BudgetPacing {
  monthlyBudget: number
  percentSpent: number
  projectedSpend: number
  remainingBudget: number
  pacingStatus: 'on-track' | 'overspending' | 'underspending'
}

interface ReportData {
  campaigns: Campaign[]
  totals: Totals
  performanceScore: number
  performanceStatus: { label: string; color: string }
  budgetPacing: BudgetPacing
  timeRange: string
  generatedAt: Date
}

/**
 * Generate a PDF report for Google Ads analytics
 */
export function generatePDFReport(data: ReportData): jsPDF {
  const doc = new jsPDF()
  let yPosition = 20

  // Set document properties
  doc.setProperties({
    title: 'Google Ads Analytics Report',
    subject: 'Campaign Performance Report',
    author: 'DataSpur',
    keywords: 'google ads, analytics, report',
    creator: 'DataSpur Analytics Platform'
  })

  // Title
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Google Ads Analytics Report', 105, yPosition, { align: 'center' })
  yPosition += 10

  // Subtitle with date and time range
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `Generated: ${data.generatedAt.toLocaleDateString()} at ${data.generatedAt.toLocaleTimeString()}`,
    105,
    yPosition,
    { align: 'center' }
  )
  yPosition += 5
  doc.text(`Time Range: ${data.timeRange}`, 105, yPosition, { align: 'center' })
  yPosition += 15

  // Performance Score Section
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Account Performance', 20, yPosition)
  yPosition += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Performance Score: ${data.performanceScore}/100`, 20, yPosition)
  yPosition += 6
  doc.text(`Status: ${data.performanceStatus.label}`, 20, yPosition)
  yPosition += 12

  // Budget Pacing Section
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Budget Pacing', 20, yPosition)
  yPosition += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Monthly Budget: $${data.budgetPacing.monthlyBudget.toFixed(2)}`, 20, yPosition)
  yPosition += 6
  doc.text(`Budget Spent: ${data.budgetPacing.percentSpent}%`, 20, yPosition)
  yPosition += 6
  doc.text(`Projected Spend: $${data.budgetPacing.projectedSpend.toFixed(2)}`, 20, yPosition)
  yPosition += 6
  doc.text(`Remaining Budget: $${data.budgetPacing.remainingBudget.toFixed(2)}`, 20, yPosition)
  yPosition += 6
  doc.text(`Status: ${data.budgetPacing.pacingStatus}`, 20, yPosition)
  yPosition += 12

  // Key Metrics Section
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Key Metrics Summary', 20, yPosition)
  yPosition += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  // Create a table-like layout for metrics
  const metrics = [
    ['Impressions', formatNumber(data.totals.impressions)],
    ['Clicks', formatNumber(data.totals.clicks)],
    ['Conversions', formatNumber(data.totals.conversions)],
    ['Cost', `$${data.totals.cost.toFixed(2)}`],
    ['CTR', `${data.totals.ctr.toFixed(2)}%`],
    ['CVR', `${data.totals.conversionRate.toFixed(2)}%`],
    ['CPC', `$${data.totals.cpc.toFixed(2)}`],
    ['CPA', `$${data.totals.cpa.toFixed(2)}`]
  ]

  // Display metrics in two columns
  for (let i = 0; i < metrics.length; i++) {
    const col = i % 2
    const row = Math.floor(i / 2)
    const xPos = 20 + (col * 90)
    const yPos = yPosition + (row * 6)

    doc.text(`${metrics[i][0]}:`, xPos, yPos)
    doc.setFont('helvetica', 'bold')
    doc.text(metrics[i][1], xPos + 40, yPos)
    doc.setFont('helvetica', 'normal')
  }

  yPosition += Math.ceil(metrics.length / 2) * 6 + 12

  // Campaign Performance Table
  if (yPosition > 250) {
    doc.addPage()
    yPosition = 20
  }

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Campaign Performance', 20, yPosition)
  yPosition += 8

  // Table headers
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  const headers = ['Campaign', 'Impressions', 'Clicks', 'Conv.', 'Cost', 'CTR', 'CVR', 'CPA']
  const colWidths = [60, 20, 15, 15, 20, 15, 15, 20]
  let xPos = 20

  headers.forEach((header, i) => {
    doc.text(header, xPos, yPosition)
    xPos += colWidths[i]
  })

  yPosition += 5
  doc.setLineWidth(0.5)
  doc.line(20, yPosition, 190, yPosition)
  yPosition += 5

  // Table rows
  doc.setFont('helvetica', 'normal')
  for (const campaign of data.campaigns.slice(0, 10)) { // Limit to 10 campaigns to fit on page
    if (yPosition > 270) {
      doc.addPage()
      yPosition = 20
    }

    xPos = 20
    const rowData = [
      campaign.name.length > 25 ? campaign.name.substring(0, 22) + '...' : campaign.name,
      formatNumber(campaign.impressions),
      formatNumber(campaign.clicks),
      formatNumber(campaign.conversions),
      `$${campaign.cost.toFixed(0)}`,
      `${campaign.ctr.toFixed(1)}%`,
      `${campaign.conversionRate.toFixed(1)}%`,
      `$${campaign.cpa.toFixed(0)}`
    ]

    rowData.forEach((data, i) => {
      doc.text(data, xPos, yPosition)
      xPos += colWidths[i]
    })

    yPosition += 6
  }

  // Footer on last page
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Page ${i} of ${pageCount}`,
      105,
      290,
      { align: 'center' }
    )
    doc.text('Generated by DataSpur Analytics', 105, 285, { align: 'center' })
  }

  return doc
}

/**
 * Format large numbers with K/M suffixes
 */
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toFixed(0)
}

/**
 * Generate and download PDF report
 */
export function downloadPDFReport(data: ReportData, filename?: string): void {
  const doc = generatePDFReport(data)
  const defaultFilename = `google-ads-report-${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename || defaultFilename)
}
