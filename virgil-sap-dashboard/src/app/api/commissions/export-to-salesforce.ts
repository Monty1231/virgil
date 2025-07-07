import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Simulate export to Salesforce (log the data)
    console.log("[MOCK] Exporting to Salesforce CPQ:", body);
    // Simulate a delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return NextResponse.json({
      success: true,
      message: "Exported to Salesforce CPQ (mock)",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to export to Salesforce CPQ" },
      { status: 500 }
    );
  }
}
