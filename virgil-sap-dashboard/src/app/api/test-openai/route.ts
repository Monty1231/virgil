import { NextResponse } from "next/server";
import { embeddingService } from "@/lib/embeddings";

export async function GET() {
  try {
    console.log("🧪 Test OpenAI: Testing OpenAI API...");

    // Test embedding generation
    const testText = "This is a test text for embedding generation";
    console.log("🧪 Test OpenAI: Generating embedding for:", testText);

    const embedding = await embeddingService.generateEmbedding(testText);
    console.log(
      "🧪 Test OpenAI: Embedding generated successfully, length:",
      embedding.length
    );

    return NextResponse.json({
      success: true,
      message: "OpenAI API is working",
      embeddingLength: embedding.length,
      embeddingSample: embedding.slice(0, 5),
    });
  } catch (error: any) {
    console.error("🧪 Test OpenAI: Error testing OpenAI API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
