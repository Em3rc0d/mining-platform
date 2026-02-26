import { NextRequest, NextResponse } from 'next/server'
import { getPriceData, getBacktestResults } from '@/lib/db'
import { runBacktest } from '@/lib/mlEngine'
import yahooFinance from '@/lib/yahooFinance'

const STRATEGIES = ['SVC Trend', 'LSTM Momentum', 'BiLSTM Signal', 'ARIMA Mean-Rev', 'ARIMA-LSTM VectorBT']

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get('ticker') || 'BHP'
  const strategy = req.nextUrl.searchParams.get('strategy') || 'SVC Trend'
  const capital = parseFloat(req.nextUrl.searchParams.get('capital') || '10000')

  try {
    let priceData: any[] = getPriceData(ticker).sort((a, b) => a.date.localeCompare(b.date))

    if (priceData.length < 100) {
      try {
        const endDate = new Date()
        const startDate = new Date()
        startDate.setFullYear(startDate.getFullYear() - 2)
        const realTimeData = await (yahooFinance as any).historical(ticker, {
          period1: startDate,
          period2: endDate,
          interval: '1d'
        })
        if (realTimeData && realTimeData.length > 50) {
          priceData = realTimeData.map((day: any) => ({
            date: day.date.toISOString().split('T')[0],
            open: parseFloat(day.open?.toFixed(2) || '0'),
            high: parseFloat(day.high?.toFixed(2) || '0'),
            low: parseFloat(day.low?.toFixed(2) || '0'),
            close: parseFloat(day.close?.toFixed(2) || '0'),
            volume: day.volume || 0,
          })) as any[]
        }
      } catch (apiError) {
        console.error('Yahoo Finance API error in backtest:', apiError)
      }
    }

    if (priceData.length < 60) {
      return NextResponse.json({ error: 'Insufficient data for backtest. Please try a valid ticker like BHP or BVN.' }, { status: 400 })
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
