import { NextResponse } from 'next/server'
import { getAlerts } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const alerts = getAlerts(userId ? parseInt(userId) : undefined)

    // Sort by triggered_at desc, then created_at desc
    alerts.sort((a, b) => {
      const aTime = a.triggered_at || a.created_at
      const bTime = b.triggered_at || b.created_at
      return new Date(bTime).getTime() - new Date(aTime).getTime()
    })

    return NextResponse.json({ alerts })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}