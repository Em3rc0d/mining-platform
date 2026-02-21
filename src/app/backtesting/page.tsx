'use client'
import { useState } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const COMPANIES = ['BHP', 'RIO', 'FCX', 'NEM', 'GOLD', 'SCCO']
const STRATEGIES = ['RF Signal', 'SVM Trend', 'LSTM Momentum', 'ARIMA Mean-Rev', 'Ensemble']

function MetricBox({ label, value, color, prefix = '', suffix = '' }: any) {
  const numVal = parseFloat(value)
  const isGood = numVal > 0
  return (
    <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 18px', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: color || (isGood ? '#059669' : '#dc2626') }}>
        {prefix}{typeof value === 'number' ? value.toFixed(2) : value}{suffix}
      </div>
    </div>
  )
}

export default function BacktestingPage() {
  const [ticker, setTicker] = useState('BHP')
  const [strategy, setStrategy] = useState('RF Signal')
  const [capital, setCapital] = useState(10000)
  const [result, setResult] = useState<any>(null)
  const [comparison, setComparison] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const runBacktest = async () => {
    setLoading(true)
    const res = await fetch(`/api/backtest?ticker=${ticker}&strategy=${encodeURIComponent(strategy)}&capital=${capital}`)
    const d = await res.json()
    setResult(d.result)
    setComparison(d.comparison || [])
    setLoading(false)
  }

  const metrics = result?.metrics

  return (
    <AuthGuard>
      {/* Config panel */}
      <div className="card animate-in" style={{ padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: 16 }}>Backtest Configuration</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Company</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {COMPANIES.map(t => (
                <button key={t} onClick={() => setTicker(t)} style={{
                  padding: '6px 12px', borderRadius: 6, fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                  background: ticker === t ? '#0f172a' : 'transparent',
                  color: ticker === t ? 'white' : '#64748b',
                  border: `1.5px solid ${ticker === t ? '#0f172a' : '#e2e8f0'}`,
                  transition: 'all 0.15s',
                }}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Strategy</label>
            <select value={strategy} onChange={e => setStrategy(e.target.value)} style={{
              padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0',
              fontSize: '0.85rem', fontWeight: 500, color: '#0f172a', background: 'white',
              cursor: 'pointer', outline: 'none',
            }}>
              {STRATEGIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Initial Capital (USD)</label>
            <input type="number" value={capital} onChange={e => setCapital(Number(e.target.value))} style={{
              padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0',
              fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: '#0f172a',
              width: 140, outline: 'none',
            }} />
          </div>
          <button onClick={runBacktest} disabled={loading} style={{
            padding: '10px 28px', borderRadius: 8, background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: 'white', fontWeight: 700, fontSize: '0.9rem', cursor: loading ? 'not-allowed' : 'pointer',
            border: 'none', opacity: loading ? 0.7 : 1, transition: 'all 0.15s',
          }}>
            {loading ? 'Running...' : '▶ Run Backtest'}
          </button>
        </div>
      </div>

      {!result && !loading && (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>↺</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: '#64748b', marginBottom: 8 }}>Ready to Backtest</div>
          <div style={{ fontSize: '0.9rem' }}>Configure your parameters and click Run Backtest</div>
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
          <div className="spinner" />
          <span style={{ color: '#64748b' }}>Simulating {strategy} strategy on {ticker}...</span>
        </div>
      )}

      {result && !loading && (
        <>
          {/* Metrics */}
          <div className="card animate-in" style={{ padding: '20px 24px', marginBottom: 20, borderColor: metrics.totalReturn >= 0 ? '#bbf7d0' : '#fecaca' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>
                  {strategy} — {ticker}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>VectorBT-style performance analysis · 500 days of data</div>
              </div>
              <div style={{
                padding: '8px 20px', borderRadius: 8,
                background: metrics.totalReturn >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                color: metrics.totalReturn >= 0 ? '#059669' : '#dc2626',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.5rem',
              }}>
                {metrics.totalReturn >= 0 ? '+' : ''}{metrics.totalReturn.toFixed(2)}%
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
              <MetricBox label="Final Value" value={`$${metrics.finalValue.toLocaleString('en', { maximumFractionDigits: 0 })}`} color="#0f172a" />
              <MetricBox label="Total Return" value={metrics.totalReturn.toFixed(2)} suffix="%" />
              <MetricBox label="Sharpe Ratio" value={metrics.sharpeRatio.toFixed(2)} color={metrics.sharpeRatio > 1 ? '#059669' : metrics.sharpeRatio > 0 ? '#f59e0b' : '#dc2626'} />
              <MetricBox label="Max Drawdown" value={metrics.maxDrawdown.toFixed(2)} suffix="%" color="#dc2626" />
              <MetricBox label="Win Rate" value={metrics.winRate.toFixed(1)} suffix="%" color={metrics.winRate > 55 ? '#059669' : '#f59e0b'} />
              <MetricBox label="Total Trades" value={metrics.totalTrades} color="#3b82f6" />
            </div>
          </div>

          {/* Equity curve */}
          <div className="card animate-in" style={{ padding: '20px 24px', marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>Equity Curve</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 20 }}>Portfolio value over time · Initial: ${capital.toLocaleString()}</div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={result.equity}>
                <defs>
                  <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={metrics.totalReturn >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={metrics.totalReturn >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                  formatter={(v: any) => [`$${parseFloat(v).toLocaleString('en', { maximumFractionDigits: 0 })}`, 'Portfolio Value']}
                />
                <ReferenceLine y={capital} stroke="#94a3b8" strokeDasharray="4 4" />
                <Area type="monotone" dataKey="value" stroke={metrics.totalReturn >= 0 ? '#10b981' : '#ef4444'} strokeWidth={2.5} fill="url(#equityGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Trade log */}
          {result.trades.length > 0 && (
            <div className="card animate-in">
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>Trade Log</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>All executed signals</div>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Showing last 20 of {result.trades.length}</div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Price</th>
                      <th>P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.trades.slice(-20).reverse().map((trade: any, i: number) => (
                      <tr key={i}>
                        <td style={{ color: '#94a3b8', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{result.trades.length - i}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{trade.date}</td>
                        <td>
                          <span className={`badge badge-${trade.type === 'BUY' ? 'up' : 'down'}`}>
                            {trade.type === 'BUY' ? '↗ BUY' : '↙ SELL'}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>${parseFloat(trade.price).toFixed(2)}</td>
                        <td>
                          {trade.pnl !== undefined ? (
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: trade.pnl >= 0 ? '#059669' : '#dc2626' }}>
                              {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </AuthGuard>
  )
}
