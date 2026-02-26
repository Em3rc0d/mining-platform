import fs from 'fs'
import path from 'path'
import yahooFinance from './yahooFinance'
import Database from 'better-sqlite3'
import { runAllModels, runBacktest } from './mlEngine'

const DATA_DIR = path.join(process.cwd(), 'data')
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

const dbPath = path.join(DATA_DIR, 'database.sqlite')
const db = new Database(dbPath)

// Initialize schema
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT UNIQUE,
    name TEXT,
    sector TEXT,
    country TEXT,
    market_cap REAL,
    currency TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS price_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT,
    date TEXT,
    open REAL,
    high REAL,
    low REAL,
    close REAL,
    volume REAL,
    adj_close REAL
  );

  CREATE TABLE IF NOT EXISTS predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT,
    model_name TEXT,
    model_type TEXT,
    prediction_date TEXT,
    horizon_days INTEGER,
    predicted_value REAL,
    predicted_direction TEXT,
    confidence REAL,
    actual_value REAL,
    accuracy REAL,
    rmse REAL,
    mae REAL,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS backtest_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT,
    strategy_name TEXT,
    start_date TEXT,
    end_date TEXT,
    initial_capital REAL,
    final_value REAL,
    total_return REAL,
    sharpe_ratio REAL,
    max_drawdown REAL,
    win_rate REAL,
    total_trades INTEGER,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    email TEXT,
    full_name TEXT,
    role TEXT,
    avatar_color TEXT,
    created_at TEXT,
    last_login TEXT
  );

  CREATE TABLE IF NOT EXISTS portfolios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    description TEXT,
    initial_capital REAL,
    current_value REAL,
    currency TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS portfolio_positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id INTEGER,
    ticker TEXT,
    quantity REAL,
    avg_buy_price REAL,
    current_price REAL,
    unrealized_pnl REAL
  );

  CREATE TABLE IF NOT EXISTS operations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id INTEGER,
    ticker TEXT,
    operation_type TEXT,
    quantity REAL,
    price REAL,
    total_value REAL,
    commission REAL,
    notes TEXT,
    operation_date TEXT
  );

  CREATE TABLE IF NOT EXISTS model_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_name TEXT,
    ticker TEXT,
    accuracy REAL,
    precision_score REAL,
    recall REAL,
    f1_score REAL,
    rmse REAL,
    mae REAL,
    r2_score REAL,
    training_date TEXT,
    data_points INTEGER
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT,
    title TEXT,
    message TEXT,
    ticker TEXT,
    threshold REAL,
    current_value REAL,
    condition TEXT,
    confidence REAL,
    prediction_direction TEXT,
    portfolio_id INTEGER,
    risk_metric TEXT,
    model_name TEXT,
    is_active INTEGER,
    is_read INTEGER,
    created_at TEXT,
    triggered_at TEXT
  );
