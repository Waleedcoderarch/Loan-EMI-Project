
// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════
let banks = [];
let amortData = [];
let amortView = 'monthly';
let pieChartInst = null, lineChartInst = null, barChartInst = null, prepChartInst = null;
let currentResult = null;
let isCalculated = false;

const PRESETS = {
  home:      { amount: 5000000, rate: 8.50, tenure: 20 },
  car:       { amount: 800000,  rate: 9.15, tenure: 5  },
  education: { amount: 1500000, rate: 9.50, tenure: 7  },
  personal:  { amount: 300000,  rate: 12.0, tenure: 3  },
};

const DEFAULT_BANKS = [
  { name:'SBI',            rate:8.40, color:'#22577a' },
  { name:'Bank of Baroda', rate:8.45, color:'#f77f00' },
  { name:'HDFC Bank',      rate:8.75, color:'#004c8c' },
  { name:'ICICI Bank',     rate:8.75, color:'#d7263d' },
  { name:'Axis Bank',      rate:8.75, color:'#7400b8' },
  { name:'Kotak Mahindra', rate:8.65, color:'#e63946' },
  { name:'PNB',            rate:8.50, color:'#264653' },
  { name:'Canara Bank',    rate:8.55, color:'#2a9d8f' },
];

// ═══════════════════════════════════════════════════════════════
// CORE EMI FORMULA
// ═══════════════════════════════════════════════════════════════
function calcEMI(P, r, n) {
  if (r === 0) return P / n;
  const monthly_r = r / 12 / 100;
  return P * monthly_r * Math.pow(1 + monthly_r, n) / (Math.pow(1 + monthly_r, n) - 1);
}

function generateAmortization(P, annualRate, months) {
  const r = annualRate / 12 / 100;
  const emi = calcEMI(P, annualRate, months);
  let balance = P;
  const rows = [];
  for (let i = 1; i <= months; i++) {
    const interest = balance * r;
    const principal = emi - interest;
    balance = Math.max(0, balance - principal);
    rows.push({ month: i, emi, principal, interest, balance });
  }
  return rows;
}

// ═══════════════════════════════════════════════════════════════
// RECALCULATE
// ═══════════════════════════════════════════════════════════════
function recalculate() {
  const P = parseFloat(document.getElementById('principal').value) || 0;
  const rate = parseFloat(document.getElementById('rate').value) || 0;
  const yrs = parseFloat(document.getElementById('tenure').value) || 0;
  const n = Math.round(yrs * 12);
  const curr = document.getElementById('currencySelect').value;

  updateDisplays();

  if (!P || !rate || !n) return;

  const emi = calcEMI(P, rate, n);
  const totalPay = emi * n;
  const totalInt = totalPay - P;
  const ratio = (totalInt / totalPay * 100).toFixed(1);

  currentResult = { P, rate, n, emi, totalPay, totalInt, ratio, curr };
  isCalculated = true;

  // EMI Display
  const emiEl = document.getElementById('emiAmount');
  emiEl.textContent = fmt(curr, emi);
  document.querySelector('.emi-display .emi-sub').textContent =
    `for ${yrs} year${yrs===1?'':'s'} | ${fmt(curr, totalInt)} total interest`;

  // Metric cards
  document.getElementById('m-emi').textContent = fmt(curr, emi);
  document.getElementById('m-interest').textContent = fmtCrore(curr, totalInt);
  document.getElementById('m-total').textContent = fmtCrore(curr, totalPay);
  document.getElementById('m-ratio').textContent = ratio + '%';

  // Progress
  document.getElementById('ratioProg').style.width = Math.min(ratio, 100) + '%';
  document.getElementById('ratioLabel').textContent = ratio + '%';

  // Insight
  generateInsight(curr, P, emi, totalInt, rate, yrs, ratio);

  // Amortization
  amortData = generateAmortization(P, rate, n);
  renderAmortTable();

  // Charts
  renderPieChart(P, totalInt);
  renderLineChart(amortData, curr);

  // Bank comparison
  renderBankList();

  // Update prepayment displays
  document.getElementById('prepCurrSymbol').textContent = curr;
  document.getElementById('prepMonth').max = n;
  if (isCalculated) calcPrepayment();
}

