import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserHubSpotClient } from "@/lib/hubspot";
import sql from "@/lib/db";

function normalizeCompanySize(value?: string, employees?: string): string {
  if (value) {
    const v = value.toLowerCase();
    if (v === "small") return "Small (1-100 employees)";
    if (v === "medium") return "Medium (101-1,000 employees)";
    if (v === "large") return "Large (1,001-5,000 employees)";
    if (v === "enterprise") return "Enterprise (5,000+ employees)";
  }
  if (employees) return String(employees);
  return "";
}

function normalizeTags(value?: string): string[] | null {
  if (!value) return null;
  // HubSpot multi-select comes as a ";" separated string
  const arr = value
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  return arr.length ? arr : null;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.id === "0") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { hubspotCompanyIds } = await request.json();
    if (!Array.isArray(hubspotCompanyIds) || hubspotCompanyIds.length === 0) {
      return NextResponse.json(
        { error: "No companies provided" },
        { status: 400 }
      );
    }

    const client = await getUserHubSpotClient(Number(session.user.id));

    const imported: any[] = [];
    for (const id of hubspotCompanyIds) {
      const company = await client.crm.companies.basicApi.getById(id, [
        "name",
        "industry",
        "website",
        "numberofemployees",
        "phone",
        // custom mirrored fields
        "business_challenges",
        "current_systems",
        "budget",
        "timeline",
        "priority",
        "region",
        "company_size",
        "tags",
      ]);
      const props: any = company.properties || {};

      const mappedCompanySize = normalizeCompanySize(
        props.company_size,
        props.numberofemployees
      );
      const mappedTags = normalizeTags(props.tags);

      const insertQuery = `
        INSERT INTO companies (
          name, industry, company_size, region, website, business_challenges,
          current_systems, budget, timeline, priority, primary_contact, secondary_contact, notes, tags, created_by
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15
        ) RETURNING *
      `;
      const values = [
        props.name || "",
        props.industry || "",
        mappedCompanySize,
        props.region || "",
        props.website || "",
        props.business_challenges || "",
        props.current_systems || "",
        props.budget || "",
        props.timeline || "",
        props.priority || "",
        null,
        null,
        "Imported from HubSpot",
        JSON.stringify([...(mappedTags || []), "hubspot-import"]),
        Number(session.user.id),
      ];
      const { rows } = await sql.query(insertQuery, values);
      imported.push(rows[0]);
    }

    return NextResponse.json({
      success: true,
      importedCount: imported.length,
      companies: imported,
    });
  } catch (error) {
    console.error("Import companies error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
