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
        <mark key={i} style={{ backgroundColor: '#fce3d7', color: '#8f3717', padding: '0 2px' }}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="card-flat">
      <div className="transcript-header-bar">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <div className="card-title" style={{ margin: 0 }}>Transcript</div>
          <span className="timestamp">
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
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="transcript-box">
        {highlightMatches(transcript, searchTerm)}
      </div>
    </div>
  );
}
