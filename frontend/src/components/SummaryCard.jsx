import React from 'react';

export default function SummaryCard({ summary, keyDecisions }) {
  return (
    <div className="glass-card">
      <div className="card-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        <span>Executive Summary & Key Decisions</span>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--accent-cyan)', letterSpacing: '0.05em', marginBottom: '8px' }}>
          Overview
        </h4>
        <p style={{ fontSize: '0.98rem', lineHeight: '1.7', color: 'var(--text-main)' }}>
          {summary || 'No summary available yet.'}
        </p>
      </div>

      {keyDecisions && keyDecisions.length > 0 && (
        <div>
          <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--secondary)', letterSpacing: '0.05em', marginBottom: '12px' }}>
            Key Decisions Made ({keyDecisions.length})
          </h4>
          <div className="decisions-list">
            {keyDecisions.map((decision, index) => (
              <div key={index} className="decision-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <div className="decision-text">{decision}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
