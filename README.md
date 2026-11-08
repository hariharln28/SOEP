# Structured Output Extraction Pipeline (SOEP)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v24+-green.svg)](https://nodejs.org/)
[![Zod](https://img.shields.io/badge/Schema-Zod%20Strict-indigo.svg)](https://zod.dev/)
[![Benchmark](https://img.shields.io/badge/Benchmark-52%20Samples%20%7C%2092.5%25%20Accuracy-emerald.svg)](tests/benchmark.test.js)
[![Negative Precision](https://img.shields.io/badge/Negative%20Doc%20Handling-100%25%20Zero%20Hallucination-purple.svg)](src/dataset/benchmark50.js)

> **Turn messy, unstructured text into validated structured data reliably.**
> Uses schema-constrained generation and strict validation. Anything that fails validation is retried via targeted error-feedback or routed to a Human-in-the-Loop review queue — **never silently accepted or dropped**.

---

## 📑 Table of Contents
1. [Core Features & Assessment Criteria](#-core-features--assessment-criteria)
2. [Architecture & Pipeline Flow](#-architecture--pipeline-flow)
3. [Benchmark Evaluation (52 Samples)](#-benchmark-evaluation-52-samples)
4. [Multi-Domain Support](#-multi-domain-support)
5. [Explicit Failure Path & Human-in-the-Loop Queue](#-explicit-failure-path--human-in-the-loop-queue)
6. [Quick Start & Installation](#-quick-start--installation)
7. [Web UI & Dashboard](#-web-ui--dashboard)
8. [REST API Specification](#-rest-api-specification)
9. [Project Directory Layout](#-project-directory-layout)

---

## 🌟 Core Features & Assessment Criteria

### 1. Strongly Typed Schema Enforcement
Every extraction candidate is validated against strict **Zod Schemas** and Draft-07 **JSON Schemas**:
- **Field constraints**: `invoice_number`, `vendor_name`, `vendor_tax_id`, `invoice_date`, `due_date`, `currency`, `subtotal`, `tax_rate`, `tax_amount`, `total_amount`, and itemized `line_items`.
- **ISO 8601 Date standard**: Strict `YYYY-MM-DD` formatting.
- **Chronology verification**: `due_date >= invoice_date`.
- **Itemized arithmetic consistency**: `abs(quantity * unit_price - amount) <= 0.05`.
- **Cross-field invariant check**: `abs((subtotal + tax_amount) - total_amount) <= 0.05`.

### 2. Validation with an Explicit Failure Path (Zero Silent Failures)
- **Attempt 1 (Extraction)**: Schema-constrained extraction pass.
- **Validation Pass**: The output is certified as `VALIDATED`.
- **Validation Failure**: The pipeline does **never silently accept or drop** invalid records.
- **Self-Healing Targeted Retry Loop**: Automatically formulates a targeted feedback prompt injecting the exact violating constraint paths (e.g. arithmetic discrepancies or date formatting errors). Retries extraction (configurable 1–3 retries).
- **Human-in-the-Loop (HITL) Review Queue**: If retries are exhausted, the document is routed to the review queue with complete diagnostic audit traces, candidate diffs, and validation issues. A human reviewer can inspect, edit, and approve/reject before ingestion.

### 3. Out-of-Domain & Negative Document Handling
- Explicit negative classifier prevents false-positive hallucinations on documents containing **none of the target fields** (e.g. recipes, weather forecasts, git commit logs, Slack chats, poetry, medical prescriptions).
- Guaranteed invariant: `is_valid_document === false`, with all financial fields strictly forced to `null` and line items to `[]`.
- Achieves **100% precision on out-of-domain test cases** (12 out of 12 negative samples).

### 4. Measured Extraction Accuracy on 52 Benchmark Samples
- **Clean Invoices**: 10 samples (96.3% avg accuracy)
- **Messy OCR / Noisy Scans**: 12 samples (80.3% avg accuracy)
- **International Invoices (EUR, GBP, JPY, CAD, AUD, INR)**: 8 samples (93.2% avg accuracy)
- **Complex Arithmetic & Edge Cases**: 10 samples (96.4% avg accuracy)
- **Out-of-Domain Negative Samples**: 12 samples (100% accuracy)
- **Overall Extraction Accuracy**: **92.5%**
- **Schema Compliance Rate**: **100%**
- **First-Try Pass Rate**: **82.7%**
- **Self-Healed on Retry**: **9 samples**

---

## 🔄 Architecture & Pipeline Flow

```
   ┌──────────────────────────────────────────────┐
   │            Unstructured Document             │
   │ (Messy scans, noisy text, receipts, articles) │
   └──────────────────────┬───────────────────────┘
                          │
                          ▼
            [ 1. Ingestion & Preprocessing ]
                          │
                          ▼
     [ 2. Schema-Constrained Generation / Extractor ]
                          │
                          ▼
             [ 3. Strict Zod Validation ]
                          │
           ┌──────────────┴──────────────┐
           │                             │
    [ Validation Pass ]          [ Validation Fail ]
           │                             │
           │                             ▼
           │               [ 4. Targeted Self-Healing ]
           │               (Injects exact error paths)
           │                             │
           │              ┌──────────────┴──────────────┐
           │              │                             │
           │         [ Retry Pass ]               [ Retries Exceeded ]
           │              │                             │
           ▼              ▼                             ▼
   ┌─────────────────────────────┐           ┌─────────────────────────────┐
   │     Certified & Ingested    │           │  Explicit HITL Review Queue │
   │ (VALIDATED / HEALED_RETRY)  │           │   (ROUTED_TO_REVIEW with    │
   │                             │           │    audit trace & editor)    │
   └─────────────────────────────┘           └─────────────────────────────┘
```

---

## 📊 Benchmark Evaluation (52 Samples)

Run the automated benchmark suite:
```bash
npm test
# or
node tests/benchmark.test.js
```

### Measured Performance Summary:
```
==========================================================
  STRUCTURED OUTPUT EXTRACTION PIPELINE - BENCHMARK TEST  
==========================================================
Total Samples Evaluated:         52
Overall Extraction Accuracy:     92.5%
Schema Compliance Rate:          100.0%
First-Try Pass Rate:             82.7%
Self-Healed on Retry:            9 samples
Routed to Review Queue:          0 (unresolved)
Negative/Out-of-Domain Accuracy: 100.0% (12 of 12 detected)
Avg Latency per Document:        1 ms

FIELD-LEVEL ACCURACY BREAKDOWN:
  is_valid_document    [████████████████████] 98.1%
  document_type        [███████████████████░] 96.2%
  invoice_number       [███████████████░░░░░] 75.0%
  vendor_name          [███████████████████░] 96.2%
  vendor_tax_id        [█████████████████░░░] 84.3%
  invoice_date         [████████████████████] 97.5%
  due_date             [███████████████████░] 97.3%
  currency             [████████████████████] 97.5%
  subtotal             [████████████████████] 98.1%
  tax_amount           [██████████████████░░] 90.4%
  total_amount         [██████████████████░░] 90.4%
```

---

## 🗂️ Multi-Domain Support

SOEP supports three realistic unstructured data domains:
1. **Financial Invoices & Receipts** (`src/schemas/invoiceSchema.js`)
   - Vendor, tax ID, dates, line items, subtotal, tax amount, total amount, currency.
2. **Job Postings** (`src/schemas/jobPostSchema.js`)
   - Job title, company name, location, workplace type (remote/hybrid/on-site), salary min/max, technical skills, years of experience, contact email.
3. **Résumés / CVs** (`src/schemas/resumeSchema.js`)
   - Candidate full name, email, phone, current title, total experience, skills portfolio, education history, work history.

---

## 🛡️ Explicit Failure Path & Human-in-the-Loop Queue

The pipeline **forbids silent failures**:
- When retries are exhausted or data fails invariant checks, it is stored in the **Review Queue Store** (`src/store/reviewQueue.js`).
- The interactive UI displays the original raw text side-by-side with failing schema errors and an interactive field editor.
- Reviewers can resolve items with `APPROVE`, `EDIT_AND_APPROVE`, or `REJECT`.
- Complete audit logging records reviewer notes and resolution timestamps.

---

## 🚀 Quick Start & Installation

### Prerequisites
- Node.js v18+ (tested on Node.js v24)
- npm v9+

### Setup
```bash
# Clone the repository
git clone https://github.com/hariharln28/SOEP.git
cd SOEP

# Install dependencies
npm install

# Run the automated benchmark suite (52 test cases)
npm test

# Start the interactive Web Application & REST API
npm start
```

Access the UI at: **`http://localhost:3000`**

---

## 🖥️ Web UI & Dashboard

The application includes a Single-Page Application (SPA) built with Tailwind CSS, Lucide icons, and modern glassmorphic aesthetics:
- ⚡ **Extraction Playground**: Live document extraction, preset scenario selector, visual pipeline stepper, formatted cards view, raw JSON inspector.
- 📊 **50+ Sample Benchmark Dashboard**: One-click benchmark runner, field-level progress bars, category filter, diff inspection modal with side-by-side ground truth comparisons, and JSON report export.
- 🛡️ **Human-in-the-Loop Review Queue**: Dedicated inbox of flagged extractions, live field editor, resolution buttons, and audit trail.
- 📐 **Typed Schema & Rule Explorer**: Interactive inspector for Zod invariants and JSON schemas.
- 🔄 **Pipeline Architecture**: Visual diagram explaining the non-silent failure path.

---

## 📡 REST API Specification

| Endpoint | Method | Payload / Params | Description |
| :--- | :---: | :--- | :--- |
| `/api/extract` | `POST` | `{ text, domain, maxRetries, simulateFault, apiKey }` | Executes extraction pipeline with validation and auto-retry |
| `/api/benchmark` | `GET` | `?apiKey=...` | Runs full 52-sample benchmark suite and returns metrics |
| `/api/samples` | `GET` | — | Returns presets and ground truth definitions |
| `/api/review-queue` | `GET` | `?status=ALL\|PENDING_REVIEW` | Retrieves items routed to the review queue |
| `/api/review-queue/:id/resolve` | `POST` | `{ action, updatedData, notes }` | Resolves review item (`APPROVE`, `EDIT_AND_APPROVE`, `REJECT`) |
| `/api/schemas` | `GET` | — | Returns typed schema rules and Draft-07 JSON Schemas |
| `/api/stats` | `GET` | — | Returns system-wide extraction throughput and review metrics |

---

## 📁 Project Directory Layout

```
SOEP/
├── package.json               # Project manifest, scripts, and dependencies
├── server.js                  # Express API server & static asset host
├── README.md                  # Comprehensive technical documentation
├── .gitignore                 # Node modules, logs, and environment ignores
├── src/
│   ├── schemas/
│   │   ├── invoiceSchema.js   # Zod schema, JSON schema, arithmetic invariants
│   │   ├── jobPostSchema.js   # Job vacancy typed schema
│   │   └── resumeSchema.js    # Candidate resume typed schema
│   ├── engine/
│   │   ├── extractor.js       # Pattern/heuristic parser & out-of-domain classifier
│   │   ├── validator.js       # Strict schema validation engine
│   │   ├── retryManager.js    # Targeted error-feedback retry loops
│   │   └── pipeline.js        # End-to-end pipeline orchestrator
│   ├── dataset/
│   │   ├── benchmark50.js     # 52 diverse, realistic samples + ground truths
│   │   └── evaluator.js       # Field-level accuracy & metric calculation suite
│   └── store/
│       └── reviewQueue.js     # Human-in-the-loop review queue store & audit log
├── public/
│   ├── index.html             # Interactive SPA dashboard
│   ├── app.js                 # Frontend application & trace controller
│   └── styles.css             # Glassmorphic styles & pipeline animations
└── tests/
    └── benchmark.test.js      # Headless CLI benchmark test runner
```

---

## 📄 License
MIT License &copy; 2026. Free for educational and commercial use.
