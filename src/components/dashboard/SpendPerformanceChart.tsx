'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const googleData = [
  { name: 'Q1', Spend: 15000, Performance: 85 },
  { name: 'Q2', Spend: 18000, Performance: 78 },
  { name: 'Q3', Spend: 22000, Performance: 92 },
  { name: 'Q4', Spend: 25000, Performance: 88 },
]

const facebookData = [
  { name: 'Q1', Spend: 12000, Performance: 72 },
  { name: 'Q2', Spend: 14500, Performance: 81 },
  { name: 'Q3', Spend: 16800, Performance: 76 },
  { name: 'Q4', Spend: 19200, Performance: 84 },
]

const instagramData = [
  { name: 'Q1', Spend: 8500, Performance: 68 },
  { name: 'Q2', Spend: 11200, Performance: 75 },
  { name: 'Q3', Spend: 13600, Performance: 82 },
  { name: 'Q4', Spend: 16400, Performance: 79 },
]

const tikTokData = [
  { name: 'Q1', Spend: 6000, Performance: 91 },
  { name: 'Q2', Spend: 8800, Performance: 89 },
  { name: 'Q3', Spend: 12500, Performance: 94 },
  { name: 'Q4', Spend: 16200, Performance: 96 },
]

const platformConfigs = [
  {
    name: 'Google Adwords',
    data: googleData,
    spendColor: '#FF6B35',
    performanceColor: '#FF9F66'
  },
  {
    name: 'Facebook',
    data: facebookData,
    spendColor: '#1877F2',
    performanceColor: '#42A5F5'
  },
  {
    name: 'Instagram',
    data: instagramData,
    spendColor: '#E4405F',
    performanceColor: '#F06292'
  },
  {
    name: 'TikTok',
    data: tikTokData,
    spendColor: '#25D366',
    performanceColor: '#66BB6A'
  }
]

interface PlatformChartProps {
  config: typeof platformConfigs[0]
}

function PlatformChart({ config }: PlatformChartProps) {
  return (
    <div className="platform-chart">
      <div className="platform-chart-header">
        <h4 className="platform-name">{config.name}</h4>
      </div>
      
      <div style={{ width: '100%', height: '200px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={config.data}
            margin={{
              top: 10,
              right: 15,
              left: 15,
              bottom: 10,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.2} />
            <XAxis 
              dataKey="name" 
              stroke="var(--text-secondary)"
              fontSize={10}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              yAxisId="spend"
              orientation="left"
              stroke={config.spendColor}
              fontSize={10}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
            />
            <YAxis 
              yAxisId="performance"
              orientation="right"
              stroke={config.performanceColor}
              fontSize={10}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'var(--background-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                fontSize: '11px',
                padding: '8px'
              }}
              labelStyle={{ color: 'var(--text-primary)', fontSize: '11px' }}
              formatter={(value, name) => {
                if (name === 'Spend') return [`$${value.toLocaleString()}`, name]
                return [`${value}%`, name]
              }}
            />
            <Line 
              yAxisId="spend"
              type="monotone" 
              dataKey="Spend" 
              stroke={config.spendColor}
              strokeWidth={2}
              dot={{ fill: config.spendColor, strokeWidth: 1, r: 2 }}
              activeDot={{ r: 4, stroke: config.spendColor, strokeWidth: 1 }}
            />
            <Line 
              yAxisId="performance"
              type="monotone" 
              dataKey="Performance" 
              stroke={config.performanceColor}
              strokeWidth={2}
              dot={{ fill: config.performanceColor, strokeWidth: 1, r: 2 }}
              activeDot={{ r: 4, stroke: config.performanceColor, strokeWidth: 1 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="platform-metrics">
        <div className="metric">
          <span className="metric-label" style={{ color: config.spendColor }}>Q4 Spend:</span>
          <span className="metric-value">${config.data[3].Spend.toLocaleString()}</span>
        </div>
        <div className="metric">
          <span className="metric-label" style={{ color: config.performanceColor }}>Performance:</span>
          <span className="metric-value">{config.data[3].Performance}%</span>
        </div>
      </div>
    </div>
  )
}

export default function SpendPerformanceChart() {
  return (
    <div className="spend-performance-container">
      <div className="chart-header">
        <h2 className="chart-title">Quarterly Spend vs Performance Analysis</h2>
        <p className="chart-subtitle">Investment efficiency across advertising platforms</p>
      </div>
      
      <div className="platforms-grid">
        {platformConfigs.map((config, index) => (
          <PlatformChart key={index} config={config} />
        ))}
      </div>
      
      <div className="performance-insights">
        <div className="insight-summary">
          <h4>Key Insights</h4>
          <ul>
            <li><strong>TikTok</strong> delivers highest performance-to-spend ratio at 96% efficiency</li>
            <li><strong>Google Adwords</strong> shows consistent performance despite higher investment</li>
            <li><strong>Instagram</strong> demonstrates strong growth trajectory in Q3-Q4</li>
            <li><strong>Facebook</strong> maintains steady performance with moderate spend increases</li>
          </ul>
        </div>
      </div>
    </div>
  )
}