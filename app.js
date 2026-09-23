/* ============================================
   AI Salary Calculator — Engine & UI Logic
   FY 2026-27 (Assessment Year 2027-28)
   ============================================ */

// ─── Salary Calculation Engine ──────────────────────────────────────────

const SalaryEngine = {

  /**
   * Main entry: calculate full salary breakdown from CTC
   * @param {object} input - User inputs
   * @returns {object} Complete salary breakdown
   */
  calculate(input) {
    const {
      ctcAnnual,
      regime = 'new',          // 'old' | 'new'
      cityType = 'metro',      // 'metro' | 'non-metro'
      epfOption = 'basic',     // 'basic' (12% of basic) | 'capped' (12% of 15000)
      rentPaid = 0,            // Monthly rent (for old regime HRA)
      investments80C = 0,      // 80C investments (for old regime)
      medicalInsurance = 0,    // 80D medical insurance
      otherDeductions = 0,     // Any other deductions
      npsContribution = 0      // NPS under 80CCD
    } = input;

    // Step 1: Basic Salary = 50% of CTC
    const basicAnnual = Math.round(ctcAnnual * 0.50);
    const basicMonthly = Math.round(basicAnnual / 12);

    // Step 2: Employer EPF contribution
    let employerEPFMonthly;
    if (epfOption === 'capped') {
      employerEPFMonthly = Math.round(Math.min(basicMonthly, 15000) * 0.12);
    } else {
      employerEPFMonthly = Math.round(basicMonthly * 0.12);
    }
    const employerEPFAnnual = employerEPFMonthly * 12;

    // Step 3: Gratuity = (15/26) × Monthly Basic × 1 year
    const gratuityAnnual = Math.round((15 / 26) * basicMonthly * 1);
    // Note: For actual payout, need 5 years. This is the annual set-aside.

    // Step 4: Gross Salary = CTC - Employer EPF - Gratuity
    const grossAnnual = ctcAnnual - employerEPFAnnual - gratuityAnnual;

    // Step 5: Salary Components from Gross
    const hraPercent = cityType === 'metro' ? 0.50 : 0.40;
    const hraAnnual = Math.round(basicAnnual * hraPercent);

    // LTA: approximately 8.33% of basic (1 month basic)
    const ltaAnnual = Math.round(basicMonthly);

    // Special Allowance = Gross - Basic - HRA - LTA
    const specialAllowanceAnnual = Math.max(0, grossAnnual - basicAnnual - hraAnnual - ltaAnnual);

    // Step 6: Employee EPF contribution (same as employer)
    let employeeEPFMonthly;
    if (epfOption === 'capped') {
      employeeEPFMonthly = Math.round(Math.min(basicMonthly, 15000) * 0.12);
    } else {
      employeeEPFMonthly = Math.round(basicMonthly * 0.12);
    }
    const employeeEPFAnnual = employeeEPFMonthly * 12;

    // Step 7: Professional Tax (approximate ₹200/month, max ₹2500/year)
    const profTaxAnnual = Math.min(2400, 2500);
    const profTaxMonthly = 200;

    // Step 8: Calculate Taxable Income
    let taxableIncome;
    let hraExemption = 0;
    let section80C = 0;
    let standardDeduction = 0;

    if (regime === 'new') {
      // New regime: Standard deduction of ₹75,000
      standardDeduction = 75000;
      taxableIncome = grossAnnual - standardDeduction;
      taxableIncome = Math.max(0, taxableIncome);
    } else {
      // Old regime: Multiple deductions
      standardDeduction = 50000; // Old regime standard deduction

      // HRA Exemption (min of three)
      const hraReceived = hraAnnual;
      const rentMinus10Basic = Math.max(0, (rentPaid * 12) - (0.10 * basicAnnual));
      const basicPercent = cityType === 'metro' ? 0.50 : 0.40;
      const basicPercentAmt = basicAnnual * basicPercent;

      if (rentPaid > 0) {
        hraExemption = Math.min(hraReceived, rentMinus10Basic, basicPercentAmt);
      } else {
        hraExemption = 0; // Fully taxable if not renting
      }

      // 80C deduction (max 1.5L) — EPF contribution counts towards 80C
      const total80C = employeeEPFAnnual + investments80C;
      section80C = Math.min(total80C, 150000);

      // NPS 80CCD(1B) additional deduction up to 50000
      const npsDeduction = Math.min(npsContribution, 50000);

      taxableIncome = grossAnnual
        - standardDeduction
        - hraExemption
        - section80C
        - npsDeduction
        - medicalInsurance
        - otherDeductions;

      taxableIncome = Math.max(0, taxableIncome);
    }

    // Step 9: Calculate Income Tax
    const taxDetails = regime === 'new'
      ? this.calculateNewRegimeTax(taxableIncome)
      : this.calculateOldRegimeTax(taxableIncome);

    // Step 10: Take Home Salary
    const totalDeductionsAnnual = taxDetails.totalTax + employeeEPFAnnual + profTaxAnnual;
    const takeHomeAnnual = grossAnnual - totalDeductionsAnnual;
    const takeHomeMonthly = Math.round(takeHomeAnnual / 12);

    return {
      // Input echo
      ctcAnnual,
      regime,
      cityType,

      // Components
      basicAnnual,
      basicMonthly,
      hraAnnual,
      hraMonthly: Math.round(hraAnnual / 12),
      ltaAnnual,
      ltaMonthly: Math.round(ltaAnnual / 12),
      specialAllowanceAnnual,
      specialAllowanceMonthly: Math.round(specialAllowanceAnnual / 12),

      // Employer contributions
      employerEPFAnnual,
      employerEPFMonthly,
      gratuityAnnual,
      gratuityMonthly: Math.round(gratuityAnnual / 12),

      // Gross
      grossAnnual,
      grossMonthly: Math.round(grossAnnual / 12),

      // Deductions
      employeeEPFAnnual,
      employeeEPFMonthly,
      profTaxAnnual,
      profTaxMonthly,

      // Tax
      standardDeduction,
      hraExemption,
      section80C,
      taxableIncome,
      ...taxDetails,

      // Take Home
      totalDeductionsAnnual,
      totalDeductionsMonthly: Math.round(totalDeductionsAnnual / 12),
      takeHomeAnnual,
      takeHomeMonthly,
    };
  },

  /**
   * New Tax Regime (FY 2026-27 / AY 2027-28)
   * Post budget announcement 1 Feb 2025
   */
  calculateNewRegimeTax(taxableIncome) {
    const slabs = [
      { min: 0,       max: 400000,   rate: 0.00 },
      { min: 400000,  max: 800000,   rate: 0.05 },
      { min: 800000,  max: 1200000,  rate: 0.10 },
      { min: 1200000, max: 1600000,  rate: 0.15 },
      { min: 1600000, max: 2000000,  rate: 0.20 },
      { min: 2000000, max: 2400000,  rate: 0.25 },
      { min: 2400000, max: Infinity,  rate: 0.30 },
    ];

    let baseTax = this._calculateSlabTax(taxableIncome, slabs);

    // Section 87A Rebate: Full rebate for taxable income ≤ ₹12,00,000
    // (effectively ₹12,75,000 with ₹75,000 standard deduction — zero tax below that)
    if (taxableIncome <= 1200000) {
      // Full rebate — apply marginal relief logic
      // Rebate = min(tax, 60000)
      const rebate = Math.min(baseTax, 60000);
      baseTax = baseTax - rebate;
    } else if (taxableIncome <= 1275000) {
      // Marginal relief zone (₹12L to ₹12.75L)
      // Tax payable should not exceed the income above ₹12L
      const incomeAbove12L = taxableIncome - 1200000;
      // Calculate tax normally
      const normalTax = baseTax; // no rebate
      // Tax with marginal relief = min(normalTax, incomeAbove12L)
      baseTax = Math.min(normalTax, incomeAbove12L);
    }

    // Surcharge
    let surcharge = 0;
    if (taxableIncome > 50000000) {
      // Above 5 Cr — 25% surcharge (proposed 2019)
      surcharge = baseTax * 0.25;
    } else if (taxableIncome > 20000000) {
      // Above 2 Cr — 25% surcharge (as mentioned)
      surcharge = baseTax * 0.25;
    } else if (taxableIncome > 10000000) {
      // Above 1 Cr — 15%
      surcharge = baseTax * 0.15;
    } else if (taxableIncome > 5000000) {
      // Above 50L — 10%
      surcharge = baseTax * 0.10;
    }

    // Cess: 4% on (tax + surcharge)
    const cess = Math.round((baseTax + surcharge) * 0.04);

    const totalTax = Math.round(baseTax + surcharge + cess);

    return {
      baseTax: Math.round(baseTax),
      surcharge: Math.round(surcharge),
      cess,
      totalTax,
      rebateApplied: taxableIncome <= 1200000,
      marginalRelief: taxableIncome > 1200000 && taxableIncome <= 1275000,
    };
  },

  /**
   * Old Tax Regime (FY 2026-27 / AY 2027-28)
   */
  calculateOldRegimeTax(taxableIncome) {
    const slabs = [
      { min: 0,       max: 250000,    rate: 0.00 },
      { min: 250000,  max: 500000,    rate: 0.05 },
      { min: 500000,  max: 1000000,   rate: 0.20 },
      { min: 1000000, max: Infinity,  rate: 0.30 },
    ];

    let baseTax = this._calculateSlabTax(taxableIncome, slabs);

    // Section 87A Rebate: ₹12,500 for income ≤ ₹5,00,000
    if (taxableIncome <= 500000) {
      baseTax = Math.max(0, baseTax - 12500);
    }

    // Surcharge
    let surcharge = 0;
    if (taxableIncome > 50000000) {
      surcharge = baseTax * 0.25;
    } else if (taxableIncome > 20000000) {
      surcharge = baseTax * 0.25;
    } else if (taxableIncome > 10000000) {
      surcharge = baseTax * 0.15;
    } else if (taxableIncome > 5000000) {
      surcharge = baseTax * 0.10;
    }

    // Cess: 4%
    const cess = Math.round((baseTax + surcharge) * 0.04);
    const totalTax = Math.round(baseTax + surcharge + cess);

    return {
      baseTax: Math.round(baseTax),
      surcharge: Math.round(surcharge),
      cess,
      totalTax,
      rebateApplied: taxableIncome <= 500000,
      marginalRelief: false,
    };
  },

  /**
   * Generic slab-based tax calculation
   */
  _calculateSlabTax(income, slabs) {
    let tax = 0;
    for (const slab of slabs) {
      if (income <= slab.min) break;
      const taxableInSlab = Math.min(income, slab.max) - slab.min;
      tax += taxableInSlab * slab.rate;
    }
    return tax;
  },

  /**
   * Calculate both regimes for comparison
   */
  compareBothRegimes(input) {
    const newResult = this.calculate({ ...input, regime: 'new' });
    const oldResult = this.calculate({ ...input, regime: 'old' });
    return { newRegime: newResult, oldRegime: oldResult };
  }
};


