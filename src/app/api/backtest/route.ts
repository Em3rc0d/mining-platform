import { NextRequest, NextResponse } from 'next/server'
import { getPriceData, getBacktestResults } from '@/lib/db'
import { runBacktest } from '@/lib/mlEngine'

const STRATEGIES = ['RF Signal', 'SVM Trend', 'LSTM Momentum', 'ARIMA Mean-Rev', 'Ensemble']

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get('ticker') || 'BHP'
  const strategy = req.nextUrl.searchParams.get('strategy') || 'RF Signal'
  const capital = parseFloat(req.nextUrl.searchParams.get('capital') || '10000')
  
  try {
    const priceData = getPriceData(ticker).sort((a, b) => a.date.localeCompare(b.date))

    if (priceData.length < 60) {
      return NextResponse.json({ error: 'Insufficient data for backtest' }, { status: 400 })
    }

    const result = runBacktest(priceData.map(p => ({
      date: p.date,
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
      volume: p.volume
    })), ticker, strategy, capital)
    
    // Also get stored results for comparison
    const stored = getBacktestResults(ticker).sort((a, b) => b.total_return - a.total_return)

    return NextResponse.json({ result, comparison: stored, strategies: STRATEGIES })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
