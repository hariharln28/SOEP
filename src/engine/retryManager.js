/**
 * Retry Manager Module
 * Manages iterative repair loops with targeted error feedback.
 * Prevents silent failures by enforcing explicit routing to review when retries are exhausted.
 */

class RetryManager {
  constructor(maxRetries = 2) {
    this.maxRetries = maxRetries;
  }

  /**
   * Formats a clear diagnostic feedback report from validation errors
   * for guiding the next extraction attempt.
   */
  createFeedbackContext(attempt, errors, previousOutput) {
    const errorSummaries = errors.map(err => ({
      field: err.field,
      message: err.message,
      code: err.code,
      received: err.received
    }));

    const feedbackPrompt = [
      `Extraction Attempt #${attempt} failed schema validation with ${errors.length} error(s):`,
      ...errorSummaries.map((e, idx) => `  ${idx + 1}. [${e.field}]: ${e.message}`),
      `Please revise the extracted values specifically targeting these failing constraints.`
    ].join('\n');

    return {
      attempt,
      errors: errorSummaries,
      feedbackPrompt,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Determines if another retry should be attempted.
   */
  shouldRetry(attempt) {
    return attempt <= this.maxRetries;
  }
}

module.exports = { RetryManager };
