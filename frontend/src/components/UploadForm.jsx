import React, { useState, useRef } from 'react';
import { uploadAudioFile } from '../api/client';

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB Whisper limit

export default function UploadForm({ onUploadStart, onUploadSuccess, onError }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const validateAndSelectFile = (file) => {
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      onError(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds 25MB maximum limit.`);
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      onUploadStart();
      const uploadRes = await uploadAudioFile(selectedFile);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onUploadSuccess(uploadRes);
    } catch (err) {
      onError(err.message || 'Failed to upload audio file');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="glass-card">
      <div className="card-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <span>Upload Meeting Audio</span>
      </div>

      <form onSubmit={handleSubmit}>
        <div
          className={`dropzone ${isDragging ? 'drag-active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInput}
            accept=".mp3,.wav,.m4a,.mp4,.webm,.ogg,.flac,.aac"
            style={{ display: 'none' }}
          />

          <div className="upload-icon-bubble">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          </div>

          <div>
            <div className="upload-text-main">
              {selectedFile ? selectedFile.name : 'Choose an audio file or drag & drop here'}
            </div>
            <div className="upload-text-sub">
              {selectedFile
                ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to process`
                : 'Supports MP3, WAV, M4A, AAC, WEBM, OGG (Max 25MB)'}
            </div>
          </div>

          <div className="format-tags">
            <span className="format-tag">.MP3</span>
            <span className="format-tag">.WAV</span>
            <span className="format-tag">.M4A</span>
            <span className="format-tag">.AAC</span>
            <span className="format-tag">.OGG</span>
          </div>
        </div>

        {selectedFile && (
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-new-meeting"
              style={{ width: 'auto', margin: 0 }}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Start Transcription & Analysis'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
