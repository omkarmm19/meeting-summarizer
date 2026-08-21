import React from 'react';

const STEPS = [
  {
    key: 'pending',
    label: 'Uploaded',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    key: 'transcribing',
    label: 'Transcribing',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="22" />
      </svg>
    ),
  },
  {
    key: 'summarizing',
    label: 'Summarizing',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z" />
      </svg>
    ),
  },
  {
    key: 'done',
    label: 'Completed',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
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

  const getProgressWidthPercent = () => {
    switch (status) {
      case 'pending':
        return 12;
      case 'transcribing':
        return 48;
      case 'summarizing':
        return 82;
      case 'done':
        return 100;
      default:
        return 0;
    }
  };

  return (
    <div className="stepper-container card-interactive">
      <div className="stepper-header-row">
        <span className="section-label">Pipeline Progress</span>
        <span className={`stepper-status-chip ${status}`}>
          {status === 'transcribing' && 'Transcribing speech...'}
          {status === 'summarizing' && 'Extracting summary...'}
          {status === 'pending' && 'Queued for processing'}
          {status === 'done' && 'Processing complete'}
          {status === 'failed' && 'Processing failed'}
        </span>
      </div>

      <div className="stepper-track-wrapper">
        {/* Animated Connecting Line */}
        <div className="stepper-line-bg">
          <div
            className="stepper-line-fill"
            style={{
              width: `${getProgressWidthPercent()}%`,
              backgroundColor: status === 'failed' ? 'var(--danger)' : 'var(--accent)',
            }}
          />
        </div>

        {/* Steps with Icons */}
        <div className="stepper-steps-row">
          {STEPS.map((step, idx) => {
            const state = getStepState(step.key, idx);
            return (
              <div key={step.key} className={`stepper-node ${state}`}>
                <div className="stepper-icon-circle">
                  {state === 'completed' && step.key !== 'done' ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    step.icon
                  )}
                </div>
                <span className="stepper-node-label mono-text">{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {status === 'failed' && errorMessage && (
        <div className="error-banner" style={{ marginTop: '20px', marginBottom: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <strong>Processing error:</strong> {errorMessage}
          </div>
        </div>
      )}
    </div>
  );
}
