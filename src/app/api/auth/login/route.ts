import { NextResponse } from 'next/server'
import { getUsers } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    const users = getUsers()
    const user = users.find(u => u.username === username)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // For demo purposes, accept any password for existing users
    // In production, you would hash and compare passwords
    if (password.length < 3) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Update last login
    user.last_login = new Date().toISOString()

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        avatar_color: user.avatar_color,
        last_login: user.last_login
      },
      message: 'Login successful'
    })
  } catch (err: any) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}