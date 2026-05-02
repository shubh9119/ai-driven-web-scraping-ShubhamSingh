import React, { useEffect, useRef } from 'react';
import './LandingPage.css';

const features = [
  {
    icon: '⚡',
    title: 'Instant Test Execution',
    desc: 'Trigger your entire Playwright test suite with a single click. Watch results stream in real-time.'
  },
  {
    icon: '📊',
    title: 'Live Results Dashboard',
    desc: 'Pass/fail status, execution times, and error details displayed in a clean, scannable interface.'
  },
  {
    icon: '🕓',
    title: 'Run History',
    desc: 'Track every test run with timestamps. See trends and catch regressions before they ship.'
  },
  {
    icon: '🎯',
    title: 'Individual Test Control',
    desc: 'Run the full suite or isolate individual tests. Pin down failures with surgical precision.'
  },
  {
    icon: '🔍',
    title: 'Error Diagnostics',
    desc: 'Detailed error messages and stack traces surfaced directly in the UI — no terminal diving needed.'
  },
  {
    icon: '🛡️',
    title: 'Reliable Automation',
    desc: 'Built on Playwright — the gold standard for end-to-end testing, with cross-browser support.'
  }
];

const tests = [
  { name: 'Add a new todo item', desc: 'Verifies the core input and list rendering flow' },
  { name: 'Mark a todo as complete', desc: 'Tests checkbox interaction and state update' },
  { name: 'Filter todos by status', desc: 'Validates Active, Completed, and All filters' }
];

function LandingPage({ onEnter }) {
  const heroRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing">
      {/* Nav */}
      <nav className="landing-nav">
        <div className="nav-inner">
          <div className="nav-logo">
            <span className="logo-mark">TP</span>
            <span className="logo-text">TestPilot</span>
          </div>
          <div className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#tests" className="nav-link">Test Suite</a>
            <a href="#stack" className="nav-link">Stack</a>
            <button className="nav-cta" onClick={onEnter}>Open Dashboard →</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero" ref={heroRef}>
        <div className="hero-inner">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            Playwright · React · Node.js · Express
          </div>
          <h1 className="hero-title">
            Test automation,<br />
            <span className="hero-title-accent">beautifully surfaced.</span>
          </h1>
          <p className="hero-subtitle">
            A full-stack web testing dashboard that runs Playwright tests against TodoMVC
            and presents results in a clean, professional interface. Built for engineers
            who care about clarity.
          </p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={onEnter}>
              Open Dashboard
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <a href="https://playwright.dev" target="_blank" rel="noreferrer" className="btn-secondary">
              Playwright Docs ↗
            </a>
          </div>
          <div className="hero-stat-row">
            <div className="hero-stat">
              <span className="stat-num">3</span>
              <span className="stat-label">Automated tests</span>
            </div>
            <div className="stat-divider"></div>
            <div className="hero-stat">
              <span className="stat-num">1</span>
              <span className="stat-label">Click to run</span>
            </div>
            <div className="stat-divider"></div>
            <div className="hero-stat">
              <span className="stat-num">∞</span>
              <span className="stat-label">Runs stored</span>
            </div>
          </div>
        </div>

        {/* Hero visual */}
        <div className="hero-visual">
          <div className="dashboard-preview">
            <div className="preview-bar">
              <span className="preview-dot red"></span>
              <span className="preview-dot amber"></span>
              <span className="preview-dot green"></span>
              <span className="preview-title">TestPilot Dashboard</span>
            </div>
            <div className="preview-body">
              <div className="preview-header-row">
                <div className="preview-badge pass">All Passing</div>
                <div className="preview-run-btn">Run Tests</div>
              </div>
              {tests.map((t, i) => (
                <div className="preview-test-row" key={i} style={{ animationDelay: `${i * 0.15}s` }}>
                  <div className="preview-check">✓</div>
                  <div className="preview-test-name">{t.name}</div>
                  <div className="preview-duration">{(1.2 + i * 0.4).toFixed(1)}s</div>
                </div>
              ))}
              <div className="preview-footer">
                <span>Last run: just now</span>
                <span>3 passed · 0 failed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section" id="features">
        <div className="section-inner">
          <div className="section-header reveal">
            <span className="section-tag">Capabilities</span>
            <h2 className="section-title">Everything you need, nothing you don't.</h2>
            <p className="section-desc">A focused feature set designed to make test results legible and actionable.</p>
          </div>
          <div className="features-grid">
            {features.map((f, i) => (
              <div className="feature-card reveal" key={i} style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Test Suite */}
      <section className="section section-alt" id="tests">
        <div className="section-inner">
          <div className="section-header reveal">
            <span className="section-tag">Test Suite</span>
            <h2 className="section-title">Three tests. Comprehensive coverage.</h2>
            <p className="section-desc">Testing against <a href="https://demo.playwright.dev/todomvc/" target="_blank" rel="noreferrer" className="inline-link">demo.playwright.dev/todomvc</a> — the canonical Playwright demo app.</p>
          </div>
          <div className="tests-list">
            {tests.map((t, i) => (
              <div className="test-item reveal" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="test-number">0{i + 1}</div>
                <div className="test-content">
                  <h3 className="test-name">{t.name}</h3>
                  <p className="test-desc">{t.desc}</p>
                </div>
                <div className="test-status-badge">Automated</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stack */}
      <section className="section" id="stack">
        <div className="section-inner">
          <div className="section-header reveal">
            <span className="section-tag">Tech Stack</span>
            <h2 className="section-title">Built with the right tools.</h2>
          </div>
          <div className="stack-grid reveal">
            {[
              { name: 'Playwright', role: 'Test Automation', color: '#45ba4b' },
              { name: 'React', role: 'Frontend UI', color: '#61dafb' },
              { name: 'Node.js', role: 'Runtime', color: '#339933' },
              { name: 'Express', role: 'Backend API', color: '#000000' },
              { name: 'JSON', role: 'Data Storage', color: '#f7df1e' },
              { name: 'CSS3', role: 'Styling', color: '#2965f1' }
            ].map((s, i) => (
              <div className="stack-card" key={i}>
                <div className="stack-dot" style={{ background: s.color }}></div>
                <div className="stack-name">{s.name}</div>
                <div className="stack-role">{s.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-inner reveal">
          <h2 className="cta-title">Ready to run your tests?</h2>
          <p className="cta-desc">Click below to open the dashboard and trigger your first test run.</p>
          <button className="btn-primary btn-large" onClick={onEnter}>
            Launch Dashboard
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-logo">
            <span className="logo-mark small">TP</span>
            <span>TestPilot</span>
          </div>
          <p className="footer-note">Built for Green Letter Technologies · Assignment Submission</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
