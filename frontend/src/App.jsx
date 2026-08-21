import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  uploadAudioFile,
  getMeetingDetail,
  getMeetingsList,
  deleteMeeting,
  getStoredUser,
  getCurrentUser,
  clearAuth,
} from './api/client';
import UploadForm from './components/UploadForm';
import StatusStepper from './components/StatusStepper';
import SummaryCard from './components/SummaryCard';
import ActionItemsList from './components/ActionItemsList';
import TranscriptView from './components/TranscriptView';
import MeetingHistory from './components/MeetingHistory';
import AudioPlayer from './components/AudioPlayer';
import AuthModal from './components/AuthModal';
import { formatLocalDateTime } from './utils/date';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [meetings, setMeetings] = useState([]);
  const [currentMeeting, setCurrentMeeting] = useState(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const pollTimerRef = useRef(null);

  // Validate session on mount
  useEffect(() => {
    async function verifySession() {
      if (currentUser) {
        try {
          const user = await getCurrentUser();
          setCurrentUser(user);
        } catch {
          setCurrentUser(null);
        }
      }
    }
    verifySession();
  }, []);

  const fetchMeetings = useCallback(async () => {
    if (!currentUser) return;
    try {
      setIsHistoryLoading(true);
      const data = await getMeetingsList();
      setMeetings(data);
    } catch (err) {
      console.error('Error fetching meetings list:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchMeetings();
    } else {
      setMeetings([]);
      setCurrentMeeting(null);
    }
  }, [currentUser, fetchMeetings]);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const startPolling = useCallback((meetingId) => {
    stopPolling();

    const poll = async () => {
      try {
        const detail = await getMeetingDetail(meetingId);
        setCurrentMeeting(detail);

        if (detail.status === 'done' || detail.status === 'failed') {
          stopPolling();
          fetchMeetings();
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    // Immediate check then poll every 2.5s
    poll();
    pollTimerRef.current = setInterval(poll, 2500);
  }, [stopPolling, fetchMeetings]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const handleUploadSuccess = (uploadRes) => {
    setErrorMessage(null);
    const pendingMeeting = {
      id: uploadRes.id,
      filename: uploadRes.filename,
      status: uploadRes.status,
      file_size_bytes: 0,
      created_at: uploadRes.created_at,
      summary: null,
      key_decisions: [],
      action_items: [],
      transcript: null,
      error_message: null,
    };
    setCurrentMeeting(pendingMeeting);
    setShowUploadModal(false);
    startPolling(uploadRes.id);
  };

  const handleSelectMeeting = async (meetingId) => {
    setErrorMessage(null);
    stopPolling();

    try {
      const detail = await getMeetingDetail(meetingId);
      setCurrentMeeting(detail);

      if (detail.status === 'pending' || detail.status === 'transcribing' || detail.status === 'summarizing') {
        startPolling(meetingId);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load meeting details');
    }
  };

  const handleDeleteMeeting = async (meetingId) => {
    try {
      await deleteMeeting(meetingId);
      if (currentMeeting && currentMeeting.id === meetingId) {
        setCurrentMeeting(null);
      }
      fetchMeetings();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to delete meeting');
    }
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setErrorMessage(null);
  };

  const handleLogout = () => {
    stopPolling();
    clearAuth();
    setCurrentUser(null);
    setMeetings([]);
    setCurrentMeeting(null);
  };

  const handleExportMarkdown = () => {
    if (!currentMeeting) return;

    let md = `# Meeting Summary: ${currentMeeting.filename}\n\n`;
    md += `**Date:** ${formatLocalDateTime(currentMeeting.created_at)}\n`;
    md += `**Status:** ${currentMeeting.status}\n\n`;

    md += `## 📋 Executive Overview\n\n${currentMeeting.summary || 'N/A'}\n\n`;

    if (currentMeeting.key_decisions && currentMeeting.key_decisions.length > 0) {
      md += `## 💡 Key Decisions\n\n`;
      currentMeeting.key_decisions.forEach((dec) => {
        md += `- ${dec}\n`;
      });
      md += `\n`;
    }

    if (currentMeeting.action_items && currentMeeting.action_items.length > 0) {
      md += `## ✅ Action Items\n\n`;
      md += `| Task | Owner | Deadline |\n`;
      md += `| :--- | :--- | :--- |\n`;
      currentMeeting.action_items.forEach((item) => {
        md += `| ${item.task} | ${item.owner || 'Unassigned'} | ${item.deadline || 'None'} |\n`;
      });
      md += `\n`;
    }

    if (currentMeeting.transcript) {
      md += `## 🎙️ Transcript\n\n\`\`\`\n${currentMeeting.transcript}\n\`\`\`\n`;
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentMeeting.filename.replace(/\.[^/.]+$/, '')}_summary.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    if (!currentMeeting) return;
    const blob = new Blob([JSON.stringify(currentMeeting, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentMeeting.filename.replace(/\.[^/.]+$/, '')}_data.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // If user is not authenticated, show Auth Screen / Modal
  if (!currentUser) {
    return <AuthModal onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="app-layout">
      <MeetingHistory
        meetings={meetings}
        selectedMeetingId={currentMeeting?.id}
        onSelectMeeting={handleSelectMeeting}
        onNewMeetingClick={() => {
          stopPolling();
          setCurrentMeeting(null);
          setShowUploadModal(true);
        }}
        onDeleteMeeting={handleDeleteMeeting}
        isLoading={isHistoryLoading}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <main className="main-content">
        <header className="dashboard-header">
          <div className="dashboard-title-group">
            <h1>
              {currentMeeting ? currentMeeting.filename : 'Meeting Intelligence Workspace'}
            </h1>
            <p>
              {currentMeeting
                ? `Uploaded on ${formatLocalDateTime(currentMeeting.created_at)}`
                : `Welcome back, ${currentUser.full_name || currentUser.email}. Upload an audio recording to transcribe speech and extract AI summaries.`}
            </p>
          </div>

          {currentMeeting && currentMeeting.status === 'done' && (
            <div className="btn-action-group">
              <button type="button" className="btn-secondary" onClick={handleExportMarkdown}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Export Markdown</span>
              </button>
              <button type="button" className="btn-secondary" onClick={handleExportJSON}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
                <span>Export JSON</span>
              </button>
            </div>
          )}
        </header>

        {errorMessage && (
          <div className="error-banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>{errorMessage}</div>
          </div>
        )}

        {!currentMeeting ? (
          <UploadForm
            onUploadStart={() => setErrorMessage(null)}
            onUploadSuccess={handleUploadSuccess}
            onError={(msg) => setErrorMessage(msg)}
          />
        ) : (
          <div>
            <StatusStepper
              status={currentMeeting.status}
              errorMessage={currentMeeting.error_message}
            />

            {currentMeeting.status === 'done' && (
              <>
                <AudioPlayer
                  meetingId={currentMeeting.id}
                  filename={currentMeeting.filename}
                />

                <SummaryCard
                  summary={currentMeeting.summary}
                  keyDecisions={currentMeeting.key_decisions}
                />

                <ActionItemsList
                  actionItems={currentMeeting.action_items}
                  meetingId={currentMeeting.id}
                />

                <TranscriptView
                  transcript={currentMeeting.transcript}
                />
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
