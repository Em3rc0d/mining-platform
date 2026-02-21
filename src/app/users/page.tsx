'use client'
import { useState, useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'

interface User {
  id: number
  username: string
  email: string
  full_name: string | null
  role: string
  avatar_color: string
  created_at: string
  last_login: string | null
}

const ROLE_COLORS = {
  senior_analyst: '#f59e0b',
  trader: '#3b82f6',
  quant: '#10b981',
  portfolio_manager: '#8b5cf6',
  risk_manager: '#ef4444',
  admin: '#dc2626'
}

const ROLE_LABELS = {
  senior_analyst: 'Senior Analyst',
  trader: 'Trader',
  quant: 'Quantitative Analyst',
  portfolio_manager: 'Portfolio Manager',
  risk_manager: 'Risk Manager',
  admin: 'Administrator'
}

function UserCard({ user }: { user: User }) {
  const initials = user.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || user.username.slice(0, 2).toUpperCase()

  return (
    <div className="card" style={{ padding: '20px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
            background: user.avatar_color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: '1rem',
          }}>{initials}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{user.full_name || user.username}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>@{user.username}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{user.email}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span className="badge" style={{
            background: ROLE_COLORS[user.role as keyof typeof ROLE_COLORS] || '#6b7280',
            color: 'white'
          }}>
            {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] || user.role}
          </span>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 4 }}>
            Joined {new Date(user.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: '#f8fafc', borderRadius: 8, padding: '12px' }}>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
            Last Login
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.85rem' }}>
            {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
          </div>
        </div>
        <div style={{ background: '#f8fafc', borderRadius: 8, padding: '12px' }}>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
            Status
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.85rem', color: '#059669' }}>
            Active
          </div>
        </div>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRole, setSelectedRole] = useState<string>('all')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      setUsers(data.users)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = selectedRole === 'all'
    ? users
    : users.filter(user => user.role === selectedRole)

  const roleStats = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  if (loading) {
    return (
      <AppShell>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <div>Loading users...</div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '8px' }}>User Management</h1>
          <p style={{ color: '#64748b' }}>Manage platform users and their roles</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a' }}>{users.length}</div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Total Users</div>
          </div>
          {Object.entries(roleStats).map(([role, count]) => (
            <div key={role} className="card" style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700 }} style={{ color: ROLE_COLORS[role as keyof typeof ROLE_COLORS] || '#6b7280' }}>
                {count}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                {ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role}
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedRole('all')}
              className={`filter-btn ${selectedRole === 'all' ? 'active' : ''}`}
            >
              All Users ({users.length})
            </button>
            {Object.entries(roleStats).map(([role, count]) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`filter-btn ${selectedRole === role ? 'active' : ''}`}
                style={{
                  '--role-color': ROLE_COLORS[role as keyof typeof ROLE_COLORS] || '#6b7280'
                } as any}
              >
                {ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* Users Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '16px' }}>
          {filteredUsers.map(user => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            No users found for the selected role.
          </div>
        )}
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
          border-color: var(--role-color, #3b82f6);
          background: var(--role-color, #3b82f6);
          color: white;
        }
      `}</style>
    </AppShell>
  )
}