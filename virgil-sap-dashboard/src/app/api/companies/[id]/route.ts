import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import sql from "@/lib/db";
import { knowledgeBase } from "@/lib/knowledge-base";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isActive || session?.user?.id === "0") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: rawId } = await context.params;
    const id = Number.parseInt(rawId, 10);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid company id" }, { status: 400 });
    }

    const { rows } = await sql.query(
      `SELECT * FROM companies WHERE id = $1 AND created_by = $2`,
      [id, session.user.id]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Fetch files for this company (ownership enforced via company join)
    const filesQuery = `
      SELECT cf.id, cf.filename, cf.original_name, cf.file_type, cf.file_size, cf.category, cf.s3_key, cf.uploaded_at
      FROM company_files cf
      JOIN companies c ON c.id = cf.company_id
      WHERE cf.company_id = $1 AND c.created_by = $2
      ORDER BY cf.uploaded_at DESC
    `;
    const { rows: files } = await sql.query(filesQuery, [id, session.user.id]);

    const company = rows[0];
    return NextResponse.json({ ...company, files });
  } catch (error) {
    console.error("GET /api/companies/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch company" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isActive || session?.user?.id === "0") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: rawId } = await context.params;
    const id = Number.parseInt(rawId, 10);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid company id" }, { status: 400 });
    }

    const body = await request.json();
    const {
      name,
      industry,
      company_size,
      region,
      website,
      business_challenges,
      current_systems,
      budget,
      timeline,
      priority,
      primary_contact,
      secondary_contact,
      notes,
      tags,
    } = body || {};

    const { rows } = await sql.query(
      `UPDATE companies SET 
        name = COALESCE($1, name),
        industry = COALESCE($2, industry),
        company_size = COALESCE($3, company_size),
        region = COALESCE($4, region),
        website = COALESCE($5, website),
        business_challenges = COALESCE($6, business_challenges),
        current_systems = COALESCE($7, current_systems),
        budget = COALESCE($8, budget),
        timeline = COALESCE($9, timeline),
        priority = COALESCE($10, priority),
        primary_contact = COALESCE($11, primary_contact),
        secondary_contact = COALESCE($12, secondary_contact),
        notes = COALESCE($13, notes),
        tags = COALESCE($14, tags),
        updated_at = NOW()
       WHERE id = $15 AND created_by = $16
       RETURNING *`,
      [
        name ?? null,
        industry ?? null,
        company_size ?? null,
        region ?? null,
        website ?? null,
        business_challenges ?? null,
        current_systems ?? null,
        budget ?? null,
        timeline ?? null,
        priority ?? null,
        primary_contact ? JSON.stringify(primary_contact) : null,
        secondary_contact ? JSON.stringify(secondary_contact) : null,
        notes ?? null,
        tags ? JSON.stringify(tags) : null,
        id,
        session.user.id,
      ]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Company not found or not owned" }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("PUT /api/companies/[id] error:", error);
    return NextResponse.json({ error: "Failed to update company" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const client = await (sql as any).connect?.() || null;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isActive || session?.user?.id === "0") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: rawId } = await context.params;
    const id = Number.parseInt(rawId, 10);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid company id" }, { status: 400 });
    }

    // Remove from knowledge base best-effort (non-blocking)
    knowledgeBase
      .removeCompanyFromKnowledgeBase(id)
      .catch((e) => console.warn("KB removal failed", e));

    // Transaction: delete dependents then company
    if (client) await client.query("BEGIN");
    const exec = client ? client.query.bind(client) : sql.query.bind(sql);

    // Delete dependent rows that reference company_id
    await exec(`DELETE FROM ai_analyses WHERE company_id = $1`, [id]);
    await exec(`DELETE FROM company_files WHERE company_id = $1`, [id]);
    await exec(`DELETE FROM documents WHERE company_id = $1`, [id]);
    await exec(`DELETE FROM presentation_decks WHERE company_id = $1`, [id]);
    await exec(`DELETE FROM deals WHERE company_id = $1`, [id]);

    // Finally delete the company (ownership enforced)
    const { rowCount } = await exec(
      `DELETE FROM companies WHERE id = $1 AND created_by = $2`,
      [id, session.user.id]
    );

    if (client) await client.query("COMMIT");

    if (rowCount === 0) {
      return NextResponse.json({ error: "Company not found or not owned" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (client) await client.query("ROLLBACK").catch(() => {});
    console.error("DELETE /api/companies/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete company" }, { status: 500 });
  } finally {
    // release client if we acquired one
    if (client?.release) client.release();
  }
} 