// ═══════════════════════════════════════════════════════════════
// FORMATTING HELPERS
// ═══════════════════════════════════════════════════════════════
function fmt(curr, val) {
  if (curr === '₹') {
    return curr + Math.round(val).toLocaleString('en-IN');
  }
  return curr + Math.round(val).toLocaleString('en-US');
}

function fmtCrore(curr, val) {
  if (curr === '₹') {
    if (val >= 10000000) return curr + (val/10000000).toFixed(2) + ' Cr';
    if (val >= 100000)   return curr + (val/100000).toFixed(2) + ' L';
    return curr + Math.round(val).toLocaleString('en-IN');
  }
  if (val >= 1000000) return curr + (val/1000000).toFixed(2) + 'M';
  if (val >= 1000)    return curr + (val/1000).toFixed(1) + 'K';
  return curr + Math.round(val).toLocaleString();
}

// ═══════════════════════════════════════════════════════════════
// SLIDER SYNC
// ═══════════════════════════════════════════════════════════════
function syncSlider(inputId, sliderId) {
  const v = document.getElementById(inputId).value;
  document.getElementById(sliderId).value = v;
  updateDisplays();
}
function syncInput(sliderId, inputId) {
  const v = document.getElementById(sliderId).value;
  document.getElementById(inputId).value = v;
  updateDisplays();
}
function updateDisplays() {
  const curr = document.getElementById('currencySelect').value;
  const P = parseFloat(document.getElementById('principal').value) || 0;
  const r = parseFloat(document.getElementById('rate').value) || 0;
  const t = parseFloat(document.getElementById('tenure').value) || 0;

  document.getElementById('currSymbol').textContent = curr;
  document.getElementById('prepCurrSymbol').textContent = curr;

  // Format principal nicely
  let pDisp;
  if (curr === '₹') {
    if (P >= 10000000) pDisp = curr + (P/10000000).toFixed(1) + ' Cr';
    else if (P >= 100000) pDisp = curr + (P/100000).toFixed(0) + ' L';
    else pDisp = curr + P.toLocaleString('en-IN');
  } else {
    if (P >= 1000000) pDisp = curr + (P/1000000).toFixed(1) + 'M';
    else if (P >= 1000) pDisp = curr + (P/1000).toFixed(0) + 'K';
    else pDisp = curr + P;
  }
  document.getElementById('principalDisplay').textContent = pDisp;
  document.getElementById('rateDisplay').textContent = r.toFixed(1) + '%';
  document.getElementById('tenureDisplay').textContent = t + ' yr' + (t===1?'':'s');
}

// ═══════════════════════════════════════════════════════════════
// PRESETS
// ═══════════════════════════════════════════════════════════════
function setPreset(type) {
  const p = PRESETS[type];
  document.getElementById('principal').value = p.amount;
  document.getElementById('principalSlider').value = p.amount;
  document.getElementById('rate').value = p.rate;
  document.getElementById('rateSlider').value = p.rate;
  document.getElementById('tenure').value = p.tenure;
  document.getElementById('tenureSlider').value = p.tenure;

  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('preset-' + type).classList.add('active');

  recalculate();
}

// ═══════════════════════════════════════════════════════════════
// INSIGHT
// ═══════════════════════════════════════════════════════════════
function generateInsight(curr, P, emi, totalInt, rate, yrs, ratio) {
  let msg = '';
  const intRatio = parseFloat(ratio);

  if (intRatio > 60) {
    msg = `You're paying <strong>${fmtCrore(curr, totalInt)}</strong> as interest — <strong>${ratio}%</strong> of your total payment! Consider increasing your down payment or reducing the tenure to cut this significantly.`;
  } else if (intRatio > 40) {
    msg = `Your interest burden is moderate at <strong>${ratio}%</strong>. Making a lump-sum prepayment in the first 2 years could save you <strong>${fmtCrore(curr, totalInt * 0.15)}</strong> or more.`;
  } else if (rate > 12) {
    msg = `Your interest rate of <strong>${rate}%</strong> is on the higher side. Compare with other banks above — even a 0.5% reduction can save you <strong>${fmtCrore(curr, calcEMI(P, rate, yrs*12)*yrs*12 - calcEMI(P, rate-0.5, yrs*12)*yrs*12)}</strong>.`;
  } else {
    msg = `Great rate at <strong>${rate}%</strong>! Your EMI-to-loan ratio is healthy. Staying consistent with payments will build credit and save you from penalties.`;
  }

  document.getElementById('insightText').innerHTML = msg;
}

