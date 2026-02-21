import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // In a real application, you might want to invalidate server-side sessions
    // For now, we'll just return success and let the client handle localStorage cleanup

    return NextResponse.json({
      message: 'Logout successful'
    })
  } catch (err: any) {
    console.error('Logout error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}