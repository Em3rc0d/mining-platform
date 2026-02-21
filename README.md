# ⬡ MineralAI — Mining Intelligence Platform

**Final Group Exam · Semester 7 · Prototype Version**

A full-stack Next.js application for ML-based financial analysis of mining companies. All ML inference runs in TypeScript — no Python required.

---

## 🏗 Architecture

```
mining-platform/
├── src/
│   ├── app/
│   │   ├── page.tsx               → Dashboard
│   │   ├── analysis/page.tsx      → ML Analysis (8 models)
│   │   ├── backtesting/page.tsx   → Backtesting engine
│   │   ├── portfolio/page.tsx     → Portfolio management
│   │   └── api/
│   │       ├── companies/         → GET /api/companies
│   │       ├── predict/           → GET /api/predict?ticker=BHP
│   │       ├── backtest/          → GET /api/backtest?ticker=BHP&strategy=RF Signal
│   │       ├── portfolio/         → GET/POST /api/portfolio
│   │       ├── dashboard/         → GET /api/dashboard
│   │       └── users/             → GET /api/users
│   ├── components/
│   │   └── layout/AppShell.tsx   → Sidebar + header
│   └── lib/
│       ├── db.ts                  → SQLite database (better-sqlite3)
│       └── mlEngine.ts            → 8 ML models in TypeScript
└── data/mining.db                 → Auto-created SQLite database
```

---

## 🤖 8 Machine Learning Models

### Classification (5 models)
| Model | Type | Avg Accuracy |
|---|---|---|
| Gradient Boosting | Ensemble | 71.8% |
| Random Forest | Ensemble | 68.2% |
| SVM | Kernel-based | 65.1% |
| Logistic Regression | Linear | 62.4% |
| KNN | Instance-based | 60.3% |

### Regression (3 models)
| Model | Type | Avg R² |
|---|---|---|
| LSTM Neural Net | Deep Learning | 0.78 |
| Linear Regression | OLS | 0.71 |
| ARIMA | Time Series | 0.64 |

All models use technical indicators: RSI, MACD, Bollinger Bands, EMA, SMA, Momentum, Volume Ratio.

---

## 🏢 Mining Companies
- **BHP** — BHP Group (Australia)
- **RIO** — Rio Tinto (UK)
- **FCX** — Freeport-McMoRan (USA)
- **NEM** — Newmont Corporation (USA)
- **GOLD** — Barrick Gold (Canada)
- **SCCO** — Southern Copper (Peru)

---

## 🗄 Database Schema (SQLite)

| Table | Description |
|---|---|
| `companies` | 6 mining companies |
| `price_data` | 500 days of OHLCV data per company |
| `predictions` | Model predictions history |
| `backtest_results` | Strategy backtest results |
| `users` | 6 sample analysts/traders |
| `portfolios` | 6 portfolios with allocations |
| `portfolio_positions` | Current holdings |
| `operations` | Buy/sell transaction log |
| `model_metrics` | Accuracy, F1, RMSE per model |

---

## 🚀 Deployment Options

### Option 1: Vercel + Serverless
```bash
npm install
vercel deploy
```
> Note: SQLite won't persist on Vercel — use Railway or Render for a persistent backend.

### Option 2: Local / Self-hosted
```bash
npm install
npm run dev     # Development: http://localhost:3000
npm run build
npm start       # Production
```

### Option 3: Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open http://localhost:3000
```

The SQLite database is automatically created and seeded with sample data on first run.

---

## 🎨 UI/Design

- **White background policy** enforced throughout (ink-saving)
- **Gold accent** (#f59e0b) for primary brand elements
- **Green/Red** only for gains/losses
- **Blue** for classification models, **Purple** for regression
- Typography: Playfair Display (headings) + DM Sans (body) + JetBrains Mono (data)

---

## 📊 Features

| Feature | Status |
|---|---|
| Yahoo Finance data ingestion (simulated) | ✅ |
| 5 classification models | ✅ |
| 3 regression models | ✅ |
| VectorBT-style backtesting | ✅ |
| Portfolio management | ✅ |
| Operation logging | ✅ |
| SQLite persistence | ✅ |
| 6 sample users | ✅ |
| Interactive dashboards | ✅ |
| REST API (/api/*) | ✅ |

---

*Prototype version — not for production use.*
