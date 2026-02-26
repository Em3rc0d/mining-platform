import fs from 'fs'
import path from 'path'
import yahooFinance from 'yahoo-finance2'

const DATA_DIR = path.join(process.cwd(), 'data')

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

// Interfaces
export interface Company {
  id: number
  ticker: string
  name: string
  sector: string
  country: string
  market_cap: number | null
  currency: string
  created_at: string
}

export interface PriceData {
  id: number
  ticker: string
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  adj_close: number
}

export interface Prediction {
  id: number
  ticker: string
  model_name: string
  model_type: string
  prediction_date: string
  horizon_days: number
  predicted_value: number
  predicted_direction: string
  confidence: number
  actual_value: number | null
  accuracy: number | null
  rmse: number | null
  mae: number | null
  created_at: string
}

export interface BacktestResult {
  id: number
  ticker: string
  strategy_name: string
  start_date: string
  end_date: string
  initial_capital: number
  final_value: number
  total_return: number
  sharpe_ratio: number
  max_drawdown: number
  win_rate: number
  total_trades: number
  created_at: string
}

export interface User {
  id: number
  username: string
  email: string
  full_name: string | null
  role: string
  avatar_color: string
  created_at: string
  last_login: string | null
}

export interface Portfolio {
  id: number
  user_id: number
  name: string
  description: string | null
  initial_capital: number
  current_value: number | null
  currency: string
  created_at: string
}

export interface PortfolioPosition {
  id: number
  portfolio_id: number
  ticker: string
  quantity: number
  avg_buy_price: number
  current_price: number | null
  unrealized_pnl: number | null
}

export interface Operation {
  id: number
  portfolio_id: number
  ticker: string
  operation_type: string
  quantity: number
  price: number
  total_value: number
  commission: number
  notes: string | null
  operation_date: string
}

export interface ModelMetric {
  id: number
  model_name: string
  ticker: string
  accuracy: number | null
  precision_score: number | null
  recall: number | null
  f1_score: number | null
  rmse: number | null
  mae: number | null
  r2_score: number | null
  training_date: string | null
  data_points: number | null
}

export interface Alert {
  id: number
  user_id: number
  type: 'price_alert' | 'prediction_alert' | 'risk_alert' | 'system_alert'
  title: string
  message: string
  ticker?: string
  threshold?: number
  current_value?: number
  condition?: 'above' | 'below'
  confidence?: number
  prediction_direction?: 'up' | 'down'
  portfolio_id?: number
  risk_metric?: string
  model_name?: string
  is_active: boolean
  is_read: boolean
  created_at: string
  triggered_at: string | null
}

// File paths
const files = {
  companies: path.join(DATA_DIR, 'companies.json'),
  price_data: path.join(DATA_DIR, 'price_data.json'),
  predictions: path.join(DATA_DIR, 'predictions.json'),
  backtest_results: path.join(DATA_DIR, 'backtest_results.json'),
  users: path.join(DATA_DIR, 'users.json'),
  portfolios: path.join(DATA_DIR, 'portfolios.json'),
  portfolio_positions: path.join(DATA_DIR, 'portfolio_positions.json'),
  operations: path.join(DATA_DIR, 'operations.json'),
  model_metrics: path.join(DATA_DIR, 'model_metrics.json'),
  alerts: path.join(DATA_DIR, 'alerts.json'),
}

// Helper functions
function readJson<T>(file: string): T[] {
  if (!fs.existsSync(file)) return []
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function writeJson<T>(file: string, data: T[]) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
}

function getNextId(items: { id: number }[]): number {
  return items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1
}

// Initialize data if empty
async function initData() {
  const companies = readJson<Company>(files.companies)
  if (companies.length === 0) {
    await seedData()
  }
}

