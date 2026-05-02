# TestPilot — Playwright Test Automation Dashboard

A full-stack web testing dashboard that runs automated Playwright tests against [TodoMVC](https://demo.playwright.dev/todomvc/) and displays results in a clean, professional UI.

---

##  Demo Video

> **[▶ Watch the Demo Video](YOUR_VIDEO_LINK_HERE)**
>
> _Record a 5–10 minute walkthrough covering architecture, Playwright integration, test structure, and a live demonstration of the dashboard. Upload to YouTube/Vimeo/Google Drive and replace the link above._

---

##  Quick Start

### Prerequisites

- **Node.js** v18+ ([download](https://nodejs.org/))
- **npm** v8+

### Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd playwright-dashboard

# 2. Install root dependencies (Playwright + concurrently)
npm install

# 3. Install Playwright browser(s)
npx playwright install chromium

# 4. Install backend dependencies
cd backend && npm install && cd ..

# 5. Install frontend dependencies
cd frontend && npm install && cd ..
```

### Running the Application

Open **two terminal windows**:

**Terminal 1 — Backend (port 4000)**
```bash
cd backend
npm run dev        # development (nodemon auto-restart)
# or
npm start          # production
```
You should see: ` Backend server running on http://localhost:4000`

**Terminal 2 — Frontend (port 3000)**
```bash
cd frontend
npm start
```
Browser opens automatically at `http://localhost:3000`

---

##  How to Use

1. Open `http://localhost:3000` — you'll see the **Landing Page**
2. Click **"Open Dashboard"** to enter the dashboard
3. Click **"Run All Tests"** to trigger the full Playwright suite (~15–30 seconds)
4. Watch the animated progress bar while tests execute
5. Results appear with pass/fail status, duration, and timestamps
6. Use the **Run History** tab to review all previous runs (expandable, with execution logs)
7. Use the **Test Suite** tab to run individual tests in isolation

---

## 🏗️ Architecture

```
playwright-dashboard/
├── backend/                    # Express REST API (port 4000)
│   ├── server.js               # Main server — all API routes + test runner
│   ├── reports/                # Auto-created — per-run JSON reporter files
│   ├── test-results.json       # Auto-created — persistent run history (up to 50 runs)
│   └── package.json
├── frontend/                   # React 18 SPA (port 3000)
│   └── src/
│       ├── App.js              # Root router: Landing ↔ Dashboard
│       ├── pages/
│       │   ├── LandingPage.js  # Marketing/info landing page
│       │   ├── LandingPage.css
│       │   ├── Dashboard.js    # Main dashboard — results, history, test suite
│       │   └── Dashboard.css
│       └── styles/
│           └── global.css      # CSS design system / variables
├── tests/
│   └── todo.spec.js            # 3 Playwright tests for TodoMVC
├── playwright.config.js        # Playwright configuration (chromium, headless)
├── package.json                # Root scripts + shared devDeps
└── README.md
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check — returns `{ status: "ok" }` |
| `GET` | `/api/status` | Returns `{ isRunning: boolean }` |
| `GET` | `/api/results` | Returns full run history as JSON array |
| `GET` | `/api/results/:runId` | Returns a single run by ID |
| `POST` | `/api/run` | Triggers the full 3-test suite |
| `POST` | `/api/run/single` | Runs one test; body: `{ "testName": "..." }` |
| `DELETE` | `/api/results` | Clears all stored results and report files |

### Result Storage Format

Each test run is stored as a JSON object:
```json
{
  "id": "uuid",
  "startedAt": "ISO timestamp",
  "completedAt": "ISO timestamp",
  "duration": 18432,
  "type": "full | single",
  "summary": { "total": 3, "passed": 3, "failed": 0, "skipped": 0 },
  "tests": [
    {
      "name": "Add a new todo item",
      "status": "passed",
      "duration": 4821,
      "error": null,
      "screenshots": [],
      "retries": 0
    }
  ],
  "rawOutput": "...",
  "reportFile": "/reports/<runId>.json"
}
```

---

## 🧩 Test Suite

Target: **`https://demo.playwright.dev/todomvc/`**

| # | Test Name | What It Verifies |
|---|-----------|-----------------|
| 01 | Add a new todo item | Types a todo, presses Enter, checks it appears in the list with a count of 1 |
| 02 | Mark a todo as complete | Adds a todo, clicks the toggle checkbox, verifies `.completed` class and 0 items remaining |
| 03 | Filter todos by status | Adds two todos, completes one, verifies Active/Completed/All filter links all work correctly |

---

##  Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Test Engine | **Playwright v1.40+** | Headless Chromium test automation |
| Backend | **Node.js + Express** | REST API + test orchestration |
| Frontend | **React 18** | Dashboard UI |
| Styling | **Custom CSS3** | Design system with CSS variables, no UI library |
| Storage | **JSON file** | Lightweight run persistence (no DB required) |
| Dev tooling | **nodemon** | Auto-restart backend on file change |

---

## ✅ Requirements Checklist

### Core (Required)
- [x] 3 Playwright tests targeting `https://demo.playwright.dev/todomvc/`
  - [x] Adding a new todo item
  - [x] Marking a todo as complete
  - [x] Filtering todos by status (Active / Completed / All)
- [x] Test results stored in structured JSON format
- [x] Backend endpoint to trigger tests — `POST /api/run`
- [x] Backend endpoint to return latest results — `GET /api/results`
- [x] Proper error handling on all API endpoints
- [x] Frontend dashboard with pass/fail status per test
- [x] "Run All Tests" button to trigger execution
- [x] Loading state (animated progress bar + spinner) while tests run
- [x] Timestamp of most recent test run displayed prominently

### Optional (Bonus — all implemented)
- [x] Test history view — **Run History** tab with expandable run details
- [x] Execution logs — raw Playwright output viewable per run
- [x] Individual test execution — **Test Suite** tab with per-test Run button

---

## 🤖 AI Tools + StackOverflow + Playwright Documentaion are used:

This project was developed with assistance from **Claude (Anthropic)** + **StackOverflow** + **Playwright Documentation**:
- Architecture planning and API design decisions
- Code generation for backend routes and frontend components
- Debugging Playwright JSON reporter parsing edge cases
- README and documentation writing

Code was reviewed, tested, and refined manually.

---

*Built for Green Letter Technologies · Take-Home Assignment*
*Repository: `ai-driven-web-scraping-<YourName>`*
