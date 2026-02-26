import { NextResponse } from 'next/server'
import { getPriceData, getCompanies } from '@/lib/db'

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

// Mock data for demo
let orders: Order[] = [
  {
    id: 1,
    user_id: 1,
    ticker: 'FSM',
    order_type: 'market',
    side: 'buy',
    quantity: 100,
    status: 'filled',
    created_at: '2026-02-21T10:00:00.000Z',
    filled_at: '2026-02-21T10:00:05.000Z',
    filled_price: 3.45
  },
  {
    id: 2,
    user_id: 1,
    ticker: 'BVN',
    order_type: 'limit',
    side: 'buy',
    quantity: 50,
    price: 15.00,
    status: 'pending',
    created_at: '2026-02-21T11:30:00.000Z'
  }
]

let positions: Position[] = [
  {
    id: 1,
    user_id: 1,
    ticker: 'FSM',
    quantity: 100,
    average_cost: 3.45,
    current_price: 3.52,
    market_value: 352.00,
    unrealized_pnl: 7.00,
    created_at: '2026-02-21T10:00:00.000Z',
    updated_at: '2026-02-21T15:00:00.000Z'
  }
]

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const userId = searchParams.get('userId') || '1'

    if (action === 'orders') {
      const userOrders = orders.filter(o => o.user_id === parseInt(userId))
      return NextResponse.json({ orders: userOrders })
    }

    if (action === 'positions') {
      const userPositions = positions.filter(p => p.user_id === parseInt(userId))

      // Update current prices
      const companies = getCompanies()
      userPositions.forEach(position => {
        const lastPrices = getPriceData(position.ticker).sort((a, b) => b.date.localeCompare(a.date))
        const currentPrice = lastPrices[0]?.close || position.average_cost
        if (currentPrice) {
          position.current_price = currentPrice
          position.market_value = position.quantity * position.current_price
          position.unrealized_pnl = position.market_value - (position.quantity * position.average_cost)
          position.updated_at = new Date().toISOString()
        }
      })

      return NextResponse.json({ positions: userPositions })
    }

    if (action === 'portfolio') {
      const userPositions = positions.filter(p => p.user_id === parseInt(userId))
      const totalValue = userPositions.reduce((sum, p) => sum + p.market_value, 0)
      const totalCost = userPositions.reduce((sum, p) => sum + (p.quantity * p.average_cost), 0)
      const totalPnL = totalValue - totalCost

      return NextResponse.json({
        portfolio: {
          total_value: totalValue,
          total_cost: totalCost,
          total_pnl: totalPnL,
          positions: userPositions
        }
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, userId, ticker, orderType, side, quantity, price } = body

    if (action === 'place_order') {
      const newOrder: Order = {
        id: orders.length + 1,
        user_id: parseInt(userId || '1'),
        ticker,
        order_type: orderType,
        side,
        quantity: parseInt(quantity),
        price: price ? parseFloat(price) : undefined,
        status: 'pending',
        created_at: new Date().toISOString()
      }

      // Simulate order execution for demo
      if (orderType === 'market') {
        setTimeout(() => {
          const lastPrices = getPriceData(ticker).sort((a, b) => b.date.localeCompare(a.date))
          const executionPrice = lastPrices[0]?.close || 50

          newOrder.status = 'filled'
          newOrder.filled_at = new Date().toISOString()
          newOrder.filled_price = executionPrice

          // Update or create position
          let position = positions.find(p => p.user_id === newOrder.user_id && p.ticker === ticker)
          if (!position) {
            position = {
              id: positions.length + 1,
              user_id: newOrder.user_id,
              ticker,
              quantity: 0,
              average_cost: 0,
              current_price: executionPrice,
              market_value: 0,
              unrealized_pnl: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
            positions.push(position)
          }

          if (side === 'buy') {
            const newQuantity = position.quantity + newOrder.quantity
            const newCost = (position.quantity * position.average_cost) + (newOrder.quantity * executionPrice)
            position.average_cost = newCost / newQuantity
            position.quantity = newQuantity
          } else {
            position.quantity -= newOrder.quantity
            if (position.quantity <= 0) {
              // Remove position if fully sold
              positions = positions.filter(p => p.id !== position!.id)
            }
          }
        }, 1000) // Simulate 1 second execution
      }

      orders.push(newOrder)
      return NextResponse.json({ order: newOrder, message: 'Order placed successfully' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}