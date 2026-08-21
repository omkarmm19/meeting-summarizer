import React, { useState } from 'react';
import { loginUser, signupUser } from '../api/client';

export default function AuthModal({ onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fillDemoAccount = () => {
    setEmail('om@gmail.com');
    setPassword('omkar123');
    setMode('login');
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const data = await signupUser({
          email: email.trim(),
          password,
          full_name: fullName.trim() || null,
        });
        onAuthSuccess(data.user);
      } else {
        const data = await loginUser({
          email: email.trim(),
          password,
        });
        onAuthSuccess(data.user);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay-split">
      <div className="auth-split-wrapper">
        {/* Left Side: Product Editorial Hero */}
        <div className="auth-hero-panel">
          <div className="auth-hero-top">
            <div className="auth-brand-badge">
              <div className="brand-icon-box" style={{ width: '32px', height: '32px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                </svg>
              </div>
              <span className="brand-title" style={{ fontSize: '1.35rem' }}>Meeting Summarizer</span>
            </div>

            <h1 className="auth-hero-headline">
              Turn audio recordings into actionable intelligence.
            </h1>
            <p className="auth-hero-desc">
              Upload any team sync, standup, or client conversation to automatically produce structured summaries, key decisions, and deadline-tracked action items.
            </p>
          </div>

          <div className="auth-features-list">
            <div className="auth-feature-item">
              <div className="feature-bullet-icon">🎙️</div>
              <div>
                <div className="feature-title">Speech-to-Text Transcription</div>
                <div className="feature-sub">Whisper ASR with search & copy support</div>
              </div>
            </div>

            <div className="auth-feature-item">
              <div className="feature-bullet-icon">⚡</div>
              <div>
                <div className="feature-title">Structured Executive Summaries</div>
                <div className="feature-sub">Key takeaways & critical decisions synthesized</div>
              </div>
            </div>

            <div className="auth-feature-item">
              <div className="feature-bullet-icon">📋</div>
              <div>
                <div className="feature-title">Assignee & Deadline Extraction</div>
                <div className="feature-sub">Automatic owner detection with exact timeframes</div>
              </div>
            </div>
          </div>

          <div className="auth-hero-footer">
            <button
              type="button"
              className="btn-demo-quick"
              onClick={fillDemoAccount}
              title="Pre-fill working demo account"
            >
              <span>⚡ One-Click Demo Credentials</span>
            </button>
          </div>
        </div>

        {/* Right Side: Clean Form Panel */}
        <div className="auth-form-panel">
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => {
                setMode('login');
                setErrorMessage('');
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => {
                setMode('signup');
                setErrorMessage('');
              }}
            >
              Sign up
            </button>
          </div>

          <div className="auth-panel-heading">
            <h2 className="card-heading-serif" style={{ fontSize: '1.4rem', margin: 0 }}>
              {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {mode === 'signup'
                ? 'Sign up to store and manage your meeting records.'
                : 'Enter your credentials to access your workspace.'}
            </p>
          </div>

          {errorMessage && (
            <div className="auth-error-banner">
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'signup' && (
              <div className="form-group">
                <label htmlFor="auth-fullname">Name</label>
                <input
                  id="auth-fullname"
                  type="text"
                  className="form-input"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="auth-email">Email Address</label>
              <input
                id="auth-email"
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="auth-password">Password</label>
                <button
                  type="button"
                  className="btn-toggle-password mono-text"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
              style={{ marginTop: '8px' }}
            >
              {loading ? (
                <span className="auth-spinner-wrapper">
                  <span className="spinner-small" />
                  <span>{mode === 'signup' ? 'Creating account...' : 'Signing in...'}</span>
                </span>
              ) : (
                <span>{mode === 'signup' ? 'Create Account' : 'Sign In'}</span>
              )}
            </button>
          </form>

          <div className="auth-card-footer">
            <span className="mono-text" style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              Encrypted Session • Isolated User Workspace
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
