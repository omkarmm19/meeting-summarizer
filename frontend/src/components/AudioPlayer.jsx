import React from 'react';
import { getAudioStreamUrl } from '../api/client';

export default function AudioPlayer({ meetingId, filename }) {
  if (!meetingId) return null;

  const audioUrl = getAudioStreamUrl(meetingId);

  return (
    <div className="audio-player-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
          Audio Recording
        </span>
      </div>

      <audio controls src={audioUrl} preload="metadata">
        Your browser does not support audio playback.
      </audio>
    </div>
  );
}
