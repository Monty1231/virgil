import { type NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    console.log("🔄 PATCH /api/deals/[id] - Starting update...")

    const { id } = await context.params
    console.log("📝 Deal ID:", id)

    const body = await request.json()
    console.log("📝 Request body:", body)

    const { stage } = body

    if (!stage) {
      console.error("❌ Stage is required")
      return NextResponse.json({ error: "Stage is required" }, { status: 400 })
    }

    // Ensure exact case matching for all stages including "Closed"
    const validStages = ["Discovery", "Proposal", "Demo", "Negotiation", "Closed"]
    const normalizedStage = stage.trim() // Remove any whitespace

    if (!validStages.includes(normalizedStage)) {
      console.error("❌ Invalid stage:", normalizedStage, "Valid stages:", validStages)
      return NextResponse.json(
        {
          error: `Invalid stage: "${normalizedStage}". Valid stages are: ${validStages.join(", ")}`,
          received: normalizedStage,
          valid: validStages,
        },
        { status: 400 },
      )
    }

    console.log("🔄 Executing UPDATE query for stage:", normalizedStage)
    const result = await sql.query(
      `UPDATE deals 
       SET stage = $1, last_activity = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [normalizedStage, id]
    )
    console.log("📊 Query result:", result)

    if (result.rows.length === 0) {
      console.error("❌ Deal not found with ID:", id)
      return NextResponse.json({ error: "Deal not found" }, { status: 404 })
    }

    console.log("✅ Deal updated successfully:", result.rows[0])
    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("❌ Error updating deal:", error)
    return NextResponse.json(
      {
        error: "Failed to update deal",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