// ─── Number Formatting ─────────────────────────────────────────────────

function formatINR(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  const isNegative = amount < 0;
  amount = Math.abs(Math.round(amount));
  const str = amount.toString();
  let result = '';
  const len = str.length;

  if (len <= 3) {
    result = str;
  } else {
    result = str.slice(-3);
    let remaining = str.slice(0, -3);
    while (remaining.length > 2) {
      result = remaining.slice(-2) + ',' + result;
      remaining = remaining.slice(0, -2);
    }
    if (remaining.length > 0) {
      result = remaining + ',' + result;
    }
  }

  return (isNegative ? '-' : '') + '₹' + result;
}

function formatINRCompact(amount) {
  if (Math.abs(amount) >= 10000000) {
    return '₹' + (amount / 10000000).toFixed(2) + ' Cr';
  } else if (Math.abs(amount) >= 100000) {
    return '₹' + (amount / 100000).toFixed(2) + ' L';
  }
  return formatINR(amount);
}


// ─── Donut Chart ────────────────────────────────────────────────────────

function renderDonutChart(data) {
  // data: [{label, value, color}]
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return;

  const svg = document.getElementById('donut-svg');
  const legend = document.getElementById('chart-legend');
  if (!svg || !legend) return;

  const radius = 86;
  const circumference = 2 * Math.PI * radius;

  // Clear
  svg.innerHTML = '';
  legend.innerHTML = '';

  let cumulativeOffset = 0;

  data.forEach((item, index) => {
    const percentage = item.value / total;
    const dashLength = circumference * percentage;
    const dashOffset = circumference * cumulativeOffset;

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '100');
    circle.setAttribute('cy', '100');
    circle.setAttribute('r', radius.toString());
    circle.setAttribute('stroke', item.color);
    circle.setAttribute('stroke-dasharray', `${dashLength} ${circumference - dashLength}`);
    circle.setAttribute('stroke-dashoffset', (-dashOffset).toString());
    circle.style.transition = `stroke-dasharray 1s ease ${index * 0.1}s, stroke-dashoffset 1s ease ${index * 0.1}s`;

    svg.appendChild(circle);

    // Legend
    const legendItem = document.createElement('div');
    legendItem.className = 'legend-item';
    legendItem.innerHTML = `
      <span class="legend-dot" style="background:${item.color}"></span>
      <span>${item.label}</span>
      <span class="legend-value">${Math.round(percentage * 100)}%</span>
    `;
    legend.appendChild(legendItem);

    cumulativeOffset += percentage;
  });

  // Center text
  const centerValue = document.getElementById('donut-center-value');
  const centerLabel = document.getElementById('donut-center-label');
  if (centerValue && centerLabel) {
    centerLabel.textContent = 'MONTHLY';
    animateNumber(centerValue, 0, data[0].value, 800, (v) => formatINR(Math.round(v / 12)));
  }
}


