/**
 * Meetlytic API Client
 * Interacts with FastAPI backend endpoints with JWT Authentication & Tenant Isolation
 */

const API_BASE = '/api';
const TOKEN_KEY = 'meetlytic_jwt_token';
const USER_KEY = 'meetlytic_user';

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token, user = null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else if (!token) {
    localStorage.removeItem(USER_KEY);
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function getAuthHeaders(extraHeaders = {}) {
  const token = getAuthToken();
  const headers = { ...extraHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// --- Auth Endpoints ---

export async function signupUser({ email, password, full_name }) {
  const response = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, full_name }),
  });

  if (!response.ok) {
    let errorDetail = 'Signup failed';
    try {
      const err = await response.json();
      errorDetail = err.detail || errorDetail;
    } catch {
      errorDetail = `Server error (${response.status})`;
    }
    throw new Error(errorDetail);
  }

  const data = await response.json();
  setAuthToken(data.access_token, data.user);
  return data;
}

export async function loginUser({ email, password }) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    let errorDetail = 'Login failed';
    try {
      const err = await response.json();
      errorDetail = err.detail || errorDetail;
    } catch {
      errorDetail = `Server error (${response.status})`;
    }
    throw new Error(errorDetail);
  }

  const data = await response.json();
  setAuthToken(data.access_token, data.user);
  return data;
}

export async function getCurrentUser() {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    clearAuth();
    throw new Error('Session expired. Please log in again.');
  }

  const user = await response.json();
  setAuthToken(getAuthToken(), user);
  return user;
}

// --- Meeting Endpoints ---

export async function uploadAudioFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/meetings/upload`, {
    method: 'POST',
    headers: getAuthHeaders(),
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
  const response = await fetch(`${API_BASE}/meetings/${meetingId}`, {
    headers: getAuthHeaders(),
  });
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
  const response = await fetch(`${API_BASE}/meetings`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch meeting history');
  }
  return await response.json();
}

export async function deleteMeeting(meetingId) {
  const response = await fetch(`${API_BASE}/meetings/${meetingId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
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
