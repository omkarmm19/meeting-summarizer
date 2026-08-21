import React from 'react';

export default function SummaryCard({ summary, keyDecisions }) {
  return (
    <div className="card-flat card-summary-primary card-interactive">
      <div style={{ marginBottom: '20px' }}>
        <span className="section-label">Executive Overview</span>
        <h2 className="card-heading-serif">Meeting Summary</h2>
        <p className="summary-body-text">
          {summary || 'No summary available yet.'}
        </p>
      </div>

      {keyDecisions && keyDecisions.length > 0 && (
        <div className="summary-decisions-block">
          <span className="section-label">Key Decisions Made ({keyDecisions.length})</span>
          <ul className="decisions-list">
            {keyDecisions.map((decision, index) => (
              <li key={index} className="decision-item">
                <span className="decision-bullet">—</span>
                <span className="decision-content">{decision}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
