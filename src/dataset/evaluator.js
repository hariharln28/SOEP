/**
 * Benchmark Evaluator Suite
 * Measures extraction accuracy across 50+ samples against typed schema ground truths.
 * Evaluates field-level accuracy, schema compliance, retry healing, and out-of-domain rejection.
 */

const { BENCHMARK_SAMPLES } = require('./benchmark50');
const { runExtractionPipeline } = require('../engine/pipeline');

/**
 * Compare two numeric values within a tolerance.
 */
function isNumMatch(actual, expected, tol = 0.05) {
  if (expected === null || expected === undefined) return actual === null || actual === undefined;
  if (actual === null || actual === undefined) return false;
  return Math.abs(Number(actual) - Number(expected)) <= tol;
}

/**
 * Compare string values with normalization.
 */
function isStrMatch(actual, expected) {
  if (expected === null || expected === undefined) return actual === null || actual === undefined;
  if (actual === null || actual === undefined) return false;
  const a = String(actual).toLowerCase().replace(/[^a-z0-9]/g, '');
  const e = String(expected).toLowerCase().replace(/[^a-z0-9]/g, '');
  return a === e || a.includes(e) || e.includes(a);
}

/**
 * Evaluate single sample result against its ground truth.
 */
function evaluateSample(sample, result) {
  const gt = sample.ground_truth;
  const actual = result.data || {};

  const fieldMatches = {};
  const checkedFields = [
    'is_valid_document',
    'document_type',
    'invoice_number',
    'vendor_name',
    'vendor_tax_id',
    'invoice_date',
    'due_date',
    'currency',
    'subtotal',
    'tax_amount',
    'total_amount'
  ];

  let matchedCount = 0;
  let totalChecked = 0;

  for (const field of checkedFields) {
    if (gt[field] !== undefined) {
      totalChecked++;
      let match = false;

      if (field === 'is_valid_document') {
        match = actual.is_valid_document === gt.is_valid_document;
      } else if (['subtotal', 'tax_amount', 'total_amount'].includes(field)) {
        match = isNumMatch(actual[field], gt[field]);
      } else {
        match = isStrMatch(actual[field], gt[field]);
      }

      fieldMatches[field] = {
        expected: gt[field],
        actual: actual[field] !== undefined ? actual[field] : null,
        match
      };

      if (match) matchedCount++;
    }
  }

  const sampleAccuracy = totalChecked > 0 ? (matchedCount / totalChecked) * 100 : 100;

  return {
    sampleId: sample.id,
    category: sample.category,
    description: sample.description,
    status: result.status,
    success: result.success,
    attempts: result.attempts,
    durationMs: result.totalDurationMs,
    sampleAccuracy: Math.round(sampleAccuracy * 10) / 10,
    fieldMatches,
    rawTextPreview: sample.raw_text.substring(0, 150) + "...",
    extractedData: actual,
    errors: result.errors
  };
}

/**
 * Run evaluation over all 52 benchmark samples.
 */
async function runBenchmarkSuite(options = {}) {
  const samples = options.samples || BENCHMARK_SAMPLES;
  const startTime = Date.now();
  const sampleEvaluations = [];

  const fieldStats = {
    is_valid_document: { match: 0, total: 0 },
    document_type: { match: 0, total: 0 },
    invoice_number: { match: 0, total: 0 },
    vendor_name: { match: 0, total: 0 },
    vendor_tax_id: { match: 0, total: 0 },
    invoice_date: { match: 0, total: 0 },
    due_date: { match: 0, total: 0 },
    currency: { match: 0, total: 0 },
    subtotal: { match: 0, total: 0 },
    tax_amount: { match: 0, total: 0 },
    total_amount: { match: 0, total: 0 }
  };

  let firstTryCount = 0;
  let retryCount = 0;
  let routedCount = 0;
  let negativeCount = 0;
  let negativeCorrectCount = 0;

  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    
    // Simulate fault on sample 13 (a messy thermal receipt) to exercise and verify self-healing retry path
    const simulateFault = sample.id === "SAMPLE-13";

    const result = await runExtractionPipeline(sample.raw_text, {
      domain: 'invoice',
      documentId: sample.id,
      simulateFault,
      apiKey: options.apiKey
    });

    const evalResult = evaluateSample(sample, result);
    sampleEvaluations.push(evalResult);

    if (sample.category === 'negative_out_of_domain') {
      negativeCount++;
      if (evalResult.extractedData.is_valid_document === false && evalResult.extractedData.total_amount === null) {
        negativeCorrectCount++;
      }
    }

    if (result.status === 'VALIDATED') firstTryCount++;
    else if (result.status === 'VALIDATED_ON_RETRY') retryCount++;
    else if (result.status === 'ROUTED_TO_REVIEW') routedCount++;
    else if (result.status === 'VALIDATED_NEGATIVE_REJECTED') firstTryCount++;

    // Tally field stats
    for (const [field, matchData] of Object.entries(evalResult.fieldMatches)) {
      if (fieldStats[field]) {
        fieldStats[field].total++;
        if (matchData.match) fieldStats[field].match++;
      }
    }
  }

  const totalDurationMs = Date.now() - startTime;
  const totalSamples = samples.length;

  // Calculate overall field accuracy
  let totalFieldChecks = 0;
  let totalFieldMatches = 0;
  const fieldAccuracy = {};

  for (const [field, stat] of Object.entries(fieldStats)) {
    totalFieldChecks += stat.total;
    totalFieldMatches += stat.match;
    fieldAccuracy[field] = stat.total > 0
      ? Math.round((stat.match / stat.total) * 1000) / 10
      : 100;
  }

  const overallAccuracy = totalFieldChecks > 0
    ? Math.round((totalFieldMatches / totalFieldChecks) * 1000) / 10
    : 100;

  const negativeHandlingAccuracy = negativeCount > 0
    ? Math.round((negativeCorrectCount / negativeCount) * 1000) / 10
    : 100;

  const schemaComplianceRate = Math.round(
    ((firstTryCount + retryCount) / totalSamples) * 1000
  ) / 10;

  return {
    summary: {
      totalSamples,
      overallAccuracy,
      schemaComplianceRate,
      firstTryPassRate: Math.round((firstTryCount / totalSamples) * 1000) / 10,
      retryHealingCount: retryCount,
      routedToReviewCount: routedCount,
      negativeSamplesCount: negativeCount,
      negativeHandlingAccuracy,
      avgDurationMs: Math.round(totalDurationMs / totalSamples),
      totalDurationMs,
      completedAt: new Date().toISOString()
    },
    fieldAccuracy,
    sampleEvaluations
  };
}

module.exports = {
  runBenchmarkSuite,
  evaluateSample
};
