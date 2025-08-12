import { NextResponse } from "next/server";
import { knowledgeBase } from "@/lib/knowledge-base";

export async function POST() {
  try {
    console.log("🚀 RAG Init: Starting knowledge base initialization...");

    await knowledgeBase.initialize();

    console.log("✅ RAG Init: Knowledge base initialized successfully");

    return NextResponse.json({
      success: true,
      message: "Knowledge base initialized successfully",
    });
  } catch (error) {
    console.error("❌ RAG Init: Error initializing knowledge base:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to initialize knowledge base",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    console.log("📊 RAG Init: Getting knowledge base status...");

    const stats = await knowledgeBase.getKnowledgeBaseStatus();

    return NextResponse.json({
      success: true,
      stats,
      initialized: true,
    });
  } catch (error) {
    console.error("❌ RAG Init: Error getting knowledge base status:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get knowledge base status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