// ═══════════════════════════════════════════════════════════════
// BANK COMPARISON
// ═══════════════════════════════════════════════════════════════
function loadDefaultBanks() {
  banks = DEFAULT_BANKS.map(b => ({ ...b }));
  renderBankList();
  toast('✓ 8 Indian banks loaded', 'success');
}

function openAddBankModal() {
  document.getElementById('newBankName').value = '';
  document.getElementById('newBankRate').value = '';
  document.getElementById('bankPreview').style.display = 'none';
  document.getElementById('addBankModal').classList.add('open');
  setTimeout(() => document.getElementById('newBankName').focus(), 100);
}

function closeModal() {
  document.getElementById('addBankModal').classList.remove('open');
}

function updateBankPreview() {
  const r = parseFloat(document.getElementById('newBankRate').value);
  const name = document.getElementById('newBankName').value;
  if (!r || !currentResult) { document.getElementById('bankPreview').style.display = 'none'; return; }
  const emi = calcEMI(currentResult.P, r, currentResult.n);
  const total = emi * currentResult.n;
  const interest = total - currentResult.P;
  document.getElementById('bankPreview').style.display = 'block';
  document.getElementById('bankPreviewEmi').textContent = fmt(currentResult.curr, emi) + '/mo';
  document.getElementById('bankPreviewTotal').textContent = 'Total interest: ' + fmtCrore(currentResult.curr, interest);
}

function addBank() {
  const name = document.getElementById('newBankName').value.trim();
  const rate = parseFloat(document.getElementById('newBankRate').value);
  if (!name) { toast('Please enter a bank name', 'error'); return; }
  if (!rate || rate < 0.1 || rate > 36) { toast('Enter a valid rate (0.1–36%)', 'error'); return; }
  const colors = ['#4361ee','#ef4444','#10b981','#f59e0b','#8b5cf6','#06b6d4','#f97316','#84cc16'];
  banks.push({ name, rate, color: colors[banks.length % colors.length] });
  renderBankList();
  closeModal();
  toast(`✓ ${name} added`, 'success');
}

function removeBank(i) {
  banks.splice(i, 1);
  renderBankList();
}

function renderBankList() {
  const listEl = document.getElementById('bankList');
  const tableBody = document.getElementById('bankTableBody');
  const compTable = document.getElementById('comparisonTable');
  const compEmpty = document.getElementById('comparisonEmpty');

  if (!banks.length || !currentResult) {
    listEl.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text3);font-size:13px">No banks added yet.</div>';
    compTable.style.display = 'none';
    compEmpty.style.display = 'block';
    return;
  }

  // Compute EMIs for all banks
  const { P, n, curr, totalPay: baseTotal } = currentResult;
  const results = banks.map(b => {
    const emi = calcEMI(P, b.rate, n);
    const total = emi * n;
    const interest = total - P;
    return { ...b, emi, total, interest };
  });

  // Sort by interest (ascending)
  results.sort((a, b) => a.interest - b.interest);
  const bestInterest = results[0].interest;
  const worstInterest = results[results.length - 1].interest;

  // LEFT PANEL: bank cards
  listEl.innerHTML = results.map((b, i) => {
    const isBest = i === 0;
    const saving = b.interest - bestInterest;
    return `
      <div class="bank-item ${isBest ? 'best' : ''}">
        <div class="bank-logo" style="background:${b.color}">${b.name.charAt(0)}</div>
        <div class="bank-info">
          <div class="bank-name">${b.name} ${isBest ? '<span class="best-badge">Best</span>' : ''}</div>
          <div class="bank-rate">${b.rate.toFixed(2)}% per annum</div>
        </div>
        <div style="text-align:right">
          <div class="bank-emi">${fmt(curr, b.emi)}</div>
          <div class="bank-total">${fmtCrore(curr, b.interest)} interest</div>
          ${saving > 0 ? `<div style="font-size:11px;color:var(--red)">+${fmtCrore(curr, saving)} more</div>` : ''}
        </div>
        <button class="btn btn-icon btn-danger" onclick="removeBank(${banks.indexOf(banks.find(x=>x.name===b.name))})" title="Remove">&times;</button>
      </div>`;
  }).join('');

  // RIGHT PANEL: comparison table
  tableBody.innerHTML = results.map((b, i) => {
    const isBest = i === 0;
    const diff = b.interest - bestInterest;
    return `
      <tr class="${isBest ? 'best-row' : ''}">
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <div class="bank-logo" style="width:28px;height:28px;font-size:12px;background:${b.color}">${b.name.charAt(0)}</div>
            ${b.name} ${isBest ? '<span class="save-tag">Best</span>' : ''}
          </div>
        </td>
        <td>${b.rate.toFixed(2)}%</td>
        <td class="td-right" style="font-weight:700">${fmt(curr, b.emi)}</td>
        <td class="td-right" style="color:${isBest?'var(--green)':'var(--red)'}">${fmtCrore(curr, b.interest)}</td>
        <td class="td-right">${fmtCrore(curr, b.total)}</td>
        <td class="td-center">
          ${diff === 0 ? `<span class="badge badge-green">Best</span>` : `<span class="badge badge-red">+${fmtCrore(curr, diff)}</span>`}
        </td>
        <td><button class="btn btn-sm btn-danger" onclick="removeBank(${banks.indexOf(banks.find(x=>x.name===b.name))})">✕</button></td>
      </tr>`;
  }).join('');

  compTable.style.display = 'block';
  compEmpty.style.display = 'none';

  // Bar chart
  renderBarChart(results, curr);
}

