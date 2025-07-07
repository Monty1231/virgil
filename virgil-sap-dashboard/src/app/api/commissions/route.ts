import sql from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await sql.query(
      `SELECT cs.*, d.deal_name
       FROM commission_submissions cs
       LEFT JOIN deals d ON cs.deal_id = d.id
       ORDER BY cs.submission_date DESC`
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching commission submissions:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch commission submissions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Map frontend fields to DB columns
    const {
      deal_id, // should be int
      submitted_by, // should be int
      deal_value, // numeric
      commission_rate, // numeric
      commission_amount, // numeric
      notes, // text
      submission_status, // optional, e.g. 'Draft' or 'Under Review'
    } = body;

    // Insert into commission_submissions
    const result = await sql.query(
      `INSERT INTO commission_submissions (
        deal_id, submitted_by, deal_value, commission_rate, commission_amount, notes, submission_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        deal_id,
        submitted_by,
        deal_value,
        commission_rate,
        commission_amount,
        notes || null,
        submission_status || "Under Review",
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Error creating commission submission:", error);
    return NextResponse.json(
      {
        error: "Failed to create commission submission",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
