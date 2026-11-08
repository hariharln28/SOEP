const { z } = require('zod');

// Single line item schema
const LineItemSchema = z.object({
  description: z.string().min(1, "Line item description cannot be empty"),
  quantity: z.number().positive("Quantity must be greater than 0").default(1),
  unit_price: z.number().nonnegative("Unit price cannot be negative"),
  amount: z.number().nonnegative("Line item amount cannot be negative")
}).refine(item => {
  const expected = Math.round(item.quantity * item.unit_price * 100) / 100;
  return Math.abs(expected - item.amount) <= 0.05;
}, {
  message: "Line item amount does not match quantity * unit_price",
  path: ["amount"]
});

// Primary typed Invoice schema
const InvoiceDataSchema = z.object({
  is_valid_document: z.boolean().describe("True if document is an invoice, receipt, or billing document; False if unrelated or out-of-domain"),
  document_type: z.enum(["invoice", "receipt", "credit_note", "purchase_order", "unknown"]),
  invoice_number: z.string().nullable().optional(),
  vendor_name: z.string().nullable().optional(),
  vendor_tax_id: z.string().nullable().optional(),
  vendor_address: z.string().nullable().optional(),
  customer_name: z.string().nullable().optional(),
  customer_address: z.string().nullable().optional(),
  invoice_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invoice date must follow ISO YYYY-MM-DD format").nullable().optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must follow ISO YYYY-MM-DD format").nullable().optional(),
  currency: z.enum(["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "INR", "UNKNOWN"]).default("USD"),
  line_items: z.array(LineItemSchema).default([]),
  subtotal: z.number().nonnegative("Subtotal cannot be negative").nullable().optional(),
  tax_rate: z.number().min(0, "Tax rate cannot be negative").max(100, "Tax rate cannot exceed 100%").nullable().optional(),
  tax_amount: z.number().nonnegative("Tax amount cannot be negative").nullable().optional(),
  total_amount: z.number().nonnegative("Total amount cannot be negative").nullable().optional(),
  payment_terms: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  confidence_score: z.number().min(0).max(1).default(0.95)
}).superRefine((data, ctx) => {
  // If it's NOT an invoice/receipt (negative/out-of-domain document)
  if (!data.is_valid_document) {
    if (data.total_amount !== null && data.total_amount !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Out-of-domain document must not have total_amount extracted",
        path: ["total_amount"]
      });
    }
    if (data.invoice_number) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Out-of-domain document must not have invoice_number extracted",
        path: ["invoice_number"]
      });
    }
    if (data.document_type !== "unknown") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Out-of-domain document type must be 'unknown'",
        path: ["document_type"]
      });
    }
    return;
  }

  // If it IS a valid document, it must have core identifiers
  if (!data.invoice_number && !data.vendor_name && data.total_amount === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "At least one primary identifier (invoice_number, vendor_name, or total_amount) is required for valid invoices",
      path: ["invoice_number"]
    });
  }

  // Total amount sanity validation
  if (data.total_amount === null || data.total_amount === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Valid invoices must include a total_amount",
      path: ["total_amount"]
    });
  }

  // Mathematical consistency check: subtotal + tax_amount === total_amount
  if (data.subtotal !== null && data.subtotal !== undefined &&
      data.tax_amount !== null && data.tax_amount !== undefined &&
      data.total_amount !== null && data.total_amount !== undefined) {
    const computedTotal = Math.round((data.subtotal + data.tax_amount) * 100) / 100;
    const diff = Math.abs(computedTotal - data.total_amount);
    if (diff > 0.05) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Cross-field arithmetic mismatch: subtotal (${data.subtotal}) + tax (${data.tax_amount}) = ${computedTotal}, but total_amount is ${data.total_amount}`,
        path: ["total_amount"]
      });
    }
  }

  // Date ordering validation: due_date should not precede invoice_date
  if (data.invoice_date && data.due_date) {
    if (new Date(data.due_date) < new Date(data.invoice_date)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Due date (${data.due_date}) cannot be before invoice date (${data.invoice_date})`,
        path: ["due_date"]
      });
    }
  }
});

// JSON Schema definition representation for documentation & LLM prompt injection
const InvoiceJsonSchema = {
  type: "object",
  properties: {
    is_valid_document: { type: "boolean", description: "true if an invoice/receipt; false if unrelated/negative" },
    document_type: { type: "string", enum: ["invoice", "receipt", "credit_note", "purchase_order", "unknown"] },
    invoice_number: { type: ["string", "null"], description: "Invoice or reference identifier" },
    vendor_name: { type: ["string", "null"], description: "Legal name of issuing vendor/merchant" },
    vendor_tax_id: { type: ["string", "null"], description: "VAT, GST, EIN or Tax ID of vendor" },
    vendor_address: { type: ["string", "null"] },
    customer_name: { type: ["string", "null"] },
    customer_address: { type: ["string", "null"] },
    invoice_date: { type: ["string", "null"], pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
    due_date: { type: ["string", "null"], pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
    currency: { type: "string", enum: ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "INR", "UNKNOWN"] },
    line_items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          description: { type: "string" },
          quantity: { type: "number" },
          unit_price: { type: "number" },
          amount: { type: "number" }
        },
        required: ["description", "quantity", "unit_price", "amount"]
      }
    },
    subtotal: { type: ["number", "null"] },
    tax_rate: { type: ["number", "null"] },
    tax_amount: { type: ["number", "null"] },
    total_amount: { type: ["number", "null"] },
    payment_terms: { type: ["string", "null"] },
    notes: { type: ["string", "null"] },
    confidence_score: { type: "number", minimum: 0, maximum: 1 }
  },
  required: ["is_valid_document", "document_type", "currency", "line_items", "total_amount"]
};

module.exports = {
  InvoiceDataSchema,
  LineItemSchema,
  InvoiceJsonSchema
};