async function seedData() {
  console.log('Fetching real stock data from Yahoo Finance...')

  const tickers = ['FSM', 'VOLCABC1.LM', 'BVN', 'ABX', 'BHP', 'SCCO']
  const companies: Company[] = []

  // Fetch company info and market caps
  for (let i = 0; i < tickers.length; i++) {
    const ticker = tickers[i]
    try {
      console.log(`Fetching data for ${ticker}...`)
      const quote = await yahooFinance.quoteSummary(ticker, { modules: ['summaryDetail', 'price'] }) as any
      console.log(`Raw data for ${ticker}:`, JSON.stringify(quote, null, 2))
      const marketCap = quote.summaryDetail?.marketCap || quote.price?.marketCap
      const displayName = quote.price?.longName || quote.price?.shortName || ticker
      const country = 'Unknown' // Yahoo doesn't provide country in these modules

      companies.push({
        id: i + 1,
        ticker,
        name: displayName,
        sector: 'Mining',
        country,
        market_cap: marketCap || null,
        currency: 'USD',
        created_at: new Date().toISOString()
      })
      console.log(`Successfully fetched data for ${ticker}: ${displayName}, Market Cap: ${marketCap}`)
    } catch (error) {
      console.error(`Failed to fetch data for ${ticker}:`, error)
      // Fallback to static data with updated market caps
      const fallbackData: Record<string, any> = {
        FSM: { name: 'Fortuna Silver Mines', country: 'Canada', market_cap: 1100000000 },
        'VOLCABC1.LM': { name: 'Volcan Cía Minera', country: 'Peru', market_cap: 350000000 },
        BVN: { name: 'Cía Minas Buenaventura', country: 'Peru', market_cap: 4000000000 },
        ABX: { name: 'Barrick Gold', country: 'Canada', market_cap: 35000000000 },
        BHP: { name: 'BHP Billiton Limited', country: 'Australia', market_cap: 140000000000 },
        SCCO: { name: 'Southern Copper', country: 'USA', market_cap: 90000000000 },
      }
      companies.push({
        id: i + 1,
        ticker,
        name: fallbackData[ticker].name,
        sector: 'Mining',
        country: fallbackData[ticker].country,
        market_cap: fallbackData[ticker].market_cap,
        currency: 'USD',
        created_at: new Date().toISOString()
      })
    }
  }

  writeJson(files.companies, companies)

  // Fetch historical price data
  const priceData: PriceData[] = []
  let id = 1

  const endDate = new Date()
  const startDate = new Date()
  startDate.setFullYear(startDate.getFullYear() - 2) // 2 years of data

  for (const company of companies) {
    try {
      const historical = await yahooFinance.historical(company.ticker, {
        period1: startDate,
        period2: endDate,
        interval: '1d'
      }) as any

      historical.forEach((day: any) => {
        if (day.close && day.open && day.high && day.low && day.volume) {
          priceData.push({
            id: id++,
            ticker: company.ticker,
            date: day.date.toISOString().split('T')[0],
            open: parseFloat(day.open.toFixed(2)),
            high: parseFloat(day.high.toFixed(2)),
            low: parseFloat(day.low.toFixed(2)),
            close: parseFloat(day.close.toFixed(2)),
            volume: day.volume,
            adj_close: parseFloat((day.adjClose || day.close).toFixed(2))
          })
        }
      })
      console.log(`Fetched ${historical.length} days of data for ${company.ticker}`)
    } catch (error) {
      console.error(`Failed to fetch historical data for ${company.ticker}:`, error)
      // Generate fallback data
      let price = 50 + Math.random() * 100
      const fallbackStart = new Date()
      fallbackStart.setDate(fallbackStart.getDate() - 500)

      for (let i = 0; i < 500; i++) {
        const date = new Date(fallbackStart)
        date.setDate(fallbackStart.getDate() + i)
        if (date.getDay() === 0 || date.getDay() === 6) continue

        const change = (Math.random() - 0.48) * price * 0.025
        const open = price
        price = Math.max(price + change, price * 0.5)
        const high = price * (1 + Math.random() * 0.015)
        const low = price * (1 - Math.random() * 0.015)
        const volume = Math.floor(Math.random() * 8000000 + 2000000)

        priceData.push({
          id: id++,
          ticker: company.ticker,
          date: date.toISOString().split('T')[0],
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(price.toFixed(2)),
          volume,
          adj_close: parseFloat(price.toFixed(2))
        })
      }
    }
  }

  writeJson(files.price_data, priceData)

  // Users
  const users: User[] = [
    { id: 1, username: 'analyst1', email: 'ana.garcia@mining.com', full_name: 'Ana García', role: 'senior_analyst', avatar_color: '#f59e0b', created_at: new Date().toISOString(), last_login: null },
    { id: 2, username: 'trader_mx', email: 'carlos.mx@mining.com', full_name: 'Carlos Mendoza', role: 'trader', avatar_color: '#3b82f6', created_at: new Date().toISOString(), last_login: null },
    { id: 3, username: 'quant_r', email: 'rosa.quant@mining.com', full_name: 'Rosa Fernández', role: 'quant', avatar_color: '#10b981', created_at: new Date().toISOString(), last_login: null },
    { id: 4, username: 'pm_lead', email: 'jorge.pm@mining.com', full_name: 'Jorge Ramírez', role: 'portfolio_manager', avatar_color: '#8b5cf6', created_at: new Date().toISOString(), last_login: null },
    { id: 5, username: 'risk_mgr', email: 'lucia.risk@mining.com', full_name: 'Lucía Vargas', role: 'risk_manager', avatar_color: '#ef4444', created_at: new Date().toISOString(), last_login: null },
    { id: 6, username: 'director', email: 'miguel.dir@mining.com', full_name: 'Miguel Torres', role: 'director', avatar_color: '#f97316', created_at: new Date().toISOString(), last_login: null },
  ]
  writeJson(files.users, users)

  // Portfolios
  const portfolios: Portfolio[] = [
    { id: 1, user_id: 1, name: 'Alpha Mining Fund', description: 'Diversified mining portfolio', initial_capital: 500000, current_value: 547230, currency: 'USD', created_at: new Date().toISOString() },
    { id: 2, user_id: 2, name: 'Copper Focus', description: 'Copper-weighted strategy', initial_capital: 250000, current_value: 278450, currency: 'USD', created_at: new Date().toISOString() },
    { id: 3, user_id: 3, name: 'Quant Strategy A', description: 'ML-driven signals', initial_capital: 1000000, current_value: 1124780, currency: 'USD', created_at: new Date().toISOString() },
    { id: 4, user_id: 4, name: 'Balanced Portfolio', description: 'Risk-balanced allocation', initial_capital: 750000, current_value: 791200, currency: 'USD', created_at: new Date().toISOString() },
    { id: 5, user_id: 5, name: 'Risk Parity', description: 'Equal risk contribution', initial_capital: 300000, current_value: 315600, currency: 'USD', created_at: new Date().toISOString() },
    { id: 6, user_id: 6, name: 'Director Fund', description: 'Strategic positions', initial_capital: 2000000, current_value: 2187000, currency: 'USD', created_at: new Date().toISOString() },
  ]
  writeJson(files.portfolios, portfolios)

  // Operations
  const operations: Operation[] = [
    { id: 1, portfolio_id: 1, ticker: 'BHP', operation_type: 'BUY', quantity: 500, price: 55.20, total_value: 27600, commission: 0, notes: null, operation_date: new Date().toISOString() },
    { id: 2, portfolio_id: 1, ticker: 'FSM', operation_type: 'BUY', quantity: 300, price: 60.50, total_value: 18150, commission: 0, notes: null, operation_date: new Date().toISOString() },
    { id: 3, portfolio_id: 2, ticker: 'BVN', operation_type: 'BUY', quantity: 800, price: 40.10, total_value: 32080, commission: 0, notes: null, operation_date: new Date().toISOString() },
    { id: 4, portfolio_id: 2, ticker: 'SCCO', operation_type: 'BUY', quantity: 200, price: 72.30, total_value: 14460, commission: 0, notes: null, operation_date: new Date().toISOString() },
    { id: 5, portfolio_id: 3, ticker: 'ABX', operation_type: 'BUY', quantity: 1000, price: 36.80, total_value: 36800, commission: 0, notes: null, operation_date: new Date().toISOString() },
    { id: 6, portfolio_id: 3, ticker: 'VOLCABC1.LM', operation_type: 'BUY', quantity: 2000, price: 15.40, total_value: 30800, commission: 0, notes: null, operation_date: new Date().toISOString() },
    { id: 7, portfolio_id: 1, ticker: 'BHP', operation_type: 'SELL', quantity: 100, price: 59.80, total_value: 5980, commission: 0, notes: null, operation_date: new Date().toISOString() },
  ]
  writeJson(files.operations, operations)

  // Predictions and metrics
  const predictions: Prediction[] = []
  const modelMetrics: ModelMetric[] = []
  const models = [
    { name: 'SVC', type: 'classification' },
    { name: 'Simple RNN', type: 'classification' },
    { name: 'LSTM Classifier', type: 'classification' },
    { name: 'BiLSTM Classifier', type: 'classification' },
    { name: 'GRU Classifier', type: 'classification' },
    { name: 'ARIMA', type: 'regression' },
    { name: 'LSTM Regressor', type: 'regression' },
    { name: 'ARIMA-LSTM Ensemble', type: 'regression' },
  ]
  let predId = 1
  let metricId = 1
  companies.forEach(({ ticker }) => {
    // Get latest price from real data
    const latestPrice = priceData
      .filter(p => p.ticker === ticker)
      .sort((a, b) => b.date.localeCompare(a.date))[0]?.close || 50

    models.forEach(model => {
      const acc = 0.55 + Math.random() * 0.25
      const rmse = 1.2 + Math.random() * 2
      const predPrice = latestPrice * (1 + (Math.random() - 0.47) * 0.05)
      const dir = predPrice > latestPrice ? 'UP' : 'DOWN'

      predictions.push({
        id: predId++,
        ticker,
        model_name: model.name,
        model_type: model.type,
        prediction_date: new Date().toISOString().split('T')[0],
        horizon_days: 5,
        predicted_value: parseFloat(predPrice.toFixed(2)),
        predicted_direction: dir,
        confidence: parseFloat(acc.toFixed(3)),
        actual_value: latestPrice,
        accuracy: parseFloat(acc.toFixed(3)),
        rmse: parseFloat(rmse.toFixed(3)),
        mae: parseFloat((rmse * 0.75).toFixed(3)),
        created_at: new Date().toISOString()
      })
      modelMetrics.push({
        id: metricId++,
        model_name: model.name,
        ticker,
        accuracy: parseFloat(acc.toFixed(3)),
        precision_score: parseFloat((acc - 0.02 + Math.random() * 0.04).toFixed(3)),
        recall: parseFloat((acc - 0.03 + Math.random() * 0.06).toFixed(3)),
        f1_score: parseFloat((acc - 0.01 + Math.random() * 0.02).toFixed(3)),
        rmse: parseFloat(rmse.toFixed(3)),
        mae: parseFloat((rmse * 0.75).toFixed(3)),
        r2_score: parseFloat((acc - 0.1 + Math.random() * 0.15).toFixed(3)),
        training_date: '2024-01-01',
        data_points: 365 + Math.floor(Math.random() * 100)
      })
    })
  })
  writeJson(files.predictions, predictions)
  writeJson(files.model_metrics, modelMetrics)

  // Backtest results
  const backtestResults: BacktestResult[] = []
  const strategies = ['SVC Trend', 'LSTM Momentum', 'BiLSTM Signal', 'ARIMA Mean-Rev', 'ARIMA-LSTM VectorBT']
  let btId = 1
  companies.forEach(({ ticker }) => {
    strategies.forEach(strategy => {
      const ret = -0.1 + Math.random() * 0.45
      const capital = 10000
      backtestResults.push({
        id: btId++,
        ticker,
        strategy_name: strategy,
        start_date: '2023-01-01',
        end_date: '2024-12-31',
        initial_capital: capital,
        final_value: parseFloat((capital * (1 + ret)).toFixed(2)),
        total_return: parseFloat((ret * 100).toFixed(2)),
        sharpe_ratio: parseFloat((0.5 + Math.random() * 2).toFixed(2)),
        max_drawdown: parseFloat((-(5 + Math.random() * 25)).toFixed(2)),
        win_rate: parseFloat((0.45 + Math.random() * 0.2).toFixed(2)),
        total_trades: Math.floor(20 + Math.random() * 80),
        created_at: new Date().toISOString()
      })
    })
  })
  writeJson(files.backtest_results, backtestResults)

  // Empty arrays for positions
  writeJson(files.portfolio_positions, [])
}

