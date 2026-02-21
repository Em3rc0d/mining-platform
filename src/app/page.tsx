'use client'
import { useState, useEffect } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface DashboardData {
  companies: any[]
  portfolio: any
  stats: any
  topModels: any[]
  recentOperations: any[]
  priceHistory: Record<string, any[]>
}

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f97316']
const COMPANY_COLORS: Record<string, string> = { BHP: '#f59e0b', RIO: '#3b82f6', FCX: '#10b981', NEM: '#8b5cf6', GOLD: '#ef4444', SCCO: '#f97316' }

function StatCard({ label, value, sub, color, icon }: any) {
  return (
    <div className="card animate-in" style={{ padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color || 'var(--gold)' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>
          <div className="stat-value" style={{ color: '#0f172a', marginBottom: 4 }}>{value}</div>
          {sub && <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{sub}</div>}
        </div>
        <div style={{ fontSize: '1.8rem' }}>{icon}</div>
      </div>
    </div>
  )
}

function CompanyRow({ company }: { company: any }) {
  const change = parseFloat(company.change || 0)
  const isUp = change >= 0
  return (
    <tr>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `${COMPANY_COLORS[company.ticker] || '#94a3b8'}20`,
            border: `1.5px solid ${COMPANY_COLORS[company.ticker] || '#94a3b8'}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 700,
            color: COMPANY_COLORS[company.ticker] || '#64748b',
          }}>{company.ticker}</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{company.name}</div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{company.country}</div>
          </div>
        </div>
      </td>
      <td><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>${parseFloat(company.price || 0).toFixed(2)}</span></td>
      <td>
        <span className={`badge badge-${isUp ? 'up' : 'down'}`}>
          {isUp ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
        </span>
      </td>
      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#64748b' }}>
        ${company.market_cap ? (company.market_cap / 1e9).toFixed(1) + 'B' : '—'}
      </td>
    </tr>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [chartTicker, setChartTicker] = useState('BHP')

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) return (
    <AuthGuard>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, gap: 12 }}>
        <div className="spinner" />
        <span style={{ color: '#64748b' }}>Loading market data...</span>
      </div>
    </AuthGuard>
  )

  const priceChartData = data?.priceHistory[chartTicker]?.slice(-60).map(p => ({
    date: p.date.slice(5),
    price: parseFloat(p.close),
  })) || []

  const modelChartData = data?.topModels.map(m => ({
    name: m.model_name.replace(' Neural Net', '').replace(' Regression', ' Reg'),
    accuracy: parseFloat((m.avg_accuracy * 100).toFixed(1)),
    f1: parseFloat((m.avg_f1 * 100).toFixed(1)),
  })) || []

  const portfolioReturn = parseFloat(data?.portfolio?.returnPct || 0)

  return (
    <AuthGuard>
      {/* Header stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard
          label="Total AUM"
          value={`$${((data?.portfolio?.total_aum || 0) / 1e6).toFixed(2)}M`}
          sub="Across all portfolios"
          icon="◈"
          color="#f59e0b"
        />
        <StatCard
          label="Total P&L"
          value={`${portfolioReturn >= 0 ? '+' : ''}${portfolioReturn}%`}
          sub={`$${parseFloat(data?.portfolio?.total_pnl || 0).toLocaleString()} realized`}
          icon="◎"
          color={portfolioReturn >= 0 ? '#10b981' : '#ef4444'}
        />
        <StatCard
          label="ML Models"
          value="8"
          sub="5 Classification · 3 Regression"
          icon="⬡"
          color="#3b82f6"
        />
        <StatCard
          label="Operations"
          value={data?.stats?.totalOperations || 0}
          sub={`${data?.stats?.totalUsers || 0} analysts · ${data?.stats?.totalCompanies || 0} companies`}
          icon="↺"
          color="#8b5cf6"
        />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Price chart */}
        <div className="card animate-in animate-in-delay-1" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>Price History</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>60-day trend</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {Object.keys(data?.priceHistory || {}).map(ticker => (
                <button key={ticker} onClick={() => setChartTicker(ticker)} style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                  background: chartTicker === ticker ? COMPANY_COLORS[ticker] : 'transparent',
                  color: chartTicker === ticker ? 'white' : '#64748b',
                  border: `1.5px solid ${chartTicker === ticker ? COMPANY_COLORS[ticker] : '#e2e8f0'}`,
                  transition: 'all 0.15s',
                }}>{ticker}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={priceChartData}>
              <defs>
                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COMPANY_COLORS[chartTicker]} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={COMPANY_COLORS[chartTicker]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v.toFixed(0)}`} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                formatter={(v: any) => [`$${parseFloat(v).toFixed(2)}`, 'Price']}
              />
              <Area type="monotone" dataKey="price" stroke={COMPANY_COLORS[chartTicker]} strokeWidth={2} fill="url(#priceGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Model performance */}
        <div className="card animate-in animate-in-delay-2" style={{ padding: '20px 24px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>Model Performance</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 20 }}>Average accuracy across all tickers</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={modelChartData} layout="vertical" barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" domain={[40, 80]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} width={90} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                formatter={(v: any) => [`${v}%`]}
              />
              <Bar dataKey="accuracy" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Accuracy" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Companies table */}
        <div className="card animate-in animate-in-delay-2">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>Mining Companies</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Real-time prices from Yahoo Finance</div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Price</th>
                <th>Change</th>
                <th>Market Cap</th>
              </tr>
            </thead>
            <tbody>
              {data?.companies.map(c => <CompanyRow key={c.ticker} company={c} />)}
            </tbody>
          </table>
        </div>

        {/* Recent operations */}
        <div className="card animate-in animate-in-delay-3">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>Recent Operations</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Portfolio transaction log</div>
          </div>
          <div style={{ padding: '8px 0' }}>
            {data?.recentOperations.slice(0, 8).map((op: any, i: number) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 20px',
                borderBottom: '1px solid #f8fafc',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: op.operation_type === 'BUY' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                  color: op.operation_type === 'BUY' ? '#059669' : '#dc2626',
                }}>
                  {op.operation_type === 'BUY' ? '↗' : '↙'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{op.ticker}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600 }}>
                      ${parseFloat(op.total_value).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    {op.portfolio_name} · {op.quantity} shares @ ${parseFloat(op.price).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
