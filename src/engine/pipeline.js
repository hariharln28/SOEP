/**
 * Structured Output Extraction Pipeline (SOEP) Orchestrator
 * Turns messy unstructured text into validated structured data reliably.
 * Enforces:
 *  - Schema-constrained generation
 *  - Typed validation on every output
 *  - Targeted retry repair loops
 *  - Explicit routing to human review on failure (Zero silent acceptance)
 *  - Safe handling of documents containing none of the target fields
 */

const { extractDocument } = require('./extractor');
const { validateExtraction } = require('./validator');
const { RetryManager } = require('./retryManager');
const { reviewQueue } = require('../store/reviewQueue');

/**
 * Execute the end-to-end extraction pipeline on a raw text input.
 *
 * @param {string} rawText - Unstructured document text
 * @param {object} options - Pipeline configuration
 * @returns {Promise<object>} Pipeline execution result
 */
async function runExtractionPipeline(rawText, options = {}) {
  const startTime = Date.now();
  const domain = options.domain || 'invoice';
  const maxRetries = options.maxRetries !== undefined ? options.maxRetries : 2;
  const simulateFault = !!options.simulateFault;
  const apiKey = options.apiKey || process.env.GEMINI_API_KEY || null;
  const documentId = options.documentId || `DOC-${Date.now()}`;

  const retryManager = new RetryManager(maxRetries);
  const executionTrace = [];
  
  let currentAttempt = 1;
  let finalData = null;
  let status = "PROCESSING";
  let lastErrors = [];
  let retryContext = null;
  let routedReviewItem = null;

  // Step 1: Initial Attempt
  executionTrace.push({
    step: "INGESTION",
    timestamp: new Date().toISOString(),
    message: `Received document (${rawText.length} characters). Initiating domain '${domain}' extraction.`,
    details: { documentLength: rawText.length, domain }
  });

  while (currentAttempt <= maxRetries + 1) {
    const attemptStart = Date.now();
    const isRetry = currentAttempt > 1;

    executionTrace.push({
      step: isRetry ? `RETRY_ATTEMPT_${currentAttempt}` : "INITIAL_EXTRACTION",
      timestamp: new Date().toISOString(),
      message: isRetry 
        ? `Attempting self-healing repair #${currentAttempt - 1} with targeted feedback.`
        : "Running schema-constrained extraction pass.",
      attemptNumber: currentAttempt,
      retryContext: retryContext ? { errors: retryContext.errors } : null
    });

    // Run extraction
    let candidateData;
    try {
      candidateData = await extractDocument(rawText, {
        domain,
        apiKey,
        retryContext,
        // Only trigger simulated fault on first attempt if requested for testing the repair path
        simulateFault: simulateFault && currentAttempt === 1
      });
    } catch (err) {
      candidateData = null;
      lastErrors = [{ field: "extractor", message: `Extraction exception: ${err.message}`, code: "extractor_error" }];
    }

    // Step 2: Validate against typed schema
    const validation = validateExtraction(domain, candidateData);
    const attemptDurationMs = Date.now() - attemptStart;

    if (validation.success) {
      finalData = validation.data;
      lastErrors = [];

      if (!finalData.is_valid_document) {
        status = "VALIDATED_NEGATIVE_REJECTED";
        executionTrace.push({
          step: "NEGATIVE_DOCUMENT_DETECTED",
          timestamp: new Date().toISOString(),
          durationMs: attemptDurationMs,
          message: "Document correctly identified as out-of-domain with no target financial fields. Zero false-positive hallucinations.",
          status: "SUCCESS"
        });
      } else if (isRetry) {
        status = "VALIDATED_ON_RETRY";
        executionTrace.push({
          step: "VALIDATION_PASSED_AFTER_REPAIR",
          timestamp: new Date().toISOString(),
          durationMs: attemptDurationMs,
          message: `Self-healing succeeded on attempt ${currentAttempt}. All schema constraints satisfied.`,
          status: "SUCCESS"
        });
      } else {
        status = "VALIDATED";
        executionTrace.push({
          step: "VALIDATION_PASSED",
          timestamp: new Date().toISOString(),
          durationMs: attemptDurationMs,
          message: "Schema validation passed on first attempt with 0 errors.",
          status: "SUCCESS"
        });
      }
      break; // Successfully validated!
    } else {
      // Validation failed!
      lastErrors = validation.errors;
      executionTrace.push({
        step: `VALIDATION_FAILED_ATTEMPT_${currentAttempt}`,
        timestamp: new Date().toISOString(),
        durationMs: attemptDurationMs,
        message: `Output violated ${validation.errors.length} schema constraint(s).`,
        errors: validation.errors,
        candidateOutput: candidateData,
        status: "FAILURE"
      });

      // Check if another retry is permissible
      if (retryManager.shouldRetry(currentAttempt)) {
        retryContext = retryManager.createFeedbackContext(currentAttempt, validation.errors, candidateData);
        currentAttempt++;
      } else {
        // Retries exhausted! Explicit Failure Path triggered:
        // NEVER silently accept invalid data -> Route to Human Review Queue!
        status = "ROUTED_TO_REVIEW";
        executionTrace.push({
          step: "EXPLICIT_FAILURE_PATH_TRIGGERED",
          timestamp: new Date().toISOString(),
          message: `Max retries (${maxRetries}) exhausted. Enforcing non-silent failure: Routing document to Human-in-the-Loop review queue.`,
          status: "ROUTED_FOR_REVIEW"
        });

        routedReviewItem = reviewQueue.enqueue({
          documentId,
          rawText,
          extractedData: candidateData,
          validationErrors: validation.errors,
          executionTrace: [...executionTrace],
          reason: `Violated ${validation.errors.length} schema constraint(s) across ${currentAttempt} extraction attempts.`
        });

        finalData = candidateData;
        break;
      }
    }
  }

  const totalDurationMs = Date.now() - startTime;

  return {
    documentId,
    status,
    success: status.startsWith("VALIDATED"),
    attempts: currentAttempt,
    totalDurationMs,
    domain,
    data: finalData,
    errors: lastErrors,
    reviewItemId: routedReviewItem ? routedReviewItem.id : null,
    executionTrace
  };
}

module.exports = {
  runExtractionPipeline
};
