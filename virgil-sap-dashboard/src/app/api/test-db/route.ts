import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    // Query all users from the "users" table
    const result = await pool.query('SELECT * FROM users')
    
    return NextResponse.json({
      connected: true,
      users: result.rows,
    })
  } catch (error) {
    console.error('DB connection error:', error)
    return NextResponse.json(
      {
        connected: false,
        error: (error as Error).message,
      },
      { status: 500 }
    )
  }
}

