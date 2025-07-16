// Test script for RAG system
const BASE_URL = "http://localhost:3000";

async function testRAG() {
  console.log("🧪 Testing RAG System...\n");

  try {
    // Step 1: Check initial status
    console.log("1️⃣ Checking initial status...");
    const statusResponse = await fetch(`${BASE_URL}/api/rag/init`);
    const status = await statusResponse.json();
    console.log("Status:", status);
    console.log("Vector count:", status.stats?.totalVectorCount || 0);
    console.log("");

    // Step 2: Initialize knowledge base (if needed)
    if (
      !status.stats?.totalVectorCount ||
      status.stats.totalVectorCount === 0
    ) {
      console.log("2️⃣ Initializing knowledge base...");
      const initResponse = await fetch(`${BASE_URL}/api/rag/init`, {
        method: "POST",
      });
      const initResult = await initResponse.json();
      console.log("Initialization result:", initResult);
      console.log("");
    } else {
      console.log("2️⃣ Knowledge base already initialized");
      console.log("");
    }

    // Step 3: Test RAG analysis
    console.log("3️⃣ Testing RAG analysis...");
    const analysisResponse = await fetch(
      `${BASE_URL}/api/ai-analysis/company/1/rag`
    );
    const analysisResult = await analysisResponse.json();

    if (analysisResult.success) {
      console.log("✅ RAG Analysis successful!");
      console.log("Method:", analysisResult.metadata?.method);
      console.log("Company:", analysisResult.metadata?.company_name);
      console.log("Fit Score:", analysisResult.analysis?.fitScore);
      console.log(
        "Solutions:",
        analysisResult.analysis?.recommendedSolutions?.length || 0
      );
      console.log("");

      // Show some sample content
      if (analysisResult.analysis?.recommendedSolutions?.length > 0) {
        const firstSolution = analysisResult.analysis.recommendedSolutions[0];
        console.log("Sample solution:");
        console.log("- Module:", firstSolution.module);
        console.log("- ROI:", firstSolution.estimatedROI);
        console.log(
          "- Cost:",
          `$${firstSolution.estimatedCostMin?.toLocaleString()} - $${firstSolution.estimatedCostMax?.toLocaleString()}`
        );
      }
    } else {
      console.log("❌ RAG Analysis failed:");
      console.log("Error:", analysisResult.error);
      console.log("Details:", analysisResult.details);
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
testRAG();
