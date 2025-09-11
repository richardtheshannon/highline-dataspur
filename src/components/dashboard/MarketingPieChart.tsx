'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const data01 = [
  { name: 'Facebook', value: 15000, fill: '#1877F2' },
  { name: 'Instagram', value: 12000, fill: '#E4405F' },
  { name: 'TikTok', value: 8000, fill: '#000000' },
  { name: 'Google', value: 18000, fill: '#4285F4' },
]

const data02 = [
  { name: 'Facebook ROI', value: 3.2, fill: '#4A90E2' },
  { name: 'Instagram ROI', value: 2.8, fill: '#F77737' },
  { name: 'TikTok ROI', value: 4.1, fill: '#333333' },
  { name: 'Google ROI', value: 2.5, fill: '#34A853' },
]

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]
    const isSpend = data.name.includes('Facebook') || data.name.includes('Instagram') || 
                    data.name.includes('TikTok') || data.name.includes('Google')
    
    if (!data.name.includes('ROI')) {
      return (
        <div className="custom-tooltip">
          <p className="label">{data.name}</p>
          <p className="value">Spend: ${data.value.toLocaleString()}</p>
        </div>
      )
    } else {
      return (
        <div className="custom-tooltip">
          <p className="label">{data.name}</p>
          <p className="value">ROI: {data.value}x</p>
        </div>
      )
    }
  }
  return null
}

export default function MarketingPieChart() {
  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div className="card-header">
        <h3>Platform Performance</h3>
        <span className="card-subtitle">Spend & ROI Analysis</span>
      </div>
      <div className="card-content" style={{ height: '300px', padding: '1rem' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data01}
              dataKey="value"
              cx="50%"
              cy="50%"
              outerRadius={60}
              label={(entry) => `$${(entry.value / 1000).toFixed(0)}k`}
              labelLine={false}
            >
              {data01.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Pie
              data={data02}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={90}
              label={(entry) => `${entry.value}x`}
              labelLine={false}
            >
              {data02.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value) => value.replace(' ROI', '')}
              wrapperStyle={{
                fontSize: '12px',
                paddingTop: '10px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="card-footer" style={{ fontSize: '0.875rem', color: '#666' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
          <span>Total Spend: $53,000</span>
          <span>Avg ROI: 3.15x</span>
        </div>
      </div>
    </div>
  )
}