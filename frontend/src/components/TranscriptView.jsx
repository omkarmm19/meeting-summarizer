import React, { useState } from 'react';

export default function TranscriptView({ transcript }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  if (!transcript) {
    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(transcript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const highlightMatches = (text, term) => {
    if (!term.trim()) return text;
    const regex = new RegExp(`(${term.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} style={{ backgroundColor: 'rgba(245, 158, 11, 0.4)', color: '#fff', borderRadius: '3px', padding: '0 2px' }}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="glass-card">
      <div className="transcript-header-bar">
        <div className="card-title" style={{ margin: 0 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
          <span>Full Transcript</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 400 }}>
            ({wordCount} words)
          </span>
        </div>

        <div className="btn-action-group">
          <input
            type="text"
            className="transcript-search-input"
            placeholder="Search transcript..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="button" className="btn-secondary" onClick={handleCopy}>
            {copied ? (
              <>
                <span>✓</span>
                <span>Copied!</span>
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="transcript-box">
        {highlightMatches(transcript, searchTerm)}
      </div>
    </div>
  );
}
