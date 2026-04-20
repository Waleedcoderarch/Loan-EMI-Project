# Loan EMI & Comparison Tool

A professional, offline-capable, browser-based Loan EMI calculator that helps borrowers understand the full cost of loans, compare banks, and simulate prepayments — all without a server. Ideal for demos, final year projects, and lightweight financial tools.
View Website------https://loan-emi-project.vercel.app/
---

## Problem Statement

Every day, millions take loans without fully understanding the total cost. Banks advertise EMIs but rarely expose the real interest burden or how changing the bank or tenure affects total cost. This tool puts the full picture in front of the borrower so they can make informed decisions before signing.

---

## Core Features

1. EMI Calculator
	- Calculates EMI using the standard formula:

	  $$ EMI = P \times r \times \frac{(1+r)^n}{(1+r)^n - 1} $$

	  Where:
	  - $P$ = Principal
	  - $r$ = Monthly rate = (annual rate ÷ 12 ÷ 100)
	  - $n$ = Tenure in months
	- Shows monthly EMI, total amount paid, and total interest instantly.

2. Multi-Bank Comparison Table
	- Add multiple banks with rates to compare EMI, total interest, and total paid side-by-side.
	- Highlights the lowest-cost option and shows savings compared to others.

3. Amortization Schedule
	- Full month-by-month breakdown: EMI, principal portion, interest portion, remaining balance.
	- Toggle monthly/yearly views to summarize long tenures.

4. Visual Charts
	- Pie Chart: Principal vs Total Interest
	- Bar Chart: Total interest comparison across banks
	- Line Chart: Outstanding balance (amortization curve)

5. Prepayment Impact Simulator
	- Simulate lump-sum prepayments (e.g., ₹20,000 in month 6).
	- Outputs months saved and interest saved.

6. Loan Type Presets
	- Presets: Home, Car, Education, Personal with sensible defaults for quick demos.

7. PDF Report Export
	- Generate a one-click PDF containing inputs, comparison table, charts, and amortization schedule using `html2canvas` + `jsPDF`.

8. Currency & Language Support
	- Support for ₹ (INR), $ (USD), € (EUR) and optional regional label translations for accessibility.

9. Saved Comparisons (localStorage)
	- Save and load comparison sessions locally — no cloud, no login.

10. Share via URL
	- Encode inputs as query parameters so comparisons can be shared via messaging apps.

---

## Tech Stack (Why these choices)

- Markup: HTML5 — semantic, accessible, and universal.
- Styling: Tailwind CSS (CDN) + small custom overrides — fast responsive UI without a build step.
- Logic: Vanilla JavaScript (ES6+) — zero build, zero node, runs from `index.html` directly.
- Charts: Chart.js (CDN) — lightweight, flexible charts.
- PDF Export: jsPDF + html2canvas (CDN) — client-side PDF generation.
- Icons: Lucide (CDN) — clean SVG icons.
- Fonts: Google Fonts (Inter/Poppins) — professional typography.

Why not React? This project intentionally avoids a build step so it can be run from a USB drive or GitHub Pages without installing anything. That makes it robust for demos and offline classrooms.

---

## Recommended File Structure

loan-emi-tool/
├── index.html              ← Single-page app
├── css/
│   └── styles.css         ← Tailwind overrides & custom styles
├── js/
│   ├── calculator.js      ← EMI formula & amortization
│   ├── comparison.js      ← Multi-bank comparison logic
│   ├── charts.js          ← Chart initialization & rendering
│   ├── prepayment.js      ← Prepayment simulation
│   ├── export.js          ← PDF & share URL generation
│   ├── storage.js         ← localStorage save/load
│   └── ui.js              ← DOM interactions & theme toggles
├── assets/
│   ├── favicon.svg
│   └── og-image.png       ← Open Graph image for sharing
└── README.md

---

## CDN Libraries (no install required)

Include in `index.html` head or before closing `body`:

```html
<!-- Tailwind CSS -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- Chart.js -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<!-- jsPDF + html2canvas -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>

<!-- Lucide icons -->
<script src="https://unpkg.com/lucide@latest"></script>
```

---

## UX / Page Sections

- Hero / Input Panel: presets, principal, rate, tenure, instant EMI display.
- Your Results: large EMI number, total interest, total paid, pie chart.
- Bank Comparison: add bank modal, comparison table, bar chart, "Best" badge.
- Amortization: month-by-month table, toggle view, line chart.
- Prepayment Simulator: month + amount input, months saved + interest saved.
- Export & Share: PDF export, copy shareable URL, save session.

---

## Sample Bank Presets (demo data)

Use these pre-loaded rates for demo scenarios:

```js
const BANK_PRESETS = [
  { name: 'SBI',         homeLoan: 8.50, carLoan: 9.15, personalLoan: 12.30 },
  { name: 'HDFC Bank',   homeLoan: 8.75, carLoan: 9.40, personalLoan: 13.50 },
  { name: 'ICICI Bank',  homeLoan: 8.75, carLoan: 9.30, personalLoan: 13.00 },
  { name: 'Axis Bank',   homeLoan: 8.75, carLoan: 9.25, personalLoan: 13.25 },
  { name: 'Kotak Bank',  homeLoan: 8.65, carLoan: 9.25, personalLoan: 14.00 },
  { name: 'Bank of Baroda', homeLoan: 8.40, carLoan: 9.15, personalLoan: 13.15 },
];
```

---

## Sample Usage (Quick Demo)

1. Open `index.html` in a modern browser.
2. Select a preset (e.g., Home Loan ₹50,00,000, 20 years).
3. Add banks to compare and observe EMI & interest differences.
4. Run a prepayment simulation to see months and interest saved.
5. Export a PDF report to share or negotiate with a lender.

---

## Project Report / Final Year Submission Outline

Suggested chapters for documentation:

1. Introduction — problem, motivation, objectives
2. Literature Survey — existing calculators and gaps
3. System Analysis — requirements, feasibility
4. System Design — architecture, wireframes, data flows
5. Implementation — key algorithms (EMI derivation), charts, PDF export
6. Testing — unit/functional test approach and results
7. Results & Discussion — screenshots, sample comparisons, user feedback
8. Conclusion & Future Work — API integration, reminders, notifications

---

## Why this stands out in a Viva

- Derived from first principles — you can explain the EMI math.
- Demonstrates measurable impact — show monetary savings between banks.
- Offline-capable and fast on low-end devices.
- Practical export (PDF) makes this useful beyond a demo.

---

## Testing & Validation

Manual checklist:

- Verify EMI and totals against trusted calculators for sample inputs.
- Verify charts display expected shapes (balance should steadily decrease).
- Validate prepayment scenarios produce sensible months/interest saved.
- Confirm PDF output matches the on-screen report.

Automated tests: extract `calcEMI` and `generateAmortization` into `calculator.js` and add unit tests using Jest or your preferred runner.

---

## License

Add an appropriate `LICENSE` file if you plan to open-source; MIT is a common choice.

---

If you'd like, I can:

- Convert this README into a shorter one-page marketing README.
- Add example screenshots into a `docs/` folder and embed them.
- Split the JavaScript into the `js/` modules listed above and scaffold the folder structure.

Tell me which of the above you'd like next and I'll implement it.