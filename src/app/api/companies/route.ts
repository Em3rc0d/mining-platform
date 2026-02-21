import { NextResponse } from 'next/server'
import { getCompaniesWithPrices } from '@/lib/db'

export async function GET() {
  try {
    const companies = getCompaniesWithPrices()
    return NextResponse.json({ companies })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
