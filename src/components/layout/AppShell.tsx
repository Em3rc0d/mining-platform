'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext'

const NAV = [
  { href: '/', icon: '⬡', label: 'Dashboard' },
  { href: '/analysis', icon: '◎', label: 'ML Analysis' },
  { href: '/backtesting', icon: '↺', label: 'Backtesting' },
  { href: '/portfolio', icon: '◈', label: 'Portfolio' },
  { href: '/users', icon: '👥', label: 'Users' },
  { href: '/risk', icon: '⚠️', label: 'Risk Management' },
  { href: '/alerts', icon: '🔔', label: 'Alerts' },
  { href: '/trading', icon: '📈', label: 'Paper Trading' },
]

const COMPANIES = ['FSM', 'VOLCABC1.LM', 'BVN', 'ABX', 'BHP', 'SCCO']

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, isLoading } = useUser()
  const [collapsed, setCollapsed] = useState(false)
  const [prices, setPrices] = useState<Record<string, any>>({})

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(d => {
      if (d.companies) {
        const map: Record<string, any> = {}
        d.companies.forEach((c: any) => { map[c.ticker] = c })
        setPrices(map)
      }
    })
  }, [])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 64 : 240,
        minWidth: collapsed ? 64 : 240,
        background: 'white',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease, min-width 0.25s ease',
        overflow: 'hidden',
        zIndex: 50,
        position: 'sticky',
        top: 0,
        height: '100vh',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setCollapsed(!collapsed)}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, flexShrink: 0, color: 'white', fontWeight: 800,
            }}>⬡</div>
            {!collapsed && (
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>MineralAI</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '0.05em' }}>MINING INTELLIGENCE</div>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          <div style={{ marginBottom: 20 }}>
            {!collapsed && <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0 8px 8px' }}>Navigation</div>}
            {NAV.map(item => {
              const active = pathname === item.href
              return (
                <Link key={item.href} href={item.href} className={`nav-item ${active ? 'active' : ''}`}
                  style={{ justifyContent: collapsed ? 'center' : 'flex-start', marginBottom: 2 }}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              )
            })}
          </div>

          {!collapsed && (
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0 8px 8px' }}>Companies</div>
              {COMPANIES.map(ticker => {
                const data = prices[ticker]
                const change = parseFloat(data?.change || 0)
                return (
                  <div key={ticker} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '7px 10px', borderRadius: 8, marginBottom: 2,
                    cursor: 'default',
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>{ticker}</div>
                      <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{data?.name?.split(' ')[0] || '—'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>${parseFloat(data?.current_price || 0).toFixed(2)}</div>
                      <div style={{ fontSize: '0.65rem', color: change >= 0 ? '#059669' : '#dc2626', fontWeight: 600 }}>
                        {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </nav>
        {/* User Section */}
        {user && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0' }}>
            {!collapsed ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: user.avatar_color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 700, fontSize: '0.8rem',
                  flexShrink: 0
                }}>
                  {(user.full_name || user.username).split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.full_name || user.username}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'capitalize' }}>
                    {user.role.replace('_', ' ')}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: user.avatar_color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 700, fontSize: '0.8rem'
                }}>
                  {(user.full_name || user.username).split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
              </div>
            )}
            <button
              onClick={() => {
                logout()
                router.push('/auth/login')
              }}
              style={{
                width: '100%',
                padding: '6px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                background: 'white',
                color: '#64748b',
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#dc2626'
                e.currentTarget.style.color = '#dc2626'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0'
                e.currentTarget.style.color = '#64748b'
              }}
            >
              {!collapsed ? 'Logout' : '🚪'}
            </button>
          </div>
        )}
        {/* Footer */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', fontSize: '0.7rem', color: '#94a3b8' }}>
          {!collapsed ? (
            <div>
              <div style={{ fontWeight: 600, color: '#64748b', marginBottom: 2 }}>v1.0.0 Prototype</div>
              <div>8 ML Models Active</div>
            </div>
          ) : <div style={{ textAlign: 'center' }}>v1</div>}
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        {/* Top bar */}
        <header style={{
          background: 'white',
          borderBottom: '1px solid #e2e8f0',
          padding: '14px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem', color: '#0f172a' }}>
              {NAV.find(n => n.href === pathname)?.label || 'Dashboard'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 2s infinite' }}></span>
              Live Data
            </div>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: '0.85rem',
              cursor: 'pointer',
            }}>AG</div>
          </div>
        </header>

        <div style={{ padding: '28px' }}>
          {children}
        </div>
      </main>
    </div>
  )
}
