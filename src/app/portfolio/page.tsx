'use client'
import { useState, useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f97316']

function PortfolioCard({ portfolio }: { portfolio: any }) {
  const ret = parseFloat(portfolio.totalReturn)
  const pnl = parseFloat(portfolio.pnl)
  const initials = portfolio.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'U'

  return (
    <div className="card" style={{ padding: '20px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            background: portfolio.avatar_color || '#f59e0b',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: '0.875rem',
          }}>{initials}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{portfolio.name}</div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{portfolio.full_name} · {portfolio.role?.replace('_', ' ')}</div>
          </div>
        </div>
        <span className={`badge ${ret >= 0 ? 'badge-up' : 'badge-down'}`}>
          {ret >= 0 ? '+' : ''}{ret}%
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[
          { label: 'Current Value', value: `$${parseFloat(portfolio.current_value).toLocaleString()}` },
          { label: 'P&L', value: `${pnl >= 0 ? '+' : ''}$${Math.abs(pnl).toLocaleString()}`, color: pnl >= 0 ? '#059669' : '#dc2626' },
          { label: 'Trades', value: portfolio.op_count },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.9rem', color: color || '#0f172a' }}>{value}</div>
          </div>
        ))}
      </div>
      {portfolio.description && (
        <div style={{ marginTop: 10, fontSize: '0.78rem', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
          {portfolio.description}
        </div>
      )}
    </div>
  )
}

export default function PortfolioPage() {
  const [data, setData] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newOp, setNewOp] = useState({ portfolio_id: '', ticker: 'BHP', type: 'BUY', quantity: '', price: '' })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/portfolio').then(r => r.json()),
      fetch('/api/users').then(r => r.json()),
    ]).then(([pd, ud]) => {
      setData(pd)
      setUsers(ud.users || [])
      setLoading(false)
    })
  }, [])

  const submitOperation = async () => {
    if (!newOp.portfolio_id || !newOp.quantity || !newOp.price) return
    setSubmitting(true)
    const res = await fetch('/api/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newOp, quantity: Number(newOp.quantity), price: Number(newOp.price) }),
    })
    const d = await res.json()
    if (d.success) {
      setSuccess(`Operation registered: $${d.total.toLocaleString()}`)
      setTimeout(() => setSuccess(''), 4000)
      // Refresh
      const pd = await fetch('/api/portfolio').then(r => r.json())
      setData(pd)
    }
    setSubmitting(false)
  }

  const portfolios = data?.portfolios || []
  const operations = data?.operations || []

  // Pie chart data: portfolio allocations
  const pieData = portfolios.map((p: any, i: number) => ({
    name: p.name,
    value: parseFloat(p.current_value),
  }))

  // Bar chart: returns
  const barData = portfolios.map((p: any) => ({
    name: p.name.split(' ').slice(0, 2).join(' '),
    return: parseFloat(p.totalReturn),
  }))

  if (loading) return (
    <AppShell>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, gap: 12 }}>
        <div className="spinner" />
        <span style={{ color: '#64748b' }}>Loading portfolios...</span>
      </div>
    </AppShell>
  )

  return (
    <AppShell>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Portfolios', value: portfolios.length, icon: '◈' },
          { label: 'Total AUM', value: `$${(portfolios.reduce((s: number, p: any) => s + parseFloat(p.current_value), 0) / 1e6).toFixed(2)}M`, icon: '◎' },
          { label: 'Analysts', value: users.length, icon: '◉' },
          { label: 'Total Ops', value: operations.length, icon: '↺' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="card animate-in" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: '1.5rem', width: 42, height: 42, borderRadius: 10, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {icon}
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.4rem' }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Pie */}
        <div className="card animate-in" style={{ padding: '20px 24px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>AUM Allocation</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 8 }}>By portfolio</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                {pieData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: any) => [`$${parseFloat(v).toLocaleString()}`, 'Value']} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Returns bar */}
        <div className="card animate-in" style={{ padding: '20px 24px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>Portfolio Returns</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 8 }}>Total return since inception</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} width={100} tickLine={false} />
              <Tooltip formatter={(v: any) => [`${parseFloat(v).toFixed(2)}%`, 'Return']} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Bar dataKey="return" radius={[0, 4, 4, 0]}>
                {barData.map((d: any, i: number) => <Cell key={i} fill={d.return >= 0 ? '#10b981' : '#ef4444'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Portfolio cards */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', marginBottom: 14 }}>All Portfolios</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {portfolios.map((p: any, i: number) => (
            <div key={p.id} className="animate-in" style={{ animationDelay: `${i * 0.06}s` }}>
              <PortfolioCard portfolio={p} />
            </div>
          ))}
        </div>
      </div>

      {/* New operation form */}
      <div className="card animate-in" style={{ padding: '20px 24px', marginBottom: 24, borderColor: '#fde68a' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: 16 }}>Register Operation</div>
        {success && (
          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: '0.85rem', color: '#059669', fontWeight: 600 }}>
            ✓ {success}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr) auto', gap: 12, alignItems: 'flex-end' }}>
          {[
            {
              label: 'Portfolio', type: 'select', key: 'portfolio_id',
              options: portfolios.map((p: any) => ({ value: p.id, label: p.name })),
            },
            {
              label: 'Ticker', type: 'select', key: 'ticker',
              options: ['BHP', 'RIO', 'FCX', 'NEM', 'GOLD', 'SCCO'].map(t => ({ value: t, label: t })),
            },
            {
              label: 'Type', type: 'select', key: 'type',
              options: [{ value: 'BUY', label: '↗ BUY' }, { value: 'SELL', label: '↙ SELL' }],
            },
          ].map(field => (
            <div key={field.key}>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 5 }}>{field.label}</label>
              <select value={(newOp as any)[field.key]} onChange={e => setNewOp(prev => ({ ...prev, [field.key]: e.target.value }))} style={{
                width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0',
                fontSize: '0.85rem', color: '#0f172a', background: 'white', outline: 'none',
              }}>
                {field.options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          ))}
          {[{ label: 'Quantity', key: 'quantity', placeholder: '100' }, { label: 'Price (USD)', key: 'price', placeholder: '55.00' }].map(field => (
            <div key={field.key}>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 5 }}>{field.label}</label>
              <input
                type="number" placeholder={field.placeholder}
                value={(newOp as any)[field.key]}
                onChange={e => setNewOp(prev => ({ ...prev, [field.key]: e.target.value }))}
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0',
                  fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: '#0f172a', outline: 'none',
                }}
              />
            </div>
          ))}
          <button onClick={submitOperation} disabled={submitting} style={{
            padding: '10px 20px', borderRadius: 8, background: '#0f172a',
            color: 'white', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
            border: 'none', whiteSpace: 'nowrap',
          }}>
            {submitting ? '...' : '+ Add'}
          </button>
        </div>
      </div>

      {/* Operations table */}
      <div className="card animate-in">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>Operations History</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>All portfolio transactions</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Portfolio</th>
                <th>Ticker</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {operations.slice(0, 20).map((op: any, i: number) => (
                <tr key={i}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#94a3b8' }}>
                    {new Date(op.operation_date).toLocaleDateString()}
                  </td>
                  <td style={{ fontSize: '0.82rem', fontWeight: 500 }}>{op.portfolio_name}</td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>{op.ticker}</span>
                  </td>
                  <td>
                    <span className={`badge badge-${op.operation_type === 'BUY' ? 'up' : 'down'}`}>
                      {op.operation_type === 'BUY' ? '↗' : '↙'} {op.operation_type}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{parseFloat(op.quantity).toLocaleString()}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>${parseFloat(op.price).toFixed(2)}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.85rem' }}>
                    ${parseFloat(op.total_value).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  )
}
