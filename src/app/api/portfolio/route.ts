import { NextRequest, NextResponse } from 'next/server'
import { getPortfoliosWithUsers, getRecentOperations, insertOperation, updatePortfolioValue } from '@/lib/db'

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  
  try {
    const portfolios = getPortfoliosWithUsers(userId || undefined)
    const operations = getRecentOperations()

    return NextResponse.json({ portfolios, operations })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { portfolio_id, ticker, type, quantity, price } = body
    
    if (!portfolio_id || !ticker || !type || !quantity || !price) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const total = quantity * price
    insertOperation({
      portfolio_id,
      ticker: ticker.toUpperCase(),
      operation_type: type.toUpperCase(),
      quantity,
      price,
      total_value: total,
      commission: 0,
      notes: null
    })

    // Update portfolio value
    updatePortfolioValue(portfolio_id, type.toUpperCase() === 'BUY' ? -total : total)

    return NextResponse.json({ success: true, total })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
