/**
 * SOEP Frontend Application Logic
 */

let currentTab = 'playground';
let currentBenchmarkData = null;
let currentExtractionResult = null;
let benchmarkSamplesList = [];

const PRESETS = {
  clean: `Amazon Web Services, Inc.
410 Terry Avenue North, Seattle, WA 98109
Tax ID: US-91-1234567

INVOICE: INV-AWS-2024-89012
Invoice Date: 2024-03-01
Due Date: 2024-03-31
Customer: Acme Cloud Corp

EC2 Compute Instance Standard - 720 hrs @ $0.100 = $72.00
S3 Standard Storage Bucket - 500 GB @ $0.020 = $10.00
AWS CloudFront Data Transfer - 100 GB @ $0.085 = $8.50

Subtotal: $90.50
Tax (10%): $9.05
Total Amount Due: $99.55 USD`,

  noisy: `B|STRO CAFE & GRILL
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

  international: `SIEMENS MOBILITY GMBH
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

  negative_recipe: `Grandma's Traditional Apple Pie Recipe
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
3. In a large bowl, toss apples with sugar, flour, and cinnamon.
4. Spoon apple mixture into pie pan. Dot top with butter cubes.
5. Bake for 45 to 50 minutes until golden brown.`,

  negative_weather: `NATIONAL WEATHER SERVICE BULLETIN
ISSUED: 06:00 AM EDT FRIDAY OCTOBER 18
ZONE FORECAST FOR THE GREATER METROPOLITAN AREA

TODAY: Partly cloudy skies in the morning becoming overcast by early afternoon.
High temperatures near 68°F (20°C). Winds from the south-southwest at 10 to 15 mph.
Chance of precipitation 20 percent.

TONIGHT: Rain showers developing after 9:00 PM. Overnight low of 52°F (11°C).
Barometric pressure steady at 30.12 inches of mercury. Relative humidity 88%.`,

  fault_test: `Matrix Electronics Supply
Tax ID: 94-8819203
Invoice: MAT-2024-3310
Date: 2024-02-14
Due: 2024-03-16
Microcontroller Board - 5 @ $14.25 = $71.25
Subtotal: $116.15
Tax (8%): $9.29
Total: $125.44 USD`,

  job_post: `Senior Backend Engineer
Company: Stripe, Inc.
Location: San Francisco, CA (Remote / Hybrid)
Employment Type: Full-time
Salary Range: $165,000 - $210,000 USD
Requirements:
- 5+ years of production experience in Go, Node.js, or Java
- Deep knowledge of distributed systems, SQL databases, and high-availability API design
- Experience building secure payment or financial ledgers
Contact: careers@stripe.com`,

  resume: `Elena Rostova
San Francisco, CA • elena.rostova@devmail.io • (415) 555-0192
Senior Full-Stack Software Engineer

SUMMARY:
Results-driven engineer with 6+ years of experience designing scalable web architectures,
distributed cloud APIs, and intuitive user experiences with React, TypeScript, and Node.js.

SKILLS:
TypeScript, React, Node.js, Python, PostgreSQL, Docker, AWS, GraphQL, Git

EXPERIENCE:
Staff Software Engineer — CloudStream Technologies (2021 - Present)
- Architected real-time streaming pipeline reducing p99 latency by 42%.
- Mentored a distributed team of 8 full-stack engineers.

EDUCATION:
B.S. in Computer Science — University of California, Berkeley (2018)`
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  setupEventListeners();
  loadPreset('clean');
  loadSchema();
  loadReviewQueue();
});

function setupEventListeners() {
  const textarea = document.getElementById('raw-input-text');
  textarea.addEventListener('input', () => {
    document.getElementById('char-count').innerText = `${textarea.value.length} chars`;
  });
}

