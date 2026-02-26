'use client'
import { useState, useEffect } from 'react'
import AuthGuard from '@/components/AuthGuard'

interface Order {
  id: number
  user_id: number
  ticker: string
  order_type: 'market' | 'limit'
  side: 'buy' | 'sell'
  quantity: number
  price?: number
  status: 'pending' | 'filled' | 'cancelled'
  created_at: string
  filled_at?: string
  filled_price?: number
}

interface Position {
  id: number
  user_id: number
  ticker: string
  quantity: number
  average_cost: number
  current_price: number
  market_value: number
  unrealized_pnl: number
  created_at: string
  updated_at: string
}

interface Company {
  id: number
  ticker: string
  name: string
  market_cap: number | null
  currency: string
}

function OrderForm({ onOrderPlaced }: { onOrderPlaced: () => void }) {
  const [ticker, setTicker] = useState('')
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/trading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'place_order',
          userId: 1,
          ticker: ticker.toUpperCase(),
          orderType,
          side,
          quantity: parseInt(quantity),
          price: price ? parseFloat(price) : undefined
        })
      })

      const data = await response.json()
      if (response.ok) {
        alert('Order placed successfully!')
        setTicker('')
        setQuantity('')
        setPrice('')
        onOrderPlaced()
      } else {
        alert(data.error || 'Failed to place order')
      }
    } catch (error) {
      alert('Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card" style={{ padding: '20px' }}>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '16px' }}>Place Order</h3>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }}>
              Ticker
            </label>
            <select
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '0.875rem',
                background: 'white'
              }}
            >
              <option value="">Select Ticker</option>
              {['FSM', 'VOLCABC1.LM', 'BVN', 'ABX', 'BHP', 'SCCO'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }}>
              Side
            </label>
            <select
              value={side}
              onChange={(e) => setSide(e.target.value as 'buy' | 'sell')}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}
            >
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }}>
              Order Type
            </label>
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value as 'market' | 'limit')}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}
            >
              <option value="market">Market</option>
              <option value="limit">Limit</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }}>
              Quantity
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="100"
              min="1"
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}
            />
          </div>
        </div>

        {orderType === 'limit' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }}>
              Limit Price
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="45.50"
              step="0.01"
              min="0.01"
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 16px',
            background: side === 'buy' ? '#059669' : '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Placing Order...' : `${side === 'buy' ? 'Buy' : 'Sell'} ${ticker || 'Stock'}`}
        </button>
      </form>
    </div>
  )
}

function PositionsTable({ positions }: { positions: Position[] }) {
  return (
    <div className="card" style={{ padding: '20px' }}>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '16px' }}>Current Positions</h3>
      {positions.length === 0 ? (
        <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>No open positions</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600 }}>Ticker</th>
                <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '0.875rem', fontWeight: 600 }}>Quantity</th>
                <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '0.875rem', fontWeight: 600 }}>Avg Cost</th>
                <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '0.875rem', fontWeight: 600 }}>Current</th>
                <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '0.875rem', fontWeight: 600 }}>Market Value</th>
                <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '0.875rem', fontWeight: 600 }}>P&L</th>
              </tr>
            </thead>
            <tbody>
              {positions.map(position => (
                <tr key={position.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 8px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {position.ticker}
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    {position.quantity.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    ${position.average_cost.toFixed(2)}
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    ${position.current_price.toFixed(2)}
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    ${position.market_value.toLocaleString()}
                  </td>
                  <td style={{
                    padding: '12px 8px',
                    textAlign: 'right',
                    fontFamily: 'var(--font-mono)',
                    color: position.unrealized_pnl >= 0 ? '#059669' : '#dc2626'
                  }}>
                    {position.unrealized_pnl >= 0 ? '+' : ''}${position.unrealized_pnl.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function OrdersTable({ orders }: { orders: Order[] }) {
  return (
    <div className="card" style={{ padding: '20px' }}>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '16px' }}>Order History</h3>
      {orders.length === 0 ? (
        <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>No orders placed yet</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600 }}>Time</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600 }}>Ticker</th>
                <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600 }}>Side</th>
                <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600 }}>Type</th>
                <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '0.875rem', fontWeight: 600 }}>Quantity</th>
                <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '0.875rem', fontWeight: 600 }}>Price</th>
                <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 8px', fontSize: '0.875rem', color: '#64748b' }}>
                    {new Date(order.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 8px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {order.ticker}
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: order.side === 'buy' ? '#dcfce7' : '#fef2f2',
                      color: order.side === 'buy' ? '#166534' : '#991b1b'
                    }}>
                      {order.side.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '0.875rem' }}>
                    {order.order_type}
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    {order.quantity.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    {order.filled_price ? `$${order.filled_price.toFixed(2)}` : order.price ? `$${order.price.toFixed(2)}` : '—'}
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: order.status === 'filled' ? '#dcfce7' : order.status === 'pending' ? '#fef3c7' : '#f3f4f6',
                      color: order.status === 'filled' ? '#166534' : order.status === 'pending' ? '#92400e' : '#374151'
                    }}>
                      {order.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function TradingPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [portfolio, setPortfolio] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTradingData()
  }, [])

  const fetchTradingData = async () => {
    try {
      const [ordersRes, positionsRes, portfolioRes] = await Promise.all([
        fetch('/api/trading?action=orders'),
        fetch('/api/trading?action=positions'),
        fetch('/api/trading?action=portfolio')
      ])

      const ordersData = await ordersRes.json()
      const positionsData = await positionsRes.json()
      const portfolioData = await portfolioRes.json()

      setOrders(ordersData.orders)
      setPositions(positionsData.positions)
      setPortfolio(portfolioData.portfolio)
    } catch (error) {
      console.error('Failed to fetch trading data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AuthGuard>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <div>Loading trading data...</div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '8px' }}>Paper Trading</h1>
          <p style={{ color: '#64748b' }}>Practice trading with virtual money and real market data</p>
        </div>

        {/* Portfolio Summary */}
        {portfolio && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
                ${portfolio.total_value.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Portfolio Value</div>
            </div>
            <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: portfolio.total_pnl >= 0 ? '#059669' : '#dc2626'
              }}>
                {portfolio.total_pnl >= 0 ? '+' : ''}${portfolio.total_pnl.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Total P&L</div>
            </div>
            <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
                {portfolio.positions.length}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Open Positions</div>
            </div>
            <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
                {orders.length}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Total Orders</div>
            </div>
          </div>
        )}

        {/* Order Form */}
        <div style={{ marginBottom: '24px' }}>
          <OrderForm onOrderPlaced={fetchTradingData} />
        </div>

        {/* Positions and Orders */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          <PositionsTable positions={positions} />
          <OrdersTable orders={orders} />
        </div>
      </div>
    </AuthGuard>
  )
}