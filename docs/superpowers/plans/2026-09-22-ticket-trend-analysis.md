# 客服工单趋势分析 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reproducible, zero-dependency Chinese ticket-trend dashboard that opens directly from `index.html` and documents evidence-backed anomalies from 50 tickets.

**Architecture:** Keep raw data in `data/tickets.json`, pure aggregation and anomaly rules in `src/analysis.js`, browser rendering in `src/dashboard.js`, and generate the distributable `index.html` by inlining source files into a template. Node's built-in test runner covers the pure analysis layer.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Node.js built-in `node:test`, inline SVG.

---

### Task 1: Lock analysis behavior with tests

**Files:**
- Create: `tests/analysis.test.js`
- Create: `src/analysis.js`
- Create: `data/tickets.json`

- [ ] Write tests for ticket count, category aggregation, high-priority unresolved count, and anomaly selection.
- [ ] Run `npm test` and observe failure because analysis exports do not exist yet.
- [ ] Implement pure aggregation functions with explicit thresholds.
- [ ] Run `npm test` and confirm all assertions pass.

### Task 2: Build the static dashboard

**Files:**
- Create: `src/dashboard.js`
- Create: `index.template.html`
- Create: `scripts/build.js`
- Create: `package.json`

- [ ] Render KPI values, inline SVG charts, anomaly tabs, and ticket table from the shared data and analysis output.
- [ ] Run `npm run build` to create a self-contained `index.html`.
- [ ] Open the generated file through a local HTTP server and inspect desktop/mobile layout.

### Task 3: Document and capture deliverables

**Files:**
- Modify: `README.md`
- Create: `outputs/development-process.png`
- Create: `outputs/dashboard-result.png`

- [ ] Document dimensions, decision value, findings, anomaly evidence, AI use, and local run commands.
- [ ] Capture a development-tool screenshot and a dashboard-result screenshot.

### Task 4: Verify and commit

- [ ] Run `npm test` and `npm run build` from a clean command invocation.
- [ ] Check that `index.html` contains embedded data and no network dependency.
- [ ] Review `git diff --check` and commit all project files.