// Tab Switching
function switchTab(tabId) {
  currentTab = tabId;
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

  const activeContent = document.getElementById(`tab-${tabId}`);
  const activeBtn = document.getElementById(`tab-btn-${tabId}`);
  if (activeContent) activeContent.classList.remove('hidden');
  if (activeBtn) activeBtn.classList.add('active');

  if (tabId === 'benchmark' && !currentBenchmarkData) {
    executeBenchmark();
  } else if (tabId === 'review') {
    loadReviewQueue();
  }

  lucide.createIcons();
}

// Preset Loader
function loadPreset(key) {
  const text = PRESETS[key] || '';
  const textarea = document.getElementById('raw-input-text');
  textarea.value = text;
  document.getElementById('char-count').innerText = `${text.length} chars`;

  const domainSelect = document.getElementById('domain-select');
  if (key === 'job_post') {
    if (domainSelect) domainSelect.value = 'job_post';
  } else if (key === 'resume') {
    if (domainSelect) domainSelect.value = 'resume';
  } else {
    if (domainSelect) domainSelect.value = 'invoice';
  }

  // If fault test, check simulate fault checkbox
  const faultCheck = document.getElementById('simulate-fault-check');
  if (key === 'fault_test') {
    faultCheck.checked = true;
  } else {
    faultCheck.checked = false;
  }
}

function onDomainChange() {
  const domain = document.getElementById('domain-select').value;
  if (domain === 'job_post') loadPreset('job_post');
  else if (domain === 'resume') loadPreset('resume');
  else loadPreset('clean');
}

function clearInput() {
  const textarea = document.getElementById('raw-input-text');
  textarea.value = '';
  document.getElementById('char-count').innerText = '0 chars';
}

