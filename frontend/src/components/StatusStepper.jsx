import React from 'react';

const STEPS = [
  { key: 'pending', label: 'Uploaded' },
  { key: 'transcribing', label: 'Transcribing' },
  { key: 'summarizing', label: 'Summarizing' },
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

  return (
    <div className="stepper-container">
      <div className="stepper-header">Processing pipeline</div>

      <div className="stepper-track">
        {STEPS.map((step, idx) => {
          const state = getStepState(step.key, idx);
          return (
            <div key={step.key} className={`stepper-step ${state}`}>
              <div className="stepper-bullet">
                {state === 'completed' ? '✓' : idx + 1}
              </div>
              <span className="stepper-label">{step.label}</span>
            </div>
          );
        })}
      </div>

      {status === 'failed' && errorMessage && (
        <div className="error-banner" style={{ marginTop: '16px', marginBottom: 0 }}>
          <span>Error: {errorMessage}</span>
        </div>
      )}
    </div>
  );
}
