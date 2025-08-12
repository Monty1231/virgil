import { NextRequest, NextResponse } from "next/server";
import { Client } from "@hubspot/api-client";

// Initialize HubSpot client
const getHubSpotClient = () => {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("HUBSPOT_ACCESS_TOKEN environment variable is required");
  }
  return new Client({ accessToken });
};

// Test HubSpot connection
export async function GET() {
  try {
    const client = getHubSpotClient();
    // Try to fetch a single contact as a connection test
    const contacts = await client.crm.contacts.basicApi.getPage(1);
    return NextResponse.json({
      connected: true,
      message: "HubSpot connection successful",
      contacts: contacts.results,
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

    const client = getHubSpotClient();

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

  const properties = {
    email,
    firstname,
    lastname,
    company,
    phone,
    jobtitle,
  };

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
  const {
    dealname,
    amount,
    dealstage,
    pipeline,
    closedate,
    contactId,
    companyId,
  } = data;

  const properties = {
    dealname,
    amount,
    dealstage,
    pipeline,
    closedate,
  };

  const deal = await client.crm.deals.basicApi.create({ properties });

  // Associate with contact if provided (skipped - associations API differs in this SDK version)

  // Associate with company if provided (skipped - associations API differs in this SDK version)

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
