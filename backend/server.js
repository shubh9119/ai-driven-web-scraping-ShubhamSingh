const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 4001;
const RESULTS_FILE = path.join(__dirname, "test-results.json");
const REPORTS_DIR = path.join(__dirname, "reports");

// Serve playwright test-results (screenshots) statically
app.use("/screenshots", express.static(path.join(__dirname, "..", "test-results")));
app.use("/reports", express.static(REPORTS_DIR));

// Ensure required dirs exist
if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });

app.use(cors());
app.use(express.json());

// Initialize results file
if (!fs.existsSync(RESULTS_FILE)) {
  fs.writeFileSync(RESULTS_FILE, JSON.stringify({ runs: [] }, null, 2));
}

let isRunning = false;

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse Playwright JSON reporter output into a normalised test array.
 * Handles both flat (suite.specs) and nested (suite.suites[].specs) layouts.
 */
function parsePlaywrightJSON(jsonStr) {
  const root = JSON.parse(jsonStr);
  const tests = [];

  function processSuite(suite) {
    if (suite.specs) {
      suite.specs.forEach((spec) => {
        const result = spec.tests && spec.tests[0] && spec.tests[0].results && spec.tests[0].results[0];
        const status =
          result && result.status === "passed"
            ? "passed"
            : result && result.status === "skipped"
            ? "skipped"
            : "failed";

        const screenshots = result && result.attachments
          ? result.attachments
              .filter((a) => a.contentType === "image/png" && a.path)
              .map((a) => `/screenshots/${path.basename(a.path)}`)
          : [];

        tests.push({
          name: spec.title,
          status,
          duration: (result && result.duration) || 0,
          error:
            result && result.error && result.error.message
              ? result.error.message.slice(0, 500)
              : null,
          screenshots,
          retries: (result && result.retry) || 0,
        });
      });
    }
    if (suite.suites) {
      suite.suites.forEach(processSuite);
    }
  }

  (root.suites || []).forEach(processSuite);
  return tests;
}

/**
 * Run Playwright tests, save structured results, clear isRunning flag.
 */
function runTests(runId, startedAt, grepPattern) {
  const reportFile = path.join(REPORTS_DIR, `${runId}.json`);
  const testFile = path.join(__dirname, "..", "tests", "todo.spec.js");
  const grepArg = grepPattern
    ? `--grep "${grepPattern.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`
    : "";

  const cmd = [
    "npx playwright test",
    testFile,
    grepArg,
    "--reporter=json",
  ].join(" ");

  exec(
    cmd,
    {
      cwd: path.join(__dirname, ".."),
      timeout: 120000,
      env: {
        ...process.env,
        PLAYWRIGHT_JSON_OUTPUT_NAME: reportFile,
      },
    },
    (error, stdout, stderr) => {
      isRunning = false;
      const completedAt = new Date().toISOString();
      let tests = [];

      // 1. Parse JSON report file written by the reporter
      if (fs.existsSync(reportFile)) {
        try {
          tests = parsePlaywrightJSON(fs.readFileSync(reportFile, "utf8"));
        } catch (e) {
          console.warn("Report file parse failed:", e.message);
        }
      }

      // 2. Fallback: extract JSON block from stdout
      if (tests.length === 0) {
        try {
          const match = stdout.match(/\{[\s\S]*"suites"[\s\S]*\}/);
          if (match) tests = parsePlaywrightJSON(match[0]);
        } catch (e) {
          console.warn("Stdout JSON parse failed:", e.message);
        }
      }

      // 3. Final fallback: infer from stdout text
      if (tests.length === 0) {
        const knownTests = grepPattern
          ? [grepPattern]
          : ["Add a new todo item", "Mark a todo as complete", "Filter todos by status"];
        const lines = (stdout + stderr).split("\n");
        knownTests.forEach((name) => {
          const passed = lines.some(
            (l) => (l.includes("✓") || l.includes("passed")) && l.toLowerCase().includes(name.toLowerCase())
          );
          const failed = lines.some(
            (l) =>
              (l.includes("✗") || l.includes("×") || l.includes("FAILED") || l.includes("failed")) &&
              l.toLowerCase().includes(name.toLowerCase())
          );
          tests.push({
            name,
            status: failed ? "failed" : passed ? "passed" : error ? "failed" : "passed",
            duration: 0,
            error: failed ? "Test assertion failed — see raw output for details." : null,
            screenshots: [],
            retries: 0,
          });
        });
      }

      const passed = tests.filter((t) => t.status === "passed").length;
      const failed = tests.filter((t) => t.status === "failed").length;
      const skipped = tests.filter((t) => t.status === "skipped").length;

      const run = {
        id: runId,
        startedAt,
        completedAt,
        duration: new Date(completedAt) - new Date(startedAt),
        type: grepPattern ? "single" : "full",
        summary: { total: tests.length, passed, failed, skipped },
        tests,
        rawOutput: (stdout + "\n" + stderr).slice(0, 5000),
        reportFile: fs.existsSync(reportFile) ? `/reports/${runId}.json` : null,
      };

      try {
        const data = JSON.parse(fs.readFileSync(RESULTS_FILE, "utf8"));
        data.runs.unshift(run);
        if (data.runs.length > 50) data.runs = data.runs.slice(0, 50);
        fs.writeFileSync(RESULTS_FILE, JSON.stringify(data, null, 2));
      } catch (e) {
        console.error("Failed to save results:", e.message);
      }
    }
  );
}

