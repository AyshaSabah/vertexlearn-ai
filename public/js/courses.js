/**
 * VertexLearn AI - Courses Catalog Controller
 * Loads curriculum courses, fetches user progress, and provides instant filtering & search
 */

let allCourses = [];
let userProgressMap = new Map(); // courseId -> progress record
let activeCategory = 'all';
let activeLevel = 'all';
let activeSearchQuery = '';

document.addEventListener('DOMContentLoaded', async () => {
  setupFilterControls();
  await loadCoursesAndProgress();
});

async function loadCoursesAndProgress() {
  const grid = document.getElementById('coursesGrid');

  try {
    // 1. Fetch courses
    const res = await fetch('/api/courses');
    if (!res.ok) throw new Error('Failed to load courses from API.');
    allCourses = await res.json();

    // 2. If user is logged in, fetch user progress to display progress bars
    if (typeof isAuthenticated === 'function' && isAuthenticated()) {
      try {
        const progRes = await authFetch('/api/progress');
        if (progRes.ok) {
          const progressList = await progRes.json();
          if (Array.isArray(progressList)) {
            progressList.forEach(p => {
              userProgressMap.set(p.courseId, p);
            });
          }
        }
      } catch (err) {
        console.warn('Could not load user course progress:', err);
      }
    }

    applyFiltersAndRender();
  } catch (err) {
    console.error('Error fetching courses:', err);
    showAlert('coursesAlert', 'Could not load courses: ' + err.message, 'danger');
  }
}

function applyFiltersAndRender() {
  let filtered = [...allCourses];

  // Category filter
  if (activeCategory !== 'all') {
    const catLower = activeCategory.toLowerCase();
    filtered = filtered.filter(c => 
      (c.category && c.category.toLowerCase().includes(catLower)) ||
      (c.categoryLabel && c.categoryLabel.toLowerCase().includes(catLower))
    );
  }

  // Level filter
  if (activeLevel !== 'all') {
    const lvlLower = activeLevel.toLowerCase();
    filtered = filtered.filter(c => (c.level || '').toLowerCase() === lvlLower);
  }

  // Search filter
  if (activeSearchQuery.trim()) {
    const q = activeSearchQuery.trim().toLowerCase();
    filtered = filtered.filter(c => 
      (c.title && c.title.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q)) ||
      (c.category && c.category.toLowerCase().includes(q)) ||
      (c.lessons && c.lessons.some(l => l.title && l.title.toLowerCase().includes(q)))
    );
  }

  renderCourses(filtered);
}

function renderCourses(courses) {
  const grid = document.getElementById('coursesGrid');
  if (!grid) return;

  if (!courses || courses.length === 0) {
    grid.innerHTML = `
      <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 48px 20px;">
        <div style="font-size: 36px; margin-bottom: 12px;">🔍</div>
        <h3 style="font-size: 18px; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">No matching courses found</h3>
        <p style="color: var(--text-muted); font-size: 14px; max-width: 420px; margin: 0 auto 16px;">
          Try refining your search keyword or switching the discipline and level filters.
        </p>
        <button class="btn btn-outline btn-sm" onclick="resetFilters()">Reset All Filters</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = courses.map(course => {
    const lessonCount = (course.lessons || []).length;
    const prog = userProgressMap.get(course.id);
    const percentage = prog ? (prog.percentage || 0) : 0;
    const isFinished = percentage === 100;
    const hasStarted = percentage > 0;

    return `
      <div class="card feature-card" style="display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <!-- Card Header Badges -->
          <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
            <span class="badge badge-primary">${escapeHtml(course.categoryLabel || course.category || 'Programming')}</span>
            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); background: var(--bg-main); padding: 2px 8px; border-radius: 4px; border: 1px solid var(--border-color);">
              ${escapeHtml(course.level || 'Beginner')}
            </span>
          </div>

          <!-- Course Title & Description -->
          <h3 class="card-title" style="margin-bottom: 8px; font-size: 18px;">${escapeHtml(course.title)}</h3>
          <p class="card-body" style="font-size: 14px; color: var(--text-muted); margin-bottom: 16px; line-height: 1.6;">
            ${escapeHtml(course.description)}
          </p>
        </div>

        <div>
          <!-- Course Meta: Lessons & Duration -->
          <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center;">
            <span style="display: flex; align-items: center; gap: 4px;">
              <span>📖</span> ${lessonCount} ${lessonCount === 1 ? 'Lesson' : 'Lessons'}
            </span>
            <span style="display: flex; align-items: center; gap: 4px;">
              <span>⏱</span> ${escapeHtml(course.duration || '3 hours')}
            </span>
          </div>

          <!-- Student Progress Indicator (if started or completed) -->
          ${hasStarted ? `
            <div style="margin-bottom: 16px; background-color: var(--bg-main); padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
              <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; margin-bottom: 4px;">
                <span style="color: ${isFinished ? 'var(--success)' : 'var(--text-main)'};">
                  ${isFinished ? '✅ Course Completed' : 'In Progress'}
                </span>
                <span style="color: ${isFinished ? 'var(--success)' : 'var(--primary)'};">${percentage}%</span>
              </div>
              <div class="progress-bar-bg" style="height: 5px;">
                <div class="progress-bar-fill ${isFinished ? 'success' : ''}" style="width: ${percentage}%;"></div>
              </div>
            </div>
          ` : ''}

          <!-- Card Action Buttons -->
          <div style="display: flex; gap: 8px;">
            <a href="/course.html?id=${course.id}" class="btn ${isFinished ? 'btn-success' : 'btn-primary'} btn-sm" style="flex: 1;">
              ${hasStarted ? (isFinished ? 'Review Curriculum' : 'Continue Learning') : 'Start Learning'}
            </a>
            <a href="/quiz.html?courseId=${course.id}" class="btn btn-outline btn-sm" title="Test your knowledge">
              📝 Quiz
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function setupFilterControls() {
  // Category chip filters
  const chips = document.querySelectorAll('.chip[data-cat]');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => {
        c.classList.remove('active-filter');
        c.style.backgroundColor = '';
        c.style.borderColor = '';
      });

      chip.classList.add('active-filter');
      activeCategory = chip.getAttribute('data-cat') || 'all';
      applyFiltersAndRender();
    });
  });

  // Level selector
  const levelSelect = document.getElementById('levelFilterSelect');
  if (levelSelect) {
    levelSelect.addEventListener('change', (e) => {
      activeLevel = e.target.value;
      applyFiltersAndRender();
    });
  }

  // Search input with instant filtering
  const searchInput = document.getElementById('courseSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      activeSearchQuery = e.target.value;
      applyFiltersAndRender();
    });
  }
}

function resetFilters() {
  activeCategory = 'all';
  activeLevel = 'all';
  activeSearchQuery = '';

  const searchInput = document.getElementById('courseSearchInput');
  if (searchInput) searchInput.value = '';

  const levelSelect = document.getElementById('levelFilterSelect');
  if (levelSelect) levelSelect.value = 'all';

  const chips = document.querySelectorAll('.chip[data-cat]');
  chips.forEach(c => {
    if (c.getAttribute('data-cat') === 'all') {
      c.classList.add('active-filter');
    } else {
      c.classList.remove('active-filter');
    }
  });

  applyFiltersAndRender();
}