// ═══════════════════════════════════════════════════════════════
// AMORTIZATION
// ═══════════════════════════════════════════════════════════════
function setAmortView(view, btn) {
  amortView = view;
  document.querySelectorAll('#tab-amortization .btn-sm').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderAmortTable();
}

function renderAmortTable() {
  if (!amortData.length || !currentResult) return;
  const { curr } = currentResult;
  const body = document.getElementById('amortBody');

  if (amortView === 'monthly') {
    body.innerHTML = amortData.map(r => `
      <tr>
        <td>Month ${r.month}</td>
        <td class="td-right">${fmt(curr, r.emi)}</td>
        <td class="td-right" style="color:var(--accent)">${fmt(curr, r.principal)}</td>
        <td class="td-right" style="color:var(--red)">${fmt(curr, r.interest)}</td>
        <td class="td-right" style="font-weight:600">${fmt(curr, r.balance)}</td>
      </tr>`).join('');
  } else {
    // Yearly aggregate
    const years = {};
    amortData.forEach(r => {
      const yr = Math.ceil(r.month / 12);
      if (!years[yr]) years[yr] = { principal: 0, interest: 0, emi: 0, balance: 0, count: 0 };
      years[yr].principal += r.principal;
      years[yr].interest += r.interest;
      years[yr].emi += r.emi;
      years[yr].balance = r.balance;
      years[yr].count++;
    });
    body.innerHTML = Object.entries(years).map(([yr, d]) => `
      <tr>
        <td>Year ${yr}</td>
        <td class="td-right">${fmt(curr, d.emi)}</td>
        <td class="td-right" style="color:var(--accent)">${fmt(curr, d.principal)}</td>
        <td class="td-right" style="color:var(--red)">${fmt(curr, d.interest)}</td>
        <td class="td-right" style="font-weight:600">${fmt(curr, d.balance)}</td>
      </tr>`).join('');
  }
}

function downloadAmortCSV() {
  if (!amortData.length) { toast('Calculate first!', 'error'); return; }
  const rows = [['Month','EMI','Principal','Interest','Balance']];
  amortData.forEach(r => rows.push([r.month, r.emi.toFixed(2), r.principal.toFixed(2), r.interest.toFixed(2), r.balance.toFixed(2)]));
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'loan-amortization.csv';
  a.click();
  toast('✓ CSV downloaded', 'success');
}

