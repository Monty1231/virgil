import sql from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("Fetching users from database...")

    const usersResult = await sql.query(`
      SELECT id, name, email, role, territory
      FROM users
      WHERE role IN ('sales_rep', 'sales_manager')
      ORDER BY name
    `)
    const users = usersResult.rows

    console.log("Users query result:", users)
    console.log("Number of users found:", users.length)

    // Ensure we always return an array
    const usersArray = Array.isArray(users) ? users : []

    return NextResponse.json(usersArray)
  } catch (error) {
    console.error("Database error in /api/users:", error)

    // Return empty array with error info for debugging
    return NextResponse.json(
      {
        error: "Failed to fetch users",
        details: error instanceof Error ? error.message : "Unknown error",
        users: [], // Include empty users array for fallback
      },
      { status: 500 },
    )
  }
}