// Query functions
export function getUsers(): User[] {
  return readJson<User>(files.users)
}

export function getAlerts(userId?: number): Alert[] {
  const data = readJson<Alert>(files.alerts)
  return userId ? data.filter(a => a.user_id === userId) : data
}

export function getCompanies(): Company[] {
  return readJson<Company>(files.companies)
}

export function getPriceData(ticker?: string): PriceData[] {
  const data = readJson<PriceData>(files.price_data)
  return ticker ? data.filter(p => p.ticker === ticker) : data
}

export function getPredictions(ticker?: string): Prediction[] {
  const data = readJson<Prediction>(files.predictions)
  return ticker ? data.filter(p => p.ticker === ticker) : data
}

export function getBacktestResults(ticker?: string): BacktestResult[] {
  const data = readJson<BacktestResult>(files.backtest_results)
  return ticker ? data.filter(b => b.ticker === ticker) : data
}

export function getPortfolios(): Portfolio[] {
  return readJson<Portfolio>(files.portfolios)
}

export function getOperations(portfolioId?: number): Operation[] {
  const data = readJson<Operation>(files.operations)
  return portfolioId ? data.filter(o => o.portfolio_id === portfolioId) : data
}

export function getModelMetrics(ticker?: string): ModelMetric[] {
  const data = readJson<ModelMetric>(files.model_metrics)
  return ticker ? data.filter(m => m.ticker === ticker) : data
}

