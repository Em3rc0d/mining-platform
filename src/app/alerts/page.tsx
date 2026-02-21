'use client'
import { useState, useEffect } from 'react'
import AuthGuard from '@/components/AuthGuard'

interface Alert {
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

const ALERT_TYPE_CONFIG = {
  price_alert: { icon: '💰', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' },
  prediction_alert: { icon: '🔮', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)' },
  risk_alert: { icon: '⚠️', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' },
  system_alert: { icon: '🔧', color: '#06b6d4', bgColor: 'rgba(6, 182, 212, 0.1)' }
}

function AlertCard({ alert }: { alert: Alert }) {
  const config = ALERT_TYPE_CONFIG[alert.type]
  const timeAgo = alert.triggered_at
    ? new Date(alert.triggered_at).toLocaleString()
    : new Date(alert.created_at).toLocaleString()

  return (
    <div className={`alert-card ${alert.is_read ? 'read' : 'unread'}`} style={{
      padding: '16px 20px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      marginBottom: '12px',
      background: alert.is_read ? '#f8fafc' : config.bgColor,
      borderLeft: `4px solid ${config.color}`,
      transition: 'all 0.2s'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ fontSize: '1.25rem', flexShrink: 0 }}>{config.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>
              {alert.title}
            </h4>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              {timeAgo}
            </div>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 8px 0' }}>
            {alert.message}
          </p>
          <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: '#94a3b8' }}>
            {alert.ticker && (
              <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                {alert.ticker}
              </span>
            )}
            {alert.type === 'price_alert' && alert.threshold && (
              <span>
                Target: {alert.condition} ${alert.threshold}
                {alert.current_value && ` (Current: $${alert.current_value.toFixed(2)})`}
              </span>
            )}
            {alert.type === 'prediction_alert' && alert.confidence && (
              <span>
                Confidence: {(alert.confidence * 100).toFixed(1)}%
                {alert.prediction_direction && ` (${alert.prediction_direction === 'up' ? '↗' : '↘'})`}
              </span>
            )}
            {alert.type === 'risk_alert' && alert.risk_metric && alert.threshold && (
              <span>
                {alert.risk_metric}: {alert.threshold > 1 ? (alert.threshold * 100).toFixed(1) + '%' : alert.threshold}
              </span>
            )}
          </div>
        </div>
        {!alert.is_read && (
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: config.color,
            flexShrink: 0,
            marginTop: '6px'
          }} />
        )}
      </div>
    </div>
  )
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'price_alert' | 'prediction_alert' | 'risk_alert' | 'system_alert'>('all')

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/alerts')
      const data = await response.json()
      setAlerts(data.alerts)
    } catch (error) {
      console.error('Failed to fetch alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true
    if (filter === 'unread') return !alert.is_read
    return alert.type === filter
  })

  const unreadCount = alerts.filter(a => !a.is_read).length

  const alertStats = alerts.reduce((acc, alert) => {
    acc[alert.type] = (acc[alert.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  if (loading) {
    return (
      <AuthGuard>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <div>Loading alerts...</div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '8px' }}>
            Alerts & Notifications
            {unreadCount > 0 && (
              <span style={{
                background: '#ef4444',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                marginLeft: '12px'
              }}>
                {unreadCount} new
              </span>
            )}
          </h1>
          <p style={{ color: '#64748b' }}>Real-time alerts for price movements, predictions, and risk events</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{alerts.length}</div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Total Alerts</div>
          </div>
          <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>{unreadCount}</div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Unread</div>
          </div>
          {Object.entries(alertStats).map(([type, count]) => {
            const config = ALERT_TYPE_CONFIG[type as keyof typeof ALERT_TYPE_CONFIG]
            return (
              <div key={type} className="card" style={{ padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: config.color }}>
                  {count}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
              </div>
            )
          })}
        </div>

        {/* Filters */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilter('all')}
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            >
              All Alerts ({alerts.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
              style={{ '--filter-color': '#ef4444' } as any}
            >
              Unread ({unreadCount})
            </button>
            {Object.entries(alertStats).map(([type, count]) => {
              const config = ALERT_TYPE_CONFIG[type as keyof typeof ALERT_TYPE_CONFIG]
              return (
                <button
                  key={type}
                  onClick={() => setFilter(type as any)}
                  className={`filter-btn ${filter === type ? 'active' : ''}`}
                  style={{ '--filter-color': config.color } as any}
                >
                  {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {/* Alerts List */}
        <div style={{ maxWidth: '800px' }}>
          {filteredAlerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              No alerts found for the selected filter.
            </div>
          ) : (
            filteredAlerts.map(alert => (
              <AlertCard key={alert.id} alert={alert} />
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        .filter-btn {
          padding: 8px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          background: white;
          color: #64748b;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .filter-btn:hover {
          border-color: #cbd5e1;
          background: #f8fafc;
        }
        .filter-btn.active {
          border-color: var(--filter-color, #3b82f6);
          background: var(--filter-color, #3b82f6);
          color: white;
        }
        .alert-card:hover {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </AuthGuard>
  )
}