// ═══════════════════════════════════════════════════════════════
// PREPAYMENT
// ═══════════════════════════════════════════════════════════════
function calcPrepayment() {
  if (!currentResult || !isCalculated) {
    document.getElementById('prepaymentEmpty').style.display = 'block';
    document.getElementById('prepaymentResult').style.display = 'none';
    return;
  }

  const { P, rate, n, emi, totalInt, curr } = currentResult;
  const prepMonth = parseInt(document.getElementById('prepMonth').value) || 1;
  const prepAmount = parseFloat(document.getElementById('prepAmount').value) || 0;

  if (!prepAmount) return;

  // Calculate new schedule after prepayment
  const r = rate / 12 / 100;
  let bal = P;
  // Advance to prepayment month
  for (let i = 1; i < prepMonth; i++) {
    const int = bal * r;
    bal -= (emi - int);
    if (bal <= 0) break;
  }
  bal = Math.max(0, bal - prepAmount);

  // Recalculate remaining months
  let newMonths = 0;
  let newBal = bal;
  while (newBal > 0.01 && newMonths < n) {
    const int = newBal * r;
    newBal -= (emi - int);
    newMonths++;
  }

  const totalNewMonths = prepMonth + newMonths;
  const savedMonths = n - totalNewMonths;
  const savedInterest = Math.max(0, totalInt - (emi * totalNewMonths - P + prepAmount));

  document.getElementById('p-months').textContent = Math.max(0, savedMonths);
  document.getElementById('p-saved').textContent = fmtCrore(curr, savedInterest);
  document.getElementById('p-newTenure').textContent = totalNewMonths;
  document.getElementById('p-origTenure').textContent = n;
  document.getElementById('bigSaving').textContent = fmtCrore(curr, savedInterest);
  document.getElementById('savingDesc').textContent = `You save ${Math.max(0, savedMonths)} months and ${fmtCrore(curr, savedInterest)} in interest by prepaying ${fmt(curr, prepAmount)} at month ${prepMonth}.`;

  document.getElementById('prepaymentEmpty').style.display = 'none';
  document.getElementById('prepaymentResult').style.display = 'block';

  renderPrepChart(P, rate, n, emi, prepMonth, prepAmount, curr);
}

// ═══════════════════════════════════════════════════════════════
// CHARTS
// ═══════════════════════════════════════════════════════════════
function renderPieChart(principal, interest) {
  const canvas = document.getElementById('pieChart');
  if (pieChartInst) pieChartInst.destroy();
  pieChartInst = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: ['Principal', 'Total Interest'],
      datasets: [{
        data: [Math.round(principal), Math.round(interest)],
        backgroundColor: ['#4361ee', '#ef4444'],
        borderColor: ['#4361ee', '#ef4444'],
        borderWidth: 0,
        hoverOffset: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ' ' + fmtCrore(currentResult?.curr || '₹', ctx.raw)
          }
        }
      },
      cutout: '62%',
    }
  });
}

function renderLineChart(amortRows, curr) {
  const canvas = document.getElementById('lineChart');
  if (lineChartInst) lineChartInst.destroy();

  // Sample at yearly intervals for clarity
  const tenureYears = Math.ceil(amortRows.length / 12);
  const labels = [];
  const data = [];
  for (let y = 0; y <= tenureYears; y++) {
    labels.push('Yr ' + y);
    const monthIdx = Math.min(y * 12 - 1, amortRows.length - 1);
    data.push(Math.round(y === 0 ? amortRows[0].balance + amortRows[0].principal : (amortRows[monthIdx]?.balance || 0)));
  }

  lineChartInst = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Outstanding Balance',
        data,
        borderColor: '#4361ee',
        backgroundColor: 'rgba(67,97,238,.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#4361ee',
        borderWidth: 2.5,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ' Balance: ' + fmtCrore(curr, ctx.raw)
          }
        }
      },
      scales: {
        x: { grid: { color: 'rgba(128,128,128,.1)' }, ticks: { color: '#8896a7', font: { size: 11 } } },
        y: {
          grid: { color: 'rgba(128,128,128,.1)' },
          ticks: {
            color: '#8896a7',
            font: { size: 11 },
            callback: v => fmtCrore(curr, v)
          }
        }
      }
    }
  });
}

function renderBarChart(results, curr) {
  const canvas = document.getElementById('barChart');
  if (barChartInst) barChartInst.destroy();
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  barChartInst = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: results.map(b => b.name),
      datasets: [{
        label: 'Total Interest',
        data: results.map(b => Math.round(b.interest)),
        backgroundColor: results.map((b, i) => i === 0 ? '#10b981' : '#4361ee'),
        borderRadius: 6,
        borderWidth: 0,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ' Interest: ' + fmtCrore(curr, ctx.raw)
          }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#8896a7', font: { size: 11 } } },
        y: {
          grid: { color: 'rgba(128,128,128,.1)' },
          ticks: {
            color: '#8896a7',
            font: { size: 11 },
            callback: v => fmtCrore(curr, v)
          }
        }
      }
    }
  });
}

