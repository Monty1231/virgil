// Test script to verify token tracking
const { generateText } = require("ai");
const { openai } = require("@ai-sdk/openai");

async function testTokenTracking() {
  console.log("🧪 Testing Token Tracking...\n");

  try {
    // Test 1: Simple generation
    console.log("📝 Test 1: Simple text generation");
    const { text, usage } = await generateText({
      model: openai("gpt-4o"),
      prompt: "Write a short paragraph about SAP solutions.",
      maxTokens: 100,
    });

    console.log("Response:", text);
    console.log("Token Usage:", {
      promptTokens: usage?.promptTokens,
      completionTokens: usage?.completionTokens,
      totalTokens: usage?.totalTokens,
    });

    // Calculate cost
    const inputCost = (usage?.promptTokens / 1000000) * 5.0;
    const outputCost = (usage?.completionTokens / 1000000) * 15.0;
    const totalCost = inputCost + outputCost;

    console.log("Cost Calculation:", {
      inputCost: `$${inputCost.toFixed(6)}`,
      outputCost: `$${outputCost.toFixed(6)}`,
      totalCost: `$${totalCost.toFixed(6)}`,
    });

    console.log("\n" + "=".repeat(50) + "\n");

    // Test 2: JSON generation (like your analysis)
    console.log("📝 Test 2: JSON generation (similar to analysis)");
    const { text: jsonText, usage: jsonUsage } = await generateText({
      model: openai("gpt-4o"),
      prompt: `Generate a JSON object with the following structure:
{
  "name": "string",
  "value": "number",
  "description": "string (at least 100 characters)"
}

Make it about a business solution.`,
      maxTokens: 200,
    });

    console.log("JSON Response:", jsonText);
    console.log("Token Usage:", {
      promptTokens: jsonUsage?.promptTokens,
      completionTokens: jsonUsage?.completionTokens,
      totalTokens: jsonUsage?.totalTokens,
    });

    // Calculate cost
    const jsonInputCost = (jsonUsage?.promptTokens / 1000000) * 5.0;
    const jsonOutputCost = (jsonUsage?.completionTokens / 1000000) * 15.0;
    const jsonTotalCost = jsonInputCost + jsonOutputCost;

    console.log("Cost Calculation:", {
      inputCost: `$${jsonInputCost.toFixed(6)}`,
      outputCost: `$${jsonOutputCost.toFixed(6)}`,
      totalCost: `$${jsonTotalCost.toFixed(6)}`,
    });

    console.log("\n" + "=".repeat(50) + "\n");

    // Test 3: Estimate your actual analysis costs
    console.log("📝 Test 3: Estimating your analysis costs");

    const estimatedTokens = {
      solutions: { input: 3000, output: 8000 },
      challenges: { input: 2500, output: 2000 },
      comprehensive: { input: 4000, output: 15000 },
    };

    let totalEstimatedCost = 0;
    let totalEstimatedTokens = 0;

    Object.entries(estimatedTokens).forEach(([step, tokens]) => {
      const inputCost = (tokens.input / 1000000) * 5.0;
      const outputCost = (tokens.output / 1000000) * 15.0;
      const stepCost = inputCost + outputCost;
      const stepTokens = tokens.input + tokens.output;

      totalEstimatedCost += stepCost;
      totalEstimatedTokens += stepTokens;

      console.log(`${step}:`, {
        inputTokens: tokens.input.toLocaleString(),
        outputTokens: tokens.output.toLocaleString(),
        totalTokens: stepTokens.toLocaleString(),
        cost: `$${stepCost.toFixed(4)}`,
      });
    });

    console.log("\nEstimated Analysis Totals:", {
      totalTokens: totalEstimatedTokens.toLocaleString(),
      totalCost: `$${totalEstimatedCost.toFixed(4)}`,
      costPerAnalysis: `$${totalEstimatedCost.toFixed(4)}`,
    });

    // Monthly estimates
    const analysesPerMonth = 50; // per user
    const users = [10, 100, 500, 1000];

    console.log("\n📊 Monthly Cost Projections:");
    users.forEach((userCount) => {
      const monthlyAnalyses = userCount * analysesPerMonth;
      const monthlyCost = totalEstimatedCost * monthlyAnalyses;
      console.log(
        `${userCount} users (${monthlyAnalyses.toLocaleString()} analyses): $${monthlyCost.toFixed(
          2
        )}`
      );
    });
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testTokenTracking();
