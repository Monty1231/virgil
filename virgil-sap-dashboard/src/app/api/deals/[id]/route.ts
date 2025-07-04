import { type NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    console.log("🔄 PATCH /api/deals/[id] - Starting update...")

    const { id } = await context.params
    console.log("📝 Deal ID:", id)

    if (!id) {
      console.error("❌ Deal ID is required")
      return NextResponse.json({ error: "Deal ID is required" }, { status: 400 })
    }

    let body
    try {
      body = await request.json()
      console.log("📝 Request body:", body)
    } catch (parseError) {
      console.error("❌ Failed to parse request body:", parseError)
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    const { stage } = body

    if (!stage) {
      console.error("❌ Stage is required in request body")
      return NextResponse.json({ error: "Stage is required" }, { status: 400 })
    }

    // Ensure exact case matching for all stages including "Closed"
    const validStages = ["Discovery", "Proposal", "Demo", "Negotiation", "Closed-Won"]
    const normalizedStage = String(stage).trim() // Ensure it's a string and remove whitespace

    console.log("🔍 Validating stage:", normalizedStage, "against valid stages:", validStages)

    if (!validStages.includes(normalizedStage)) {
      console.error("❌ Invalid stage:", normalizedStage, "Valid stages:", validStages)
      return NextResponse.json(
        {
          error: `Invalid stage: "${normalizedStage}". Valid stages are: ${validStages.join(", ")}`,
          received: normalizedStage,
          receivedType: typeof stage,
          valid: validStages,
        },
        { status: 400 },
      )
    }

    console.log("🔄 Executing UPDATE query for deal ID:", id, "to stage:", normalizedStage)

    // First check if the deal exists
    const existingDealResult = await sql.query(
      "SELECT id, stage FROM deals WHERE id = $1",
      [id]
    )
    const existingDeal = existingDealResult.rows

    if (existingDeal.length === 0) {
      console.error("❌ Deal not found with ID:", id)
      return NextResponse.json({ error: `Deal with ID ${id} not found` }, { status: 404 })
    }

    console.log("✅ Found existing deal:", existingDeal[0])
    const updateResult = await sql.query(
      "UPDATE deals SET stage = $1, last_activity = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [normalizedStage, id]
    )

    console.log("📊 Update query result:", updateResult.rows)

    if (updateResult.rows.length === 0) {
      console.error("❌ Update failed - no rows affected for ID:", id)
      return NextResponse.json({ error: "Update failed - deal not found" }, { status: 404 })
    }

    console.log("✅ Deal updated successfully to stage:", updateResult.rows[0].stage)
    return NextResponse.json(updateResult.rows[0])
  } catch (error) {
    console.error("❌ Error updating deal:", error)

    // Provide more detailed error information
    const errorDetails = {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : "UnknownError",
    }

    return NextResponse.json(
      {
        error: "Failed to update deal",
        details: errorDetails.message,
        debugInfo: process.env.NODE_ENV === "development" ? errorDetails : undefined,
      },
      { status: 500 },
    )
  }
}
