/**
 * VertexLearn AI - Student Dashboard Controller
 * Fetches and displays student enrollment, progress bars, and recent quiz scores
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Check if logged in; if not, redirect to login
  if (!requireAuth()) return;

  const currentUser = getUser();
  const welcomeTitle = document.getElementById('welcomeTitle');
  if (welcomeTitle && currentUser) {
    welcomeTitle.textContent = `Welcome back, ${escapeHtml(currentUser.name)}! 👋`;
  }

  await loadDashboardData();
});

async function loadDashboardData() {
  const container = document.getElementById('coursesListContainer');
  const quizContainer = document.getElementById('quizScoresContainer');

  try {
    // 1. Fetch courses and student progress
    const [coursesRes, progressRes, quizRes] = await Promise.all([
      fetch('/api/courses'),
      authFetch('/api/progress'),
      authFetch('/api/quiz/results')
    ]);

    const courses = await coursesRes.json();
    const progressList = await progressRes.json();
    const quizResults = await quizRes.json();

    // 2. Map progress by courseId
    const progressMap = {};
    let totalCompletedLessons = 0;
    let totalLessonsAllCourses = 0;

    if (Array.isArray(progressList)) {
      progressList.forEach(p => {
        progressMap[p.courseId] = p;
      });
    }

    // 3. Render course progress cards
    if (courses && courses.length > 0) {
      container.innerHTML = '';

      courses.forEach(course => {
        const prog = progressMap[course.id] || { completedLessons: [], percentage: 0 };
        const completedCount = (prog.completedLessons || []).length;
        const totalLessons = (course.lessons || []).length;
        const percentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

        totalCompletedLessons += completedCount;
        totalLessonsAllCourses += totalLessons;

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div>
              <span class="badge badge-primary">${escapeHtml(course.category || 'Programming')}</span>
              <h3 style="font-size: 18px; font-weight: 700; color: var(--text-main); margin-top: 6px;">
                ${escapeHtml(course.title)}
              </h3>
            </div>
            <span style="font-size: 13px; font-weight: 600; color: var(--text-muted);">
              ${completedCount} / ${totalLessons} Lessons
            </span>
          </div>

          <p style="font-size: 14px; color: var(--text-muted); margin-bottom: 12px;">
            ${escapeHtml(course.description)}
          </p>

          <div class="progress-container">
            <div class="progress-info">
              <span>Course Progress</span>
              <span style="color: ${percentage === 100 ? 'var(--success)' : 'var(--primary)'};">${percentage}%</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill ${percentage === 100 ? 'success' : ''}" style="width: ${percentage}%;"></div>
            </div>
          </div>

          <div style="display: flex; gap: 10px; margin-top: 16px; flex-wrap: wrap;">
            <a href="/course.html?id=${course.id}" class="btn btn-primary btn-sm">
              ${completedCount === 0 ? '▶ Start Course' : '📖 Continue Lesson'}
            </a>
            <a href="/quiz.html?courseId=${course.id}" class="btn btn-outline btn-sm">
              📝 Take Quiz
            </a>
          </div>
        `;
        container.appendChild(card);
      });
    } else {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 30px;">
          <p style="color: var(--text-muted);">No courses available at the moment.</p>
        </div>
      `;
    }

    // 4. Update Stats Overview
    const statEnrolled = document.getElementById('statEnrolledCourses');
    const statLessons = document.getElementById('statCompletedLessons');
    const statQuizAvg = document.getElementById('statAverageQuizScore');
    const statOverall = document.getElementById('statOverallProgress');

    if (statEnrolled) statEnrolled.textContent = courses.length;
    if (statLessons) statLessons.textContent = totalCompletedLessons;

    const overallPct = totalLessonsAllCourses > 0 
      ? Math.round((totalCompletedLessons / totalLessonsAllCourses) * 100) 
      : 0;
    if (statOverall) statOverall.textContent = `${overallPct}%`;

    // 5. Render Quiz Results
    if (Array.isArray(quizResults) && quizResults.length > 0) {
      let totalQuizScorePct = 0;
      quizContainer.innerHTML = '';

      quizResults.slice(0, 5).forEach(result => {
        totalQuizScorePct += result.percentage;
        const item = document.createElement('div');
        item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border-color);';
        item.innerHTML = `
          <div>
            <div style="font-size: 14px; font-weight: 600; color: var(--text-main);">${escapeHtml(result.courseTitle)}</div>
            <div style="font-size: 12px; color: var(--text-light);">${new Date(result.completedAt || Date.now()).toLocaleDateString()}</div>
          </div>
          <div style="text-align: right;">
            <span class="badge ${result.percentage >= 70 ? 'badge-success' : 'badge-primary'}">
              ${result.score}/${result.totalQuestions} (${result.percentage}%)
            </span>
          </div>
        `;
        quizContainer.appendChild(item);
      });

      const avgQuiz = Math.round(totalQuizScorePct / quizResults.length);
      if (statQuizAvg) statQuizAvg.textContent = `${avgQuiz}%`;
    } else {
      quizContainer.innerHTML = `
        <p style="color: var(--text-muted); font-size: 14px;">No quizzes taken yet.</p>
        <a href="/courses.html" class="btn btn-outline btn-sm" style="margin-top: 10px;">Find a Quiz</a>
      `;
      if (statQuizAvg) statQuizAvg.textContent = '0%';
    }

  } catch (err) {
    console.error('Error loading dashboard data:', err);
    showAlert('dashboardAlert', 'Could not load student dashboard data: ' + err.message, 'danger');
  }
}
