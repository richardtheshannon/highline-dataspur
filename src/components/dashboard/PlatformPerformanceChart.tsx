'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const data = [
  {
    name: 'Jan',
    'Google Adwords': 4000,
    'Facebook': 2400,
    'Instagram': 2400,
    'TikTok': 1800,
  },
  {
    name: 'Feb',
    'Google Adwords': 3000,
    'Facebook': 1398,
    'Instagram': 2210,
    'TikTok': 2200,
  },
  {
    name: 'Mar',
    'Google Adwords': 2000,
    'Facebook': 9800,
    'Instagram': 2290,
    'TikTok': 2800,
  },
  {
    name: 'Apr',
    'Google Adwords': 2780,
    'Facebook': 3908,
    'Instagram': 2000,
    'TikTok': 3200,
  },
  {
    name: 'May',
    'Google Adwords': 1890,
    'Facebook': 4800,
    'Instagram': 2181,
    'TikTok': 3600,
  },
  {
    name: 'Jun',
    'Google Adwords': 2390,
    'Facebook': 3800,
    'Instagram': 2500,
    'TikTok': 4000,
  },
  {
    name: 'Jul',
    'Google Adwords': 3490,
    'Facebook': 4300,
    'Instagram': 2100,
    'TikTok': 4200,
  },
  {
    name: 'Aug',
    'Google Adwords': 4200,
    'Facebook': 3200,
    'Instagram': 2800,
    'TikTok': 3800,
  },
  {
    name: 'Sep',
    'Google Adwords': 3800,
    'Facebook': 4100,
    'Instagram': 3200,
    'TikTok': 4500,
  },
  {
    name: 'Oct',
    'Google Adwords': 4500,
    'Facebook': 4800,
    'Instagram': 3600,
    'TikTok': 5000,
  },
  {
    name: 'Nov',
    'Google Adwords': 4100,
    'Facebook': 4200,
    'Instagram': 3800,
    'TikTok': 4800,
  },
  {
    name: 'Dec',
    'Google Adwords': 4800,
    'Facebook': 5200,
    'Instagram': 4200,
    'TikTok': 5500,
  },
]

export default function PlatformPerformanceChart() {
  return (
    <div className="chart-container">
      <div className="chart-header">
        <h2 className="chart-title">Platform Performance Analytics</h2>
        <p className="chart-subtitle">Monthly engagement metrics across advertising platforms</p>
      </div>
      
      <div style={{ width: '100%', height: '500px', marginTop: '1.5rem' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 40,
              bottom: 60,
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
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
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
              formatter={(value, name) => [`${value.toLocaleString()}`, name]}
            />
            <Legend 
              wrapperStyle={{ 
                paddingTop: '20px',
                fontSize: '12px',
                color: 'var(--text-secondary)'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="Google Adwords" 
              stroke="#FF6B35" 
              strokeWidth={2}
              dot={{ fill: '#FF6B35', strokeWidth: 1, r: 3 }}
              activeDot={{ r: 5, stroke: '#FF6B35', strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="Facebook" 
              stroke="#1877F2" 
              strokeWidth={2}
              dot={{ fill: '#1877F2', strokeWidth: 1, r: 3 }}
              activeDot={{ r: 5, stroke: '#1877F2', strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="Instagram" 
              stroke="#E4405F" 
              strokeWidth={2}
              dot={{ fill: '#E4405F', strokeWidth: 1, r: 3 }}
              activeDot={{ r: 5, stroke: '#E4405F', strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="TikTok" 
              stroke="#25D366" 
              strokeWidth={2}
              dot={{ fill: '#25D366', strokeWidth: 1, r: 3 }}
              activeDot={{ r: 5, stroke: '#25D366', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="chart-insights" style={{ marginTop: '1.5rem' }}>
        <div className="insight-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          <div className="insight-card">
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: '600' }}>Top Performer</h4>
            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>TikTok leads with 5.5K December engagement</p>
          </div>
          <div className="insight-card">
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: '600' }}>Growth Trend</h4>
            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>All platforms showing positive Q4 momentum</p>
          </div>
        </div>
      </div>
    </div>
  )
}