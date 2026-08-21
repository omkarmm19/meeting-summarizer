import React from 'react';
import { getAudioStreamUrl } from '../api/client';

export default function AudioPlayer({ meetingId, filename }) {
  if (!meetingId) return null;

  const audioUrl = getAudioStreamUrl(meetingId);

  return (
    <div className="audio-player-card">
      <div style={{ marginBottom: '8px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
        Audio playback {filename && <span className="timestamp">({filename})</span>}
      </div>
      <audio controls src={audioUrl} preload="metadata">
        Your browser does not support audio playback.
      </audio>
    </div>
  );
}
