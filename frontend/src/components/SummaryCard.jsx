import React from 'react';

export default function SummaryCard({ summary, keyDecisions }) {
  return (
    <div className="card-flat">
      <div className="card-title">Summary & Key Decisions</div>

      <div style={{ marginBottom: '24px' }}>
        <p className="summary-text">
          {summary || 'No summary available yet.'}
        </p>
      </div>

      {keyDecisions && keyDecisions.length > 0 && (
        <div>
          <div className="stepper-header" style={{ marginBottom: '10px' }}>
            Decisions ({keyDecisions.length})
          </div>
          <ul className="decisions-list">
            {keyDecisions.map((decision, index) => (
              <li key={index} className="decision-item">
                <span className="decision-bullet">—</span>
                <div>{decision}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