`);

export interface Company { id: number; ticker: string; name: string; sector: string; country: string; market_cap: number | null; currency: string; created_at: string; }
export interface PriceData { id: number; ticker: string; date: string; open: number; high: number; low: number; close: number; volume: number; adj_close: number; }
export interface Prediction { id: number; ticker: string; model_name: string; model_type: string; prediction_date: string; horizon_days: number; predicted_value: number; predicted_direction: string; confidence: number; actual_value: number | null; accuracy: number | null; rmse: number | null; mae: number | null; created_at: string; }
export interface BacktestResult { id: number; ticker: string; strategy_name: string; start_date: string; end_date: string; initial_capital: number; final_value: number; total_return: number; sharpe_ratio: number; max_drawdown: number; win_rate: number; total_trades: number; created_at: string; }
export interface User { id: number; username: string; email: string; full_name: string | null; role: string; avatar_color: string; created_at: string; last_login: string | null; }
export interface Portfolio { id: number; user_id: number; name: string; description: string | null; initial_capital: number; current_value: number | null; currency: string; created_at: string; }
export interface PortfolioPosition { id: number; portfolio_id: number; ticker: string; quantity: number; avg_buy_price: number; current_price: number | null; unrealized_pnl: number | null; }
export interface Operation { id: number; portfolio_id: number; ticker: string; operation_type: string; quantity: number; price: number; total_value: number; commission: number; notes: string | null; operation_date: string; }
export interface ModelMetric { id: number; model_name: string; ticker: string; accuracy: number | null; precision_score: number | null; recall: number | null; f1_score: number | null; rmse: number | null; mae: number | null; r2_score: number | null; training_date: string | null; data_points: number | null; }
export interface Alert { id: number; user_id: number; type: 'price_alert' | 'prediction_alert' | 'risk_alert' | 'system_alert'; title: string; message: string; ticker?: string; threshold?: number; current_value?: number; condition?: 'above' | 'below'; confidence?: number; prediction_direction?: 'up' | 'down'; portfolio_id?: number; risk_metric?: string; model_name?: string; is_active: boolean; is_read: boolean; created_at: string; triggered_at: string | null; }

function getNextId(table: string): number {
  const row = db.prepare(`SELECT MAX(id) as maxId FROM ${table}`).get() as any;
  return (row && row.maxId ? row.maxId : 0) + 1;
}

function readTable<T>(table: string): T[] {
  const rows = db.prepare(`SELECT * FROM ${table}`).all() as Record<string, any>[];
  if (table === 'alerts') {
    return rows.map(r => ({ ...r, is_active: Boolean(r.is_active), is_read: Boolean(r.is_read) })) as T[];
  }
  return rows as T[];
}

function insertBatch(table: string, data: any[]) {
  if (data.length === 0) return;
  const columns = Object.keys(data[0]);
  const placeholders = columns.map(() => '?').join(', ');
  const insert = db.prepare(`INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`);
  const insertMany = db.transaction((rows: any[]) => {
    for (const row of rows) {
      insert.run(columns.map(c => row[c]));
    }
  });
  insertMany(data);
}

// Initialize data if empty
async function initData() {
  const row = db.prepare(`SELECT COUNT(*) as count FROM companies`).get() as any;
  if (row.count === 0) {
    await seedData();
  }
}

async function seedData() {
  console.log('Fetching real stock data from Yahoo Finance...')

  const tickers = ['FSM', 'VOLCABC1.LM', 'BVN', 'ABX', 'BHP', 'SCCO']
  const companies: Company[] = []

  for (let i = 0; i < tickers.length; i++) {
    const ticker = tickers[i]
    try {
      console.log(`Fetching data for ${ticker}...`)
      const quote = await (yahooFinance as any).quoteSummary(ticker, { modules: ['summaryDetail', 'price'] }) as any
      const marketCap = quote.summaryDetail?.marketCap || quote.price?.marketCap
      const displayName = quote.price?.longName || quote.price?.shortName || ticker
      companies.push({ id: i + 1, ticker, name: displayName, sector: 'Mining', country: 'Unknown', market_cap: marketCap || null, currency: 'USD', created_at: new Date().toISOString() })
    } catch (error: any) {
      console.error(`Error fetching metadata for ${ticker}:`, error.message)
      const fallbackData: Record<string, any> = { FSM: { name: 'Fortuna Silver Mines', country: 'Canada', market_cap: 1100000000 }, 'VOLCABC1.LM': { name: 'Volcan Cía Minera', country: 'Peru', market_cap: 350000000 }, BVN: { name: 'Cía Minas Buenaventura', country: 'Peru', market_cap: 4000000000 }, ABX: { name: 'Barrick Gold', country: 'Canada', market_cap: 35000000000 }, BHP: { name: 'BHP Billiton Limited', country: 'Australia', market_cap: 140000000000 }, SCCO: { name: 'Southern Copper', country: 'USA', market_cap: 90000000000 } }
      companies.push({ id: i + 1, ticker, name: fallbackData[ticker].name, sector: 'Mining', country: fallbackData[ticker].country, market_cap: fallbackData[ticker].market_cap, currency: 'USD', created_at: new Date().toISOString() })
    }
  }
  insertBatch('companies', companies);

  const priceData: PriceData[] = []
  let id = 1
  const endDate = new Date()
  const startDate = new Date()
  startDate.setFullYear(startDate.getFullYear() - 2)

  for (const company of companies) {
    try {
      const historical = await (yahooFinance as any).historical(company.ticker, { period1: startDate, period2: endDate, interval: '1d' }) as any
      historical.forEach((day: any) => {
        if (day.close && day.open && day.high && day.low && day.volume) {
          priceData.push({ id: id++, ticker: company.ticker, date: day.date.toISOString().split('T')[0], open: parseFloat(day.open.toFixed(2)), high: parseFloat(day.high.toFixed(2)), low: parseFloat(day.low.toFixed(2)), close: parseFloat(day.close.toFixed(2)), volume: day.volume, adj_close: parseFloat((day.adjClose || day.close).toFixed(2)) })
        }
      })
    } catch (error: any) {
      console.error(`Could not fetch real history for ${company.ticker}, skipping fake data generation.`, error.message)
    }
  }
  insertBatch('price_data', priceData);

  const users: User[] = [
    { id: 1, username: 'analyst1', email: 'ana.garcia@mining.com', full_name: 'Ana García', role: 'senior_analyst', avatar_color: '#f59e0b', created_at: new Date().toISOString(), last_login: null },
    { id: 2, username: 'trader_mx', email: 'carlos.mx@mining.com', full_name: 'Carlos Mendoza', role: 'trader', avatar_color: '#3b82f6', created_at: new Date().toISOString(), last_login: null },
    { id: 3, username: 'quant_r', email: 'rosa.quant@mining.com', full_name: 'Rosa Fernández', role: 'quant', avatar_color: '#10b981', created_at: new Date().toISOString(), last_login: null },
    { id: 4, username: 'pm_lead', email: 'jorge.pm@mining.com', full_name: 'Jorge Ramírez', role: 'portfolio_manager', avatar_color: '#8b5cf6', created_at: new Date().toISOString(), last_login: null },
    { id: 5, username: 'risk_mgr', email: 'lucia.risk@mining.com', full_name: 'Lucía Vargas', role: 'risk_manager', avatar_color: '#ef4444', created_at: new Date().toISOString(), last_login: null },
    { id: 6, username: 'director', email: 'miguel.dir@mining.com', full_name: 'Miguel Torres', role: 'director', avatar_color: '#f97316', created_at: new Date().toISOString(), last_login: null },
  ]
  insertBatch('users', users);

  const portfolios: Portfolio[] = [
    { id: 1, user_id: 1, name: 'Alpha Mining Fund', description: 'Diversified mining portfolio', initial_capital: 500000, current_value: 547230, currency: 'USD', created_at: new Date().toISOString() },
    { id: 2, user_id: 2, name: 'Copper Focus', description: 'Copper-weighted strategy', initial_capital: 250000, current_value: 278450, currency: 'USD', created_at: new Date().toISOString() },
    { id: 3, user_id: 3, name: 'Quant Strategy A', description: 'ML-driven signals', initial_capital: 1000000, current_value: 1124780, currency: 'USD', created_at: new Date().toISOString() },
    { id: 4, user_id: 4, name: 'Balanced Portfolio', description: 'Risk-balanced allocation', initial_capital: 750000, current_value: 791200, currency: 'USD', created_at: new Date().toISOString() },
    { id: 5, user_id: 5, name: 'Risk Parity', description: 'Equal risk contribution', initial_capital: 300000, current_value: 315600, currency: 'USD', created_at: new Date().toISOString() },
    { id: 6, user_id: 6, name: 'Director Fund', description: 'Strategic positions', initial_capital: 2000000, current_value: 2187000, currency: 'USD', created_at: new Date().toISOString() },
  ]
  insertBatch('portfolios', portfolios);

  const operations: Operation[] = [
    { id: 1, portfolio_id: 1, ticker: 'BHP', operation_type: 'BUY', quantity: 500, price: 55.20, total_value: 27600, commission: 0, notes: null, operation_date: new Date().toISOString() },
    { id: 2, portfolio_id: 1, ticker: 'FSM', operation_type: 'BUY', quantity: 300, price: 60.50, total_value: 18150, commission: 0, notes: null, operation_date: new Date().toISOString() },
    { id: 3, portfolio_id: 2, ticker: 'BVN', operation_type: 'BUY', quantity: 800, price: 40.10, total_value: 32080, commission: 0, notes: null, operation_date: new Date().toISOString() },
    { id: 4, portfolio_id: 2, ticker: 'SCCO', operation_type: 'BUY', quantity: 200, price: 72.30, total_value: 14460, commission: 0, notes: null, operation_date: new Date().toISOString() },
    { id: 5, portfolio_id: 3, ticker: 'ABX', operation_type: 'BUY', quantity: 1000, price: 36.80, total_value: 36800, commission: 0, notes: null, operation_date: new Date().toISOString() },
    { id: 6, portfolio_id: 3, ticker: 'VOLCABC1.LM', operation_type: 'BUY', quantity: 2000, price: 15.40, total_value: 30800, commission: 0, notes: null, operation_date: new Date().toISOString() },
    { id: 7, portfolio_id: 1, ticker: 'BHP', operation_type: 'SELL', quantity: 100, price: 59.80, total_value: 5980, commission: 0, notes: null, operation_date: new Date().toISOString() },
  ]
  insertBatch('operations', operations);

  const predictions: Prediction[] = []
  const modelMetrics: ModelMetric[] = []
  const backtestResults: BacktestResult[] = []

  let predId = 1
  let metricId = 1
  let btId = 1
  const strategies = ['SVC Trend', 'LSTM Momentum', 'BiLSTM Signal', 'ARIMA Mean-Rev', 'ARIMA-LSTM VectorBT']

  for (const company of companies) {
    const ticker = company.ticker
    const tickerPrices = priceData.filter(p => p.ticker === ticker).sort((a, b) => a.date.localeCompare(b.date))

    if (tickerPrices.length > 50) {
      // 1. Generate real predictions
      const rawPrices = tickerPrices.map(p => ({ date: p.date, open: p.open, high: p.high, low: p.low, close: p.close, volume: p.volume }))
      const preds = runAllModels(rawPrices)
      const latestPrice = tickerPrices[tickerPrices.length - 1].close

      preds.forEach(p => {
        predictions.push({
          id: predId++, ticker, model_name: p.modelName, model_type: p.modelType,
          prediction_date: new Date().toISOString().split('T')[0], horizon_days: 5,
          predicted_value: p.modelType === 'regression' ? (p.predictedPrice || latestPrice) : latestPrice * (p.predictedDirection === 'UP' ? 1.02 : 0.98),
          predicted_direction: p.predictedDirection || 'HOLD',
          confidence: p.confidence,
          actual_value: latestPrice, accuracy: p.accuracy, rmse: p.metrics.rmse || null, mae: p.metrics.mae || null,
          created_at: new Date().toISOString()
        })
        modelMetrics.push({
          id: metricId++, model_name: p.modelName, ticker,
          accuracy: p.metrics.accuracy || null, precision_score: p.metrics.precision || null, recall: p.metrics.recall || null,
          f1_score: p.metrics.f1 || null, rmse: p.metrics.rmse || null, mae: p.metrics.mae || null, r2_score: p.metrics.r2 || null,
          training_date: '2025-01-01', data_points: tickerPrices.length
        })
      })

      // 2. Generate real initial backtests
      for (const strategy of strategies) {
        const bt = runBacktest(rawPrices, ticker, strategy, 10000)
        backtestResults.push({
          id: btId++, ticker, strategy_name: strategy,
          start_date: tickerPrices[0].date, end_date: tickerPrices[tickerPrices.length - 1].date,
          initial_capital: 10000, final_value: bt.metrics.finalValue, total_return: bt.metrics.totalReturn,
          sharpe_ratio: bt.metrics.sharpeRatio, max_drawdown: bt.metrics.maxDrawdown,
          win_rate: bt.metrics.winRate, total_trades: bt.metrics.totalTrades,
          created_at: new Date().toISOString()
        })
      }
    }
  }
  insertBatch('predictions', predictions);
  insertBatch('model_metrics', modelMetrics);
  insertBatch('backtest_results', backtestResults);
}

// Query functions
export function getUsers(): User[] { return readTable<User>('users'); }
export function getAlerts(userId?: number): Alert[] { const data = readTable<Alert>('alerts'); return userId ? data.filter(a => a.user_id === userId) : data; }
export function getCompanies(): Company[] { return readTable<Company>('companies'); }
export function getPriceData(ticker?: string): PriceData[] { const data = readTable<PriceData>('price_data'); return ticker ? data.filter(p => p.ticker === ticker) : data; }
export function getPredictions(ticker?: string): Prediction[] { const data = readTable<Prediction>('predictions'); return ticker ? data.filter(p => p.ticker === ticker) : data; }
export function getBacktestResults(ticker?: string): BacktestResult[] { const data = readTable<BacktestResult>('backtest_results'); return ticker ? data.filter(b => b.ticker === ticker) : data; }
export function getPortfolios(): Portfolio[] { return readTable<Portfolio>('portfolios'); }
export function getOperations(portfolioId?: number): Operation[] { const data = readTable<Operation>('operations'); return portfolioId ? data.filter(o => o.portfolio_id === portfolioId) : data; }
export function getModelMetrics(ticker?: string): ModelMetric[] { const data = readTable<ModelMetric>('model_metrics'); return ticker ? data.filter(m => m.ticker === ticker) : data; }

// Insert functions
export function insertOperation(operation: Omit<Operation, 'id' | 'operation_date'>) {
  const newOp = { ...operation, id: getNextId('operations'), operation_date: new Date().toISOString() };
  insertBatch('operations', [newOp]);
  return newOp;
}

export function updatePortfolioValue(id: number, valueChange: number) {
  const portfolio = db.prepare('SELECT current_value FROM portfolios WHERE id = ?').get(id) as any;
  if (portfolio) {
    db.prepare('UPDATE portfolios SET current_value = ? WHERE id = ?').run((portfolio.current_value || 0) + valueChange, id);
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
    return { ...company, current_price: currentPrice, prev_price: prevPrice, change: change.toFixed(2), changePct: change.toFixed(2) }
  })
}

export function getPortfoliosWithUsers(userId?: string) {
  const portfolios = readTable<Portfolio>('portfolios')
  const users = readTable<User>('users')
  const operations = readTable<Operation>('operations')

  const userMap = new Map(users.map(u => [u.id, u]))
  const opCountMap = new Map<number, number>()
  operations.forEach(op => { opCountMap.set(op.portfolio_id, (opCountMap.get(op.portfolio_id) || 0) + 1) })

  let filtered = portfolios
  if (userId) { filtered = portfolios.filter(p => p.user_id === parseInt(userId)) }

  return filtered.map(p => {
    const user = userMap.get(p.user_id)
    return { ...p, username: user?.username, full_name: user?.full_name, avatar_color: user?.avatar_color, op_count: opCountMap.get(p.id) || 0, totalReturn: (((p.current_value || 0) - p.initial_capital) / p.initial_capital * 100).toFixed(2), pnl: ((p.current_value || 0) - p.initial_capital).toFixed(2) }
  }).sort((a, b) => (userId ? 0 : (b.current_value || 0) - (a.current_value || 0)))
}

export function getRecentOperations(limit = 50) {
  const operations = readTable<Operation>('operations')
  const portfolios = readTable<Portfolio>('portfolios')
  const portfolioMap = new Map(portfolios.map(p => [p.id, p]))

  return operations.sort((a, b) => new Date(b.operation_date).getTime() - new Date(a.operation_date).getTime()).slice(0, limit).map(op => ({ ...op, portfolio_name: portfolioMap.get(op.portfolio_id)?.name }))
}

export function getDashboardData() {
  const companies = getCompaniesWithPrices()
  const portfolios = readTable<Portfolio>('portfolios')
  const operations = readTable<Operation>('operations')
  const users = readTable<User>('users')
  const modelMetrics = readTable<ModelMetric>('model_metrics')
  const priceData = readTable<PriceData>('price_data')

  const portfolioSummary = { total_portfolios: portfolios.length, total_aum: portfolios.reduce((sum, p) => sum + (p.current_value || 0), 0), total_initial: portfolios.reduce((sum, p) => sum + p.initial_capital, 0), total_pnl: portfolios.reduce((sum, p) => sum + ((p.current_value || 0) - p.initial_capital), 0) }

  const topModels = Object.values(modelMetrics.reduce((acc: Record<string, any>, m) => {
    if (!acc[m.model_name]) { acc[m.model_name] = { model_name: m.model_name, accuracies: [], f1s: [] } }
    if (m.accuracy) acc[m.model_name].accuracies.push(m.accuracy)
    if (m.f1_score) acc[m.model_name].f1s.push(m.f1_score)
    return acc
  }, {})).map((m: any) => ({ model_name: m.model_name, avg_accuracy: m.accuracies.reduce((a: number, b: number) => a + b, 0) / m.accuracies.length, avg_f1: m.f1s.reduce((a: number, b: number) => a + b, 0) / m.f1s.length })).sort((a: any, b: any) => b.avg_accuracy - a.avg_accuracy)

  const recentOps = getRecentOperations(10)

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const priceHistory = priceData.filter(p => new Date(p.date) >= ninetyDaysAgo).sort((a, b) => a.ticker.localeCompare(b.ticker) || a.date.localeCompare(b.date))

  const priceByTicker: Record<string, any[]> = {}
  priceHistory.forEach(p => {
    if (!priceByTicker[p.ticker]) priceByTicker[p.ticker] = []
    priceByTicker[p.ticker].push({ ticker: p.ticker, date: p.date, close: p.close })
  })

  return { companies, portfolio: { ...portfolioSummary, returnPct: portfolioSummary.total_initial > 0 ? (portfolioSummary.total_pnl / portfolioSummary.total_initial * 100).toFixed(2) : '0.00' }, stats: { totalOperations: operations.length, totalUsers: users.length, totalCompanies: companies.length, modelsDeployed: 8 }, topModels, recentOperations: recentOps, priceHistory: priceByTicker }
}

// Initialize
initData().catch(console.error);
