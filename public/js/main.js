/**
 * VertexLearn AI - Main Frontend Utility Script
 * Handles navigation bar, mobile menu, notifications, and UI initialization
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initMobileMenu();
});

// Setup active navigation state and auth buttons
function initNavbar() {
  const navContainer = document.querySelector('.nav-actions');
  const navLinks = document.querySelector('.nav-links');
  const loggedIn = isAuthenticated();
  const currentUser = getUser();

  if (navLinks) {
    // Determine current page for active tab styling
    const path = window.location.pathname;
    const links = navLinks.querySelectorAll('a');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && (path === href || (href !== '/' && path.endsWith(href)))) {
        link.classList.add('active');
      }
    });

    // If logged in, ensure logged-in links are visible
    if (loggedIn) {
      if (!navLinks.querySelector('a[href="/dashboard.html"]')) {
        const dashLi = document.createElement('li');
        dashLi.innerHTML = '<a href="/dashboard.html">Dashboard</a>';
        navLinks.prepend(dashLi);
      }

      const role = getUserRole();
      if ((role === 'instructor' || role === 'admin') && !navLinks.querySelector('a[href="/instructor.html"]')) {
        const instLi = document.createElement('li');
        instLi.innerHTML = '<a href="/instructor.html" style="color: #6366f1; font-weight: 600;">Instructor Studio</a>';
        navLinks.appendChild(instLi);
      }

      if (role === 'admin' && !navLinks.querySelector('a[href="/admin.html"]')) {
        const adminLi = document.createElement('li');
        adminLi.innerHTML = '<a href="/admin.html" style="color: #ef4444; font-weight: 600;">Admin Center</a>';
        navLinks.appendChild(adminLi);
      }
    }
  }

  if (navContainer) {
    if (loggedIn && currentUser) {
      const role = currentUser.role || 'student';
      const roleBadgeColor = role === 'admin' ? 'background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5;' :
                             role === 'instructor' ? 'background: #e0e7ff; color: #4338ca; border: 1px solid #c7d2fe;' :
                             'background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0;';

      navContainer.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span style="display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: var(--text-color);">
            <span>👤</span> ${escapeHtml(currentUser.name || 'User')}
            <span style="font-size: 11px; padding: 2px 8px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; ${roleBadgeColor}">
              ${role}
            </span>
          </span>
          <div class="persona-switch-wrapper" style="position: relative; display: inline-block;">
            <button id="personaSwitchBtn" class="btn btn-outline btn-sm" style="font-size: 12px; padding: 4px 8px;" title="Quick Switch Role for Testing">
              🔄 Switch Demo
            </button>
            <div id="personaMenu" style="display: none; position: absolute; right: 0; top: 110%; background: #ffffff; border: 1px solid var(--border-color); border-radius: 8px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); padding: 8px; min-width: 180px; z-index: 1000;">
              <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px; padding: 2px 6px;">Switch Demo Persona</div>
              <button class="btn btn-sm persona-btn" data-role="student" style="width: 100%; text-align: left; margin-bottom: 4px; justify-content: flex-start; font-size: 12px;">👩‍🎓 Student (Sarah)</button>
              <button class="btn btn-sm persona-btn" data-role="instructor" style="width: 100%; text-align: left; margin-bottom: 4px; justify-content: flex-start; font-size: 12px;">👨‍🏫 Instructor (Dr. Elena)</button>
              <button class="btn btn-sm persona-btn" data-role="admin" style="width: 100%; text-align: left; justify-content: flex-start; font-size: 12px;">⚡ Admin (Alex Rivera)</button>
            </div>
          </div>
          <a href="/profile.html" class="btn btn-outline btn-sm">Profile</a>
          <button id="logoutBtn" class="btn btn-outline btn-sm" style="color: var(--danger); border-color: var(--border-color);">Logout</button>
        </div>
      `;

      const switchBtn = document.getElementById('personaSwitchBtn');
      const personaMenu = document.getElementById('personaMenu');
      if (switchBtn && personaMenu) {
        switchBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          personaMenu.style.display = personaMenu.style.display === 'none' ? 'block' : 'none';
        });
        document.addEventListener('click', () => {
          personaMenu.style.display = 'none';
        });
        personaMenu.querySelectorAll('.persona-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const targetRole = btn.getAttribute('data-role');
            await loginAsDemoPersona(targetRole);
          });
        });
      }

      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          logout();
        });
      }
    } else {
      navContainer.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <button id="quickDemoBtn" class="btn btn-outline btn-sm" style="font-size: 12px;" title="Test without registering">⚡ Try Demo</button>
          <a href="/login.html" class="btn btn-outline btn-sm">Log In</a>
          <a href="/signup.html" class="btn btn-primary btn-sm">Sign Up</a>
        </div>
      `;
      const quickDemoBtn = document.getElementById('quickDemoBtn');
      if (quickDemoBtn) {
        quickDemoBtn.addEventListener('click', async () => {
          await loginAsDemoPersona('student');
        });
      }
    }
  }
}

// Mobile hamburger menu toggle
function initMobileMenu() {
  const menuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');

  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = navLinks.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', isOpen);
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target) && !menuBtn.contains(e.target)) {
        navLinks.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });

    // Close menu when link is clicked
    navLinks.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        navLinks.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }
}

// Utility to display alert banners in any container
function showAlert(containerId, message, type = 'danger') {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="alert alert-${type}">
      <span>${type === 'danger' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️'}</span>
      <span>${escapeHtml(message)}</span>
    </div>
  `;
}

// Utility to clear alert
function clearAlert(containerId) {
  const container = document.getElementById(containerId);
  if (container) container.innerHTML = '';
}

// Safe string escaping for DOM injection
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
