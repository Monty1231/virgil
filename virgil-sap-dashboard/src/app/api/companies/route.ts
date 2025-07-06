import sql from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("🏢 API: Fetching companies from database...");

    // Build and run the SELECT query
    const selectQuery = `
      SELECT 
        id,
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
        created_at
      FROM companies
      ORDER BY name ASC
    `;
    const { rows: companies } = await sql.query(selectQuery);

    console.log("🏢 API: Raw database result:", companies);
    console.log("🏢 API: Result type:", typeof companies, "Is array:", Array.isArray(companies));
    console.log("🏢 API: Number of companies:", companies.length);

    // Log each company for debugging
    if (companies.length > 0) {
      console.log("🏢 API: Company details:");
      companies.forEach((company, index) => {
        console.log(
          `  ${index + 1}. ID: ${company.id}, Name: "${company.name}", Industry: "${company.industry}"`
        );
      });
    }

    console.log("🏢 API: Returning", companies.length, "companies");
    return NextResponse.json(companies);
  } catch (error: any) {
    console.error("🏢 API: Database error:", error);
    console.error("🏢 API: Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack?.substring(0, 500),
    });

    // Return empty array on error so the UI doesn't break
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
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
      uploaded_files,
    } = body;

    console.log("🏢 API: Creating new company:", { name, industry, company_size, region });

    // Validate required fields
    if (!name || !industry || !company_size || !region) {
      return NextResponse.json(
        { error: "Missing required fields: name, industry, company_size, region" },
        { status: 400 }
      );
    }

    // Build and run the INSERT query
    const insertQuery = `
      INSERT INTO companies (
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
        created_by
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15
      )
      RETURNING *
    `;
    const insertValues = [
      name,
      industry,
      company_size,
      region,
      website || "",
      business_challenges || "",
      current_systems || "",
      budget || "",
      timeline || "",
      priority || "",
      primary_contact ? JSON.stringify(primary_contact) : null,
      secondary_contact ? JSON.stringify(secondary_contact) : null,
      notes || "",
      tags ? JSON.stringify(tags) : null,
      1, // created_by
    ];
    const { rows: insertResult } = await sql.query(insertQuery, insertValues);
    const newCompany = insertResult[0];

    console.log("🏢 API: Company created successfully:", newCompany);

    // If files were uploaded, store file references
    if (Array.isArray(uploaded_files) && uploaded_files.length > 0) {
      try {
        const fileInsertQuery = `
          INSERT INTO company_files (
            company_id,
            filename,
            original_name,
            file_size,
            file_type,
            category,
            file_path
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7
          )
        `;
        for (const file of uploaded_files) {
          const fileValues = [
            newCompany.id,
            file.name,
            file.name,
            file.size,
            file.type,
            file.category,
            file.url || "",
          ];
          await sql.query(fileInsertQuery, fileValues);
        }
        console.log("🏢 API: File references stored successfully");
      } catch (fileError) {
        console.error("🏢 API: Failed to store file references:", fileError);
        // Don't fail the request for file storage issues
      }
    }

    return NextResponse.json(newCompany, { status: 201 });
  } catch (error: any) {
    console.error("🏢 API: Error creating company:", error);

    // Handle duplicate company name (PostgreSQL unique_violation)
    if (error.code === "23505") {
      return NextResponse.json({ error: "A company with this name already exists" }, { status: 409 });
    }

    return NextResponse.json(
      {
        error: "Failed to create company",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
