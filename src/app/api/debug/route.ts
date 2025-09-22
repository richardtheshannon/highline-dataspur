import { NextRequest, NextResponse } from 'next/server'

// Debug endpoint to check environment variables
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      DATABASE_URL_exists: !!process.env.DATABASE_URL,
      DATABASE_URL_starts_with: process.env.DATABASE_URL?.substring(0, 20),
      NODE_ENV: process.env.NODE_ENV,
      // Never log the full DATABASE_URL for security
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Debug failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}