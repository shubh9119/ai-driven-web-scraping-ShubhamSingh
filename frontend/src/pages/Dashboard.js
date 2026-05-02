import React, { useState, useEffect, useCallback } from 'react';
import './Dashboard.css';

const API_BASE = process.env.REACT_APP_API_URL || '';

const TEST_NAMES = [
  'Add a new todo item',
  'Mark a todo as complete',
  'Filter todos by status'
];

function formatDuration(ms) {
  if (!ms && ms !== 0) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

function timeAgo(iso) {
  if (!iso) return '';
  const seconds = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function Dashboard({ onBack }) {
  const [results, setResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('latest');
  const [expandedRun, setExpandedRun] = useState(null);
  const [showRawLog, setShowRawLog] = useState(null);
  const [error, setError] = useState(null);
  const [loadingTest, setLoadingTest] = useState(null);

  const fetchResults = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/results`);
      if (!res.ok) throw new Error('Failed to fetch results');
      const data = await res.json();
      setResults(data);
      setError(null);
    } catch (e) {
      setError('Cannot connect to backend. Make sure the server is running on port 4000.');
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/status`);
      const data = await res.json();
      setIsRunning(data.isRunning);
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchResults();
    fetchStatus();
  }, [fetchResults, fetchStatus]);

  // Poll while running
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      fetchStatus();
      fetchResults();
    }, 2000);
    return () => clearInterval(id);
  }, [isRunning, fetchStatus, fetchResults]);

  useEffect(() => {
    if (!isRunning) fetchResults();
  }, [isRunning, fetchResults]);

  const handleRunAll = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/run`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to start tests');
      }
    } catch (e) {
      setError(e.message || 'Failed to trigger tests. Is the backend running?');
      setIsRunning(false);
    }
  };

  const handleRunSingle = async (testName) => {
    if (isRunning) return;
    setIsRunning(true);
    setLoadingTest(testName);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/run/single`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testName }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to start test');
      }
    } catch (e) {
      setError(e.message || 'Failed to trigger test.');
      setIsRunning(false);
    } finally {
      setLoadingTest(null);
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Clear all test history? This cannot be undone.')) return;
    try {
      await fetch(`${API_BASE}/api/results`, { method: 'DELETE' });
      fetchResults();
    } catch (_) {
      setError('Failed to clear results.');
    }
  };

  const latestRun = results?.runs?.[0] || null;
  const runs = results?.runs || [];
  const latestTests = latestRun?.tests || TEST_NAMES.map(name => ({ name, status: 'pending' }));
  const passCount = latestRun?.summary?.passed ?? '—';
  const failCount = latestRun?.summary?.failed ?? '—';

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="sidebar-logo">
            <div className="logo-mark">TP</div>
            <span>TestPilot</span>
          </div>
          <nav className="sidebar-nav">
            <button className={`nav-item ${activeTab === 'latest' ? 'active' : ''}`} onClick={() => setActiveTab('latest')}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M5 8h6M5 5h3M5 11h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              Latest Results
            </button>
            <button className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              Run History
              {runs.length > 0 && <span className="nav-badge">{runs.length}</span>}
            </button>
            <button className={`nav-item ${activeTab === 'tests' ? 'active' : ''}`} onClick={() => setActiveTab('tests')}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 4h10M3 8h7M3 12h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              Test Suite
            </button>
          </nav>
        </div>
        <div className="sidebar-bottom">
          <button className="back-btn" onClick={onBack}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M13 8H3M7 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Home
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        {/* Header */}
        <header className="dash-header">
          <div>
            <h1 className="dash-title">
              {activeTab === 'latest' && 'Latest Results'}
              {activeTab === 'history' && 'Run History'}
              {activeTab === 'tests' && 'Test Suite'}
            </h1>
            <p className="dash-subtitle">
              {latestRun
                ? `Last run ${timeAgo(latestRun.completedAt)} · ${formatDate(latestRun.completedAt)}`
                : 'No runs yet — click Run All Tests to start'}
            </p>
          </div>
          <div className="header-actions">
            {runs.length > 0 && (
              <button className="btn-ghost btn-sm" onClick={handleClear}>Clear history</button>
            )}
            <button className={`run-btn ${isRunning ? 'running' : ''}`} onClick={handleRunAll} disabled={isRunning}>
              {isRunning ? (
                <><span className="spinner"></span>Running…</>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M5 3l9 5-9 5V3z" fill="currentColor"/>
                  </svg>
                  Run All Tests
                </>
              )}
            </button>
          </div>
        </header>

        {/* Loading progress bar */}
        {isRunning && (
          <div className="progress-bar-wrap">
            <div className="progress-bar"></div>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="error-banner">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M8 5v3M8 11v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}

        <div className="main-content">

          {/* ── LATEST TAB ── */}
          {activeTab === 'latest' && (
            <div className="tab-content animate-fade-in">
              {/* Summary cards */}
              <div className="summary-cards">
                <div className="summary-card">
                  <div className="summary-label">Status</div>
                  <div className={`summary-value status-value ${!latestRun ? 'neutral' : failCount === 0 ? 'pass' : 'fail'}`}>
                    {!latestRun ? 'No runs yet' : failCount === 0 ? 'All Passing' : `${failCount} Failed`}
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">Passed</div>
                  <div className="summary-value pass-val">{latestRun ? passCount : '—'}</div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">Failed</div>
                  <div className="summary-value fail-val">{latestRun ? failCount : '—'}</div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">Duration</div>
                  <div className="summary-value mono">{latestRun ? formatDuration(latestRun.duration) : '—'}</div>
                </div>
              </div>

              {/* Timestamp row */}
              {latestRun && (
                <div className="timestamp-row">
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/>
                    <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                  <span>Run started at <strong>{formatDate(latestRun.startedAt)}</strong> and completed at <strong>{formatDate(latestRun.completedAt)}</strong></span>
                </div>
              )}

              {/* Test results list */}
              <div className="results-section">
                <h2 className="results-title">Test Results</h2>
                <div className="results-list">
                  {isRunning && !latestRun ? (
                    <div className="loading-state">
                      <div className="loading-dots"><span></span><span></span><span></span></div>
                      <p>Running tests against TodoMVC…</p>
                    </div>
                  ) : (
                    latestTests.map((test, i) => (
                      <div key={i} className={`result-row ${test.status}`} style={{ animationDelay: `${i * 0.07}s` }}>
                        <div className="result-status-icon">
                          {test.status === 'passed' && (
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                              <path d="M3 8l4 4 6-7" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                          {test.status === 'failed' && (
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                              <path d="M5 5l6 6M11 5l-6 6" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round"/>
                            </svg>
                          )}
                          {test.status === 'pending' && <div className="pending-dot"></div>}
                        </div>
                        <div className="result-name">{test.name}</div>
                        <div className={`result-badge ${test.status}`}>
                          {test.status === 'pending' ? 'Pending' : test.status === 'passed' ? 'Pass' : 'Fail'}
                        </div>
                        <div className="result-duration mono">{formatDuration(test.duration)}</div>
                        {test.error && (
                          <div className="result-error">
                            <code>{test.error.slice(0, 120)}{test.error.length > 120 ? '…' : ''}</code>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Raw log for latest run */}
              {latestRun && latestRun.rawOutput && (
                <div className="raw-log-section">
                  <button
                    className="btn-ghost btn-sm"
                    onClick={() => setShowRawLog(showRawLog === 'latest' ? null : 'latest')}
                  >
                    {showRawLog === 'latest' ? '▲ Hide execution log' : '▼ Show execution log'}
                  </button>
                  {showRawLog === 'latest' && (
                    <pre className="raw-log">{latestRun.rawOutput}</pre>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── HISTORY TAB ── */}
          {activeTab === 'history' && (
            <div className="tab-content animate-fade-in">
              {runs.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <h3>No run history yet</h3>
                  <p>Run the test suite to see results appear here.</p>
                  <button className="btn-primary-sm" onClick={handleRunAll}>Run Tests</button>
                </div>
              ) : (
                <div className="history-list">
                  {runs.map((run, i) => (
                    <div key={run.id} className="history-item animate-fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
                      <div
                        className="history-header"
                        onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                      >
                        <div className="history-status-dot">
                          <div className={`dot ${run.summary.failed === 0 ? 'pass' : 'fail'}`}></div>
                        </div>
                        <div className="history-info">
                          <div className="history-date">{formatDate(run.completedAt)}</div>
                          <div className="history-meta">
                            Run #{runs.length - i}
                            {run.type === 'single' ? ' · Single test' : ' · Full suite'}
                            {' · '}{run.summary.passed}/{run.summary.total} passed
                            {' · '}{formatDuration(run.duration)}
                          </div>
                        </div>
                        <div className={`history-badge ${run.summary.failed === 0 ? 'pass' : 'fail'}`}>
                          {run.summary.failed === 0 ? 'All Passed' : `${run.summary.failed} Failed`}
                        </div>
                        <div className={`history-chevron ${expandedRun === run.id ? 'open' : ''}`}>
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </div>
                      </div>

                      {expandedRun === run.id && (
                        <div className="history-details">
                          {run.tests.map((t, j) => (
                            <div key={j} className={`history-test ${t.status}`}>
                              <span className="ht-icon">{t.status === 'passed' ? '✓' : '✗'}</span>
                              <span className="ht-name">{t.name}</span>
                              <span className="ht-dur mono">{formatDuration(t.duration)}</span>
                            </div>
                          ))}
                          {run.rawOutput && (
                            <div className="raw-log-section">
                              <button
                                className="btn-ghost btn-sm"
                                onClick={() => setShowRawLog(showRawLog === run.id ? null : run.id)}
                              >
                                {showRawLog === run.id ? '▲ Hide execution log' : '▼ Show execution log'}
                              </button>
                              {showRawLog === run.id && (
                                <pre className="raw-log">{run.rawOutput}</pre>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TESTS TAB ── */}
          {activeTab === 'tests' && (
            <div className="tab-content animate-fade-in">
              <div className="tests-info">
                <div className="info-box">
                  <span className="info-label">Target URL</span>
                  <a href="https://demo.playwright.dev/todomvc/" target="_blank" rel="noreferrer" className="info-value link">
                    demo.playwright.dev/todomvc ↗
                  </a>
                </div>
                <div className="info-box">
                  <span className="info-label">Framework</span>
                  <span className="info-value">Playwright · Chromium</span>
                </div>
                <div className="info-box">
                  <span className="info-label">Test File</span>
                  <code className="info-value mono">tests/todo.spec.js</code>
                </div>
              </div>

              <div className="test-suite-list">
                {TEST_NAMES.map((name, i) => {
                  const lastResult = latestRun?.tests?.find(t => t.name === name);
                  const descriptions = [
                    'Types a new todo item, presses Enter, and verifies it appears in the list with a count of 1.',
                    'Adds a todo, clicks the toggle checkbox, and confirms the item receives the completed class with 0 items remaining.',
                    'Adds two todos, completes one, then verifies the Active, Completed, and All filter links work correctly.'
                  ];
                  return (
                    <div key={i} className="test-suite-item animate-fade-in" style={{ animationDelay: `${i * 0.08}s` }}>
                      <div className="tsi-number">0{i + 1}</div>
                      <div className="tsi-content">
                        <div className="tsi-name">{name}</div>
                        <div className="tsi-desc">{descriptions[i]}</div>
                        {lastResult && (
                          <div className={`tsi-last-result ${lastResult.status}`}>
                            Last run: {lastResult.status} · {formatDuration(lastResult.duration)}
                          </div>
                        )}
                      </div>
                      <button
                        className={`run-single-btn ${loadingTest === name ? 'loading' : ''}`}
                        onClick={() => handleRunSingle(name)}
                        disabled={isRunning}
                        title="Run this test only"
                      >
                        {loadingTest === name ? (
                          <span className="spinner-sm"></span>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                            <path d="M5 3l9 5-9 5V3z" fill="currentColor"/>
                          </svg>
                        )}
                        {loadingTest === name ? 'Running' : 'Run'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
