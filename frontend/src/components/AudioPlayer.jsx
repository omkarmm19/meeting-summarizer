import React, { useState, useRef, useEffect } from 'react';
import { getAudioStreamUrl } from '../api/client';

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function AudioPlayer({ meetingId, filename }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);

  const audioRef = useRef(null);
  const progressTrackRef = useRef(null);

  if (!meetingId) return null;
  const audioUrl = getAudioStreamUrl(meetingId);

  useEffect(() => {
    // Reset state on new meeting
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsLoaded(false);
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [meetingId]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.error('Audio play error:', e);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
      setIsLoaded(true);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e) => {
    if (!progressTrackRef.current || !audioRef.current || !duration) return;
    const rect = progressTrackRef.current.getBoundingClientRect();
    const clickPos = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const newTime = (clickPos / rect.width) * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const cyclePlaybackRate = () => {
    const rates = [1, 1.25, 1.5, 2];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="custom-audio-card card-interactive">
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onLoadedData={handleLoadedMetadata}
        onDurationChange={handleLoadedMetadata}
        onCanPlay={handleLoadedMetadata}
        onEnded={handleEnded}
        style={{ display: 'none' }}
      />

      <div className="audio-top-row">
        <div className="audio-meta">
          <span className="section-label">Audio Playback</span>
          <span className="audio-filename">{filename || 'recording.wav'}</span>
        </div>

        <button
          type="button"
          className="audio-speed-btn"
          onClick={cyclePlaybackRate}
          title="Change playback speed"
        >
          {playbackRate}x
        </button>
      </div>

      <div className="audio-controls-row">
        <button
          type="button"
          className="audio-play-btn"
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
        >
          {isPlaying ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}>
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </button>

        <div
          ref={progressTrackRef}
          className="audio-progress-track"
          onClick={handleSeek}
        >
          <div
            className="audio-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
          <div
            className="audio-progress-thumb"
            style={{ left: `${progressPercent}%` }}
          />
        </div>

        <div className="audio-time-display mono-text">
          <span>{formatTime(currentTime)}</span>
          <span className="time-divider">/</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
