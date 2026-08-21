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
      setTimeout(() => setCopied(false), 1000); // 1 second confirmation
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
        <mark key={i} className="transcript-match-highlight">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="card-flat card-interactive">
      <div className="transcript-header-bar">
        <div>
          <span className="section-label">Speech Transcription</span>
          <div className="transcript-title-row">
            <h2 className="card-heading-serif">Full Transcript</h2>
            <span className="transcript-word-badge mono-text">
              {wordCount.toLocaleString()} words
            </span>
          </div>
        </div>

        <div className="btn-action-group">
          <div className="search-input-wrapper">
            <svg className="search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="transcript-search-input mono-text"
              placeholder="Search transcript..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            type="button"
            className={`btn-secondary btn-copy ${copied ? 'is-copied' : ''}`}
            onClick={handleCopy}
            title="Copy full transcript to clipboard"
          >
            {copied ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Copied!</span>
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="transcript-box-constrained">
        <div className="transcript-body-text">
          {highlightMatches(transcript, searchTerm)}
        </div>
      </div>
    </div>
  );
}