// Execute Extraction Pipeline
async function executeExtraction() {
  const text = document.getElementById('raw-input-text').value.trim();
  if (!text) {
    alert("Please enter or select document text first.");
    return;
  }

  const domain = document.getElementById('domain-select') ? document.getElementById('domain-select').value : 'invoice';
  const maxRetries = parseInt(document.getElementById('max-retries-select').value, 10);
  const simulateFault = document.getElementById('simulate-fault-check').checked;
  const runBtn = document.getElementById('extract-run-btn');

  // UI state: Running
  runBtn.disabled = true;
  runBtn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Extracting...</span>`;
  lucide.createIcons();

  updateStepperStatus('PROCESSING', 'Running pipeline...');

  try {
    const response = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        domain,
        maxRetries,
        simulateFault
      })
    });

    const result = await response.json();
    currentExtractionResult = result;

    renderPipelineTrace(result);
    renderInspector(result);
    loadReviewQueue(); // Refresh badge in case item was routed
  } catch (err) {
    alert("Extraction error: " + err.message);
  } finally {
    runBtn.disabled = false;
    runBtn.innerHTML = `<i data-lucide="play" class="w-4 h-4 fill-current"></i><span>Extract & Validate</span>`;
    lucide.createIcons();
  }
}

function updateStepperStatus(status, label) {
  const badge = document.getElementById('pipeline-status-badge');
  badge.className = 'px-2.5 py-0.5 rounded-full text-xs font-semibold';

  if (status === 'VALIDATED') {
    badge.classList.add('bg-emerald-500/20', 'text-emerald-300', 'border', 'border-emerald-500/30');
    badge.innerText = 'Validated (Pass)';
  } else if (status === 'VALIDATED_ON_RETRY') {
    badge.classList.add('bg-amber-500/20', 'text-amber-300', 'border', 'border-amber-500/30');
    badge.innerText = 'Self-Healed on Retry';
  } else if (status === 'VALIDATED_NEGATIVE_REJECTED') {
    badge.classList.add('bg-violet-500/20', 'text-violet-300', 'border', 'border-violet-500/30');
    badge.innerText = 'Out-of-Domain Safely Rejected';
  } else if (status === 'ROUTED_TO_REVIEW') {
    badge.classList.add('bg-rose-500/20', 'text-rose-300', 'border', 'border-rose-500/30');
    badge.innerText = 'Routed to HITL Review';
  } else {
    badge.classList.add('bg-indigo-500/20', 'text-indigo-300');
    badge.innerText = label || status;
  }
}

function renderPipelineTrace(result) {
  const traceBox = document.getElementById('trace-log-container');
  traceBox.innerHTML = '';

  const nodes = {
    ingest: document.getElementById('step-node-ingest'),
    extract: document.getElementById('step-node-extract'),
    validate: document.getElementById('step-node-validate'),
    route: document.getElementById('step-node-route')
  };

  // Reset node classes
  Object.values(nodes).forEach(n => {
    n.className = 'step-card p-2 rounded-lg bg-slate-950 border border-slate-800';
  });

  nodes.ingest.classList.add('success');
  nodes.extract.classList.add('success');

  if (result.status === 'VALIDATED') {
    nodes.validate.classList.add('success');
    nodes.route.classList.add('success');
  } else if (result.status === 'VALIDATED_ON_RETRY') {
    nodes.validate.classList.add('retry');
    nodes.route.classList.add('success');
  } else if (result.status === 'VALIDATED_NEGATIVE_REJECTED') {
    nodes.validate.classList.add('success');
    nodes.route.classList.add('success');
  } else if (result.status === 'ROUTED_TO_REVIEW') {
    nodes.validate.classList.add('error');
    nodes.route.classList.add('error');
  }

  updateStepperStatus(result.status);

  // Render trace items
  result.executionTrace.forEach(step => {
    const item = document.createElement('div');
    item.className = 'flex items-start space-x-2 py-0.5';

    let color = 'text-slate-400';
    let icon = 'check-circle';

    if (step.step.includes('FAILED')) {
      color = 'text-rose-400';
      icon = 'alert-circle';
    } else if (step.step.includes('RETRY')) {
      color = 'text-amber-400';
      icon = 'refresh-cw';
    } else if (step.step.includes('ROUTED')) {
      color = 'text-amber-300 font-bold';
      icon = 'shield-alert';
    } else if (step.step.includes('NEGATIVE')) {
      color = 'text-violet-400';
      icon = 'shield';
    }

    item.innerHTML = `
      <span class="text-slate-500">[${step.timestamp.split('T')[1].slice(0, 8)}]</span>
      <span class="${color}"><strong>${step.step}:</strong> ${step.message}</span>
    `;

    if (step.errors && step.errors.length > 0) {
      const errList = document.createElement('div');
      errList.className = 'pl-16 text-rose-300 text-[10px] space-y-0.5';
      step.errors.forEach(e => {
        errList.innerHTML += `<div>&bull; Field <strong>${e.field}</strong>: ${e.message}</div>`;
      });
      item.appendChild(errList);
    }

    traceBox.appendChild(item);
  });

  traceBox.scrollTop = traceBox.scrollHeight;
}

function renderInspector(result) {
  const structuredView = document.getElementById('inspector-structured-view');
  const jsonCode = document.getElementById('raw-json-code');
  const data = result.data || {};

  jsonCode.innerText = JSON.stringify(result, null, 2);

  if (result.status === 'VALIDATED_NEGATIVE_REJECTED') {
    structuredView.innerHTML = `
      <div class="p-4 rounded-xl bg-violet-950/30 border border-violet-800/40 text-violet-200 space-y-2">
        <div class="flex items-center space-x-2 font-bold text-sm">
          <i data-lucide="shield-check" class="w-5 h-5 text-violet-400"></i>
          <span>Document Successfully Classified as Out-of-Domain</span>
        </div>
        <p class="text-xs text-violet-300 leading-relaxed">
          The pipeline recognized that this document contains <strong>none of the target financial fields</strong> (recipe, article, weather, etc.).
          Target fields were safely held null, ensuring zero false-positive hallucinations.
        </p>
        <div class="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-violet-800/40 text-[11px] font-mono">
          <div>is_valid_document: <strong class="text-rose-400">false</strong></div>
          <div>document_type: <strong>"unknown"</strong></div>
          <div>total_amount: <strong class="text-slate-400">null</strong></div>
          <div>invoice_number: <strong class="text-slate-400">null</strong></div>
        </div>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  // Format Job Post domain
  if (result.domain === 'job_post') {
    structuredView.innerHTML = `
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div class="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
          <span class="text-slate-500 block text-[10px] uppercase font-mono">Job Title</span>
          <span class="font-bold text-white">${data.job_title || 'N/A'}</span>
        </div>
        <div class="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
          <span class="text-slate-500 block text-[10px] uppercase font-mono">Company</span>
          <span class="font-bold text-white">${data.company_name || 'N/A'}</span>
        </div>
        <div class="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
          <span class="text-slate-500 block text-[10px] uppercase font-mono">Workplace / Type</span>
          <span class="font-bold text-white uppercase">${data.workplace_type} (${data.employment_type})</span>
        </div>
        <div class="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
          <span class="text-slate-500 block text-[10px] uppercase font-mono">Salary Range</span>
          <span class="font-bold text-emerald-400 font-mono">${data.salary_min ? '$' + Number(data.salary_min).toLocaleString() + ' - $' + Number(data.salary_max).toLocaleString() : 'Not Disclosed'}</span>
        </div>
      </div>
      <div class="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2 text-xs">
        <span class="text-slate-400 block text-[10px] uppercase font-mono">Identified Technical Skills:</span>
        <div class="flex flex-wrap gap-1.5">
          ${(data.required_skills || []).map(s => `<span class="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[11px] font-mono">${s}</span>`).join('')}
        </div>
        <div class="text-[11px] text-slate-400 pt-1 font-mono">Contact: <strong class="text-slate-200">${data.contact_email || 'N/A'}</strong> &bull; Experience: <strong class="text-slate-200">${data.experience_years || 0}+ years</strong></div>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  // Format Resume domain
  if (result.domain === 'resume') {
    structuredView.innerHTML = `
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div class="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
          <span class="text-slate-500 block text-[10px] uppercase font-mono">Candidate Name</span>
          <span class="font-bold text-white">${data.full_name || 'N/A'}</span>
        </div>
        <div class="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
          <span class="text-slate-500 block text-[10px] uppercase font-mono">Current Title</span>
          <span class="font-bold text-white truncate block">${data.current_title || 'N/A'}</span>
        </div>
        <div class="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
          <span class="text-slate-500 block text-[10px] uppercase font-mono">Email Contact</span>
          <span class="font-bold text-white font-mono truncate block">${data.email || 'N/A'}</span>
        </div>
        <div class="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
          <span class="text-slate-500 block text-[10px] uppercase font-mono">Total Experience</span>
          <span class="font-bold text-indigo-400 font-mono">${data.total_experience_years || 0} Years</span>
        </div>
      </div>
      <div class="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2 text-xs">
        <span class="text-slate-400 block text-[10px] uppercase font-mono">Skills Portfolio:</span>
        <div class="flex flex-wrap gap-1.5">
          ${(data.skills || []).map(s => `<span class="px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20 text-[11px] font-mono">${s}</span>`).join('')}
        </div>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  // Format valid / review invoice extraction
  const itemsHtml = (data.line_items || []).map(item => `
    <tr class="border-b border-slate-800/50">
      <td class="py-2 text-slate-300">${item.description}</td>
      <td class="py-2 text-right text-slate-400">${item.quantity}</td>
      <td class="py-2 text-right text-slate-400">${data.currency || '$'}${item.unit_price}</td>
      <td class="py-2 text-right font-bold text-slate-200">${data.currency || '$'}${item.amount}</td>
    </tr>
  `).join('');

  structuredView.innerHTML = `
    <!-- Top Meta Row -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
      <div class="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
        <span class="text-slate-500 block text-[10px] uppercase font-mono">Invoice Number</span>
        <span class="font-bold text-white font-mono">${data.invoice_number || 'N/A'}</span>
      </div>
      <div class="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
        <span class="text-slate-500 block text-[10px] uppercase font-mono">Vendor Name</span>
        <span class="font-bold text-white truncate block">${data.vendor_name || 'N/A'}</span>
      </div>
      <div class="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
        <span class="text-slate-500 block text-[10px] uppercase font-mono">Invoice Date</span>
        <span class="font-bold text-white font-mono">${data.invoice_date || 'N/A'}</span>
      </div>
      <div class="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
        <span class="text-slate-500 block text-[10px] uppercase font-mono">Due Date</span>
        <span class="font-bold text-white font-mono">${data.due_date || 'N/A'}</span>
      </div>
    </div>

    <!-- Line Items Table -->
    ${(data.line_items && data.line_items.length > 0) ? `
      <div class="rounded-lg border border-slate-800 overflow-hidden text-xs">
        <table class="w-full text-left">
          <thead class="bg-slate-850 text-slate-400 text-[10px] uppercase font-mono">
            <tr>
              <th class="p-2">Description</th>
              <th class="p-2 text-right">Qty</th>
              <th class="p-2 text-right">Unit Rate</th>
              <th class="p-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800 bg-slate-950">
            ${itemsHtml}
          </tbody>
        </table>
      </div>
    ` : ''}

    <!-- Financial Totals Block -->
    <div class="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-end">
      <div class="space-y-1 text-xs w-48 font-mono">
        <div class="flex justify-between text-slate-400">
          <span>Subtotal:</span>
          <span>${data.currency || 'USD'} ${data.subtotal !== null && data.subtotal !== undefined ? Number(data.subtotal).toFixed(2) : '0.00'}</span>
        </div>
        <div class="flex justify-between text-slate-400">
          <span>Tax (${data.tax_rate ? data.tax_rate + '%' : 'Calculated'}):</span>
          <span>${data.currency || 'USD'} ${data.tax_amount !== null && data.tax_amount !== undefined ? Number(data.tax_amount).toFixed(2) : '0.00'}</span>
        </div>
        <div class="flex justify-between text-sm font-bold text-emerald-400 pt-1 border-t border-slate-800">
          <span>Total Amount:</span>
          <span>${data.currency || 'USD'} ${data.total_amount !== null && data.total_amount !== undefined ? Number(data.total_amount).toFixed(2) : '0.00'}</span>
        </div>
      </div>
    </div>
  `;

  lucide.createIcons();
}

function setInspectorView(view) {
  const structured = document.getElementById('inspector-structured-view');
  const json = document.getElementById('inspector-json-view');
  const btnStruct = document.getElementById('btn-view-structured');
  const btnJson = document.getElementById('btn-view-json');

  if (view === 'structured') {
    structured.classList.remove('hidden');
    json.classList.add('hidden');
    btnStruct.className = 'text-xs font-bold text-indigo-400 border-b-2 border-indigo-500 pb-1';
    btnJson.className = 'text-xs font-medium text-slate-400 hover:text-slate-200 pb-1';
  } else {
    structured.classList.add('hidden');
    json.classList.remove('hidden');
    btnJson.className = 'text-xs font-bold text-indigo-400 border-b-2 border-indigo-500 pb-1';
    btnStruct.className = 'text-xs font-medium text-slate-400 hover:text-slate-200 pb-1';
  }
}

function copyOutputJson() {
  const jsonCode = document.getElementById('raw-json-code').innerText;
  if (!jsonCode) return;
  navigator.clipboard.writeText(jsonCode).then(() => {
    alert("JSON output copied to clipboard!");
  });
}

// ========================================================
// BENCHMARK EXECUTION (50+ SAMPLES)
// ========================================================
async function executeBenchmark() {
  const runBtn = document.getElementById('run-benchmark-btn');
  runBtn.disabled = true;
  runBtn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Assessing 52 Samples...</span>`;
  lucide.createIcons();

  try {
    const response = await fetch('/api/benchmark');
    const report = await response.json();
    currentBenchmarkData = report;
    benchmarkSamplesList = report.sampleEvaluations;

    // Populate Top Metric Cards
    document.getElementById('metric-accuracy').innerText = `${report.summary.overallAccuracy}%`;
    document.getElementById('metric-compliance').innerText = `${report.summary.schemaComplianceRate}%`;
    document.getElementById('metric-first-try').innerText = `${report.summary.firstTryPassRate}%`;
    document.getElementById('metric-retried').innerText = report.summary.retryHealingCount;
    document.getElementById('metric-routed').innerText = report.summary.routedToReviewCount;
    document.getElementById('metric-negative').innerText = `${report.summary.negativeHandlingAccuracy}%`;

    // Populate Field Accuracy Breakdown
    const grid = document.getElementById('field-accuracy-grid');
    grid.innerHTML = '';

    for (const [field, acc] of Object.entries(report.fieldAccuracy)) {
      const card = document.createElement('div');
      card.className = 'p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5';
      card.innerHTML = `
        <div class="flex justify-between text-xs font-mono">
          <span class="text-slate-400 truncate">${field}</span>
          <span class="font-bold ${acc >= 90 ? 'text-emerald-400' : 'text-amber-400'}">${acc}%</span>
        </div>
        <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div class="h-full ${acc >= 90 ? 'bg-emerald-500' : 'bg-amber-500'} rounded-full" style="width: ${acc}%"></div>
        </div>
      `;
      grid.appendChild(card);
    }

    renderBenchmarkTable(report.sampleEvaluations);
  } catch (err) {
    alert("Benchmark execution failed: " + err.message);
  } finally {
    runBtn.disabled = false;
    runBtn.innerHTML = `<i data-lucide="play-circle" class="w-5 h-5"></i><span>Re-Run 52-Sample Benchmark</span>`;
    lucide.createIcons();
  }
}

function renderBenchmarkTable(samples) {
  const tbody = document.getElementById('benchmark-table-body');
  tbody.innerHTML = '';

  samples.forEach(sample => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-850/60 transition';

    let badgeClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    let badgeText = 'Validated (Pass)';

    if (sample.status === 'VALIDATED_ON_RETRY') {
      badgeClass = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      badgeText = 'Healed on Retry';
    } else if (sample.status === 'VALIDATED_NEGATIVE_REJECTED') {
      badgeClass = 'bg-violet-500/10 text-violet-400 border border-violet-500/20';
      badgeText = 'Negative Rejected';
    } else if (sample.status === 'ROUTED_TO_REVIEW') {
      badgeClass = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      badgeText = 'Routed to Review';
    }

    tr.innerHTML = `
      <td class="p-3 font-bold text-white">${sample.sampleId}</td>
      <td class="p-3">
        <span class="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-sans">${sample.category}</span>
      </td>
      <td class="p-3 text-slate-300 truncate max-w-[200px] font-sans" title="${sample.description}">${sample.description}</td>
      <td class="p-3">
        <span class="font-bold ${sample.sampleAccuracy >= 90 ? 'text-emerald-400' : 'text-amber-400'}">${sample.sampleAccuracy}%</span>
      </td>
      <td class="p-3 text-slate-400">${sample.attempts}</td>
      <td class="p-3">
        <span class="px-2 py-0.5 rounded-full text-[10px] font-medium font-sans ${badgeClass}">${badgeText}</span>
      </td>
      <td class="p-3 text-right">
        <button onclick="inspectSampleModal('${sample.sampleId}')" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-sans transition">
          Inspect Diff
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function filterBenchmarkTable() {
  const filter = document.getElementById('benchmark-filter-category').value;
  if (!benchmarkSamplesList) return;

  if (filter === 'ALL') {
    renderBenchmarkTable(benchmarkSamplesList);
  } else {
    const filtered = benchmarkSamplesList.filter(s => s.category === filter);
    renderBenchmarkTable(filtered);
  }
}

// Sample Inspection Modal
function inspectSampleModal(sampleId) {
  const sample = benchmarkSamplesList.find(s => s.sampleId === sampleId);
  if (!sample) return;

  document.getElementById('modal-sample-title').innerText = `${sample.sampleId}: ${sample.description}`;
  document.getElementById('modal-sample-subtitle').innerText = `Category: ${sample.category} • Duration: ${sample.durationMs}ms • Attempts: ${sample.attempts}`;
  
  const statusBadge = document.getElementById('modal-status-badge');
  statusBadge.innerText = sample.status;
  statusBadge.className = 'px-2 py-0.5 rounded font-mono font-bold ' + 
    (sample.status.startsWith('VALIDATED') ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300');

  document.getElementById('modal-accuracy-badge').innerText = `${sample.sampleAccuracy}%`;

  const diffBody = document.getElementById('modal-diff-body');
  diffBody.innerHTML = '';

  for (const [field, match] of Object.entries(sample.fieldMatches)) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="p-2 font-bold text-slate-300">${field}</td>
      <td class="p-2 text-slate-400">${match.expected !== null && match.expected !== undefined ? match.expected : '<em class="text-slate-600">null</em>'}</td>
      <td class="p-2 ${match.match ? 'text-emerald-400' : 'text-rose-400 font-bold'}">${match.actual !== null && match.actual !== undefined ? match.actual : '<em class="text-slate-600">null</em>'}</td>
      <td class="p-2 text-center">
        ${match.match 
          ? '<span class="text-emerald-400">✓ MATCH</span>' 
          : '<span class="text-rose-400 font-bold">✗ DIFF</span>'}
      </td>
    `;
    diffBody.appendChild(tr);
  }

  // Fetch or display raw text
  document.getElementById('modal-raw-text').innerText = sample.rawTextPreview;

  document.getElementById('sample-modal').classList.remove('hidden');
  lucide.createIcons();
}

function closeSampleModal() {
  document.getElementById('sample-modal').classList.add('hidden');
}

// ========================================================
// HUMAN-IN-THE-LOOP REVIEW QUEUE
// ========================================================
async function loadReviewQueue() {
  try {
    const response = await fetch('/api/review-queue');
    const { items, stats } = await response.json();

    document.getElementById('review-count-badge').innerText = stats.pending;

    const container = document.getElementById('review-queue-content');
    if (!items || items.length === 0) {
      container.innerHTML = `
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
          <i data-lucide="check-circle-2" class="w-10 h-10 mx-auto mb-2 text-emerald-500 opacity-60"></i>
          <p class="font-semibold text-slate-300">Review Queue is Clean</p>
          <p class="text-xs text-slate-500 mt-1">All extracted documents satisfied the schema constraints or were resolved.</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    container.innerHTML = '';
    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4';

      let statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 font-mono">${item.status}</span>`;
      if (item.status === 'APPROVED' || item.status === 'EDITED_AND_APPROVED') {
        statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 font-mono">RESOLVED: APPROVED</span>`;
      } else if (item.status === 'REJECTED') {
        statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 font-mono">RESOLVED: REJECTED</span>`;
      }

      const errorsHtml = (item.validationErrors || []).map(e => `
        <div class="text-xs text-rose-300 font-mono">&bull; <strong>${e.field}</strong>: ${e.message}</div>
      `).join('');

      card.innerHTML = `
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div class="flex items-center space-x-3">
            <span class="font-bold text-white font-mono">${item.id}</span>
            <span class="text-xs text-slate-500 font-mono">Doc: ${item.documentId}</span>
            ${statusBadge}
          </div>
          <span class="text-xs text-slate-500 font-mono">${item.createdAt.split('T')[0]}</span>
        </div>

        <!-- Failure Reason Banner -->
        <div class="p-3 rounded-lg bg-rose-950/20 border border-rose-800/40 space-y-1">
          <div class="text-xs font-bold text-rose-300 font-mono">Schema Validation Violations:</div>
          ${errorsHtml}
        </div>

        <!-- Side-by-side: Raw text vs editable candidate -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <span class="text-xs font-mono text-slate-400 block mb-1">Original Unstructured Text</span>
            <pre class="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 max-h-48 overflow-y-auto whitespace-pre-wrap">${item.rawText}</pre>
          </div>

          <div>
            <span class="text-xs font-mono text-slate-400 block mb-1">Human-in-the-Loop Field Editor</span>
            <div class="space-y-2 p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono">
              <div class="flex items-center justify-between">
                <label class="text-slate-400">Total Amount:</label>
                <input type="number" step="0.01" id="edit-total-${item.id}" value="${item.extractedData?.total_amount || 0}" class="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono w-32 text-right">
              </div>
              <div class="flex items-center justify-between">
                <label class="text-slate-400">Vendor Name:</label>
                <input type="text" id="edit-vendor-${item.id}" value="${item.extractedData?.vendor_name || ''}" class="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono w-48">
              </div>
              <div class="flex items-center justify-between">
                <label class="text-slate-400">Invoice Number:</label>
                <input type="text" id="edit-inv-${item.id}" value="${item.extractedData?.invoice_number || ''}" class="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono w-48">
              </div>
              <div class="flex items-center justify-between">
                <label class="text-slate-400">Invoice Date (YYYY-MM-DD):</label>
                <input type="text" id="edit-date-${item.id}" value="${item.extractedData?.invoice_date || '2024-01-01'}" class="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono w-36">
              </div>
            </div>
          </div>
        </div>

        ${item.status === 'PENDING_REVIEW' ? `
          <div class="flex justify-end space-x-3 pt-2">
            <button onclick="resolveReview('${item.id}', 'REJECT')" class="px-4 py-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 text-rose-300 font-semibold text-xs transition">
              Reject Document
            </button>
            <button onclick="resolveReview('${item.id}', 'EDIT_AND_APPROVE')" class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 transition">
              Approve with Edits
            </button>
          </div>
        ` : `
          <div class="text-xs text-slate-500 font-mono pt-1">
            Resolved at ${item.resolvedAt} • Notes: ${item.reviewerNotes || 'Approved by human reviewer.'}
          </div>
        `}
      `;

      container.appendChild(card);
    });

    lucide.createIcons();
  } catch (err) {
    console.error("Error loading review queue:", err);
  }
}