// Insert functions
export function insertOperation(operation: Omit<Operation, 'id' | 'operation_date'>) {
  const operations = readJson<Operation>(files.operations)
  const newOp: Operation = {
    ...operation,
    id: getNextId(operations),
    operation_date: new Date().toISOString()
  }
  operations.push(newOp)
  writeJson(files.operations, operations)
  return newOp
}

export function updatePortfolioValue(id: number, valueChange: number) {
  const portfolios = readJson<Portfolio>(files.portfolios)
  const portfolio = portfolios.find(p => p.id === id)
  if (portfolio) {
    portfolio.current_value = (portfolio.current_value || 0) + valueChange
    writeJson(files.portfolios, portfolios)
  }
}

// Complex queries
export function getCompaniesWithPrices(): any[] {
  const companies = getCompanies()
  const priceData = getPriceData()

  return companies.map(company => {
    const prices = priceData.filter(p => p.ticker === company.ticker).sort((a, b) => b.date.localeCompare(a.date))
    const currentPrice = prices[0]?.close || null
    const prevPrice = prices[1]?.close || null
    const change = currentPrice && prevPrice ? ((currentPrice - prevPrice) / prevPrice * 100) : 0
    return {
      ...company,
      current_price: currentPrice,
      prev_price: prevPrice,
      change: change.toFixed(2),
      changePct: change.toFixed(2)
    }
  })
}

