import { NextRequest, NextResponse } from "next/server";
import { Client } from "@hubspot/api-client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserHubSpotClient } from "@/lib/hubspot";

// Initialize HubSpot client for authenticated user
const getHubSpotClientForUser = async (): Promise<Client> => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.id === "0") {
    throw new Error("Unauthorized");
  }
  return getUserHubSpotClient(Number(session.user.id));
};

// Test HubSpot connection
export async function GET() {
  try {
    const client = await getHubSpotClientForUser();
    // Fetch companies page as a connection test (matches app scopes)
    const companies = await client.crm.companies.basicApi.getPage(1);
    return NextResponse.json({
      connected: true,
      message: "HubSpot connection successful",
      companies: companies.results,
    });
  } catch (error) {
    console.error("HubSpot connection error:", error);
    return NextResponse.json(
      {
        connected: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Create or update contact in HubSpot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    const client = await getHubSpotClientForUser();

    switch (action) {
      case "create_contact":
        return await createContact(client, data);
      case "update_contact":
        return await updateContact(client, data);
      case "create_deal":
        return await createDeal(client, data);
      case "update_deal":
        return await updateDeal(client, data);
      case "sync_company":
        return await syncCompany(client, data);
      default:
        return NextResponse.json(
          { error: "Invalid action specified" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("HubSpot API error:", error);
    return NextResponse.json(
      {
        error: "HubSpot operation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function createContact(client: Client, data: any) {
  const { email, firstname, lastname, company, phone, jobtitle } = data;

  const properties = { email, firstname, lastname, company, phone, jobtitle };

  const contact = await client.crm.contacts.basicApi.create({ properties });

  return NextResponse.json({
    success: true,
    contact: contact,
    message: "Contact created successfully",
  });
}

async function updateContact(client: Client, data: any) {
  const { id, ...properties } = data;

  const contact = await client.crm.contacts.basicApi.update(id, { properties });

  return NextResponse.json({
    success: true,
    contact: contact,
    message: "Contact updated successfully",
  });
}

async function createDeal(client: Client, data: any) {
  const { dealname, amount, dealstage, pipeline, closedate } = data;

  const properties = { dealname, amount, dealstage, pipeline, closedate };

  const deal = await client.crm.deals.basicApi.create({ properties });

  return NextResponse.json({
    success: true,
    deal: deal,
    message: "Deal created successfully",
  });
}

async function updateDeal(client: Client, data: any) {
  const { id, ...properties } = data;

  const deal = await client.crm.deals.basicApi.update(id, { properties });

  return NextResponse.json({
    success: true,
    deal: deal,
    message: "Deal updated successfully",
  });
}

async function syncCompany(client: Client, data: any) {
  const { name, industry, website, phone, address, city, state, zip, country } =
    data;

  const properties = {
    name,
    industry,
    website,
    phone,
    address,
    city,
    state,
    zip,
    country,
  };

  const company = await client.crm.companies.basicApi.create({ properties });

  return NextResponse.json({
    success: true,
    company: company,
    message: "Company synced successfully",
  });
}
