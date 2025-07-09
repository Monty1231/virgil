import { NextRequest, NextResponse } from "next/server";
import { Client } from "@hubspot/api-client";
import sql from "@/lib/db";

// Initialize HubSpot client
const getHubSpotClient = () => {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("HUBSPOT_ACCESS_TOKEN environment variable is required");
  }
  return new Client({ accessToken });
};

// Sync data with HubSpot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { syncType, data } = body;
    
    const client = getHubSpotClient();
    
    switch (syncType) {
      case "companies":
        return await syncCompanies(client);
      case "contacts":
        return await syncContacts(client);
      case "deals":
        return await syncDeals(client);
      case "all":
        return await syncAll(client);
      default:
        return NextResponse.json(
          { error: "Invalid sync type specified" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("HubSpot sync error:", error);
    return NextResponse.json(
      {
        error: "Sync operation failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

async function syncCompanies(client: Client) {
  try {
    // Fetch companies from local database
    const { rows: companies } = await sql.query(`
      SELECT id, name, industry, company_size, region, website, 
             business_challenges, current_systems, budget, timeline, 
             priority, primary_contact, secondary_contact, notes, tags
      FROM companies
      ORDER BY name ASC
    `);

    const results = [];
    
    for (const company of companies) {
      try {
        // Check if company already exists in HubSpot
        const searchResponse = await client.crm.companies.searchApi.doSearch({
          filterGroups: [{
            filters: [{
              propertyName: "name",
              operator: "EQ",
              value: company.name
            }]
          }],
          properties: ["name", "industry", "website"],
          limit: 1
        });

        if (searchResponse.results.length > 0) {
          // Update existing company
          const hubspotCompany = searchResponse.results[0];
          const updatedCompany = await client.crm.companies.basicApi.update(hubspotCompany.id, {
            properties: {
              name: company.name,
              industry: company.industry,
              website: company.website,
              description: company.notes,
              numberofemployees: getCompanySizeNumber(company.company_size)
            }
          });
          
          results.push({
            id: company.id,
            name: company.name,
            action: "updated",
            hubspotId: updatedCompany.id
          });
        } else {
          // Create new company
          const newCompany = await client.crm.companies.basicApi.create({
            properties: {
              name: company.name,
              industry: company.industry,
              website: company.website,
              description: company.notes,
              numberofemployees: getCompanySizeNumber(company.company_size)
            }
          });
          
          results.push({
            id: company.id,
            name: company.name,
            action: "created",
            hubspotId: newCompany.id
          });
        }
      } catch (companyError) {
        console.error(`Error syncing company ${company.name}:`, companyError);
        results.push({
          id: company.id,
          name: company.name,
          action: "error",
          error: companyError instanceof Error ? companyError.message : "Unknown error"
        });
      }
    }

    return NextResponse.json({
      success: true,
      synced: results.length,
      results: results,
      message: `Synced ${results.length} companies with HubSpot`
    });
  } catch (error) {
    throw error;
  }
}

async function syncContacts(client: Client) {
  try {
    // Fetch contacts from local database (from companies table)
    const { rows: companies } = await sql.query(`
      SELECT id, name, primary_contact, secondary_contact
      FROM companies
      WHERE primary_contact IS NOT NULL OR secondary_contact IS NOT NULL
    `);

    const results = [];
    
    for (const company of companies) {
      const contacts = [];
      
      // Add primary contact
      if (company.primary_contact) {
        try {
          const primaryContact = JSON.parse(company.primary_contact);
          contacts.push({
            ...primaryContact,
            company: company.name
          });
        } catch (e) {
          console.error(`Error parsing primary contact for ${company.name}:`, e);
        }
      }
      
      // Add secondary contact
      if (company.secondary_contact) {
        try {
          const secondaryContact = JSON.parse(company.secondary_contact);
          contacts.push({
            ...secondaryContact,
            company: company.name
          });
        } catch (e) {
          console.error(`Error parsing secondary contact for ${company.name}:`, e);
        }
      }

      for (const contact of contacts) {
        try {
          // Check if contact already exists in HubSpot
          const searchResponse = await client.crm.contacts.searchApi.doSearch({
            filterGroups: [{
              filters: [{
                propertyName: "email",
                operator: "EQ",
                value: contact.email
              }]
            }],
            properties: ["email", "firstname", "lastname", "company"],
            limit: 1
          });

          if (searchResponse.results.length > 0) {
            // Update existing contact
            const hubspotContact = searchResponse.results[0];
            const updatedContact = await client.crm.contacts.basicApi.update(hubspotContact.id, {
              properties: {
                email: contact.email,
                firstname: contact.firstname,
                lastname: contact.lastname,
                company: contact.company,
                phone: contact.phone,
                jobtitle: contact.jobtitle
              }
            });
            
            results.push({
              email: contact.email,
              name: `${contact.firstname} ${contact.lastname}`,
              action: "updated",
              hubspotId: updatedContact.id
            });
          } else {
            // Create new contact
            const newContact = await client.crm.contacts.basicApi.create({
              properties: {
                email: contact.email,
                firstname: contact.firstname,
                lastname: contact.lastname,
                company: contact.company,
                phone: contact.phone,
                jobtitle: contact.jobtitle
              }
            });
            
            results.push({
              email: contact.email,
              name: `${contact.firstname} ${contact.lastname}`,
              action: "created",
              hubspotId: newContact.id
            });
          }
        } catch (contactError) {
          console.error(`Error syncing contact ${contact.email}:`, contactError);
          results.push({
            email: contact.email,
            name: `${contact.firstname} ${contact.lastname}`,
            action: "error",
            error: contactError instanceof Error ? contactError.message : "Unknown error"
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      synced: results.length,
      results: results,
      message: `Synced ${results.length} contacts with HubSpot`
    });
  } catch (error) {
    throw error;
  }
}

async function syncDeals(client: Client) {
  try {
    // Fetch deals from local database
    const { rows: deals } = await sql.query(`
      SELECT d.id, d.deal_name, d.stage, d.deal_value, d.notes, 
             d.expected_close_date, d.priority, d.last_activity,
             c.name as company_name, u.name as ae_name
      FROM deals d
      LEFT JOIN companies c ON d.company_id = c.id
      LEFT JOIN users u ON d.ae_assigned = u.id
      ORDER BY d.last_activity DESC
    `);

    const results = [];
    
    for (const deal of deals) {
      try {
        // Check if deal already exists in HubSpot
        const searchResponse = await client.crm.deals.searchApi.doSearch({
          filterGroups: [{
            filters: [{
              propertyName: "dealname",
              operator: "EQ",
              value: deal.deal_name
            }]
          }],
          properties: ["dealname", "amount", "dealstage"],
          limit: 1
        });

        const dealstage = mapDealStage(deal.stage);
        const amount = deal.deal_value ? parseFloat(deal.deal_value.toString()) : 0;

        if (searchResponse.results.length > 0) {
          // Update existing deal
          const hubspotDeal = searchResponse.results[0];
          const updatedDeal = await client.crm.deals.basicApi.update(hubspotDeal.id, {
            properties: {
              dealname: deal.deal_name,
              amount: amount.toString(),
              dealstage: dealstage,
              closedate: deal.expected_close_date,
              description: deal.notes
            }
          });
          
          results.push({
            id: deal.id,
            name: deal.deal_name,
            action: "updated",
            hubspotId: updatedDeal.id
          });
        } else {
          // Create new deal
          const newDeal = await client.crm.deals.basicApi.create({
            properties: {
              dealname: deal.deal_name,
              amount: amount.toString(),
              dealstage: dealstage,
              closedate: deal.expected_close_date,
              description: deal.notes
            }
          });
          
          results.push({
            id: deal.id,
            name: deal.deal_name,
            action: "created",
            hubspotId: newDeal.id
          });
        }
      } catch (dealError) {
        console.error(`Error syncing deal ${deal.deal_name}:`, dealError);
        results.push({
          id: deal.id,
          name: deal.deal_name,
          action: "error",
          error: dealError instanceof Error ? dealError.message : "Unknown error"
        });
      }
    }

    return NextResponse.json({
      success: true,
      synced: results.length,
      results: results,
      message: `Synced ${results.length} deals with HubSpot`
    });
  } catch (error) {
    throw error;
  }
}

async function syncAll(client: Client) {
  try {
    const companiesResult = await syncCompanies(client);
    const contactsResult = await syncContacts(client);
    const dealsResult = await syncDeals(client);

    return NextResponse.json({
      success: true,
      companies: companiesResult,
      contacts: contactsResult,
      deals: dealsResult,
      message: "Full sync completed successfully"
    });
  } catch (error) {
    throw error;
  }
}

// Helper functions
function getCompanySizeNumber(size: string): string {
  const sizeMap: Record<string, string> = {
    "Small": "1-10",
    "Medium": "11-50",
    "Large": "51-200",
    "Enterprise": "201-1000",
    "Fortune 500": "1000+"
  };
  return sizeMap[size] || "1-10";
}

function mapDealStage(stage: string): string {
  const stageMap: Record<string, string> = {
    "Discovery": "appointmentscheduled",
    "Proposal": "qualifiedtobuy",
    "Demo": "presentationscheduled",
    "Negotiation": "contractsent",
    "Closed-Won": "closedwon"
  };
  return stageMap[stage] || "appointmentscheduled";
} 