function renderPrepChart(P, rate, n, emi, prepMonth, prepAmount, curr) {
  const canvas = document.getElementById('prepChart');
  if (prepChartInst) prepChartInst.destroy();

  const r = rate / 12 / 100;

  // Without prepayment
  const without = [];
  let bal1 = P;
  for (let i = 1; i <= n; i++) {
    const int = bal1 * r;
    bal1 = Math.max(0, bal1 - (emi - int));
    without.push(Math.round(bal1));
  }

  // With prepayment
  const withPrep = [];
  let bal2 = P;
  for (let i = 1; i <= n; i++) {
    if (i === prepMonth && bal2 > 0) bal2 = Math.max(0, bal2 - prepAmount);
    const int = bal2 * r;
    bal2 = Math.max(0, bal2 - (emi - int));
    withPrep.push(Math.round(bal2));
  }

  const step = Math.max(1, Math.floor(n / 24));
  const labels = Array.from({length: n}, (_, i) => i + 1).filter((_, i) => i % step === 0);
  const d1 = without.filter((_, i) => i % step === 0);
  const d2 = withPrep.filter((_, i) => i % step === 0);

  prepChartInst = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Without Prepayment',
          data: d1,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239,68,68,.06)',
          fill: true,
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 0,
        },
        {
          label: 'With Prepayment',
          data: d2,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,.08)',
          fill: true,
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 0,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index',
          callbacks: {
            title: ctx => 'Month ' + ctx[0].label,
            label: ctx => ' ' + ctx.dataset.label + ': ' + fmtCrore(curr, ctx.raw)
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#8896a7', font: { size: 10 }, maxTicksLimit: 10 },
          title: { display: true, text: 'Month', color: '#8896a7', font: { size: 11 } }
        },
        y: {
          grid: { color: 'rgba(128,128,128,.1)' },
          ticks: { color: '#8896a7', font: { size: 10 }, callback: v => fmtCrore(curr, v) }
        }
      }
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════════════════════════
function showTab(id) {
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + id).classList.add('active');
  event.target.classList.add('active');

  if (id === 'prepayment' && isCalculated) calcPrepayment();
}

// ═══════════════════════════════════════════════════════════════
// THEME
// ═══════════════════════════════════════════════════════════════
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  document.getElementById('themeKnob').textContent = next === 'dark' ? '🌙' : '☀';
  localStorage.setItem('lw-theme', next);
}

// ═══════════════════════════════════════════════════════════════
// SHARE & EXPORT
// ═══════════════════════════════════════════════════════════════
function shareURL() {
  const p = document.getElementById('principal').value;
  const r = document.getElementById('rate').value;
  const t = document.getElementById('tenure').value;
  const c = document.getElementById('currencySelect').value;
  const url = `${location.origin}${location.pathname}?p=${p}&r=${r}&t=${t}&c=${encodeURIComponent(c)}`;
  navigator.clipboard.writeText(url).then(() => toast('✓ Link copied to clipboard!', 'success')).catch(() => {
    prompt('Copy this link:', url);
  });
}

function loadFromURL() {
  const params = new URLSearchParams(location.search);
  if (params.get('p')) {
    document.getElementById('principal').value = params.get('p');
    document.getElementById('principalSlider').value = params.get('p');
  }
  if (params.get('r')) {
    document.getElementById('rate').value = params.get('r');
    document.getElementById('rateSlider').value = params.get('r');
  }
  if (params.get('t')) {
    document.getElementById('tenure').value = params.get('t');
    document.getElementById('tenureSlider').value = params.get('t');
  }
  if (params.get('c')) {
    document.getElementById('currencySelect').value = decodeURIComponent(params.get('c'));
  }
}

