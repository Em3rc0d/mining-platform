import { NextResponse } from 'next/server'
import { getDashboardData } from '@/lib/db'

export async function GET() {
  try {
    const data = getDashboardData()
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
