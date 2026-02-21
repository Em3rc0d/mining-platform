'use client'
import { useState, useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ScatterChart, Scatter, Line, ReferenceLine } from 'recharts'

const COMPANIES = ['BHP', 'RIO', 'FCX', 'NEM', 'GOLD', 'SCCO']
const COMPANY_COLORS: Record<string, string> = { BHP: '#f59e0b', RIO: '#3b82f6', FCX: '#10b981', NEM: '#8b5cf6', GOLD: '#ef4444', SCCO: '#f97316' }

function ModelCard({ prediction, currentPrice }: { prediction: any, currentPrice: number }) {
  const isClassification = prediction.modelType === 'classification'
  const dir = prediction.predictedDirection
  const color = dir === 'UP' ? '#059669' : dir === 'DOWN' ? '#dc2626' : '#64748b'
  const confPct = (prediction.confidence * 100).toFixed(1)

  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>{prediction.modelName}</div>
          <span className={`badge ${isClassification ? 'tag-classification' : 'tag-regression'}`}>
            {isClassification ? 'Classification' : 'Regression'}
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: '1.2rem', fontWeight: 800, color,
            fontFamily: 'var(--font-mono)',
          }}>
            {dir === 'UP' ? '▲' : dir === 'DOWN' ? '▼' : '–'} {dir}
          </div>
          {prediction.predictedPrice && (
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
              ${parseFloat(prediction.predictedPrice).toFixed(2)}
            </div>
          )}
        </div>
      </div>

      {/* Confidence */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8', marginBottom: 4 }}>
          <span>Confidence</span>
          <span style={{ fontWeight: 600, color: '#64748b' }}>{confPct}%</span>
        </div>
        <div className="confidence-bar">
          <div className="confidence-bar-fill" style={{
            width: `${confPct}%`,
            background: parseFloat(confPct) > 70 ? '#10b981' : parseFloat(confPct) > 55 ? '#f59e0b' : '#ef4444',
          }} />
        </div>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        {isClassification ? (
          <>
            {['accuracy', 'precision', 'recall', 'f1'].map(m => (
              <div key={m} style={{ background: '#f8fafc', borderRadius: 6, padding: '6px 10px' }}>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600 }}>
                  {(prediction.metrics[m] * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            {['rmse', 'mae', 'r2'].map(m => (
              <div key={m} style={{ background: '#f8fafc', borderRadius: 6, padding: '6px 10px' }}>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.replace('_', ' ')}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600 }}>
                  {prediction.metrics[m]?.toFixed(3) ?? '—'}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

export default function AnalysisPage() {
  const [ticker, setTicker] = useState('BHP')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchPredictions = async (t: string) => {
    setLoading(true)
    const res = await fetch(`/api/predict?ticker=${t}`)
    const d = await res.json()
    setData(d)
    setLoading(false)
  }

  useEffect(() => { fetchPredictions(ticker) }, [ticker])

  const classificationModels = data?.predictions?.filter((p: any) => p.modelType === 'classification') || []
  const regressionModels = data?.predictions?.filter((p: any) => p.modelType === 'regression') || []

  const radarData = data?.predictions?.map((p: any) => ({
    model: p.modelName.replace(' Neural Net', '').replace(' Regression', '').replace(' Boosting', ' Boost'),
    accuracy: parseFloat((p.confidence * 100).toFixed(1)),
  })) || []

  const consensusDir = data?.consensus?.direction
  const consensusColor = consensusDir === 'UP' ? '#059669' : consensusDir === 'DOWN' ? '#dc2626' : '#64748b'

  return (
    <AppShell>
      {/* Company selector */}
      <div className="card animate-in" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#64748b', marginRight: 4 }}>Select Company:</div>
          {COMPANIES.map(t => (
            <button key={t} onClick={() => setTicker(t)} style={{
              padding: '8px 20px', borderRadius: 8, fontWeight: 700, fontSize: '0.85rem',
              fontFamily: 'var(--font-mono)', cursor: 'pointer', transition: 'all 0.15s',
              background: ticker === t ? COMPANY_COLORS[t] : 'transparent',
              color: ticker === t ? 'white' : '#64748b',
              border: `1.5px solid ${ticker === t ? COMPANY_COLORS[t] : '#e2e8f0'}`,
            }}>{t}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, gap: 12 }}>
          <div className="spinner" />
          <span style={{ color: '#64748b' }}>Running 8 ML models...</span>
        </div>
      ) : data && (
        <>
          {/* Consensus panel */}
          <div className="card animate-in" style={{ padding: '24px 28px', marginBottom: 20, background: 'linear-gradient(135deg, #fffbeb, #fff)', borderColor: '#fde68a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Model Consensus — {ticker}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 900, color: consensusColor, lineHeight: 1 }}>
                    {consensusDir === 'UP' ? '▲ BULLISH' : consensusDir === 'DOWN' ? '▼ BEARISH' : '– NEUTRAL'}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
                    ${parseFloat(data.currentPrice).toFixed(2)}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#92400e', marginTop: 8 }}>
                  Avg. confidence: <strong>{(data.consensus.confidence * 100).toFixed(1)}%</strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                {[
                  { label: 'UP votes', value: data.consensus.upVotes, color: '#059669' },
                  { label: 'DOWN votes', value: data.consensus.downVotes, color: '#dc2626' },
                  { label: 'HOLD votes', value: data.consensus.holdVotes, color: '#64748b' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ textAlign: 'center', background: 'white', borderRadius: 12, padding: '14px 20px', border: '1px solid #fde68a' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color, fontFamily: 'var(--font-display)' }}>{value}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Classification Models */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>Classification Models</div>
              <span className="badge tag-classification">5 models</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
              {classificationModels.map((p: any, i: number) => (
                <div key={p.modelName} className="animate-in" style={{ animationDelay: `${i * 0.07}s` }}>
                  <ModelCard prediction={p} currentPrice={data.currentPrice} />
                </div>
              ))}
            </div>
          </div>

          {/* Regression Models */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>Regression Models</div>
              <span className="badge tag-regression">3 models</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
              {regressionModels.map((p: any, i: number) => (
                <div key={p.modelName} className="animate-in" style={{ animationDelay: `${i * 0.07}s` }}>
                  <ModelCard prediction={p} currentPrice={data.currentPrice} />
                </div>
              ))}
            </div>
          </div>

          {/* Radar chart */}
          <div className="card animate-in" style={{ padding: '20px 24px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>Model Confidence Radar</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 16 }}>Comparative confidence scores for {ticker}</div>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="model" tick={{ fontSize: 11, fill: '#64748b' }} />
                <Radar name="Confidence" dataKey="accuracy" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Classification Metrics Chart */}
          {classificationModels.length > 0 && (
            <div className="card animate-in" style={{ padding: '20px 24px', marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>Classification Model Metrics</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 16 }}>Performance metrics comparison for {ticker}</div>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={classificationModels.map(p => ({
                  model: p.modelName.replace(' Neural Net', '').replace(' Regression', '').replace(' Boosting', ' Boost'),
                  accuracy: (p.metrics.accuracy * 100).toFixed(1),
                  precision: (p.metrics.precision * 100).toFixed(1),
                  recall: (p.metrics.recall * 100).toFixed(1),
                  f1: (p.metrics.f1 * 100).toFixed(1)
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="model" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(value, name) => [`${value}%`, name.charAt(0).toUpperCase() + name.slice(1)]}
                    labelStyle={{ color: '#0f172a' }}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  />
                  <Bar dataKey="accuracy" fill="#059669" name="Accuracy" />
                  <Bar dataKey="precision" fill="#3b82f6" name="Precision" />
                  <Bar dataKey="recall" fill="#f59e0b" name="Recall" />
                  <Bar dataKey="f1" fill="#ef4444" name="F1 Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Regression Model Visualizations */}
          {data?.visualizationData?.regression && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>Regression Model Predictions</div>
                <span className="badge tag-regression">Scatter Plots</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
                {data.visualizationData.regression.map((model: any) => (
                  <div key={model.modelName} className="card animate-in" style={{ padding: '20px 24px' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>
                      {model.modelName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 16 }}>
                      Actual vs Predicted Prices (45° reference line)
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <ScatterChart data={model.points}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          type="number"
                          dataKey="actual"
                          name="Actual Price"
                          domain={['dataMin - 5', 'dataMax + 5']}
                          tick={{ fontSize: 11, fill: '#64748b' }}
                        />
                        <YAxis
                          type="number"
                          dataKey="predicted"
                          name="Predicted Price"
                          domain={['dataMin - 5', 'dataMax + 5']}
                          tick={{ fontSize: 11, fill: '#64748b' }}
                        />
                        <Tooltip
                          cursor={{ strokeDasharray: '3 3' }}
                          formatter={(value: any, name: string) => [`$${parseFloat(value).toFixed(2)}`, name]}
                          labelFormatter={() => ''}
                          contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                        />
                        <Scatter name="Predictions" dataKey="predicted" fill="#f59e0b" fillOpacity={0.6} />
                        {/* 45-degree reference line */}
                        <ReferenceLine
                          segment={[
                            { x: model.currentPrice * 0.9, y: model.currentPrice * 0.9 },
                            { x: model.currentPrice * 1.1, y: model.currentPrice * 1.1 }
                          ]}
                          stroke="#ef4444"
                          strokeDasharray="5 5"
                          strokeWidth={2}
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', marginTop: 8 }}>
                      Red line: Perfect prediction (45°)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Classification Model Visualizations */}
          {data?.visualizationData?.classification && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>Classification Model Decision Boundaries</div>
                <span className="badge tag-classification">Feature Space</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
                {data.visualizationData.classification.map((model: any) => (
                  <div key={model.modelName} className="card animate-in" style={{ padding: '20px 24px' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>
                      {model.modelName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 16 }}>
                      RSI vs Momentum Feature Space
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <ScatterChart data={model.points}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          type="number"
                          dataKey="rsi"
                          name="RSI"
                          domain={[20, 80]}
                          tick={{ fontSize: 11, fill: '#64748b' }}
                        />
                        <YAxis
                          type="number"
                          dataKey="momentum"
                          name="Momentum"
                          domain={[-0.1, 0.1]}
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          tickFormatter={(value) => `${(value * 100).toFixed(1)}%`}
                        />
                        <Tooltip
                          cursor={{ strokeDasharray: '3 3' }}
                          formatter={(value: any, name: string) => {
                            if (name === 'Momentum') return [`${(parseFloat(value) * 100).toFixed(1)}%`, name];
                            return [value, name];
                          }}
                          contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                        />
                        <Scatter
                          name="UP"
                          data={model.points.filter((p: any) => p.predictedClass === 'UP')}
                          fill="#059669"
                          fillOpacity={0.7}
                        />
                        <Scatter
                          name="DOWN"
                          data={model.points.filter((p: any) => p.predictedClass === 'DOWN')}
                          fill="#dc2626"
                          fillOpacity={0.7}
                        />
                        <Scatter
                          name="HOLD"
                          data={model.points.filter((p: any) => p.predictedClass === 'HOLD')}
                          fill="#64748b"
                          fillOpacity={0.7}
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', marginTop: 8 }}>
                      Green: UP • Red: DOWN • Gray: HOLD
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </AppShell>
  )
}
