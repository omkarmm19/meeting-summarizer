import React, { useState } from 'react';
import { formatShortDate } from '../utils/date';

export default function MeetingHistory({
  meetings,
  selectedMeetingId,
  onSelectMeeting,
  onNewMeetingClick,
  onDeleteMeeting,
  isLoading,
  currentUser,
  onLogout,
}) {
  const [filterQuery, setFilterQuery] = useState('');

  const filteredMeetings = meetings.filter((m) =>
    (m.filename || '').toLowerCase().includes(filterQuery.toLowerCase())
  );

  const getInitials = (name, email) => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      return parts.length >= 2
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : parts[0].slice(0, 2).toUpperCase();
    }
    return (email || 'U').slice(0, 2).toUpperCase();
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="brand-icon-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          </div>
          <span className="brand-title">Meeting Summarizer</span>
        </div>
      </div>

      <button
        type="button"
        className="btn-new-meeting"
        onClick={onNewMeetingClick}
        style={{ marginBottom: '20px' }}
      >
        + New analysis
      </button>

      <div className="sidebar-section-title">
        <span>Recordings</span>
        <span>({meetings.length})</span>
      </div>

      <input
        type="text"
        placeholder="Filter list..."
        value={filterQuery}
        onChange={(e) => setFilterQuery(e.target.value)}
        className="history-search-input"
      />

      <div className="history-list">
        {isLoading && meetings.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
            Loading...
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
            {filterQuery ? 'No matching records' : 'No records yet'}
          </div>
        ) : (
          filteredMeetings.map((meeting, index) => {
            const isActive = selectedMeetingId === meeting.id;
            return (
              <div
                key={meeting.id}
                className={`history-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectMeeting(meeting.id)}
                role="button"
                tabIndex={0}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="history-item-name" title={meeting.filename}>
                    {meeting.filename}
                  </div>
                  <div className="history-item-meta">
                    <span>{formatShortDate(meeting.created_at)}</span>
                    <span className="history-status-dot">• {meeting.status}</span>
                  </div>
                </div>

                {isActive && (
                  <span className="history-active-pill mono-text">Active</span>
                )}

                <button
                  type="button"
                  className="btn-delete-item"
                  title="Delete recording"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Delete recording "${meeting.filename}"?`)) {
                      onDeleteMeeting(meeting.id);
                    }
                  }}
                >
                  ✕
                </button>
              </div>
            );
          })
        )}
      </div>

      {currentUser && (
        <div className="sidebar-user-footer">
          <div className="user-avatar-chip">
            <div className="user-avatar-badge">
              {getInitials(currentUser.full_name, currentUser.email)}
            </div>
            <div className="user-info-text">
              <div className="user-name" title={currentUser.full_name || currentUser.email}>
                {currentUser.full_name || currentUser.email.split('@')[0]}
              </div>
              <div className="user-email" title={currentUser.email}>
                {currentUser.email}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn-logout"
            title="Sign out"
            onClick={onLogout}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      )}
    </aside>
  );
}