export function getPortfoliosWithUsers(userId?: string) {
  const portfolios = readJson<Portfolio>(files.portfolios)
  const users = readJson<User>(files.users)
  const operations = readJson<Operation>(files.operations)

  const userMap = new Map(users.map(u => [u.id, u]))
  const opCountMap = new Map<number, number>()
  operations.forEach(op => {
    opCountMap.set(op.portfolio_id, (opCountMap.get(op.portfolio_id) || 0) + 1)
  })

  let filtered = portfolios
  if (userId) {
    filtered = portfolios.filter(p => p.user_id === parseInt(userId))
  }

  return filtered.map(p => {
    const user = userMap.get(p.user_id)
    return {
      ...p,
      username: user?.username,
      full_name: user?.full_name,
      avatar_color: user?.avatar_color,
      op_count: opCountMap.get(p.id) || 0,
      totalReturn: (((p.current_value || 0) - p.initial_capital) / p.initial_capital * 100).toFixed(2),
      pnl: ((p.current_value || 0) - p.initial_capital).toFixed(2)
    }
  }).sort((a, b) => (userId ? 0 : (b.current_value || 0) - (a.current_value || 0)))
}

export function getRecentOperations(limit = 50) {
  const operations = readJson<Operation>(files.operations)
  const portfolios = readJson<Portfolio>(files.portfolios)
  const portfolioMap = new Map(portfolios.map(p => [p.id, p]))

  return operations
    .sort((a, b) => new Date(b.operation_date).getTime() - new Date(a.operation_date).getTime())
    .slice(0, limit)
    .map(op => ({
      ...op,
      portfolio_name: portfolioMap.get(op.portfolio_id)?.name
    }))
}

