'use client'
import { useState, useEffect } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from 'recharts'

interface RiskMetrics {
  portfolio_id: number
  total_value: number
  volatility: number
  sharpe_ratio: number
  max_drawdown: number
  value_at_risk_95: number
  expected_shortfall_95: number
  beta: number
  correlation_matrix: Record<string, Record<string, number>>
  stress_test_results: {
    scenario: string
    impact: number
    probability: number
  }[]
}

interface TickerMetrics {
  ticker: string
  volatility: number
  sharpe_ratio: number
  max_drawdown: number
  value_at_risk_95: number
}

function RiskCard({ title, value, subtitle, color = '#0f172a' }: { title: string, value: string | number, subtitle?: string, color?: string }) {
  return (
    <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
      <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '8px' }}>{title}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color, marginBottom: '4px' }}>{value}</div>
      {subtitle && <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{subtitle}</div>}
    </div>
  )
}

function CorrelationMatrix({ matrix }: { matrix: Record<string, Record<string, number>> }) {
  const tickers = Object.keys(matrix)

  return (
    <div className="card" style={{ padding: '20px' }}>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '16px' }}>Asset Correlations</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}></th>
              {tickers.map(ticker => (
                <th key={ticker} style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0', fontSize: '0.875rem', fontWeight: 600 }}>
                  {ticker}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tickers.map(ticker1 => (
              <tr key={ticker1}>
                <td style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem', fontWeight: 600 }}>
                  {ticker1}
                </td>
                {tickers.map(ticker2 => {
                  const correlation = matrix[ticker1][ticker2]
                  const intensity = Math.abs(correlation)
                  const color = correlation > 0 ? `rgba(34, 197, 94, ${intensity})` : `rgba(239, 68, 68, ${intensity})`
                  return (
                    <td key={ticker2} style={{
                      padding: '8px',
                      textAlign: 'center',
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: ticker1 === ticker2 ? '#f8fafc' : color,
                      fontSize: '0.875rem',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {correlation.toFixed(2)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function RiskPage() {
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null)
  const [tickerMetrics, setTickerMetrics] = useState<TickerMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPortfolio, setSelectedPortfolio] = useState('1')

  useEffect(() => {
    fetchRiskData()
  }, [selectedPortfolio])

  const fetchRiskData = async () => {
    try {
      const response = await fetch(`/api/risk?portfolioId=${selectedPortfolio}`)
      const data = await response.json()
      setRiskMetrics(data.risk_metrics)
      setTickerMetrics(data.ticker_metrics)
    } catch (error) {
      console.error('Failed to fetch risk data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AuthGuard>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <div>Analyzing portfolio risk...</div>
        </div>
      </AuthGuard>
    )
  }

  if (!riskMetrics) {
    return (
      <AuthGuard>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <div>Unable to load risk metrics</div>
        </div>
      </AuthGuard>
    )
  }

  const radarData = [
    { metric: 'Volatility', value: riskMetrics.volatility * 100 },
    { metric: 'Sharpe Ratio', value: Math.max(0, riskMetrics.sharpe_ratio * 10) },
    { metric: 'Max Drawdown', value: (1 - riskMetrics.max_drawdown) * 100 },
    { metric: 'VaR 95%', value: (1 - riskMetrics.value_at_risk_95) * 100 },
    { metric: 'Beta', value: riskMetrics.beta * 50 }
  ]

  return (
    <AuthGuard>
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '8px' }}>Risk Management</h1>
          <p style={{ color: '#64748b' }}>Portfolio risk analysis and stress testing</p>
        </div>

        {/* Portfolio Selector */}
        <div style={{ marginBottom: '24px' }}>
          <select
            value={selectedPortfolio}
            onChange={(e) => setSelectedPortfolio(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              background: 'white',
              fontSize: '0.875rem'
            }}
          >
            <option value="1">Portfolio 1 - Mining Focus</option>
            <option value="2">Portfolio 2 - Diversified</option>
          </select>
        </div>

        {/* Key Risk Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <RiskCard
            title="Portfolio Value"
            value={`$${riskMetrics.total_value.toLocaleString()}`}
            subtitle="Current total value"
          />
          <RiskCard
            title="Annual Volatility"
            value={`${(riskMetrics.volatility * 100).toFixed(1)}%`}
            subtitle="Portfolio volatility"
            color={riskMetrics.volatility > 0.3 ? '#dc2626' : riskMetrics.volatility > 0.2 ? '#d97706' : '#059669'}
          />
          <RiskCard
            title="Sharpe Ratio"
            value={riskMetrics.sharpe_ratio.toFixed(2)}
            subtitle="Risk-adjusted returns"
            color={riskMetrics.sharpe_ratio > 1 ? '#059669' : riskMetrics.sharpe_ratio > 0 ? '#d97706' : '#dc2626'}
          />
          <RiskCard
            title="Max Drawdown"
            value={`${(riskMetrics.max_drawdown * 100).toFixed(1)}%`}
            subtitle="Worst peak-to-trough decline"
            color={riskMetrics.max_drawdown > 0.2 ? '#dc2626' : riskMetrics.max_drawdown > 0.1 ? '#d97706' : '#059669'}
          />
          <RiskCard
            title="VaR (95%)"
            value={`${(riskMetrics.value_at_risk_95 * 100).toFixed(1)}%`}
            subtitle="Value at Risk - 1 day"
            color="#dc2626"
          />
          <RiskCard
            title="Expected Shortfall"
            value={`${(riskMetrics.expected_shortfall_95 * 100).toFixed(1)}%`}
            subtitle="Expected loss beyond VaR"
            color="#dc2626"
          />
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          {/* Risk Radar Chart */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '16px' }}>Risk Profile</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="Risk Score" dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Ticker Volatility Comparison */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '16px' }}>Asset Volatility</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tickerMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ticker" />
                <YAxis />
                <Tooltip formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Volatility']} />
                <Bar dataKey="volatility" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Correlation Matrix */}
        <CorrelationMatrix matrix={riskMetrics.correlation_matrix} />

        {/* Stress Testing */}
        <div className="card" style={{ padding: '20px', marginTop: '20px' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '16px' }}>Stress Test Scenarios</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            {riskMetrics.stress_test_results.map((scenario, index) => (
              <div key={index} style={{
                padding: '16px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                background: scenario.impact < 0 ? 'rgba(239, 68, 68, 0.05)' : 'rgba(34, 197, 94, 0.05)'
              }}>
                <div style={{ fontWeight: 600, marginBottom: '8px' }}>{scenario.scenario}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span>Impact:</span>
                  <span style={{ color: scenario.impact < 0 ? '#dc2626' : '#059669' }}>
                    {scenario.impact > 0 ? '+' : ''}{(scenario.impact * 100).toFixed(1)}%
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span>Probability:</span>
                  <span>{(scenario.probability * 100).toFixed(1)}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginTop: '8px' }}>
                  <span>Expected Loss:</span>
                  <span style={{ color: '#dc2626' }}>
                    ${(riskMetrics.total_value * Math.abs(scenario.impact) * scenario.probability).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}