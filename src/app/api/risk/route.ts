import { NextResponse } from 'next/server'
import { getPriceData, getPortfolios } from '@/lib/db'

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

function calculateVolatility(returns: number[]): number {
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length
  return Math.sqrt(variance * 252) // Annualized
}

function calculateVaR(returns: number[], confidence = 0.95): number {
  const sorted = returns.sort((a, b) => a - b)
  const index = Math.floor((1 - confidence) * sorted.length)
  return -sorted[index] // Negative because we want the loss
}

function calculateMaxDrawdown(prices: number[]): number {
  let maxDrawdown = 0
  let peak = prices[0]

  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > peak) {
      peak = prices[i]
    }
    const drawdown = (peak - prices[i]) / peak
    maxDrawdown = Math.max(maxDrawdown, drawdown)
  }

  return maxDrawdown
}

function calculateCorrelation(returns1: number[], returns2: number[]): number {
  const mean1 = returns1.reduce((a, b) => a + b, 0) / returns1.length
  const mean2 = returns2.reduce((a, b) => a + b, 0) / returns2.length

  let numerator = 0
  let denom1 = 0
  let denom2 = 0

  for (let i = 0; i < returns1.length; i++) {
    const diff1 = returns1[i] - mean1
    const diff2 = returns2[i] - mean2
    numerator += diff1 * diff2
    denom1 += diff1 * diff1
    denom2 += diff2 * diff2
  }

  return numerator / Math.sqrt(denom1 * denom2)
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const portfolioId = searchParams.get('portfolioId')

    if (!portfolioId) {
      return NextResponse.json({ error: 'Portfolio ID required' }, { status: 400 })
    }

    const portfolios = getPortfolios()
    const portfolio = portfolios.find(p => p.id === parseInt(portfolioId))

    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 })
    }

    // Get all tickers in the portfolio (simplified - in real app would get from positions)
    const tickers = ['BHP', 'RIO', 'FCX', 'NEM', 'GOLD', 'SCCO']

    // Calculate risk metrics for each ticker
    const tickerMetrics = tickers.map(ticker => {
      const priceData = getPriceData(ticker)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-252) // Last year

      if (priceData.length < 30) {
        return {
          ticker,
          volatility: 0,
          sharpe_ratio: 0,
          max_drawdown: 0,
          value_at_risk_95: 0
        }
      }

      // Calculate daily returns
      const returns: number[] = []
      for (let i = 1; i < priceData.length; i++) {
        returns.push((priceData[i].close - priceData[i-1].close) / priceData[i-1].close)
      }

      const volatility = calculateVolatility(returns)
      const maxDrawdown = calculateMaxDrawdown(priceData.map(p => p.close))
      const valueAtRisk95 = calculateVaR(returns, 0.95)
      const sharpeRatio = returns.length > 0 ? (returns.reduce((a, b) => a + b, 0) / returns.length) / (volatility / Math.sqrt(252)) : 0

      return {
        ticker,
        volatility,
        sharpe_ratio: sharpeRatio,
        max_drawdown: maxDrawdown,
        value_at_risk_95: valueAtRisk95
      }
    })

    // Calculate correlation matrix
    const correlationMatrix: Record<string, Record<string, number>> = {}
    tickers.forEach(ticker1 => {
      correlationMatrix[ticker1] = {}
      tickers.forEach(ticker2 => {
        if (ticker1 === ticker2) {
          correlationMatrix[ticker1][ticker2] = 1
        } else {
          const returns1 = getPriceData(ticker1).slice(-252).map((p, i, arr) =>
            i > 0 ? (p.close - arr[i-1].close) / arr[i-1].close : 0
          ).slice(1)
          const returns2 = getPriceData(ticker2).slice(-252).map((p, i, arr) =>
            i > 0 ? (p.close - arr[i-1].close) / arr[i-1].close : 0
          ).slice(1)
          correlationMatrix[ticker1][ticker2] = calculateCorrelation(returns1, returns2)
        }
      })
    })

    // Portfolio-level metrics (simplified equal weighting)
    const portfolioVolatility = tickerMetrics.reduce((sum, m) => sum + m.volatility, 0) / tickerMetrics.length
    const portfolioSharpe = tickerMetrics.reduce((sum, m) => sum + m.sharpe_ratio, 0) / tickerMetrics.length
    const portfolioMaxDD = Math.max(...tickerMetrics.map(m => m.max_drawdown))
    const portfolioVaR = tickerMetrics.reduce((sum, m) => sum + m.value_at_risk_95, 0) / tickerMetrics.length

    // Stress test scenarios
    const stressTestResults = [
      {
        scenario: 'Global Recession',
        impact: -0.25,
        probability: 0.1
      },
      {
        scenario: 'Commodity Price Crash',
        impact: -0.35,
        probability: 0.05
      },
      {
        scenario: 'Supply Chain Disruption',
        impact: -0.15,
        probability: 0.2
      },
      {
        scenario: 'Bull Market',
        impact: 0.30,
        probability: 0.3
      }
    ]

    const riskMetrics: RiskMetrics = {
      portfolio_id: portfolio.id,
      total_value: portfolio.current_value || 0,
      volatility: portfolioVolatility,
      sharpe_ratio: portfolioSharpe,
      max_drawdown: portfolioMaxDD,
      value_at_risk_95: portfolioVaR,
      expected_shortfall_95: portfolioVaR * 1.2, // Simplified
      beta: 1.1, // Simplified market beta
      correlation_matrix: correlationMatrix,
      stress_test_results: stressTestResults
    }

    return NextResponse.json({ risk_metrics: riskMetrics, ticker_metrics: tickerMetrics })
  } catch (err: any) {
    console.error('Risk analysis error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}