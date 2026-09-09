/**
 * VertexLearn AI - Client-side Authentication Helpers
 * Simple, beginner-friendly authentication state management using localStorage
 */

const AUTH_STORAGE_KEY = 'vertexlearn_user';
const TOKEN_STORAGE_KEY = 'vertexlearn_token';

// Retrieve stored JWT token
function getToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

// Retrieve stored user profile object
function getUser() {
  const userJson = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch (e) {
    return null;
  }
}

// Get user role
function getUserRole() {
  const user = getUser();
  return user ? (user.role || 'student') : 'guest';
}

function isInstructor() {
  const role = getUserRole();
  return role === 'instructor' || role === 'admin';
}

function isAdmin() {
  return getUserRole() === 'admin';
}

// Switch demo persona for effortless multi-role testing
async function loginAsDemoPersona(role = 'student') {
  try {
    const res = await fetch('/api/auth/demo-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    const data = await res.json();
    if (data.token && data.user) {
      saveAuth(data.token, data.user);
      if (role === 'admin') {
        window.location.href = '/admin.html';
      } else if (role === 'instructor') {
        window.location.href = '/instructor.html';
      } else {
        window.location.href = '/dashboard.html';
      }
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to switch persona:', err);
    return false;
  }
}

// Check if user is logged in
function isAuthenticated() {
  return !!getToken() && !!getUser();
}

// Save authentication data on successful login or registration
function saveAuth(token, user) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

// Clear authentication data and log out
function logout() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(AUTH_STORAGE_KEY);
  window.location.href = '/login.html';
}

// Guard protected pages: if user is not logged in, redirect to login page
function requireAuth() {
  if (!isAuthenticated()) {
    // Remember the page they were trying to visit
    const currentPath = window.location.pathname;
    window.location.href = `/login.html?redirect=${encodeURIComponent(currentPath)}`;
    return false;
  }
  return true;
}

// Redirect already logged-in users away from Login or Signup to Dashboard
function redirectIfAuthenticated() {
  if (isAuthenticated()) {
    window.location.href = '/dashboard.html';
    return true;
  }
  return false;
}

// Helper to make authenticated fetch requests with Bearer token header
async function authFetch(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  // If token is expired or unauthorized, automatically log out
  if (response.status === 401) {
    logout();
    throw new Error('Session expired. Please log in again.');
  }

  return response;
}
