import React, { useState } from 'react';

export default function ActionItemsList({ actionItems, meetingId }) {
  // Store local checked state for tasks
  const [completedTasks, setCompletedTasks] = useState({});

  if (!actionItems || actionItems.length === 0) {
    return (
      <div className="glass-card">
        <div className="card-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          <span>Action Items</span>
        </div>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>No action items detected in this transcript.</p>
      </div>
    );
  }

  const toggleTask = (index) => {
    const key = `${meetingId || 'default'}-${index}`;
    setCompletedTasks((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const completedCount = actionItems.filter((_, idx) => completedTasks[`${meetingId || 'default'}-${idx}`]).length;

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div className="card-title" style={{ margin: 0 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          <span>Action Items Checklist</span>
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>
          {completedCount} of {actionItems.length} completed
        </span>
      </div>

      <div className="action-items-list">
        {actionItems.map((item, idx) => {
          const isChecked = !!completedTasks[`${meetingId || 'default'}-${idx}`];
          return (
            <div key={idx} className={`action-card ${isChecked ? 'checked' : ''}`}>
              <input
                type="checkbox"
                className="action-checkbox"
                checked={isChecked}
                onChange={() => toggleTask(idx)}
                id={`task-${idx}`}
              />
              <div className="action-content">
                <label htmlFor={`task-${idx}`} className="action-title" style={{ cursor: 'pointer' }}>
                  {item.task}
                </label>
                <div className="action-meta-row">
                  {item.owner && (
                    <span className="meta-badge owner">
                      <span>👤</span>
                      <span>{item.owner}</span>
                    </span>
                  )}
                  {item.deadline && (
                    <span className="meta-badge deadline">
                      <span>📅</span>
                      <span>{item.deadline}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