async function exportPDF() {
  toast('Generating PDF...', 'info');
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const W = 210, margin = 15;
    let y = margin;

    // Header
    doc.setFillColor(67, 97, 238);
    doc.rect(0, 0, W, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('LoanWise — EMI Report', margin, 18);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on ${new Date().toLocaleDateString('en-IN', {dateStyle:'long'})}`, W - margin, 18, {align:'right'});
    y = 38;

    if (currentResult) {
      const { P, rate, n, emi, totalPay, totalInt, curr } = currentResult;

      // Loan Summary Section
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Loan Summary', margin, y); y += 8;

      doc.setDrawColor(67, 97, 238);
      doc.setLineWidth(0.5);
      doc.line(margin, y, W - margin, y); y += 6;

      const rows = [
        ['Loan Amount', fmt(curr, P)],
        ['Annual Interest Rate', rate.toFixed(2) + '%'],
        ['Loan Tenure', Math.round(n/12) + ' years (' + n + ' months)'],
        ['Monthly EMI', fmt(curr, emi)],
        ['Total Interest Paid', fmtCrore(curr, totalInt)],
        ['Total Amount Payable', fmtCrore(curr, totalPay)],
        ['Interest as % of Total', (totalInt/totalPay*100).toFixed(1) + '%'],
      ];

      doc.setFontSize(11);
      rows.forEach(([label, val]) => {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text(label, margin + 2, y);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 30, 30);
        doc.text(val, W - margin, y, {align:'right'});
        y += 7;
      });

      y += 4;

      // Bank comparison table (if any)
      if (banks.length && currentResult) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 30, 30);
        doc.text('Bank Comparison', margin, y); y += 8;
        doc.setDrawColor(67, 97, 238);
        doc.line(margin, y, W - margin, y); y += 6;

        const bankResults = banks.map(b => {
          const emi2 = calcEMI(P, b.rate, n);
          const total2 = emi2 * n;
          const interest2 = total2 - P;
          return { name: b.name, rate: b.rate, emi: emi2, interest: interest2, total: total2 };
        }).sort((a, b) => a.interest - b.interest);

        const bestInt = bankResults[0].interest;

        // Table header
        doc.setFillColor(240, 242, 248);
        doc.rect(margin, y - 4, W - 2*margin, 7, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 100, 100);
        doc.text('Bank', margin+2, y);
        doc.text('Rate', 80, y);
        doc.text('EMI/mo', 115, y);
        doc.text('Total Interest', 145, y);
        doc.text('vs Best', 185, y, {align:'right'});
        y += 6;

        bankResults.forEach((b, i) => {
          if (y > 270) { doc.addPage(); y = 20; }
          if (i === 0) doc.setFillColor(236, 253, 245);
          else doc.setFillColor(255, 255, 255);
          doc.rect(margin, y - 4, W - 2*margin, 7, 'F');
          doc.setFont('helvetica', i===0?'bold':'normal');
          doc.setTextColor(30, 30, 30);
          doc.setFontSize(9.5);
          doc.text(b.name + (i===0?' ★':''), margin+2, y);
          doc.text(b.rate.toFixed(2)+'%', 80, y);
          doc.text(fmt(curr, b.emi), 115, y);
          doc.text(fmtCrore(curr, b.interest), 145, y);
          const diff = b.interest - bestInt;
          if (diff > 0) { doc.setTextColor(220,38,38); doc.text('+'+fmtCrore(curr, diff), 185, y, {align:'right'}); }
          else { doc.setTextColor(16,185,129); doc.text('Best', 185, y, {align:'right'}); }
          doc.setTextColor(30,30,30);
          y += 7;
        });
        y += 4;
      }

      // Amortization (first 12 months)
      if (amortData.length > 0) {
        if (y > 220) { doc.addPage(); y = 20; }
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 30, 30);
        doc.text('Amortization Schedule (First 12 Months)', margin, y); y += 8;
        doc.setDrawColor(67, 97, 238);
        doc.line(margin, y, W - margin, y); y += 6;

        doc.setFillColor(240, 242, 248);
        doc.rect(margin, y - 4, W - 2*margin, 7, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 100, 100);
        ['Month','EMI','Principal','Interest','Balance'].forEach((h, i) => {
          doc.text(h, margin + 2 + i * 37, y);
        });
        y += 6;

        amortData.slice(0, 12).forEach((r, i) => {
          if (i % 2 === 0) { doc.setFillColor(250,250,252); doc.rect(margin, y-4, W-2*margin, 7, 'F'); }
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9.5);
          doc.setTextColor(60,60,60);
          const cols = [r.month, fmt(curr, r.emi), fmt(curr, r.principal), fmt(curr, r.interest), fmt(curr, r.balance)];
          cols.forEach((c, ci) => doc.text(String(c), margin + 2 + ci * 37, y));
          y += 7;
        });
      }
    } else {
      doc.setFontSize(14);
      doc.setTextColor(100);
      doc.text('No loan data calculated yet. Please enter details and calculate.', margin, y);
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(160);
    doc.text('Generated by LoanWise — Free Loan EMI Calculator | For informational purposes only. Consult a financial advisor.', W/2, 292, {align:'center'});

    doc.save('LoanWise-EMI-Report.pdf');
    toast('✓ PDF downloaded!', 'success');
  } catch (e) {
    console.error(e);
    toast('PDF export failed. Try again.', 'error');
  }
}

// ═══════════════════════════════════════════════════════════════
// SAVED SESSIONS
// ═══════════════════════════════════════════════════════════════
function saveSession() {
  if (!currentResult) { toast('Calculate first!', 'error'); return; }
  const sessions = JSON.parse(localStorage.getItem('lw-sessions') || '[]');
  const session = {
    id: Date.now(),
    date: new Date().toLocaleDateString(),
    P: currentResult.P,
    rate: currentResult.rate,
    n: currentResult.n,
    emi: currentResult.emi,
    totalInt: currentResult.totalInt,
    curr: currentResult.curr,
  };
  sessions.unshift(session);
  if (sessions.length > 5) sessions.pop();
  localStorage.setItem('lw-sessions', JSON.stringify(sessions));
  renderSavedSessions();
  toast('✓ Session saved!', 'success');
}

function renderSavedSessions() {
  const sessions = JSON.parse(localStorage.getItem('lw-sessions') || '[]');
  const el = document.getElementById('savedList');
  if (!sessions.length) {
    el.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text3);font-size:13px">No saved sessions yet.</div>';
    return;
  }
  el.innerHTML = sessions.map(s => `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--surface2);border-radius:var(--radius-sm);border:1px solid var(--border)">
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:700;color:var(--text)">${fmt(s.curr, s.P)} @ ${s.rate}% — ${Math.round(s.n/12)}yr</div>
        <div style="font-size:12px;color:var(--text3)">${fmt(s.curr, s.emi)}/mo | ${s.date}</div>
      </div>
      <button class="btn btn-sm btn-outline" onclick="loadSession(${s.id})">Load</button>
      <button class="btn btn-sm btn-danger" onclick="deleteSession(${s.id})">✕</button>
    </div>`).join('');
}

function loadSession(id) {
  const sessions = JSON.parse(localStorage.getItem('lw-sessions') || '[]');
  const s = sessions.find(x => x.id === id);
  if (!s) return;
  document.getElementById('principal').value = s.P;
  document.getElementById('principalSlider').value = s.P;
  document.getElementById('rate').value = s.rate;
  document.getElementById('rateSlider').value = s.rate;
  document.getElementById('tenure').value = Math.round(s.n / 12);
  document.getElementById('tenureSlider').value = Math.round(s.n / 12);
  document.getElementById('currencySelect').value = s.curr;
  recalculate();
  toast('✓ Session loaded', 'success');
}

function deleteSession(id) {
  let sessions = JSON.parse(localStorage.getItem('lw-sessions') || '[]');
  sessions = sessions.filter(s => s.id !== id);
  localStorage.setItem('lw-sessions', JSON.stringify(sessions));
  renderSavedSessions();
}

// ═══════════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════════
function toast(message, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  document.getElementById('toastWrap').appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(60px)'; el.style.transition = 'all .3s'; setTimeout(() => el.remove(), 300); }, 2800);
}

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // Load theme
  const savedTheme = localStorage.getItem('lw-theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.getElementById('themeKnob').textContent = savedTheme === 'dark' ? '🌙' : '☀';
  }

  // Load URL params
  loadFromURL();

  // Render saved sessions
  renderSavedSessions();

  // Initial calculation
  recalculate();

  // Load default banks on first visit
  if (!localStorage.getItem('lw-banks-loaded')) {
    loadDefaultBanks();
    localStorage.setItem('lw-banks-loaded', '1');
  }

  // Keyboard shortcut: Enter to recalculate
  document.querySelectorAll('.form-input').forEach(el => {
    el.addEventListener('keydown', e => { if (e.key === 'Enter') recalculate(); });
  });

  // Modal: close on Escape
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
});
