/**
 * Schema Validator Module
 * Validates extraction candidates against strict Zod typed schemas.
 * Returns detailed, actionable error paths and messages.
 */

const { InvoiceDataSchema, InvoiceJsonSchema } = require('../schemas/invoiceSchema');
const { JobPostSchema } = require('../schemas/jobPostSchema');
const { ResumeSchema } = require('../schemas/resumeSchema');

const SCHEMAS = {
  invoice: InvoiceDataSchema,
  job_post: JobPostSchema,
  resume: ResumeSchema
};

/**
 * Validates an extracted payload against the schema for the given domain.
 * @param {string} domain - 'invoice' | 'job_post' | 'resume'
 * @param {object} payload - The extracted JSON object
 * @returns {{ success: boolean, data?: object, errors?: Array<{ field: string, message: string, code: string }> }}
 */
function validateExtraction(domain = 'invoice', payload) {
  const schema = SCHEMAS[domain] || SCHEMAS.invoice;
  
  if (!payload || typeof payload !== 'object') {
    return {
      success: false,
      data: null,
      errors: [
        {
          field: "root",
          message: "Extracted output is empty or not a valid JSON object",
          code: "invalid_type"
        }
      ]
    };
  }

  const result = schema.safeParse(payload);
  
  if (result.success) {
    return {
      success: true,
      data: result.data,
      errors: []
    };
  }

  // Format Zod errors into clear, actionable error objects
  const errors = result.error.issues.map(issue => ({
    field: issue.path.join('.') || 'root',
    message: issue.message,
    code: issue.code,
    received: issue.received !== undefined ? String(issue.received) : undefined
  }));

  return {
    success: false,
    data: payload,
    errors
  };
}

module.exports = {
  validateExtraction,
  SCHEMAS
};
