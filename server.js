const express = require('express');
const cors = require('cors');
const path = require('path');
const { runExtractionPipeline } = require('./src/engine/pipeline');
const { runBenchmarkSuite } = require('./src/dataset/evaluator');
const { BENCHMARK_SAMPLES } = require('./src/dataset/benchmark50');
const { reviewQueue } = require('./src/store/reviewQueue');
const { InvoiceJsonSchema } = require('./src/schemas/invoiceSchema');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Global stats tracker
const systemStats = {
  totalExtractions: 0,
  successfulValidations: 0,
  retriedExtractions: 0,
  routedToReview: 0,
  negativeHandled: 0
};

// 1. Single extraction endpoint
app.post('/api/extract', async (req, res) => {
  try {
    const { text, domain = 'invoice', maxRetries = 2, simulateFault = false, apiKey } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: "Document text is required and must be a string." });
    }

    const result = await runExtractionPipeline(text, {
      domain,
      maxRetries: Number(maxRetries),
      simulateFault: !!simulateFault,
      apiKey: apiKey || process.env.GEMINI_API_KEY || null
    });

    // Update system stats
    systemStats.totalExtractions++;
    if (result.success) systemStats.successfulValidations++;
    if (result.status === 'VALIDATED_ON_RETRY') systemStats.retriedExtractions++;
    if (result.status === 'ROUTED_TO_REVIEW') systemStats.routedToReview++;
    if (result.status === 'VALIDATED_NEGATIVE_REJECTED') systemStats.negativeHandled++;

    return res.json(result);
  } catch (error) {
    console.error("Extraction endpoint error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// 2. Full benchmark runner (50+ samples)
app.get('/api/benchmark', async (req, res) => {
  try {
    const apiKey = req.query.apiKey || process.env.GEMINI_API_KEY || null;
    const report = await runBenchmarkSuite({ apiKey });
    return res.json(report);
  } catch (error) {
    console.error("Benchmark endpoint error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// 3. Built-in presets / samples
app.get('/api/samples', (req, res) => {
  const previews = BENCHMARK_SAMPLES.map(s => ({
    id: s.id,
    category: s.category,
    description: s.description,
    textPreview: s.raw_text.substring(0, 100) + '...',
    fullText: s.raw_text,
    groundTruth: s.ground_truth
  }));
  return res.json(previews);
});

// 4. Human-in-the-loop Review Queue
app.get('/api/review-queue', (req, res) => {
  const { status } = req.query;
  const items = reviewQueue.getAll(status);
  const stats = reviewQueue.getStats();
  return res.json({ items, stats });
});

// 5. Single review item detail
app.get('/api/review-queue/:id', (req, res) => {
  const item = reviewQueue.getById(req.params.id);
  if (!item) return res.status(404).json({ error: "Review item not found." });
  return res.json(item);
});

// 6. Resolve review item
app.post('/api/review-queue/:id/resolve', (req, res) => {
  const { action, updatedData, notes } = req.body;
  if (!action) return res.status(400).json({ error: "Action is required (APPROVE, EDIT_AND_APPROVE, REJECT)." });

  const resolved = reviewQueue.resolve(req.params.id, { action, updatedData, notes });
  if (!resolved) return res.status(404).json({ error: "Review item not found." });

  return res.json(resolved);
});

// 7. Schema definitions
app.get('/api/schemas', (req, res) => {
  return res.json({
    invoice: {
      jsonSchema: InvoiceJsonSchema,
      description: "Strict typed schema for financial invoices, receipts, and billing items with cross-field consistency.",
      rules: [
        "is_valid_document: boolean indicator (false for negative/out-of-domain documents)",
        "currency: must match supported ISO currency codes",
        "dates: strict ISO 8601 YYYY-MM-DD format",
        "due_date: must not chronologically precede invoice_date",
        "arithmetic check: subtotal + tax_amount === total_amount (within 0.05 tolerance)",
        "line items: quantity * unit_price === item amount (within 0.05 tolerance)",
        "negative documents: all financial fields must be null (no hallucinations)"
      ]
    }
  });
});

// 8. System metrics
app.get('/api/stats', (req, res) => {
  return res.json({
    system: systemStats,
    reviewQueue: reviewQueue.getStats()
  });
});

// Serve frontend SPA fallback
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` Structured Output Extraction Pipeline (SOEP) Ready `);
    console.log(` Web UI & REST API running at: http://localhost:${PORT}`);
    console.log(`====================================================`);
  });
}

module.exports = app;
