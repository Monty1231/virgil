import sql from "@/lib/db";
import { NextResponse } from "next/server";
import { knowledgeBase } from "@/lib/knowledge-base";

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
    console.log(
      "🏢 API: Result type:",
      typeof companies,
      "Is array:",
      Array.isArray(companies)
    );
    console.log("🏢 API: Number of companies:", companies.length);

    // Log each company for debugging
    if (companies.length > 0) {
      console.log("🏢 API: Company details:");
      companies.forEach((company, index) => {
        console.log(
          `  ${index + 1}. ID: ${company.id}, Name: "${
            company.name
          }", Industry: "${company.industry}"`
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

    console.log("🏢 API: Creating new company:", {
      name,
      industry,
      company_size,
      region,
    });

    // Validate required fields
    if (!name || !industry || !company_size || !region) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: name, industry, company_size, region",
        },
        { status: 400 }
      );
    }

    // Validate field lengths to prevent database errors
    const maxLength = 255;
    const fieldsToCheck = {
      name: name,
      industry: industry,
      company_size: company_size,
      region: region,
      current_systems: current_systems || "",
      budget: budget || "",
      timeline: timeline || "",
      priority: priority || "",
      notes: notes || "",
    };

    for (const [fieldName, value] of Object.entries(fieldsToCheck)) {
      if (value && value.length > maxLength) {
        return NextResponse.json(
          {
            error: `${fieldName} is too long (max ${maxLength} characters). Current length: ${value.length}`,
          },
          { status: 400 }
        );
      }
    }

    // Handle website field separately - truncate if too long
    let truncatedWebsite = website || "";
    if (truncatedWebsite.length > maxLength) {
      console.log(
        `🏢 API: Truncating website from ${truncatedWebsite.length} to ${maxLength} characters`
      );
      truncatedWebsite = truncatedWebsite.substring(0, maxLength);
    }

    // Handle business_challenges field separately - truncate if too long
    let truncatedBusinessChallenges = business_challenges || "";
    if (truncatedBusinessChallenges.length > maxLength) {
      console.log(
        `🏢 API: Truncating business_challenges from ${truncatedBusinessChallenges.length} to ${maxLength} characters`
      );
      truncatedBusinessChallenges = truncatedBusinessChallenges.substring(
        0,
        maxLength
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
      truncatedWebsite,
      truncatedBusinessChallenges,
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

    // If files were uploaded, link them to the company
    if (Array.isArray(uploaded_files) && uploaded_files.length > 0) {
      try {
        console.log(
          "🏢 API: Linking",
          uploaded_files.length,
          "files to company"
        );

        // Update the company_files table to link files to this company
        const fileUpdateQuery = `
          UPDATE company_files 
          SET company_id = $1 
          WHERE id = $2
        `;

        for (const file of uploaded_files) {
          if (file.id) {
            await sql.query(fileUpdateQuery, [newCompany.id, file.id]);
            console.log(
              "🏢 API: Linked file",
              file.name,
              "to company",
              newCompany.id
            );
          }
        }

        console.log("🏢 API: File references linked successfully");
      } catch (fileError) {
        console.error("🏢 API: Failed to link file references:", fileError);
        // Don't fail the request for file storage issues
      }
    }

    // Add company to RAG knowledge base (asynchronously)
    try {
      console.log("🏢 API: Starting async RAG processing...");
      // Don't await this - let it run in the background
      knowledgeBase
        .initialize()
        .then(() => knowledgeBase.addCompanyToKnowledgeBase(newCompany.id))
        .then((chunksAdded) => {
          console.log(
            "🏢 API: ✅ Async RAG processing completed - Added",
            chunksAdded,
            "chunks to knowledge base"
          );
        })
        .catch((ragError) => {
          console.error("🏢 API: ❌ Async RAG processing failed:", ragError);
        });
    } catch (ragError) {
      console.error("🏢 API: Failed to start async RAG processing:", ragError);
      // Don't fail the request for RAG issues - company is still created successfully
    }

    return NextResponse.json(newCompany, { status: 201 });
  } catch (error: any) {
    console.error("🏢 API: Error creating company:", error);

    // Handle duplicate company name (PostgreSQL unique_violation)
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A company with this name already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    );
  }
}
