/**
 * Meetlytic API Client
 * Interacts with FastAPI backend endpoints
 */

const API_BASE = '/api';

export async function uploadAudioFile(file, onProgress = null) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/meetings/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorDetail = 'Upload failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {
      errorDetail = `Server error (${response.status})`;
    }
    throw new Error(errorDetail);
  }

  return await response.json();
}

export async function getMeetingDetail(meetingId) {
  const response = await fetch(`${API_BASE}/meetings/${meetingId}`);
  if (!response.ok) {
    let errorDetail = 'Failed to fetch meeting details';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {
      errorDetail = `Error ${response.status}`;
    }
    throw new Error(errorDetail);
  }
  return await response.json();
}

export async function getMeetingsList() {
  const response = await fetch(`${API_BASE}/meetings`);
  if (!response.ok) {
    throw new Error('Failed to fetch meeting history');
  }
  return await response.json();
}

export async function deleteMeeting(meetingId) {
  const response = await fetch(`${API_BASE}/meetings/${meetingId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete meeting');
  }
  return await response.json();
}

export function getAudioStreamUrl(meetingId) {
  return `${API_BASE}/meetings/${meetingId}/audio`;
}

export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    if (!response.ok) return { status: 'unhealthy' };
    return await response.json();
  } catch (err) {
    return { status: 'offline', error: err.message };
  }
}
