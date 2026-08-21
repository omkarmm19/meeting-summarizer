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
        <span>My Meetings</span>
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

      {/* User Profile / Logout Footer */}
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
            title="Sign Out"
            onClick={onLogout}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
