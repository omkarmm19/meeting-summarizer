import React, { useState, useRef, useEffect } from 'react';
import { getAudioStreamUrl, getAuthToken } from '../api/client';

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
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(true);

  const audioRef = useRef(null);
  const progressTrackRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    let createdUrl = null;

    async function loadAudioSource() {
      if (!meetingId) return;
      setIsLoadingAudio(true);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);

      try {
        const token = getAuthToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const streamUrl = getAudioStreamUrl(meetingId);
        const res = await fetch(streamUrl, { headers });

        if (res.ok) {
          const blob = await res.blob();
          if (isMounted) {
            createdUrl = URL.createObjectURL(blob);
            setBlobUrl(createdUrl);
            setIsLoadingAudio(false);
          }
        } else {
          if (isMounted) {
            setBlobUrl(streamUrl);
            setIsLoadingAudio(false);
          }
        }
      } catch (err) {
        console.warn('Audio fetch error, using direct stream URL:', err);
        if (isMounted) {
          setBlobUrl(getAudioStreamUrl(meetingId));
          setIsLoadingAudio(false);
        }
      }
    }

    loadAudioSource();

    return () => {
      isMounted = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [meetingId]);

  useEffect(() => {
    if (audioRef.current && blobUrl) {
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.load();
    }
  }, [blobUrl, playbackRate, volume, isMuted]);

  const togglePlay = () => {
    if (!audioRef.current || !blobUrl) return;
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

  const skipSeconds = (seconds) => {
    if (!audioRef.current || !duration) return;
    const newTime = Math.max(0, Math.min(audioRef.current.currentTime + seconds, duration));
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && audioRef.current.duration) {
      setDuration(audioRef.current.duration);
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

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.volume = !isMuted ? 0 : volume;
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!meetingId) return null;

  return (
    <div className="custom-audio-card card-interactive">
      {blobUrl && (
        <audio
          ref={audioRef}
          src={blobUrl}
          preload="auto"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onLoadedData={handleLoadedMetadata}
          onDurationChange={handleLoadedMetadata}
          onCanPlay={handleLoadedMetadata}
          onEnded={handleEnded}
          style={{ display: 'none' }}
        />
      )}

      <div className="audio-top-row">
        <div className="audio-meta">
          <span className="section-label">Audio Playback</span>
          <span className="audio-filename">{filename || 'recording.wav'}</span>
        </div>

        {/* Animated Waveform Indicator */}
        <div className={`audio-waveform-bars ${isPlaying ? 'is-playing' : ''}`}>
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
        </div>

        <div className="audio-top-actions">
          <button
            type="button"
            className="audio-speed-btn mono-text"
            onClick={cyclePlaybackRate}
            title="Change playback speed"
          >
            {playbackRate}x
          </button>
        </div>
      </div>

      <div className="audio-controls-row">
        {/* Play/Pause Button */}
        <button
          type="button"
          className="audio-play-btn"
          onClick={togglePlay}
          disabled={isLoadingAudio}
          aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
        >
          {isLoadingAudio ? (
            <span className="spinner-small" style={{ width: '12px', height: '12px' }} />
          ) : isPlaying ? (
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

        {/* Skip -5s Button */}
        <button
          type="button"
          className="audio-skip-btn"
          onClick={() => skipSeconds(-5)}
          title="Rewind 5 seconds"
          disabled={isLoadingAudio}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
          </svg>
          <span>5s</span>
        </button>

        {/* Skip +5s Button */}
        <button
          type="button"
          className="audio-skip-btn"
          onClick={() => skipSeconds(5)}
          title="Forward 5 seconds"
          disabled={isLoadingAudio}
        >
          <span>5s</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 17l5-5-5-5M6 17l5-5-5-5" />
          </svg>
        </button>

        {/* Scrubber Progress Bar */}
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

        {/* Monospace Time Display */}
        <div className="audio-time-display mono-text">
          <span>{formatTime(currentTime)}</span>
          <span className="time-divider">/</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Volume / Mute Toggle */}
        <button
          type="button"
          className="audio-volume-btn"
          onClick={toggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted || volume === 0 ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