// ─── Number Animation ───────────────────────────────────────────────────

function animateNumber(element, from, to, duration, formatter) {
  const startTime = performance.now();
  formatter = formatter || formatINR;

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = from + (to - from) * eased;
    element.textContent = formatter(Math.round(current));
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  requestAnimationFrame(update);
}


// ─── UI Controller ──────────────────────────────────────────────────────

const UI = {
  currentView: 'monthly', // 'monthly' | 'annual'
  lastResult: null,
  comparisonResult: null,

  init() {
    this.bindEvents();
    this.handleNavScroll();
    this.initFAQ();
    this.initChat();
    this.updateRegimeVisibility();
  },

  bindEvents() {
    // Calculate button
    const calcBtn = document.getElementById('btn-calculate');
    if (calcBtn) {
      calcBtn.addEventListener('click', (e) => {
        this.addRipple(e, calcBtn);
        this.doCalculation();
      });
    }

    // CTC input — format on the fly
    const ctcInput = document.getElementById('input-ctc');
    if (ctcInput) {
      ctcInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/[^0-9]/g, '');
        e.target.value = val;
      });

      // Enter key to calculate
      ctcInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.doCalculation();
        }
      });
    }

    // Regime toggle
    document.querySelectorAll('.toggle-option').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.toggle-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const slider = document.querySelector('.toggle-slider');
        if (btn.dataset.regime === 'old') {
          slider.classList.add('right');
        } else {
          slider.classList.remove('right');
        }
        this.updateRegimeVisibility();
      });
    });

    // Result tabs
    document.querySelectorAll('.result-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.result-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentView = tab.dataset.view;
        if (this.lastResult) {
          this.renderResults(this.lastResult);
        }
      });
    });

    // Mobile nav toggle
    const mobileToggle = document.getElementById('nav-mobile-toggle');
    if (mobileToggle) {
      mobileToggle.addEventListener('click', () => {
        document.getElementById('nav-links').classList.toggle('mobile-open');
      });
    }
  },

  updateRegimeVisibility() {
    const activeRegime = document.querySelector('.toggle-option.active')?.dataset.regime || 'new';
    const oldSection = document.getElementById('old-regime-section');
    if (oldSection) {
      if (activeRegime === 'old') {
        oldSection.classList.add('visible');
      } else {
        oldSection.classList.remove('visible');
      }
    }
  },

  getInputs() {
    const ctcVal = document.getElementById('input-ctc')?.value.replace(/[^0-9]/g, '') || '0';
    const ctcAnnual = parseInt(ctcVal, 10);

    const activeRegime = document.querySelector('.toggle-option.active')?.dataset.regime || 'new';
    const cityType = document.getElementById('select-city')?.value || 'metro';
    const epfOption = document.getElementById('select-epf')?.value || 'basic';

    // Old regime inputs
    const rentPaid = parseInt(document.getElementById('input-rent')?.value || '0', 10);
    const investments80C = parseInt(document.getElementById('input-80c')?.value || '0', 10);
    const medicalInsurance = parseInt(document.getElementById('input-medical')?.value || '0', 10);
    const npsContribution = parseInt(document.getElementById('input-nps')?.value || '0', 10);

    return {
      ctcAnnual,
      regime: activeRegime,
      cityType,
      epfOption,
      rentPaid,
      investments80C,
      medicalInsurance,
      npsContribution,
      otherDeductions: 0
    };
  },

  doCalculation() {
    const input = this.getInputs();

    if (!input.ctcAnnual || input.ctcAnnual < 100000) {
      this.shakeInput('input-ctc');
      return;
    }

    // Calculate for chosen regime
    const result = SalaryEngine.calculate(input);
    this.lastResult = result;

    // Also compare both regimes
    this.comparisonResult = SalaryEngine.compareBothRegimes(input);

    // Show results
    const resultsCard = document.getElementById('results-card');
    if (resultsCard) {
      resultsCard.classList.remove('results-hidden');
      resultsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    this.renderResults(result);
    this.renderComparison(this.comparisonResult);
    this.renderDonutChart(result);
  },

  renderResults(result) {
    const isMonthly = this.currentView === 'monthly';
    const div = isMonthly ? 12 : 1;
    const suffix = isMonthly ? '/mo' : '/yr';

    // Take home highlight
    const takeHomeAmt = document.getElementById('take-home-amount');
    const takeHomeAnnualEl = document.getElementById('take-home-annual');
    if (takeHomeAmt) {
      animateNumber(takeHomeAmt, 0, isMonthly ? result.takeHomeMonthly : result.takeHomeAnnual, 1000);
    }
    if (takeHomeAnnualEl) {
      if (isMonthly) {
        takeHomeAnnualEl.innerHTML = `Annual: <span>${formatINR(result.takeHomeAnnual)}</span>`;
      } else {
        takeHomeAnnualEl.innerHTML = `Monthly: <span>${formatINR(result.takeHomeMonthly)}</span>`;
      }
    }

    // Breakdown table
    const tbody = document.getElementById('breakdown-tbody');
    if (!tbody) return;

    const rows = [
      { type: 'header', label: 'CTC Breakdown' },
      { label: 'Cost to Company (CTC)', value: result.ctcAnnual, cls: '' },
      { label: 'Employer EPF', value: -result.employerEPFAnnual, cls: 'row-deduction' },
      { label: 'Gratuity', value: -result.gratuityAnnual, cls: 'row-deduction' },

      { type: 'header', label: 'Gross Salary Components' },
      { label: 'Basic Salary', value: result.basicAnnual, cls: '' },
      { label: `HRA (${result.cityType === 'metro' ? '50%' : '40%'} of Basic)`, value: result.hraAnnual, cls: '' },
      { label: 'Leave Travel Allowance', value: result.ltaAnnual, cls: '' },
      { label: 'Special Allowance', value: result.specialAllowanceAnnual, cls: '' },
      { label: 'Gross Salary', value: result.grossAnnual, cls: 'row-highlight' },

      { type: 'header', label: 'Deductions' },
      { label: 'Employee EPF', value: -result.employeeEPFAnnual, cls: 'row-deduction' },
      { label: 'Professional Tax', value: -result.profTaxAnnual, cls: 'row-deduction' },
      { label: 'Income Tax', value: -result.totalTax, cls: 'row-deduction' },

      { type: 'total', label: 'Take Home Salary', value: result.takeHomeAnnual },
    ];

    tbody.innerHTML = '';

    rows.forEach(row => {
      const tr = document.createElement('tr');

      if (row.type === 'header') {
        tr.className = 'row-section-header';
        tr.innerHTML = `<td colspan="2">${row.label}</td>`;
      } else if (row.type === 'total') {
        tr.className = 'row-total';
        const val = isMonthly ? Math.round(row.value / 12) : row.value;
        tr.innerHTML = `
          <td>${row.label} ${isMonthly ? '(Monthly)' : '(Annual)'}</td>
          <td>${formatINR(val)}</td>
        `;
      } else {
        tr.className = row.cls || '';
        const val = isMonthly ? Math.round(row.value / 12) : row.value;
        const displayVal = row.cls === 'row-deduction' ? formatINR(val) : formatINR(val);
        tr.innerHTML = `
          <td>${row.label}</td>
          <td>${displayVal}</td>
        `;
      }

      tbody.appendChild(tr);
    });

    // Tax details
    this.renderTaxDetails(result);
  },

  renderTaxDetails(result) {
    const container = document.getElementById('tax-details');
    if (!container) return;

    let html = `
      <div style="padding: 16px; background: var(--bg-glass); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-top: 20px;">
        <div style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
          Tax Computation (${result.regime === 'new' ? 'New' : 'Old'} Regime)
        </div>
        <table class="breakdown-table">
          <tr><td>Gross Salary</td><td>${formatINR(result.grossAnnual)}</td></tr>
          <tr><td>Standard Deduction</td><td style="color: var(--accent-cyan) !important;">- ${formatINR(result.standardDeduction)}</td></tr>
    `;

    if (result.regime === 'old') {
      if (result.hraExemption > 0) {
        html += `<tr><td>HRA Exemption</td><td style="color: var(--accent-cyan) !important;">- ${formatINR(result.hraExemption)}</td></tr>`;
      }
      if (result.section80C > 0) {
        html += `<tr><td>Section 80C Deduction</td><td style="color: var(--accent-cyan) !important;">- ${formatINR(result.section80C)}</td></tr>`;
      }
    }

    html += `
          <tr class="row-highlight"><td>Taxable Income</td><td>${formatINR(result.taxableIncome)}</td></tr>
          <tr><td>Base Tax</td><td>${formatINR(result.baseTax)}</td></tr>
    `;

    if (result.rebateApplied) {
      html += `<tr><td>Section 87A Rebate</td><td style="color: var(--accent-cyan) !important;">Applied ✓</td></tr>`;
    }
    if (result.marginalRelief) {
      html += `<tr><td>Marginal Relief</td><td style="color: var(--accent-cyan) !important;">Applied ✓</td></tr>`;
    }
    if (result.surcharge > 0) {
      html += `<tr><td>Surcharge</td><td>${formatINR(result.surcharge)}</td></tr>`;
    }

    html += `
          <tr><td>Health & Education Cess (4%)</td><td>${formatINR(result.cess)}</td></tr>
          <tr class="row-total"><td>Total Tax</td><td>${formatINR(result.totalTax)}</td></tr>
        </table>
      </div>
    `;

    container.innerHTML = html;
  },

  renderComparison(comparison) {
    const { newRegime, oldRegime } = comparison;
    const container = document.getElementById('regime-comparison');
    if (!container) return;

    const newBetter = newRegime.takeHomeMonthly >= oldRegime.takeHomeMonthly;

    container.innerHTML = `
      <div class="comparison-header">⚡ Regime Comparison</div>
      <div class="comparison-cards">
        <div class="comparison-card ${newBetter ? 'recommended' : ''}">
          <div class="comparison-regime-name">New Regime</div>
          <div class="comparison-amount">${formatINR(newRegime.takeHomeMonthly)}</div>
          <div class="comparison-tax">Tax: <span>${formatINR(newRegime.totalTax)}</span>/yr</div>
        </div>
        <div class="comparison-card ${!newBetter ? 'recommended' : ''}">
          <div class="comparison-regime-name">Old Regime</div>
          <div class="comparison-amount">${formatINR(oldRegime.takeHomeMonthly)}</div>
          <div class="comparison-tax">Tax: <span>${formatINR(oldRegime.totalTax)}</span>/yr</div>
        </div>
      </div>
      <div style="text-align: center; margin-top: 12px; font-size: 12px; color: var(--text-muted);">
        You save <span style="color: var(--accent-cyan); font-weight: 700; font-family: 'JetBrains Mono', monospace;">
        ${formatINR(Math.abs(newRegime.takeHomeAnnual - oldRegime.takeHomeAnnual))}/yr</span>
        with the ${newBetter ? 'New' : 'Old'} Regime
      </div>
    `;
  },

  renderDonutChart(result) {
    const chartData = [
      { label: 'Take Home', value: result.takeHomeAnnual, color: '#06d6a0' },
      { label: 'Income Tax', value: result.totalTax, color: '#ef4444' },
      { label: 'Employee EPF', value: result.employeeEPFAnnual, color: '#4f8cff' },
      { label: 'Employer EPF', value: result.employerEPFAnnual, color: '#7c3aed' },
      { label: 'Prof. Tax', value: result.profTaxAnnual, color: '#fb923c' },
      { label: 'Gratuity', value: result.gratuityAnnual, color: '#f472b6' },
    ].filter(d => d.value > 0);

    renderDonutChart(chartData);
  },

  // ─── UI Helpers ──────────────────────────────────────

  shakeInput(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.animation = 'none';
    el.offsetHeight; // trigger reflow
    el.style.animation = 'shake 0.4s ease';
    el.style.borderColor = '#ef4444';
    setTimeout(() => {
      el.style.borderColor = '';
      el.style.animation = '';
    }, 1000);
  },

  addRipple(e, btn) {
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const rect = btn.getBoundingClientRect();
    ripple.style.left = (e.clientX - rect.left) + 'px';
    ripple.style.top = (e.clientY - rect.top) + 'px';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  },

  handleNavScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  },

  // ─── FAQ Accordion ──────────────────────────────────

  initFAQ() {
    document.querySelectorAll('.faq-question').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        const answer = item.querySelector('.faq-answer');
        const isActive = item.classList.contains('active');

        // Close all
        document.querySelectorAll('.faq-item').forEach(faq => {
          faq.classList.remove('active');
          faq.querySelector('.faq-answer').style.maxHeight = '0';
        });

        // Toggle current
        if (!isActive) {
          item.classList.add('active');
          answer.style.maxHeight = answer.scrollHeight + 'px';
        }
      });
    });
  },

  // ─── AI Chat ────────────────────────────────────────

  initChat() {
    const toggle = document.getElementById('ai-chat-toggle');
    const panel = document.getElementById('ai-chat-panel');
    const input = document.getElementById('ai-chat-input');
    const sendBtn = document.getElementById('ai-chat-send');

    if (!toggle || !panel) return;

    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      panel.classList.toggle('open');
      if (panel.classList.contains('open')) {
        input?.focus();
      }
    });

    const sendMessage = () => {
      const msg = input?.value.trim();
      if (!msg) return;
      this.addChatMessage(msg, 'user');
      input.value = '';
      this.sendToAI(msg);
    };

    sendBtn?.addEventListener('click', sendMessage);
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  },

  addChatMessage(text, type = 'ai') {
    const container = document.getElementById('ai-chat-messages');
    if (!container) return;

    const msg = document.createElement('div');
    msg.className = `chat-message chat-message--${type}`;
    msg.textContent = text;
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
    return msg;
  },

  addLoadingMessage() {
    const container = document.getElementById('ai-chat-messages');
    if (!container) return;

    const msg = document.createElement('div');
    msg.className = 'chat-message chat-message--ai chat-message--loading';
    msg.id = 'chat-loading';
    msg.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
    return msg;
  },

  removeLoadingMessage() {
    document.getElementById('chat-loading')?.remove();
  },

  async sendToAI(message) {
    const sendBtn = document.getElementById('ai-chat-send');
    if (sendBtn) sendBtn.disabled = true;

    this.addLoadingMessage();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });

      this.removeLoadingMessage();

      if (response.ok) {
        const data = await response.json();
        this.addChatMessage(data.reply || 'I apologize, I could not process that request.', 'ai');
      } else {
        // Fallback: provide a helpful offline response
        this.addChatMessage(this.getOfflineResponse(message), 'ai');
      }
    } catch (err) {
      this.removeLoadingMessage();
      // Offline fallback
      this.addChatMessage(this.getOfflineResponse(message), 'ai');
    }

    if (sendBtn) sendBtn.disabled = false;
  },

  /**
   * Offline fallback — rule-based responses when AI API is unavailable
   */
  getOfflineResponse(question) {
    const q = question.toLowerCase();

    if (q.includes('ctc') && q.includes('in-hand') || q.includes('take home') || q.includes('take-home')) {
      return 'CTC (Cost to Company) is the total annual cost your employer spends. Your in-hand salary = Gross Salary - Income Tax - Employee EPF - Professional Tax. Use the calculator above to get your exact breakdown!';
    }
    if (q.includes('hra') || q.includes('house rent')) {
      return 'HRA (House Rent Allowance) exemption is the minimum of: (1) Actual HRA received, (2) Rent paid minus 10% of basic salary, (3) 50% of basic for metro cities or 40% for non-metro. This exemption is only available under the Old Tax Regime.';
    }
    if (q.includes('epf') || q.includes('provident fund')) {
      return 'Both employer and employee contribute 12% of basic salary to EPF. If basic > ₹15,000/month, the employer may contribute either 12% of ₹15,000 (₹1,800) or 12% of full basic. Employee EPF contribution qualifies for 80C deduction under the old regime.';
    }
    if (q.includes('old') && q.includes('new') || q.includes('regime') || q.includes('which')) {
      return 'The New Tax Regime (default for FY 2026-27) has lower rates but fewer deductions. The Old Regime allows HRA exemption, 80C (₹1.5L), 80D, LTA exemptions. Compare both using our calculator to find which saves you more!';
    }
    if (q.includes('gratuity')) {
      return 'Gratuity = (15/26) × Last Basic Salary × Years of Service. You can receive gratuity after completing 5 years of continuous service. The annual gratuity set-aside is deducted from CTC.';
    }
    if (q.includes('professional tax') || q.includes('prof tax')) {
      return 'Professional Tax is a state-level tax capped at ₹2,500/year. Most states charge ₹200/month (₹2,400/year). It is deducted from your gross salary.';
    }
    if (q.includes('80c') || q.includes('section 80')) {
      return 'Under Section 80C (Old Regime only), you can claim up to ₹1,50,000 deduction for investments like EPF, PPF, ELSS, LIC premiums, home loan principal, tuition fees, etc.';
    }
    if (q.includes('tax slab') || q.includes('income tax')) {
      return 'For FY 2026-27 New Regime: Up to ₹4L = Nil, ₹4-8L = 5%, ₹8-12L = 10%, ₹12-16L = 15%, ₹16-20L = 20%, ₹20-24L = 25%, Above ₹24L = 30%. Standard deduction of ₹75,000. Zero tax up to ₹12.75L effectively.';
    }
    if (q.includes('marginal relief')) {
      return 'Marginal relief applies when your income is just above ₹12 lakh (New Regime). Your tax won\'t exceed the amount by which your income exceeds ₹12 lakh. This relief applies up to ₹12.75 lakh.';
    }
    if (q.includes('basic salary') || q.includes('basic pay')) {
      return 'Basic Salary is typically 40-50% of CTC. It\'s the fixed base component that determines HRA, EPF contributions, and gratuity. It is fully taxable. Our calculator uses 50% of CTC as the default basic salary.';
    }

    return 'I can answer questions about Indian salary components, CTC, take-home salary, tax regimes, HRA, EPF, 80C deductions, and more. Try asking something specific like "What is the difference between CTC and in-hand salary?" or "How is HRA exemption calculated?"';
  }
};

// ─── Shake animation (injected via JS for clean CSS) ────────────────────
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-8px); }
    40% { transform: translateX(8px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(4px); }
  }
`;
document.head.appendChild(shakeStyle);

// ─── Initialize ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  UI.init();
});
