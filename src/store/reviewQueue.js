/**
 * Human-in-the-Loop (HITL) Review Queue Store
 * Manages items routed for manual review when validation retries fail.
 * Never silently drops or accepts invalid extractions.
 */

const crypto = require('crypto');

class ReviewQueueStore {
  constructor() {
    this.queue = [];
    this.seedDemoItem();
  }

  seedDemoItem() {
    this.enqueue({
      documentId: "DOC-DEMO-ERR402",
      rawText: `OAKRIDGE CONSULTING GROUP\nInvoice Reference: OCG-99201\nDate: 2024-03-15\nDue: 2024-02-15\n\nCloud Migration Sprint - 1 @ $4200.00 = $4200.00\nSubtotal: $4200.00\nTax: $420.00\nTotal Balance: $5500.00 USD`,
      extractedData: {
        is_valid_document: true,
        document_type: "invoice",
        invoice_number: "OCG-99201",
        vendor_name: "OAKRIDGE CONSULTING GROUP",
        invoice_date: "2024-03-15",
        due_date: "2024-02-15",
        subtotal: 4200.00,
        tax_amount: 420.00,
        total_amount: 5500.00,
        currency: "USD",
        confidence_score: 0.65
      },
      validationErrors: [
        {
          field: "total_amount",
          message: "Cross-field arithmetic mismatch: subtotal (4200) + tax (420) = 4620, but total_amount is 5500",
          code: "custom"
        },
        {
          field: "due_date",
          message: "Due date (2024-02-15) cannot be before invoice date (2024-03-15)",
          code: "custom"
        }
      ],
      reason: "Max retries (2) exhausted: Cross-field arithmetic mismatch and invalid due_date chronology."
    });
  }

  /**
   * Enqueue a failed extraction for human review.
   */
  enqueue({ documentId, rawText, extractedData, validationErrors, executionTrace, reason }) {
    const item = {
      id: `REV-${crypto.randomUUID().substring(0, 8).toUpperCase()}`,
      documentId: documentId || `DOC-${Date.now()}`,
      rawText,
      extractedData,
      validationErrors: validationErrors || [],
      executionTrace: executionTrace || [],
      reason: reason || "Schema validation constraints failed after retry attempts",
      status: "PENDING_REVIEW",
      createdAt: new Date().toISOString(),
      resolvedAt: null,
      reviewerNotes: null,
      finalData: null
    };

    this.queue.unshift(item);
    return item;
  }

  /**
   * Retrieve all review items with optional status filtering.
   */
  getAll(statusFilter = null) {
    if (statusFilter && statusFilter !== 'ALL') {
      return this.queue.filter(item => item.status === statusFilter);
    }
    return this.queue;
  }

  /**
   * Retrieve single item by ID.
   */
  getById(id) {
    return this.queue.find(item => item.id === id);
  }

  /**
   * Resolve a review item: approve, edit & approve, or reject.
   */
  resolve(id, { action, updatedData, notes }) {
    const item = this.getById(id);
    if (!item) return null;

    item.resolvedAt = new Date().toISOString();
    item.reviewerNotes = notes || "";

    if (action === 'APPROVE') {
      item.status = 'APPROVED';
      item.finalData = updatedData || item.extractedData;
    } else if (action === 'EDIT_AND_APPROVE') {
      item.status = 'EDITED_AND_APPROVED';
      item.finalData = updatedData;
    } else if (action === 'REJECT') {
      item.status = 'REJECTED';
      item.finalData = null;
    }

    return item;
  }

  /**
   * Summary metrics for review queue
   */
  getStats() {
    return {
      total: this.queue.length,
      pending: this.queue.filter(i => i.status === 'PENDING_REVIEW').length,
      approved: this.queue.filter(i => i.status === 'APPROVED' || i.status === 'EDITED_AND_APPROVED').length,
      rejected: this.queue.filter(i => i.status === 'REJECTED').length
    };
  }

  /**
   * Clear all items (useful for test resets)
   */
  clear() {
    this.queue = [];
  }
}

const reviewQueue = new ReviewQueueStore();

module.exports = {
  reviewQueue,
  ReviewQueueStore
};
