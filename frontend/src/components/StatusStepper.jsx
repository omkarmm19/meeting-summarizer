import React from 'react';

const STEPS = [
  { key: 'pending', label: 'Uploaded' },
  { key: 'transcribing', label: 'Transcribing (Whisper)' },
  { key: 'summarizing', label: 'Summarizing (Groq LLM)' },
  { key: 'done', label: 'Completed' },
];

export default function StatusStepper({ status, errorMessage }) {
  const getStepState = (stepKey, index) => {
    if (status === 'failed') {
      return 'failed';
    }

    const order = ['pending', 'transcribing', 'summarizing', 'done'];
    const currentIndex = order.indexOf(status);

    if (index < currentIndex || status === 'done') {
      return 'completed';
    }
    if (index === currentIndex) {
      return 'active';
    }
    return 'inactive';
  };

  const getProgressPercentage = () => {
    switch (status) {
      case 'pending':
        return 15;
      case 'transcribing':
        return 50;
      case 'summarizing':
        return 80;
      case 'done':
        return 100;
      default:
        return 0;
    }
  };

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#fff' }}>Pipeline Progress</h3>
        <span className={`status-badge ${status}`}>
          {status === 'transcribing' && '🎙️ '}
          {status === 'summarizing' && '⚡ '}
          {status === 'done' && '✓ '}
          {status === 'failed' && '✕ '}
          {status}
        </span>
      </div>

      <div className="stepper-container">
        <div className="stepper-progress-bar">
          <div
            className="stepper-progress-fill"
            style={{
              width: `${getProgressPercentage()}%`,
              background: status === 'failed' ? 'var(--accent-rose)' : undefined,
            }}
          />
        </div>

        {STEPS.map((step, idx) => {
          const state = getStepState(step.key, idx);
          return (
            <div key={step.key} className={`step-item ${state}`}>
              <div className="step-circle">
                {state === 'completed' ? '✓' : idx + 1}
              </div>
              <span className="step-label">{step.label}</span>
            </div>
          );
        })}
      </div>

      {status === 'failed' && errorMessage && (
        <div className="error-banner" style={{ marginTop: '20px', marginBottom: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <strong>Processing Failed:</strong> {errorMessage}
          </div>
        </div>
      )}
    </div>
  );
}