// ── Routes ───────────────────────────────────────────────────────────────────

// GET /api/health — health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// GET /api/status — is a test suite currently running?
app.get("/api/status", (req, res) => {
  res.json({ isRunning });
});

// GET /api/results — return all stored run history
app.get("/api/results", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(RESULTS_FILE, "utf8"));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to read results.", details: err.message });
  }
});

// GET /api/results/:runId — return a single run by ID
app.get("/api/results/:runId", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(RESULTS_FILE, "utf8"));
    const run = data.runs.find((r) => r.id === req.params.runId);
    if (!run) return res.status(404).json({ error: "Run not found." });
    res.json(run);
  } catch (err) {
    res.status(500).json({ error: "Failed to read results.", details: err.message });
  }
});

// POST /api/run — trigger the full test suite
app.post("/api/run", (req, res) => {
  if (isRunning) {
    return res.status(409).json({ error: "Tests are already running. Please wait for the current run to finish." });
  }
  const runId = uuidv4();
  const startedAt = new Date().toISOString();
  isRunning = true;
  res.json({ message: "Full test suite started.", runId, startedAt });
  runTests(runId, startedAt, null);
});

// POST /api/run/single — trigger a specific test by name
app.post("/api/run/single", (req, res) => {
  if (isRunning) {
    return res.status(409).json({ error: "Tests are already running. Please wait for the current run to finish." });
  }
  const { testName } = req.body;
  if (!testName || typeof testName !== "string" || !testName.trim()) {
    return res.status(400).json({ error: "testName (string) is required in the request body." });
  }
  const runId = uuidv4();
  const startedAt = new Date().toISOString();
  isRunning = true;
  res.json({ message: `Test "${testName}" started.`, runId, startedAt });
  runTests(runId, startedAt, testName.trim());
});

// DELETE /api/results — wipe all history and report files
app.delete("/api/results", (req, res) => {
  try {
    fs.writeFileSync(RESULTS_FILE, JSON.stringify({ runs: [] }, null, 2));
    if (fs.existsSync(REPORTS_DIR)) {
      fs.readdirSync(REPORTS_DIR).forEach((f) => {
        const fp = path.join(REPORTS_DIR, f);
        try { if (fs.statSync(fp).isFile()) fs.unlinkSync(fp); } catch (_) {}
      });
    }
    res.json({ message: "All test results cleared successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear results.", details: err.message });
  }
});

// 404 for unknown API paths
app.use("/api/*", (req, res) => {
  res.status(404).json({ error: `Endpoint ${req.method} ${req.originalUrl} not found.` });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📁 Results stored at: ${RESULTS_FILE}`);
  console.log(`📂 Reports dir: ${REPORTS_DIR}`);
});
