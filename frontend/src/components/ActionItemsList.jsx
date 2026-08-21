import React, { useState } from 'react';

export default function ActionItemsList({ actionItems, meetingId }) {
  const [completedTasks, setCompletedTasks] = useState({});
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'completed'
  const [copied, setCopied] = useState(false);

  if (!actionItems || actionItems.length === 0) {
    return (
      <div className="card-flat card-interactive">
        <div style={{ marginBottom: '14px' }}>
          <span className="section-label">Deliverables</span>
          <h2 className="card-heading-serif">Action Items</h2>
        </div>

        <div className="empty-state-card">
          <div className="empty-state-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <div className="empty-state-title">No Action Items Detected</div>
          <div className="empty-state-desc">
            The discussion did not contain explicit assigned tasks, owners, or deadlines.
          </div>
        </div>
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

  const copyActionItemsMarkdown = async () => {
    const lines = [
      '### Action Items Checklist\n',
      '| Status | Task | Owner | Deadline |',
      '| :--- | :--- | :--- | :--- |',
    ];
    actionItems.forEach((item, idx) => {
      const isDone = !!completedTasks[`${meetingId || 'default'}-${idx}`];
      lines.push(`| ${isDone ? '[x]' : '[ ]'} | ${item.task} | ${item.owner || '—'} | ${item.deadline || '—'} |`);
    });

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch {
      // Fallback
    }
  };

  const completedCount = actionItems.filter((_, idx) => completedTasks[`${meetingId || 'default'}-${idx}`]).length;
  const progressPercent = Math.round((completedCount / actionItems.length) * 100);

  const filteredItems = actionItems.map((item, originalIndex) => ({
    ...item,
    originalIndex,
    isCompleted: !!completedTasks[`${meetingId || 'default'}-${originalIndex}`],
  })).filter((item) => {
    if (filter === 'pending') return !item.isCompleted;
    if (filter === 'completed') return item.isCompleted;
    return true;
  });

  return (
    <div className="card-flat card-interactive">
      <div className="section-header-flex">
        <div>
          <span className="section-label">Deliverables & Owners</span>
          <h2 className="card-heading-serif">Action Items</h2>
        </div>

        <div className="action-header-controls">
          {/* Quick Filter Tabs */}
          <div className="action-filter-pills">
            <button
              type="button"
              className={`filter-pill ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({actionItems.length})
            </button>
            <button
              type="button"
              className={`filter-pill ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              Pending ({actionItems.length - completedCount})
            </button>
            <button
              type="button"
              className={`filter-pill ${filter === 'completed' ? 'active' : ''}`}
              onClick={() => setFilter('completed')}
            >
              Done ({completedCount})
            </button>
          </div>

          <button
            type="button"
            className={`btn-secondary btn-copy-tasks ${copied ? 'is-copied' : ''}`}
            onClick={copyActionItemsMarkdown}
            title="Copy tasks table to clipboard"
          >
            {copied ? '✓ Copied!' : 'Copy Tasks'}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="action-progress-container">
        <div className="action-progress-track">
          <div
            className="action-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="action-progress-text mono-text">
          {completedCount}/{actionItems.length} completed ({progressPercent}%)
        </span>
      </div>

      <div className="action-table-wrapper">
        <table className="action-items-table">
          <thead>
            <tr>
              <th style={{ width: '44px' }}>Done</th>
              <th>Task</th>
              <th style={{ width: '150px' }}>Owner</th>
              <th style={{ width: '150px' }}>Deadline</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)' }}>
                  No tasks matching the "{filter}" filter.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const idx = item.originalIndex;
                const isChecked = item.isCompleted;
                return (
                  <tr key={idx} className={`action-row ${isChecked ? 'is-completed' : ''}`}>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleTask(idx)}
                        id={`task-${idx}`}
                        className="custom-action-checkbox"
                      />
                    </td>
                    <td className="action-task-col">
                      <label htmlFor={`task-${idx}`} className="action-label">
                        {item.task}
                      </label>
                    </td>
                    <td>
                      {item.owner ? (
                        <span className="action-meta-tag mono-text">
                          <span className="meta-icon">👤</span> {item.owner}
                        </span>
                      ) : (
                        <span className="meta-empty mono-text">—</span>
                      )}
                    </td>
                    <td>
                      {item.deadline ? (
                        <span className="action-meta-tag mono-text deadline-tag">
                          <span className="meta-icon">⏱️</span> {item.deadline}
                        </span>
                      ) : (
                        <span className="meta-empty mono-text">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
