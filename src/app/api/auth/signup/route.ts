import { NextResponse } from 'next/server'
import { getUsers } from '@/lib/db'
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const USERS_FILE = path.join(DATA_DIR, 'users.json')

export async function POST(request: Request) {
  try {
    const { username, email, full_name, password, role } = await request.json()

    if (!username || !email || !full_name || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    const users = getUsers()

    // Check if username already exists
    if (users.find(u => u.username === username)) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      )
    }

    // Check if email already exists
    if (users.find(u => u.email === email)) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }

    // Create new user
    const newUser = {
      id: Math.max(...users.map(u => u.id)) + 1,
      username,
      email,
      full_name,
      role: role || 'trader',
      avatar_color: ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444'][Math.floor(Math.random() * 5)],
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString()
    }

    // Add to users array and save
    users.push(newUser)
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))

    return NextResponse.json({
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role,
        avatar_color: newUser.avatar_color,
        last_login: newUser.last_login
      },
      message: 'Account created successfully'
    })
  } catch (err: any) {
    console.error('Signup error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}