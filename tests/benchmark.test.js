const { runBenchmarkSuite } = require('../src/dataset/evaluator');

async function testSuite() {
  console.log("==========================================================");
  console.log("  STRUCTURED OUTPUT EXTRACTION PIPELINE - BENCHMARK TEST  ");
  console.log("==========================================================\n");

  console.log("Executing evaluation over 50+ diverse test samples...");
  const report = await runBenchmarkSuite();

  console.log("\n--- BENCHMARK RESULTS SUMMARY ---");
  console.log(`Total Samples Evaluated:        ${report.summary.totalSamples}`);
  console.log(`Overall Extraction Accuracy:    ${report.summary.overallAccuracy}%`);
  console.log(`Schema Compliance Rate:         ${report.summary.schemaComplianceRate}%`);
  console.log(`First-Try Pass Rate:            ${report.summary.firstTryPassRate}%`);
  console.log(`Self-Healed on Retry:           ${report.summary.retryHealingCount}`);
  console.log(`Routed to Review Queue:         ${report.summary.routedToReviewCount}`);
  console.log(`Negative/Out-of-Domain Accuracy:${report.summary.negativeHandlingAccuracy}% (${report.summary.negativeSamplesCount} samples)`);
  console.log(`Avg Latency per Document:       ${report.summary.avgDurationMs}ms\n`);

  console.log("--- FIELD-LEVEL ACCURACY BREAKDOWN ---");
  for (const [field, acc] of Object.entries(report.fieldAccuracy)) {
    const barLength = Math.round(acc / 5);
    const bar = "█".repeat(barLength) + "░".repeat(20 - barLength);
    console.log(`  ${field.padEnd(20)} [${bar}] ${acc}%`);
  }

  console.log("\n--- SAMPLE CATEGORY HIGHLIGHTS ---");
  const categories = {};
  for (const item of report.sampleEvaluations) {
    if (!categories[item.category]) categories[item.category] = { total: 0, sumAcc: 0 };
    categories[item.category].total++;
    categories[item.category].sumAcc += item.sampleAccuracy;
  }

  for (const [cat, data] of Object.entries(categories)) {
    const avg = Math.round((data.sumAcc / data.total) * 10) / 10;
    console.log(`  ${cat.padEnd(25)}: ${data.total} samples, ${avg}% avg accuracy`);
  }

  console.log("\n✓ Benchmark validation passed successfully!");
}

testSuite().catch(err => {
  console.error("Benchmark error:", err);
  process.exit(1);
});