export function getDashboardData() {
  const companies = getCompaniesWithPrices()
  const portfolios = readJson<Portfolio>(files.portfolios)
  const operations = readJson<Operation>(files.operations)
  const users = readJson<User>(files.users)
  const modelMetrics = readJson<ModelMetric>(files.model_metrics)
  const priceData = readJson<PriceData>(files.price_data)

  const portfolioSummary = {
    total_portfolios: portfolios.length,
    total_aum: portfolios.reduce((sum, p) => sum + (p.current_value || 0), 0),
    total_initial: portfolios.reduce((sum, p) => sum + p.initial_capital, 0),
    total_pnl: portfolios.reduce((sum, p) => sum + ((p.current_value || 0) - p.initial_capital), 0)
  }

  const topModels = Object.values(
    modelMetrics.reduce((acc: Record<string, any>, m) => {
      if (!acc[m.model_name]) {
        acc[m.model_name] = { model_name: m.model_name, accuracies: [], f1s: [] }
      }
      if (m.accuracy) acc[m.model_name].accuracies.push(m.accuracy)
      if (m.f1_score) acc[m.model_name].f1s.push(m.f1_score)
      return acc
    }, {})
  ).map((m: any) => ({
    model_name: m.model_name,
    avg_accuracy: m.accuracies.reduce((a: number, b: number) => a + b, 0) / m.accuracies.length,
    avg_f1: m.f1s.reduce((a: number, b: number) => a + b, 0) / m.f1s.length
  })).sort((a: any, b: any) => b.avg_accuracy - a.avg_accuracy)

  const recentOps = getRecentOperations(10)

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const priceHistory = priceData
    .filter(p => new Date(p.date) >= ninetyDaysAgo)
    .sort((a, b) => a.ticker.localeCompare(b.ticker) || a.date.localeCompare(b.date))

  const priceByTicker: Record<string, any[]> = {}
  priceHistory.forEach(p => {
    if (!priceByTicker[p.ticker]) priceByTicker[p.ticker] = []
    priceByTicker[p.ticker].push({ ticker: p.ticker, date: p.date, close: p.close })
  })

  return {
    companies,
    portfolio: {
      ...portfolioSummary,
      returnPct: portfolioSummary.total_initial > 0
        ? (portfolioSummary.total_pnl / portfolioSummary.total_initial * 100).toFixed(2)
        : '0.00',
    },
    stats: {
      totalOperations: operations.length,
      totalUsers: users.length,
      totalCompanies: companies.length,
      modelsDeployed: 8,
    },
    topModels,
    recentOperations: recentOps,
    priceHistory: priceByTicker,
  }
}

// Initialize
(async () => {
  await initData()
})()