async function resolveReview(itemId, action) {
  let updatedData = null;

  if (action === 'EDIT_AND_APPROVE') {
    const total = parseFloat(document.getElementById(`edit-total-${itemId}`)?.value || 0);
    const vendor = document.getElementById(`edit-vendor-${itemId}`)?.value || '';
    const inv = document.getElementById(`edit-inv-${itemId}`)?.value || '';
    const date = document.getElementById(`edit-date-${itemId}`)?.value || '';

    updatedData = {
      is_valid_document: true,
      document_type: 'invoice',
      invoice_number: inv,
      vendor_name: vendor,
      invoice_date: date,
      total_amount: total,
      confidence_score: 1.0
    };
  }

  try {
    const response = await fetch(`/api/review-queue/${itemId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        updatedData,
        notes: action === 'EDIT_AND_APPROVE' ? "Manually verified & corrected by reviewer." : "Rejected invalid invoice."
      })
    });

    if (response.ok) {
      alert(`Item ${itemId} ${action === 'REJECT' ? 'Rejected' : 'Approved'} successfully.`);
      loadReviewQueue();
    }
  } catch (err) {
    alert("Resolution error: " + err.message);
  }
}

// Load Schema Viewer
async function loadSchema() {
  try {
    const response = await fetch('/api/schemas');
    const data = await response.json();
    const code = document.getElementById('schema-viewer-code');
    if (code) {
      code.innerText = JSON.stringify(data.invoice.jsonSchema, null, 2);
    }
  } catch (err) {
    console.error("Schema load error:", err);
  }
}

// Export Benchmark Results as JSON File
function exportBenchmarkJson() {
  if (!currentBenchmarkData) {
    alert("Please run the benchmark first.");
    return;
  }
  const blob = new Blob([JSON.stringify(currentBenchmarkData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `soep-benchmark-report-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
