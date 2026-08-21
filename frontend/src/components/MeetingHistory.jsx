import React, { useState } from 'react';
import { formatShortDate } from '../utils/date';

export default function MeetingHistory({
  meetings,
  selectedMeetingId,
  onSelectMeeting,
  onNewMeetingClick,
  onDeleteMeeting,
  isLoading,
}) {
  const [filterQuery, setFilterQuery] = useState('');

  const filteredMeetings = meetings.filter((m) =>
    (m.filename || '').toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <aside className="sidebar">
      <div className="brand-header">
        <div className="brand-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
        </div>
        <div>
          <div className="brand-title">Meeting Summarizer</div>
          <div className="brand-subtitle">AI Meeting Intelligence</div>
        </div>
      </div>

      <button type="button" className="btn-new-meeting" onClick={onNewMeetingClick}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span>New Meeting Analysis</span>
      </button>

      <div className="sidebar-section-title">
        <span>Meeting History</span>
        <span>({meetings.length})</span>
      </div>

      <input
        type="text"
        placeholder="Filter history..."
        value={filterQuery}
        onChange={(e) => setFilterQuery(e.target.value)}
        className="transcript-search-input"
        style={{ width: '100%', marginBottom: '14px' }}
      />

      <div className="history-list">
        {isLoading && meetings.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            Loading history...
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            {filterQuery ? 'No matching meetings' : 'No recorded meetings yet'}
          </div>
        ) : (
          filteredMeetings.map((meeting) => (
            <div
              key={meeting.id}
              className={`history-item ${selectedMeetingId === meeting.id ? 'active' : ''}`}
              onClick={() => onSelectMeeting(meeting.id)}
            >
              <div className="history-item-top">
                <span className="history-item-name" title={meeting.filename}>
                  {meeting.filename}
                </span>
                <span className={`status-badge ${meeting.status}`}>
                  {meeting.status}
                </span>
              </div>

              <div className="history-item-meta">
                <span>{formatShortDate(meeting.created_at)}</span>
                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    padding: '2px 4px',
                    fontSize: '0.85rem',
                  }}
                  title="Delete meeting"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Delete meeting "${meeting.filename}"?`)) {
                      onDeleteMeeting(meeting.id);
                    }
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
