/**
 * Benchmark Dataset: 52 Diverse Samples for Structured Output Extraction Pipeline
 * Includes Clean Invoices, Messy OCR Scans, Multi-Currency Invoices, Edge Cases,
 * and 12 Explicit Negative/Out-of-Domain Documents with NONE of the target fields.
 */

const BENCHMARK_SAMPLES = [
  // ==========================================
  // CATEGORY 1: CLEAN & STANDARD INVOICES (1-10)
  // ==========================================
  {
    id: "SAMPLE-01",
    category: "clean",
    description: "Standard Cloud Service Invoice (AWS)",
    raw_text: `Amazon Web Services, Inc.
410 Terry Avenue North, Seattle, WA 98109
Tax ID: US-91-1234567

INVOICE: INV-AWS-2024-89012
Invoice Date: 2024-03-01
Due Date: 2024-03-31
Customer: Acme Cloud Corp
100 Market St, San Francisco, CA

Items:
EC2 Compute Instance Standard - 720 hrs @ $0.100 = $72.00
S3 Standard Storage Bucket - 500 GB @ $0.020 = $10.00
AWS CloudFront Data Transfer - 100 GB @ $0.085 = $8.50

Subtotal: $90.50
Tax (10%): $9.05
Total Amount Due: $99.55 USD`,
    ground_truth: {
      is_valid_document: true,
      document_type: "invoice",
      invoice_number: "INV-AWS-2024-89012",
      vendor_name: "Amazon Web Services, Inc.",
      vendor_tax_id: "US-91-1234567",
      vendor_address: "410 Terry Avenue North, Seattle, WA 98109",
      customer_name: "Acme Cloud Corp",
      invoice_date: "2024-03-01",
      due_date: "2024-03-31",
      currency: "USD",
      subtotal: 90.50,
      tax_amount: 9.05,
      tax_rate: 10,
      total_amount: 99.55,
      line_items: [
        { description: "EC2 Compute Instance Standard", quantity: 720, unit_price: 0.10, amount: 72.00 },
        { description: "S3 Standard Storage Bucket", quantity: 500, unit_price: 0.02, amount: 10.00 },
        { description: "AWS CloudFront Data Transfer", quantity: 100, unit_price: 0.085, amount: 8.50 }
      ]
    }
  },
  {
    id: "SAMPLE-02",
    category: "clean",
    description: "SaaS Subscription Invoice (Slack)",
    raw_text: `Slack Technologies, LLC
500 Howard Street, San Francisco, CA 94105
Tax ID: 47-1239871

Invoice Number: SLACK-992014
Date: 2024-02-15
Payment Terms: Net 30
Due Date: 2024-03-16
Billed To: DataFlow Labs Inc.

Description:
Slack Business+ Annual Plan (15 seats) - 15 @ $150.00 = $2250.00

Subtotal: $2250.00
Sales Tax (0%): $0.00
Total Due: $2250.00 USD`,
    ground_truth: {
      is_valid_document: true,
      document_type: "invoice",
      invoice_number: "SLACK-992014",
      vendor_name: "Slack Technologies, LLC",
      vendor_tax_id: "47-1239871",
      invoice_date: "2024-02-15",
      due_date: "2024-03-16",
      currency: "USD",
      subtotal: 2250.00,
      tax_amount: 0.00,
      tax_rate: 0,
      total_amount: 2250.00,
      line_items: [
        { description: "Slack Business+ Annual Plan (15 seats)", quantity: 15, unit_price: 150.00, amount: 2250.00 }
      ]
    }
  },
  {
    id: "SAMPLE-03",
    category: "clean",
    description: "Office Supplies Receipt (Staples)",
    raw_text: `STAPLES INC
Store #0482 - Boston MA
EIN: 04-2892384
RECEIPT # ST-2024-5541
Date: 2024-01-20

Qty  Description          Price    Total
2    Copy Paper 500ct     $12.50   $25.00
4    Ballpoint Pens (Pk)  $4.50    $18.00
1    Dry Erase Board      $45.00   $45.00

Subtotal: $88.00
State Tax (6.25%): $5.50
Total: $93.50 USD
Payment: Visa ending in 4491`,
    ground_truth: {
      is_valid_document: true,
      document_type: "receipt",
      invoice_number: "ST-2024-5541",
      vendor_name: "STAPLES INC",
      vendor_tax_id: "04-2892384",
      invoice_date: "2024-01-20",
      due_date: "2024-01-20",
      currency: "USD",
      subtotal: 88.00,
      tax_amount: 5.50,
      tax_rate: 6.25,
      total_amount: 93.50,
      line_items: [
        { description: "Copy Paper 500ct", quantity: 2, unit_price: 12.50, amount: 25.00 },
        { description: "Ballpoint Pens (Pk)", quantity: 4, unit_price: 4.50, amount: 18.00 },
        { description: "Dry Erase Board", quantity: 1, unit_price: 45.00, amount: 45.00 }
      ]
    }
  },
  {
    id: "SAMPLE-04",
    category: "clean",
    description: "Digital Marketing Agency Invoice",
    raw_text: `Vanguard Media Agency Ltd.
120 Queen St West, Toronto, ON
GST/HST: 889214772RT0001
Bill To: Apex Retail Partners
Invoice Reference: VM-8831
Issue Date: 2024-04-10
Payment Due: 2024-05-10

Services:
SEO Optimization Audit - 1 @ $1200.00 = $1200.00
PPC Campaign Management (Monthly) - 1 @ $800.00 = $800.00

Subtotal: $2000.00
Tax: $260.00
Total Payable: $2260.00 CAD`,
    ground_truth: {
      is_valid_document: true,
      document_type: "invoice",
      invoice_number: "VM-8831",
      vendor_name: "Vanguard Media Agency Ltd.",
      vendor_tax_id: "889214772RT0001",
      invoice_date: "2024-04-10",
      due_date: "2024-05-10",
      currency: "CAD",
      subtotal: 2000.00,
      tax_amount: 260.00,
      total_amount: 2260.00
    }
  },
  {
    id: "SAMPLE-05",
    category: "clean",
    description: "Hardware Hardware Manufacturer (Dell)",
    raw_text: `Dell Technologies Inc.
One Dell Way, Round Rock, TX 78682
Tax EIN: 74-2487834
Customer: Nexus Dynamics
Invoice: DELL-7489201
Date of Invoice: 2024-02-01
Due: 2024-03-03

Items:
Dell PowerEdge Server R750 - 2 @ $3200.00 = $6400.00
32GB ECC RAM Upgrade Kit - 4 @ $150.00 = $600.00

Subtotal: $7000.00
Sales Tax: $577.50
Grand Total: $7577.50 USD`,
    ground_truth: {
      is_valid_document: true,
      document_type: "invoice",
      invoice_number: "DELL-7489201",
      vendor_name: "Dell Technologies Inc.",
      vendor_tax_id: "74-2487834",
      invoice_date: "2024-02-01",
      due_date: "2024-03-03",
      currency: "USD",
      subtotal: 7000.00,
      tax_amount: 577.50,
      total_amount: 7577.50
    }
  },
  {
    id: "SAMPLE-06",
    category: "clean",
    description: "Freelance Software Consultant Invoice",
    raw_text: `CodeCraft Consulting LLC
14 Elm Street, Austin, TX
Tax ID: 81-9923841
Invoice No: CC-2024-004
Date: 2024-03-15
Due Date: 2024-03-30
Client: NextGen Fintech Co

Full-Stack Engineering (Hours) - 40 @ $125.00 = $5000.00
Architecture Review - 10 @ $150.00 = $1500.00

Subtotal: $6500.00
Tax: $0.00
Total: $6500.00 USD`,
    ground_truth: {
      is_valid_document: true,
      document_type: "invoice",
      invoice_number: "CC-2024-004",
      vendor_name: "CodeCraft Consulting LLC",
      vendor_tax_id: "81-9923841",
      invoice_date: "2024-03-15",
      due_date: "2024-03-30",
      currency: "USD",
      subtotal: 6500.00,
      tax_amount: 0.00,
      total_amount: 6500.00
    }
  },
  {
    id: "SAMPLE-07",
    category: "clean",
    description: "GitHub Enterprise Subscription",
    raw_text: `GitHub, Inc.
88 Colin P Kelly Jr St, San Francisco, CA 94107
Tax ID: 26-2771239
Invoice Number: GH-4418290
Date: 2024-01-05
Due Date: 2024-02-04
Bill to: Velocity Systems Inc

GitHub Enterprise Cloud User - 25 @ $21.00 = $525.00
GitHub Copilot Business - 25 @ $19.00 = $475.00

Subtotal: $1000.00
Tax (8.25%): $82.50
Total: $1082.50 USD`,
    ground_truth: {
      is_valid_document: true,
      document_type: "invoice",
      invoice_number: "GH-4418290",
      vendor_name: "GitHub, Inc.",
      vendor_tax_id: "26-2771239",
      invoice_date: "2024-01-05",
      due_date: "2024-02-04",
      currency: "USD",
      subtotal: 1000.00,
      tax_amount: 82.50,
      total_amount: 1082.50
    }
  },
  {
    id: "SAMPLE-08",
    category: "clean",
    description: "Ride Share Business Travel Receipt",
    raw_text: `Uber Technologies, Inc.
1515 3rd St, San Francisco, CA
Receipt: UBER-TRIP-99812
Date: 2024-02-28
Rider: John Doe

Trip Fare: Standard Black Car - 1 @ $42.50 = $42.50
Airport Surcharge - 1 @ $5.00 = $5.00
Subtotal: $47.50
Tax: $3.80
Total Paid: $51.30 USD`,
    ground_truth: {
      is_valid_document: true,
      document_type: "receipt",
      invoice_number: "UBER-TRIP-99812",
      vendor_name: "Uber Technologies, Inc.",
      invoice_date: "2024-02-28",
      due_date: "2024-02-28",
      currency: "USD",
      subtotal: 47.50,
      tax_amount: 3.80,
      total_amount: 51.30
    }
  },
  {
    id: "SAMPLE-09",
    category: "clean",
    description: "Adobe Creative Cloud Annual Licensing",
    raw_text: `Adobe Systems Software Ireland Limited
4-6 Riverwalk, Citywest Business Campus, Dublin
VAT ID: IE9587429B
Customer: Creative Peak Studio
Invoice #: ADB-339182
Invoice Date: 2024-01-12
Payment Due: 2024-02-11

Adobe Creative Cloud All Apps - 3 @ $59.99 = $179.97
Adobe Stock 10 Assets - 1 @ $29.99 = $29.99

Subtotal: $209.96
VAT (0%): $0.00
Total Amount: $209.96 USD`,
    ground_truth: {
      is_valid_document: true,
      document_type: "invoice",
      invoice_number: "ADB-339182",
      vendor_name: "Adobe Systems Software Ireland Limited",
      vendor_tax_id: "IE9587429B",
      invoice_date: "2024-01-12",
      due_date: "2024-02-11",
      currency: "USD",
      subtotal: 209.96,
      tax_amount: 0.00,
      total_amount: 209.96
    }
  },
  {
    id: "SAMPLE-10",
    category: "clean",
    description: "Legal Services Retainer Invoice",
    raw_text: `Sterling & Hastings LLP
Attorneys at Law
100 Wall Street, New York, NY 10005
Tax ID: 13-9938124
Invoice: SH-2024-1049
Date: 2024-03-05
Due Date: 2024-04-04
Client: Alpha Ventures LLC

Corporate Governance & Filing - 8 hrs @ $450.00 = $3600.00
Contract Drafting & Review - 4 hrs @ $450.00 = $1800.00

Subtotal: $5400.00
Sales Tax: $0.00
Total Balance Due: $5400.00 USD`,
    ground_truth: {
      is_valid_document: true,
      document_type: "invoice",
      invoice_number: "SH-2024-1049",
      vendor_name: "Sterling & Hastings LLP",
      vendor_tax_id: "13-9938124",
      invoice_date: "2024-03-05",
      due_date: "2024-04-04",
      currency: "USD",
      subtotal: 5400.00,
      tax_amount: 0.00,
      total_amount: 5400.00
    }
  },

  // ==========================================
  // CATEGORY 2: MESSY OCR SCANS & UNSTRUCTURED (11-22)
  // ==========================================
  {
    id: "SAMPLE-11",
    category: "noisy_ocr",
    description: "Noisy OCR scan with broken formatting and letters",
    raw_text: `*** T E X T   S C A N N E D   D O C U M E N T ***
v e n d o r :   G L O B A L   L O G I S T I C S   I N C
A d d r e s s :   1 2   W a r e h o u s e   R d ,   C h i c a g o   I L
T A X   I D :   3 6 - 8 8 2 9 1 0 2
I N V # :   I N V - G L - 7 7 4 1
D a t e :   2 0 2 4 - 0 3 - 1 4
D u e :   2 0 2 4 - 0 4 - 1 4

S h i p p i n g   C o n t a i n e r   F r e i g h t   -   1   @   $ 1 4 5 0 . 0 0   =   $ 1 4 5 0 . 0 0
F u e l   S u r c h a r g e   -   1   @   $ 1 5 0 . 0 0   =   $ 1 5 0 . 0 0

S u b t o t a l :   $ 1 6 0 0 . 0 0
T a x :   $ 1 2 8 . 0 0
T O T A L :   $ 1 7 2 8 . 0 0   U S D`,
    ground_truth: {
      is_valid_document: true,
      document_type: "invoice",
      invoice_number: "INV-GL-7741",
      vendor_name: "GLOBAL LOGISTICS INC",
      vendor_tax_id: "36-8829102",
      invoice_date: "2024-03-14",
      due_date: "2024-04-14",
      currency: "USD",
      subtotal: 1600.00,
      tax_amount: 128.00,
      total_amount: 1728.00
    }
  },
  {
    id: "SAMPLE-12",
    category: "noisy_ocr",
    description: "Camera snapshot receipt with character substitutions",
    raw_text: `B|STRO CAFE & GRILL
742 Evergreen Terr, Sprlngfleld
Tax: 88-12490
RECElPT NO: BC-99401
Date: 2024-02-18
1x Burger Combo $18.50
2x Soft Drink @ 3.50 = 7.00
Subtot: 25.50
Tax (8%): 2.04
TOTAL: $27.54 USD
Thanks for stopping by!`,
    ground_truth: {
      is_valid_document: true,
      document_type: "receipt",
      invoice_number: "BC-99401",
      vendor_name: "BISTRO CAFE & GRILL",
      vendor_tax_id: "88-12490",
      invoice_date: "2024-02-18",
      due_date: "2024-02-18",
      currency: "USD",
      subtotal: 25.50,
      tax_amount: 2.04,
      total_amount: 27.54
    }
  },
  {
    id: "SAMPLE-13",
    category: "noisy_ocr",
    description: "Messy thermal POS ticket with uneven line breaks",
    raw_text: `================================
      QUICK FIX AUTO REPAIR
      TaxReg: 22-8910245
================================
TICKET: AUTO-5519
DATE: 2024-04-02
CUSTOMER: Sarah Jenkins
---
Brake Pad Replacement
QTY: 1  UNIT: 180.00  EXT: 180.00
Labor Hours
QTY: 2  UNIT: 85.00   EXT: 170.00
---
SUBTOTAL: $350.00
TAX: $28.00
GRAND TOTAL: $378.00 USD
PAID IN FULL`,
    ground_truth: {
      is_valid_document: true,
      document_type: "invoice",
      invoice_number: "AUTO-5519",
      vendor_name: "QUICK FIX AUTO REPAIR",
      vendor_tax_id: "22-8910245",
      invoice_date: "2024-04-02",
      currency: "USD",
      subtotal: 350.00,
      tax_amount: 28.00,
      total_amount: 378.00
    }
  },
  {
    id: "SAMPLE-14",
    category: "noisy_ocr",
    description: "Handwritten invoice converted with messy punctuation",
    raw_text: `From: Blue Sky Catering Service
Tax Identification: 99-4412098
Bill Ref : BSC/2024/091
Bill Date : 2024-01-29
Due by : 2024-02-28
To: Zenith Events Corp

Buffet Lunch per person (30 @ $25.00) => $750.00
Beverage station (1 @ $100.00) => $100.00
Sub-total: $850.00
Tax amount: $68.00
Total Due: $918.00 USD`,
    ground_truth: {
      is_valid_document: true,
      document_type: "invoice",
      invoice_number: "BSC/2024/091",
      vendor_name: "Blue Sky Catering Service",
      vendor_tax_id: "99-4412098",
      invoice_date: "2024-01-29",
      due_date: "2024-02-28",
      currency: "USD",
      subtotal: 850.00,
      tax_amount: 68.00,
      total_amount: 918.00
    }
  },
  {
    id: "SAMPLE-15",
    category: "noisy_ocr",
    description: "Invoice embedded in conversational email body",
    raw_text: `Hey team, here is the official invoice attached below.
Vendor: Apex Security Systems Inc
TaxEIN: 54-1928374
Invoice Number: APX-SEC-441
Date: 2024-03-22
Due: 2024-04-21

Annual Camera Monitoring Plan (1 @ $1200.00) = $1200.00
Subtotal: $1200.00
Tax: $96.00
Total: $1296.00 USD
Please remit wire payment as usual. Thanks!`,
    ground_truth: {
      is_valid_document: true,
      document_type: "invoice",
      invoice_number: "APX-SEC-441",
      vendor_name: "Apex Security Systems Inc",
      vendor_tax_id: "54-1928374",
      invoice_date: "2024-03-22",
      due_date: "2024-04-21",
      currency: "USD",
      subtotal: 1200.00,
      tax_amount: 96.00,
      total_amount: 1296.00
    }
  },
  {
    id: "SAMPLE-16",
    category: "noisy_ocr",
    description: "Cluttered fax document with header artifacts",
    raw_text: `[FAX TRANSMISSION RCVD 2024-02-14 09:30 AM EST]
P.01/01
SUMMIT PRINTING & PACKAGING
EIN: 11-8849201
INVOICE#: SP-2024-118
INVOICE DATE: 2024-02-14
DUE DATE: 2024-03-15
RECIPIENT: BioHealth Pharma

Item: Custom Cardboard Boxes (Qty: 500, Price: $2.00, Total: $1000.00)
Subtotal: $1000.00
Tax: $80.00
Balance: $1080.00 USD
[END TRANSMISSION]`,
    ground_truth: {
      is_valid_document: true,
      document_type: "invoice",
      invoice_number: "SP-2024-118",
      vendor_name: "SUMMIT PRINTING & PACKAGING",
      vendor_tax_id: "11-8849201",
      invoice_date: "2024-02-14",
      due_date: "2024-03-15",
      currency: "USD",
      subtotal: 1000.00,
      tax_amount: 80.00,
      total_amount: 1080.00
    }
  },
  {
    id: "SAMPLE-17",
    category: "noisy_ocr",
    description: "OCR artifact with mixed slash dates and zero noise",
    raw_text: `ACME HARDWARE CO.
TaxID: 45-9920194
INV: #AH-88301
Date: 2024-04-05
Due: 2024-05-05

2x Power Drill Heavy Duty @ 120.00 = 240.00
1x Tool Case Pro @ 60.00 = 60.00
Subtotal: 300.00
Tax: 24.00
Total Due: 324.00 USD`,
    ground_truth: {
      is_valid_document: true,
      document_type: "invoice",
      invoice_number: "AH-88301",
      vendor_name: "ACME HARDWARE CO.",
      vendor_tax_id: "45-9920194",
      invoice_date: "2024-04-05",
      due_date: "2024-05-05",
      currency: "USD",
      subtotal: 300.00,
      tax_amount: 24.00,
      total_amount: 324.00
    }
  },
  {
    id: "SAMPLE-18",
    category: "noisy_ocr",
    description: "Semi-tabular layout with missing column headers",
    raw_text: `Greenfield Landscaping
Tax: 67-2891045
InvNumber: GL-9021
Date: 2024-03-10
Due: 2024-04-10
Lawn Mowing & Trimming | 4 visits @ 75.00 | 300.00
Mulch Installation | 1 @ 200.00 | 200.00
Sub-Total: 500.00
Tax (5%): 25.00
Total: 525.00 USD`,
    ground_truth: {
      is_valid_document: true,
      document_type: "invoice",
      invoice_number: "GL-9021",
      vendor_name: "Greenfield Landscaping",
      vendor_tax_id: "67-2891045",
      invoice_date: "2024-03-10",
      due_date: "2024-04-10",
      currency: "USD",
      subtotal: 500.00,
      tax_amount: 25.00,
      total_amount: 525.00
    }
  },
  {
    id: "SAMPLE-19",
    category: "noisy_ocr",
    description: "Multi-line item receipt with messy currency tags",
    raw_text: `URBAN ROAST COFFEE
Tax EIN: 82-4491029
Receipt ID: URC-50281
Date: 2024-02-22
Espresso Shot (3 @ $3.00) = $9.00
Croissant Almond (2 @ $4.50) = $9.00
Subtotal: $18.00
Tax: $1.44
Total: $19.44 USD`,
    ground_truth: {
      is_valid_document: true,
      document_type: "receipt",
      invoice_number: "URC-50281",
      vendor_name: "URBAN ROAST COFFEE",
      vendor_tax_id: "82-4491029",
      invoice_date: "2024-02-22",
      due_date: "2024-02-22",
      currency: "USD",
      subtotal: 18.00,
      tax_amount: 1.44,
      total_amount: 19.44
    }
  },
  {
    id: "SAMPLE-20",
    category: "noisy_ocr",
    description: "IT support service ticket invoice",
    raw_text: `BYTECRAFT SOLUTIONS
Tax ID: 38-9912049
Bill: BYT-99214
Date: 2024-01-18
Due: 2024-02-17
Client: Omni Corp
Workstation Onsite Setup (4 @ $100.00) = $400.00
Subtotal: $400.00
Tax: $32.00
Total: $432.00 USD`,
    ground_truth: {
      is_valid_document: true,
      document_type: "invoice",
      invoice_number: "BYT-99214",
      vendor_name: "BYTECRAFT SOLUTIONS",
      vendor_tax_id: "38-9912049",
      invoice_date: "2024-01-18",
      due_date: "2024-02-17",
      currency: "USD",
      subtotal: 400.00,
      tax_amount: 32.00,
      total_amount: 432.00
    }
  },
  {
    id: "SAMPLE-21",
    category: "noisy_ocr",
    description: "HVAC maintenance receipt with shorthand",
    raw_text: `COOLAIR HVAC SERVICES
Tax ID: 73-1928475
Inv #: CA-88120
Date: 2024-03-29
Due: 2024-04-29
Compressor Filter (2 @ $45.00) = $90.00
System Inspection Labor (1 @ $120.00) = $120.00
Subtotal: $210.00
Tax: $16.80
Total: $226.80 USD`,
    ground_truth: {
      is_valid_document: true,
      document_type: "invoice",
      invoice_number: "CA-88120",
      vendor_name: "COOLAIR HVAC SERVICES",
      vendor_tax_id: "73-1928475",
      invoice_date: "2024-03-29",
      due_date: "2024-04-29",
      currency: "USD",
      subtotal: 210.00,
      tax_amount: 16.80,
      total_amount: 226.80
    }
  },
  {
    id: "SAMPLE-22",
    category: "noisy_ocr",
    description: "Warehouse equipment rental statement",
    raw_text: `TITAN MACHINERY RENTALS
Tax: 91-4410293
Invoice: TMR-33190
Date: 2024-02-08
Due: 2024-03-08
Forklift Weekly Rental (1 @ $650.00) = $650.00
Safety Harness Kit (2 @ $25.00) = $50.00
Subtotal: $700.00
Tax: $56.00
Total: $756.00 USD`,
    ground_truth: {
      is_valid_document: true,
      document_type: "invoice",
      invoice_number: "TMR-33190",
      vendor_name: "TITAN MACHINERY RENTALS",
      vendor_tax_id: "91-4410293",
      invoice_date: "2024-02-08",
      due_date: "2024-03-08",
      currency: "USD",
      subtotal: 700.00,
      tax_amount: 56.00,
      total_amount: 756.00
    }
  },

  // ==========================================
  // CATEGORY 3: MULTI-CURRENCY & INTERNATIONAL (23-30)
  // ==========================================
  {
    id: "SAMPLE-23",
    category: "international",
    description: "European VAT Invoice (EUR) in Germany",
    raw_text: `SIEMENS MOBILITY GMBH
Otto-Hahn-Ring 6, Munich, Germany
USt-IdNr.: DE129274202
RECHNUNG NR: RE-2024-88910
Datum: 2024-02-20
Faelligkeit: 2024-03-21
Kunde: RailTech Europe

Wartung Sensorik - 2 @ 450.00 EUR = 900.00 EUR
Softwarelizenz Industrial - 1 @ 600.00 EUR = 600.00 EUR

Zwischensumme: 1500.00 EUR
MwSt (19%): 285.00 EUR
Gesamtbetrag: 1785.00 EUR`,
    ground_truth: {
      is_valid_document: true,
      document_type: "invoice",
      invoice_number: "RE-2024-88910",
      vendor_name: "SIEMENS MOBILITY GMBH",
      vendor_tax_id: "DE129274202",
      invoice_date: "2024-02-20",
      due_date: "2024-03-21",
      currency: "EUR",
      subtotal: 1500.00,
      tax_amount: 285.00,
      tax_rate: 19,
      total_amount: 1785.00
    }
  },
  {
    id: "SAMPLE-24",
    category: "international",
    description: "United Kingdom VAT Invoice (GBP)",
    raw_text: `CloudWorks UK Limited
10 Finsbury Square, London, EC2A 1AF
VAT Reg: GB 924 8192 10
INVOICE: CWUK-44192
Date: 2024-03-12
Due: 2024-04-11
Client: British Retail Consortium

Cloud Hosting Dedicated Tier (1 @ 500.00 GBP) = 500.00 GBP
Managed Firewall Support (1 @ 150.00 GBP) = 150.00 GBP

Subtotal: 650.00 GBP
VAT (20%): 130.00 GBP
Total Due: 780.00 GBP`,
    ground_truth: {
      is_valid_document: true,
      document_type: "invoice",
      invoice_number: "CWUK-44192",
      vendor_name: "CloudWorks UK Limited",
      vendor_tax_id: "GB 924 8192 10",
      invoice_date: "2024-03-12",
      due_date: "2024-04-11",
      currency: "GBP",
      subtotal: 650.00,
      tax_amount: 130.00,
      tax_rate: 20,
      total_amount: 780.00
    }
  },
  {
    id: "SAMPLE-25",
    category: "international",
    description: "Japanese Yen Hardware Invoice (JPY)",
    raw_text: `Tokyo Electronics Corp
Chiyoda-ku, Tokyo, Japan
Tax ID: JP-4910294819
Invoice No: JP-TYO-9912
Date: 2024-01-15
Due Date: 2024-02-15

Optic Sensor Modules (10 @ 5000 JPY) = 50000 JPY
Subtotal: 50000 JPY
Consumption Tax (10%): 5000 JPY
Total Payable: 55000 JPY`,
    ground_truth: {
      is_valid_document: true,
      document_type: "invoice",
      invoice_number: "JP-TYO-9912",
      vendor_name: "Tokyo Electronics Corp",
      vendor_tax_id: "JP-4910294819",
      invoice_date: "2024-01-15",
      due_date: "2024-02-15",
      currency: "JPY",
      subtotal: 50000,
      tax_amount: 5000,
      tax_rate: 10,
      total_amount: 55000
    }
  },
  {
    id: "SAMPLE-26",
    category: "international",
    description: "Australian GST Tax Invoice (AUD)",
    raw_text: `Sydney Creative Agency Pty Ltd
Level 5, 200 George St, Sydney NSW
ABN: 51 824 753 109
TAX INVOICE: SYD-88219
Invoice Date: 2024-03-01
Due Date: 2024-03-31
Customer: Harbour Logistics

Brand Identity Strategy - 1 @ 2500.00 AUD = 2500.00 AUD
Subtotal: 2500.00 AUD
GST (10%): 250.00 AUD
Total Inclusive of GST: 2750.00 AUD`,
    ground_truth: {
      is_valid_document: true,
      document_type: "invoice",
      invoice_number: "SYD-88219",
      vendor_name: "Sydney Creative Agency Pty Ltd",
      vendor_tax_id: "51 824 753 109",
      invoice_date: "2024-03-01",
      due_date: "2024-03-31",
      currency: "AUD",
      subtotal: 2500.00,
      tax_amount: 250.00,
      tax_rate: 10,
      total_amount: 2750.00
    }
  },
  {
    id: "SAMPLE-27",
    category: "international",
    description: "Canadian Dual Tax Invoice (CAD)",
    raw_text: `Montreal Cloud Solutions Inc.
Boulevard Rene-Levesque, Montreal, QC
GST: 123456789RT0001
Invoice: MTL-55102
Date: 2024-02-10
Due: 2024-03-10
Client: Quebec Health Data

Database Hosting - 1 @ 1000.00 = 1000.00 CAD
Subtotal: 1000.00 CAD
Total Tax: 149.75 CAD
Total: 1149.75 CAD`,
    ground_truth: {
      is_valid_document: true,
      document_type: "invoice",
      invoice_number: "MTL-55102",
      vendor_name: "Montreal Cloud Solutions Inc.",
      vendor_tax_id: "123456789RT0001",
      invoice_date: "2024-02-10",
      due_date: "2024-03-10",
      currency: "CAD",
      subtotal: 1000.00,
      tax_amount: 149.75,
      total_amount: 1149.75
    }
  },
  {
    id: "SAMPLE-28",
    category: "international",
    description: "Indian GST Invoice (INR)",
    raw_text: `Bengaluru Tech Innovations Pvt Ltd
Electronic City, Bengaluru, Karnataka
GSTIN: 29AAAAA0000A1Z5
TAX INVOICE: BNG-2024-102
Invoice Date: 2024-01-25
Payment Due: 2024-02-24
Customer: Horizon Analytics

Data Engineering Sprint - 1 @ 80000.00 INR = 80000.00 INR
Subtotal: 80000.00 INR
IGST (18%): 14400.00 INR
Grand Total: 94400.00 INR`,
    ground_truth: {
      is_valid_document: true,
      document_type: "invoice",
      invoice_number: "BNG-2024-102",
      vendor_name: "Bengaluru Tech Innovations Pvt Ltd",
      vendor_tax_id: "29AAAAA0000A1Z5",
      invoice_date: "2024-01-25",
      due_date: "2024-02-24",
      currency: "INR",
      subtotal: 80000.00,
      tax_amount: 14400.00,
      tax_rate: 18,
      total_amount: 94400.00
    }
  },
  {
    id: "SAMPLE-29",
    category: "international",
    description: "French Facture with Siret (EUR)",
    raw_text: `Atelier Digital Paris SAS
Rue de Rivoli, 75001 Paris, France
SIRET: 812 456 789 00012
FACTURE: FACT-2024-098
Date de facture: 2024-03-08
Echeance: 2024-04-07
Design UI/UX - 1 @ 3000.00 EUR = 3000.00 EUR
Sous-total: 3000.00 EUR
TVA (20%): 600.00 EUR
Total TTC: 3600.00 EUR`,
    ground_truth: {
      is_valid_document: true,
      document_type: "invoice",
      invoice_number: "FACT-2024-098",
      vendor_name: "Atelier Digital Paris SAS",
      vendor_tax_id: "812 456 789 00012",
      invoice_date: "2024-03-08",
      due_date: "2024-04-07",
      currency: "EUR",
      subtotal: 3000.00,
      tax_amount: 600.00,
      tax_rate: 20,
      total_amount: 3600.00
    }
  },
  {
    id: "SAMPLE-30",
    category: "international",
    description: "Irish Tech Service Provider (EUR)",
    raw_text: `Dublin Cloud Infrastructure DAC
Grand Canal Dock, Dublin 2, Ireland
VAT: IE3421908H
Invoice ID: DBL-77129
Date: 2024-04-01
Due: 2024-05-01
Network Bandwidth Tier 1 (1 @ 1200.00 EUR) = 1200.00 EUR
Subtotal: 1200.00 EUR
VAT (23%): 276.00 EUR
Total Amount: 1476.00 EUR`,
    ground_truth: {
      is_valid_document: true,
      document_type: "invoice",
      invoice_number: "DBL-77129",
      vendor_name: "Dublin Cloud Infrastructure DAC",
      vendor_tax_id: "IE3421908H",
      invoice_date: "2024-04-01",
      due_date: "2024-05-01",
      currency: "EUR",
      subtotal: 1200.00,
      tax_amount: 276.00,
      tax_rate: 23,
      total_amount: 1476.00
    }
  },

  // ==========================================
  // CATEGORY 4: COMPLEX ARITHMETIC & EDGE CASES (31-40)
  // ==========================================
  {
    id: "SAMPLE-31",
    category: "edge_case",
    description: "Multiple itemized line items with exact rounding",
    raw_text: `Matrix Electronics Supply
Tax ID: 94-8819203
Invoice: MAT-2024-3310
Date: 2024-02-14
Due: 2024-03-16
Microcontroller Board - 5 @ $14.25 = $71.25
Jumper Wires Pack - 10 @ $2.50 = $25.00
OLED Display Module - 2 @ $9.95 = $19.90
Subtotal: $116.15
Tax (8%): $9.29
Total: $125.44 USD`,
    ground_truth: {
      is_valid_document: true,
      document_type: "invoice",
      invoice_number: "MAT-2024-3310",
      vendor_name: "Matrix Electronics Supply",
      vendor_tax_id: "94-8819203",
      invoice_date: "2024-02-14",
      due_date: "2024-03-16",
      currency: "USD",
      subtotal: 116.15,
      tax_amount: 9.29,
      total_amount: 125.44
    }
  },
  {
    id: "SAMPLE-32",
    category: "edge_case",
    description: "Zero tax exempt medical equipment invoice",
    raw_text: `Apex Medical Instruments Corp
Tax ID: 22-9019283
Tax Exempt Certificate: EX-9921
Invoice: MED-88401
Date: 2024-03-02
Due Date: 2024-04-01
Surgical Scissors Stainless - 10 @ $35.00 = $350.00
Diagnostic Otoscope Set - 2 @ $180.00 = $360.00
Subtotal: $710.00
Tax: $0.00
Total: $710.00 USD`,
    ground_truth: {
      is_valid_document: true,
      document_type: "invoice",
      invoice_number: "MED-88401",
      vendor_name: "Apex Medical Instruments Corp",
      vendor_tax_id: "22-9019283",
      invoice_date: "2024-03-02",
      due_date: "2024-04-01",
      currency: "USD",
      subtotal: 710.00,
      tax_amount: 0.00,
      tax_rate: 0,
      total_amount: 710.00
    }
  },
  {
    id: "SAMPLE-33",
    category: "edge_case",
    description: "Credit Note / Refund adjustment billing",
    raw_text: `Omni Wholesale Direct
Tax ID: 41-9928172
CREDIT NOTE: CN-99410
Original Inv: MAT-1102
Date: 2024-02-25
Returned Damaged Goods - 2 @ $150.00 = $300.00
Subtotal: $300.00
Tax Refunded: $24.00
Total Credit: $324.00 USD`,
    ground_truth: {
      is_valid_document: true,
      document_type: "credit_note",
      invoice_number: "CN-99410",
      vendor_name: "Omni Wholesale Direct",
      vendor_tax_id: "41-9928172",
      invoice_date: "2024-02-25",
      currency: "USD",
      subtotal: 300.00,
      tax_amount: 24.00,
      total_amount: 324.00
    }
  },
  {
    id: "SAMPLE-34",
    category: "edge_case",
    description: "Invoice with multi-date chronology (Order, Ship, Invoice, Due)",
    raw_text: `Atlas Logistics Solutions
Tax ID: 88-1209384
Order Placed: 2024-01-10
Goods Shipped: 2024-01-12
INVOICE DATE: 2024-01-15
PAYMENT DUE DATE: 2024-02-14
INVOICE ID: ATL-2024-0012
Freight Hauling Service - 1 @ $2400.00 = $2400.00
Subtotal: $2400.00
Tax: $192.00
Total Due: $2592.00 USD`,
    ground_truth: {
      is_valid_document: true,
      document_type: "invoice",
      invoice_number: "ATL-2024-0012",
      vendor_name: "Atlas Logistics Solutions",
      vendor_tax_id: "88-1209384",
      invoice_date: "2024-01-15",
      due_date: "2024-02-14",
      currency: "USD",
      subtotal: 2400.00,
      tax_amount: 192.00,
      total_amount: 2592.00
    }
  },
  {
    id: "SAMPLE-35",
    category: "edge_case",
    description: "High value enterprise consulting contract",
    raw_text: `McKinley & Sterling Strategy Group
Tax ID: 13-4491028
Invoice Reference: MSS-2024-910
Date: 2024-03-31
Due: 2024-04-30
Q1 Enterprise Digital Transformation Advisory - 1 @ $75000.00 = $75000.00
Subtotal: $75000.00
Tax: $0.00
Total Amount Payable: $75000.00 USD`,
    ground_truth: {
      is_valid_document: true,
      document_type: "invoice",
      invoice_number: "MSS-2024-910",
      vendor_name: "McKinley & Sterling Strategy Group",
      vendor_tax_id: "13-4491028",
      invoice_date: "2024-03-31",
      due_date: "2024-04-30",
      currency: "USD",
      subtotal: 75000.00,
      tax_amount: 0.00,
      total_amount: 75000.00
    }
  },
  {
    id: "SAMPLE-36",
    category: "edge_case",
    description: "Single line restaurant takeout receipt",
    raw_text: `NOODLE HOUSE EXPRESS
Tax ID: 77-2291048
Receipt #: NHE-10294
Date: 2024-04-03
Pad Thai Chicken - 1 @ $14.50 = $14.50
Subtotal: $14.50
Tax: $1.16
Total: $15.66 USD`,
    ground_truth: {
      is_valid_document: true,
      document_type: "receipt",
      invoice_number: "NHE-10294",
      vendor_name: "NOODLE HOUSE EXPRESS",
      vendor_tax_id: "77-2291048",
      invoice_date: "2024-04-03",
      currency: "USD",
      subtotal: 14.50,
      tax_amount: 1.16,
      total_amount: 15.66
    }
  },
  {
    id: "SAMPLE-37",
    category: "edge_case",
    description: "Purchase Order with formal billing layout",
    raw_text: `PURCHASE ORDER INVOICE
Vendor: Delta Fabrication Works
EIN: 33-8820194
PO / Inv Num: DFW-PO-441
Date: 2024-02-27
Due: 2024-03-28
CNC Machined Steel Brackets - 20 @ $45.00 = $900.00
Subtotal: $900.00
Tax: $72.00
Total Due: $972.00 USD`,
    ground_truth: {
      is_valid_document: true,
      document_type: "invoice",
      invoice_number: "DFW-PO-441",
      vendor_name: "Delta Fabrication Works",
      vendor_tax_id: "33-8820194",
      invoice_date: "2024-02-27",
      due_date: "2024-03-28",
      currency: "USD",
      subtotal: 900.00,
      tax_amount: 72.00,
      total_amount: 972.00
    }
  },
  {
    id: "SAMPLE-38",
    category: "edge_case",
    description: "Subscription billing with prorated credit offset",
    raw_text: `Sentry Monitoring Corp
Tax ID: 82-1928471
Bill: SNT-2024-884
Date: 2024-03-18
Due: 2024-04-17
Team Error Monitoring (1 @ $80.00) = $80.00
Subtotal: $80.00
Tax: $6.40
Total: $86.40 USD`,
    ground_truth: {
      is_valid_document: true,
      document_type: "invoice",
      invoice_number: "SNT-2024-884",
      vendor_name: "Sentry Monitoring Corp",
      vendor_tax_id: "82-1928471",
      invoice_date: "2024-03-18",
      due_date: "2024-04-17",
      currency: "USD",
      subtotal: 80.00,
      tax_amount: 6.40,
      total_amount: 86.40
    }
  },
  {
    id: "SAMPLE-39",
    category: "edge_case",
    description: "Hardware replacement under warranty",
    raw_text: `Nordic Precision Sensors
Tax ID: 55-9019283
Invoice: NPS-994102
Date: 2024-01-30
Due: 2024-03-01
Temperature Probe Calibration - 1 @ $250.00 = $250.00
Subtotal: $250.00
Tax: $20.00
Total: $270.00 USD`,
    ground_truth: {
      is_valid_document: true,
      document_type: "invoice",
      invoice_number: "NPS-994102",
      vendor_name: "Nordic Precision Sensors",
      vendor_tax_id: "55-9019283",
      invoice_date: "2024-01-30",
      due_date: "2024-03-01",
      currency: "USD",
      subtotal: 250.00,
      tax_amount: 20.00,
      total_amount: 270.00
    }
  },
  {
    id: "SAMPLE-40",
    category: "edge_case",
    description: "Cleaning and sanitization commercial contract",
    raw_text: `EcoClean Commercial Janitorial
Tax ID: 64-1928374
Invoice: ECC-4491
Date: 2024-04-08
Due: 2024-05-08
Deep Carpet Sanitization (1 @ $450.00) = $450.00
Window Washing Exterior (1 @ $150.00) = $150.00
Subtotal: $600.00
Tax: $48.00
Total: $648.00 USD`,
    ground_truth: {
      is_valid_document: true,
      document_type: "invoice",
      invoice_number: "ECC-4491",
      vendor_name: "EcoClean Commercial Janitorial",
      vendor_tax_id: "64-1928374",
      invoice_date: "2024-04-08",
      due_date: "2024-05-08",
      currency: "USD",
      subtotal: 600.00,
      tax_amount: 48.00,
      total_amount: 648.00
    }
  },

  // =========================================================================
  // CATEGORY 5: OUT-OF-DOMAIN / NEGATIVE SAMPLES (CONTAINS NONE OF TARGET FIELDS) (41-52)
  // Must be recognized as NOT an invoice (is_valid_document: false) and NOT extract false positives!
  // =========================================================================
  {
    id: "SAMPLE-41",
    category: "negative_out_of_domain",
    description: "Baking Recipe (Grandma's Apple Pie) - Contains NO financial or billing fields",
    raw_text: `Grandma's Traditional Apple Pie Recipe
Yield: 8 servings | Prep Time: 30 minutes | Bake Time: 50 minutes

Ingredients:
- 6 medium Granny Smith apples, peeled, cored, and sliced
- 1 cup granulated white sugar
- 2 tablespoons all-purpose flour
- 1 teaspoon ground cinnamon
- 1/4 teaspoon ground nutmeg
- 1 package double-crust pie pastry
- 2 tablespoons unsalted butter, cubed

Instructions:
1. Preheat your oven to 400 degrees Fahrenheit (200 degrees C).
2. Line a 9-inch pie dish with the first rolled pastry crust.
3. In a large mixing bowl, toss the sliced apples with sugar, flour, cinnamon, and nutmeg until evenly coated.
4. Spoon apple mixture into pie pan. Dot the top with butter cubes.
5. Cover with the top crust, crimp the edges tightly, and make three 1-inch slits on top to vent steam.
6. Bake for 45 to 50 minutes until crust is golden brown and juices are bubbling.
Cool for at least 2 hours before slicing.`,
    ground_truth: {
      is_valid_document: false,
      document_type: "unknown",
      invoice_number: null,
      vendor_name: null,
      vendor_tax_id: null,
      total_amount: null,
      subtotal: null,
      tax_amount: null,
      line_items: []
    }
  },
  {
    id: "SAMPLE-42",
    category: "negative_out_of_domain",
    description: "National Weather Service Regional Forecast Report",
    raw_text: `NATIONAL WEATHER SERVICE BULLETIN
ISSUED: 06:00 AM EDT FRIDAY OCTOBER 18
ZONE FORECAST FOR THE GREATER METROPOLITAN AREA

TODAY: Partly cloudy skies in the morning becoming overcast by early afternoon.
High temperatures near 68°F (20°C). Winds from the south-southwest at 10 to 15 mph.
Chance of precipitation 20 percent.

TONIGHT: Rain showers developing after 9:00 PM. Locally heavy rainfall possible
along the coastal ridge. Overnight low of 52°F (11°C). Barometric pressure steady
at 30.12 inches of mercury. Relative humidity rising to 88%.

WEEKEND OUTLOOK: Clearing Saturday morning with brisk northwest breezes. Sunday
will be sunny and crisp with seasonal highs in the low 60s. No marine warnings in effect.`,
    ground_truth: {
      is_valid_document: false,
      document_type: "unknown",
      invoice_number: null,
      vendor_name: null,
      vendor_tax_id: null,
      total_amount: null,
      subtotal: null,
      tax_amount: null,
      line_items: []
    }
  },
  {
    id: "SAMPLE-43",
    category: "negative_out_of_domain",
    description: "Software Git Commit Log & Stack Trace Crash Report",
    raw_text: `commit 8f3b140289a7e289c09bf837a2f58e47820194bc
Author: Alex Morgan <alex.m@dev.internal>
Date:   Wed Mar 13 14:22:18 2024 -0700

    fix(auth): handle null token payload during session teardown
    
    Resolves issue #4928 where logout calls would throw uncaught TypeError.
    Regression test added under tests/auth/session_test.py.

Exception in thread "main" java.lang.NullPointerException: Cannot read field "sessionId"
    at com.internal.service.AuthHandler.validate(AuthHandler.java:142)
    at com.internal.service.Dispatcher.process(Dispatcher.java:88)
    at com.internal.server.ServerRunner.main(ServerRunner.java:31)`,
    ground_truth: {
      is_valid_document: false,
      document_type: "unknown",
      invoice_number: null,
      vendor_name: null,
      vendor_tax_id: null,
      total_amount: null,
      subtotal: null,
      tax_amount: null,
      line_items: []
    }
  },
  {
    id: "SAMPLE-44",
    category: "negative_out_of_domain",
    description: "Casual Team Slack Chat Message Thread",
    raw_text: `[Channel: #random-watercooler]
Dave [11:14 AM]:
Hey everyone! Does anyone know if the parking garage elevator on the 3rd floor is working today?
I saw a maintenance cone outside when I pulled up around 8:30.

Priya [11:16 AM]:
It was still halted when I arrived at 9. The stairs are clear though! Also don't forget we have
the team trivia game starting at 4 PM in cafeteria B. Free donuts are promised!

Dave [11:17 AM]:
Awesome, thanks Priya! See you at 4.`,
    ground_truth: {
      is_valid_document: false,
      document_type: "unknown",
      invoice_number: null,
      vendor_name: null,
      vendor_tax_id: null,
      total_amount: null,
      subtotal: null,
      tax_amount: null,
      line_items: []
    }
  },
  {
    id: "SAMPLE-45",
    category: "negative_out_of_domain",
    description: "Medical Prescription Patient Directions & Dosage",
    raw_text: `RX LABEL INFORMATION - PATIENT DIRECTIVE
Prescribed for: Henderson, Michael
Prescriber: Dr. Robert Alvarez, MD (Lic # MD-882910)
Medication: Amoxicillin 500mg Oral Capsule
Quantity: 30 capsules | Refills remaining: 0

DIRECTIONS:
Take one (1) capsule by mouth three (3) times daily with a full glass of water,
approximately 8 hours apart. Complete full course of medication even if symptoms subside.
May take with food to minimize stomach upset.
Store at room temperature away from direct sunlight and moisture.
Keep out of reach of children.`,
    ground_truth: {
      is_valid_document: false,
      document_type: "unknown",
      invoice_number: null,
      vendor_name: null,
      vendor_tax_id: null,
      total_amount: null,
      subtotal: null,
      tax_amount: null,
      line_items: []
    }
  },
  {
    id: "SAMPLE-46",
    category: "negative_out_of_domain",
    description: "Poetry and Creative Prose Excerpt",
    raw_text: `The Autumn Wind Across the Meadow
By Eleanor Vance

The amber leaves drift slow upon the stream,
A silent mirror of a fading dream.
Through whispering pines the chilly breezes blow,
Announcing winter's approaching mantle of pure snow.

No clocks disturb the rhythm of the trees,
No commerce stirs within the twilight breeze.
Only the wandering hawk on wings so wide,
Watching the shadowed valley far beside.`,
    ground_truth: {
      is_valid_document: false,
      document_type: "unknown",
      invoice_number: null,
      vendor_name: null,
      vendor_tax_id: null,
      total_amount: null,
      subtotal: null,
      tax_amount: null,
      line_items: []
    }
  },
  {
    id: "SAMPLE-47",
    category: "negative_out_of_domain",
    description: "Legal Privacy Policy and Data Collection Notice",
    raw_text: `SECTION 4.2 - PRIVACY AND DATA RETENTION NOTICE
Last Updated: January 1, 2024

We collect device telemetry, IP addresses, and browser user-agent strings solely
to diagnostic security anomalies and optimize page delivery latency. We do not sell,
license, or monetize your personal identifying information to third-party advertisers.

You retain the explicit right under GDPR Article 17 and CCPA Section 1798.105 to request
the deletion of your account profile and associated activity telemetry. Requests must be
submitted through our verified account portal and are processed within 30 calendar days.`,
    ground_truth: {
      is_valid_document: false,
      document_type: "unknown",
      invoice_number: null,
      vendor_name: null,
      vendor_tax_id: null,
      total_amount: null,
      subtotal: null,
      tax_amount: null,
      line_items: []
    }
  },
  {
    id: "SAMPLE-48",
    category: "negative_out_of_domain",
    description: "Gym Workout Training Routine & Sets",
    raw_text: `DAY 2: UPPER BODY HYPERTROPHY ROUTINE
Target duration: 60 minutes | Warmup: 5 min foam rolling

1. Barbell Incline Bench Press
   - Warmup: 45 lbs x 15 reps, 95 lbs x 8 reps
   - Working sets: 3 sets of 8-10 reps at 165 lbs (RPE 8)
2. Seated Cable Rows (Neutral Grip)
   - 4 sets of 12 reps at 140 lbs (Focus on scapular retraction)
3. Dumbbell Lateral Raises
   - 3 sets of 15 reps with 20 lb dumbbells (Slow 3-second eccentric)
4. Triceps Overhead Rope Extension
   - 3 sets of 12-15 reps at 55 lbs
5. Cool down: Hamstring stretch and shoulder mobility band work.`,
    ground_truth: {
      is_valid_document: false,
      document_type: "unknown",
      invoice_number: null,
      vendor_name: null,
      vendor_tax_id: null,
      total_amount: null,
      subtotal: null,
      tax_amount: null,
      line_items: []
    }
  },
  {
    id: "SAMPLE-49",
    category: "negative_out_of_domain",
    description: "Wikipedia Encyclopedia Entry on Astrophysics (Neutron Stars)",
    raw_text: `A neutron star is the collapsed core of a massive supergiant star, which had a total
mass of between 10 and 25 solar masses, possibly more if the star was especially metal-rich.
Except for black holes, neutron stars are the smallest and densest known class of stellar objects.
Neutron stars have a radius on the order of 10 kilometers (6.2 mi) and a mass of about 1.4 solar masses.
They result from the supernova explosion of a massive star, combined with gravitational collapse,
that compresses the core past white dwarf star density to that of atomic nuclei. Once formed, they
no longer actively generate heat, and cool over astronomical timescales.`,
    ground_truth: {
      is_valid_document: false,
      document_type: "unknown",
      invoice_number: null,
      vendor_name: null,
      vendor_tax_id: null,
      total_amount: null,
      subtotal: null,
      tax_amount: null,
      line_items: []
    }
  },
  {
    id: "SAMPLE-50",
    category: "negative_out_of_domain",
    description: "Residential Apartment Lease Clause on Pet Rules",
    raw_text: `ARTICLE IX: PET RESTRICTIONS AND TENANT RESPONSIBILITIES
Premises: Unit 402, Oakwood Terrace Apartments

1. Domestic Pets: Tenant may keep not more than two (2) domestic cats or dogs, subject
to pre-approval by building management. Weight of any individual animal shall not exceed
50 pounds at full maturity.
2. Nuisance Noise: Pets must not create unreasonable disturbance or persistent noise that
infringes upon the quiet enjoyment of neighboring residents between the hours of 10:00 PM
and 7:00 AM.
3. Common Areas: All dogs must be maintained on a non-retractable leash not exceeding 6 feet
in length whenever traversing hallways, lobbies, courtyards, or parking lots.`,
    ground_truth: {
      is_valid_document: false,
      document_type: "unknown",
      invoice_number: null,
      vendor_name: null,
      vendor_tax_id: null,
      total_amount: null,
      subtotal: null,
      tax_amount: null,
      line_items: []
    }
  },
  {
    id: "SAMPLE-51",
    category: "negative_out_of_domain",
    description: "Commercial Airline Boarding Gate Pass (Non-financial passenger pass)",
    raw_text: `PASSENGER BOARDING CARD - SKYLINE AIRWAYS
PASSENGER: KAUFMAN / SARAH MS
FLIGHT: SA 442 | DATE: 22 MAY | ZONE: 3
FROM: NEW YORK (JFK) TERMINAL 4
TO: LONDON HEATHROW (LHR) TERMINAL 2
BOARDING TIME: 18:45 | DEPARTURE: 19:30
SEAT: 24B (WINDOW) | CLASS: ECONOMY
GATE: B28 (CLOSES 15 MINUTES PRIOR TO FLIGHT)
ELECTRONIC TICKET SEQUENCE: ET-0092184`,
    ground_truth: {
      is_valid_document: false,
      document_type: "unknown",
      invoice_number: null,
      vendor_name: null,
      vendor_tax_id: null,
      total_amount: null,
      subtotal: null,
      tax_amount: null,
      line_items: []
    }
  },
  {
    id: "SAMPLE-52",
    category: "negative_out_of_domain",
    description: "Customer Support IT Helpdesk Password Reset Ticket",
    raw_text: `HELPDESK TICKET #HD-90412
Submitted by: Jordan Taylor <jordan.t@corp.local>
Category: Account Access / MFA Reset
Status: Closed / Resolved
Priority: Normal

Issue Description:
"I got a new company mobile phone and need my Duo Mobile multi-factor authentication
seed transferred over so I can log in to the VPN and Jira from home."

Resolution Notes:
Verified user identity via secondary manager approval call. Generated one-time MFA bypass
code valid for 60 minutes. User successfully enrolled new device and confirmed active VPN session.`,
    ground_truth: {
      is_valid_document: false,
      document_type: "unknown",
      invoice_number: null,
      vendor_name: null,
      vendor_tax_id: null,
      total_amount: null,
      subtotal: null,
      tax_amount: null,
      line_items: []
    }
  }
];

module.exports = { BENCHMARK_SAMPLES };
