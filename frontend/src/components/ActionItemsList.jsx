import React, { useState } from 'react';

export default function ActionItemsList({ actionItems, meetingId }) {
  const [completedTasks, setCompletedTasks] = useState({});

  if (!actionItems || actionItems.length === 0) {
    return (
      <div className="card-flat">
        <div className="card-title">Action Items</div>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem' }}>
          No action items identified in this recording.
        </p>
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
    <div className="card-flat">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div className="card-title" style={{ margin: 0 }}>Action Items</div>
        <span className="timestamp">
          {completedCount}/{actionItems.length} completed
        </span>
      </div>

      <table className="action-items-table">
        <thead>
          <tr>
            <th style={{ width: '40px' }}>Status</th>
            <th>Task</th>
            <th style={{ width: '160px' }}>Owner</th>
            <th style={{ width: '160px' }}>Deadline</th>
          </tr>
        </thead>
        <tbody>
          {actionItems.map((item, idx) => {
            const isChecked = !!completedTasks[`${meetingId || 'default'}-${idx}`];
            return (
              <tr key={idx} style={{ opacity: isChecked ? 0.6 : 1 }}>
                <td>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleTask(idx)}
                    id={`task-${idx}`}
                    style={{ cursor: 'pointer', accentColor: 'var(--accent)' }}
                  />
                </td>
                <td className="action-task-col">
                  <label
                    htmlFor={`task-${idx}`}
                    style={{
                      cursor: 'pointer',
                      textDecoration: isChecked ? 'line-through' : 'none',
                    }}
                  >
                    {item.task}
                  </label>
                </td>
                <td>
                  {item.owner ? (
                    <span className="action-meta-tag">{item.owner}</span>
                  ) : (
                    <span style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontSize: '0.78rem' }}>—</span>
                  )}
                </td>
                <td>
                  {item.deadline ? (
                    <span className="action-meta-tag">{item.deadline}</span>
                  ) : (
                    <span style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontSize: '0.78rem' }}>—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
