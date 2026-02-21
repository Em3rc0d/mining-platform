import { NextResponse } from 'next/server'
import { getUsers } from '@/lib/db'

export async function GET() {
  try {
    const users = getUsers()
    return NextResponse.json({ users })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
