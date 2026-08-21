import React, { useState, useRef } from 'react';
import { uploadAudioFile } from '../api/client';

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB Whisper limit

export default function UploadForm({ onUploadStart, onUploadSuccess, onError }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const validateAndSelectFile = (file) => {
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      onError(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds 25MB maximum limit.`);
      return;
    }

    setSelectedFile(file);
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
    <div className="card-flat">
      <div className="card-title">Upload audio recording</div>

      <form onSubmit={handleSubmit}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInput}
          accept=".mp3,.wav,.m4a,.mp4,.webm,.ogg,.flac,.aac"
          style={{ display: 'none' }}
        />

        <div className="upload-box">
          {!selectedFile ? (
            <>
              <button
                type="button"
                className="btn-choose-file"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose file
              </button>
              <div className="upload-hint">
                Supported formats: MP3, WAV, M4A, AAC, WEBM, OGG (Max 25 MB)
              </div>
            </>
          ) : (
            <div className="selected-file-banner">
              <div>
                <span className="file-name-tag">{selectedFile.name}</span>
                <span className="timestamp" style={{ marginLeft: '10px' }}>
                  ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                </span>
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                disabled={isUploading}
                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
              >
                Change
              </button>
            </div>
          )}
        </div>

        {selectedFile && (
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ width: 'auto' }}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Process recording'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
