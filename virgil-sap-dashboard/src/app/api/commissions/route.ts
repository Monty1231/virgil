import sql from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const url = new URL(request.url);
    const companyId = url.searchParams.get("companyId");

    if (!session?.user?.id || session.user.id === "0") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params: any[] = [session.user.id];
    let where = "WHERE cs.submitted_by = $1";
    if (companyId) {
      params.push(Number(companyId));
      where += " AND d.company_id = $2";
    }

    const result = await sql.query(
      `SELECT cs.*, d.deal_name, d.company_id
       FROM commission_submissions cs
       LEFT JOIN deals d ON cs.deal_id = d.id
       ${where}
       ORDER BY cs.submission_date DESC`,
      params
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.id === "0") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      deal_id,
      deal_value,
      commission_rate,
      commission_amount,
      notes,
      submission_status,
    } = body;

    if (!deal_id || !deal_value || !commission_rate || !commission_amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await sql.query(
      `INSERT INTO commission_submissions (
         deal_id, submitted_by, deal_value, commission_rate, commission_amount, notes, submission_status, submission_date
       ) VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 'Under Review'), NOW())
       RETURNING *`,
      [
        deal_id,
        Number(session.user.id),
        deal_value,
        commission_rate,
        commission_amount,
        notes || null,
        submission_status || null,
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
