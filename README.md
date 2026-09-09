# 🎓 VertexLearn AI — Modern Full-Stack AI Learning Management System

> **VertexLearn AI** is a full-stack, enterprise-grade Learning Management System (LMS) engineered with clean HTML5/CSS3/JavaScript on the client, an Express + Node.js backend, MongoDB & Mongoose persistence, and native Google Gemini AI tutoring powered by `@google/genai` and `gemini-3.8-flash`.

---

## 🌟 Key Features

1. **Responsive Multi-Device Interface**: Clean typography, accessible contrast, mobile navigation drawer, and modern UI cards without external heavyweight frontend frameworks.
2. **Modular Express Architecture**: Clean separation into dedicated routes (`/api/auth`, `/api/courses`, `/api/progress`, `/api/quiz`, `/api/ai`), structured middlewares, and custom request logging.
3. **Robust Database Layer & Seeding**: MongoDB with Mongoose schemas (`User`, `Course`, `LessonProgress`, `QuizResult`) with dual-mode in-memory fallback for resilient local previews.
4. **Student Authentication & Security**: Password hashing via `bcryptjs` (salt rounds = 10) and cryptographically signed stateless `jsonwebtoken` (JWT) authentication.
5. **Interactive Curriculum & Lesson Viewer**: Rich lesson navigation, live code snippets, complete-and-continue workflow, and dynamic percentage recalculation.
6. **Progress Tracking**: Real-time database updates tracking completed lessons and overall progress across the student curriculum.
7. **Secure Assessment & Anti-Cheat Engine**: Server-side grading of multiple-choice exams, randomized question sequences, timed exam countdown, and post-submission diagnostic links directly into the AI tutor.
8. **Vertex AI Tutor (`gemini-3.8-flash`)**: Server-side proxy to the Google GenAI SDK with multi-turn conversational memory, analogies, clean code blocks with copy buttons, and common pitfall warnings.
9. **AI Study Tools Suite**:
   - **Topic Explainer**: 5-part pedagogical breakdowns customized for Beginner, Practical, or Interview Ready levels.
   - **Text Summarizer**: Distills dense documentation into executive summaries, bullet points, and key terms.
   - **Practice Question Generator**: Generates custom interview and drill questions with model answers and in-depth explanations.
10. **Student Profile, Badges & Verified Certificates**: Dynamic milestone achievements (First Step, Dedicated Scholar, Quiz Achiever, Course Champion) and printable Verified Certificates of Completion (`@media print` supported).
11. **Comprehensive Documentation & Viva Guide**: In-depth architecture breakdown and evaluators' viva preparation guide in `explain.md`.

---

## 🛠️ Tech Stack

- **Client**: Semantic HTML5, Vanilla JavaScript (ES6+), Modern Responsive CSS3 (Custom Variables, Flexbox, CSS Grid).
- **Server**: Node.js, Express.js, TypeScript, `tsx`.
- **Database**: MongoDB, Mongoose ODM (with in-memory fallback store).
- **Authentication**: `bcryptjs` & `jsonwebtoken` (JWT).
- **AI Tutoring & Study Tools**: Google Gemini API via `@google/genai` SDK (`gemini-3.8-flash`).
- **Build & Bundle**: Vite + `esbuild` for production Node CJS bundling.

---

## 📁 Project Directory Structure

```text
vertexlearn-ai/
├── config/
│   └── db.ts                   # MongoDB connection manager & status reporter
├── data/
│   └── seedData.ts             # 6 comprehensive courses, lessons & quiz question banks
├── middleware/
│   └── auth.middleware.ts      # Bearer JWT verification & user attachment middleware
├── models/
│   ├── User.ts                 # Student schema with bcrypt pre-save password hook
│   ├── Course.ts               # Course catalog & nested lesson content schema
│   ├── LessonProgress.ts       # Student lesson completion tracking schema
│   └── QuizResult.ts           # Assessment scores, timestamps & pass/fail records
├── public/                     # Static frontend client served by Express
│   ├── index.html              # Homepage with curriculum highlights & features
│   ├── courses.html            # Course catalog with search & category filters
│   ├── course.html             # Interactive lesson reader & progress updater
│   ├── quiz.html               # Timed quiz assessment engine & review panel
│   ├── tutor.html              # Vertex AI Tutor multi-turn conversational chat
│   ├── study-tools.html        # AI Topic Explainer, Summarizer & Practice Questions
│   ├── dashboard.html          # Student learning metrics & active courses
│   ├── profile.html            # Academic stats, milestone badges & certificates
│   ├── login.html              # Student login portal
│   ├── signup.html             # Student registration portal
│   ├── css/style.css           # Global stylesheet with @media print support
│   └── js/
│       ├── auth.js             # Client-side session, JWT storage & authFetch
│       ├── main.js             # Global navbar state & mobile menu drawer
│       └── dashboard.js        # Dashboard metrics aggregator & charts
├── routes/
│   ├── health.routes.ts        # Health check & uptime monitoring (/api/health)
│   ├── auth.routes.ts          # Authentication routes (/api/auth)
│   ├── courses.routes.ts       # Curriculum catalog endpoints (/api/courses)
│   ├── progress.routes.ts      # Lesson completion endpoints (/api/progress)
│   ├── quiz.routes.ts          # Assessment retrieval & scoring (/api/quiz)
│   ├── ai.routes.ts            # Gemini 3.8 Flash proxy (/api/ai/tutor, /api/ai/study-tools)
│   └── seed.routes.ts          # Database re-seed trigger (/api/seed)
├── explain.md                  # Comprehensive architectural guide & Viva Q&A
├── metadata.json               # AI Studio applet metadata & capabilities
├── server.ts                   # Express server entry point & middleware stack
├── package.json                # Project dependencies & build scripts
└── README.md                   # System documentation
```

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
# Server Port (default: 3000)
PORT=3000

# Environment Mode
NODE_ENV=development

# JWT Secret for token signing
JWT_SECRET=your-secure-jwt-secret-key

# MongoDB Connection String (optional, falls back to in-memory store if omitted)
MONGODB_URI=mongodb://localhost:27017/vertexlearn

# Google Gemini API Key (for real-time Vertex AI Tutor & Study Tools)
GEMINI_API_KEY=your-gemini-api-key
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
The application will launch on **http://localhost:3000**.

### 3. Build for Production
```bash
npm run build
npm start
```

---

## 📡 Core API Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service uptime and health diagnostics | No |
| `POST` | `/api/auth/register` | Register new student with bcrypt hashing | No |
| `POST` | `/api/auth/login` | Authenticate student and issue JWT token | No |
| `GET` | `/api/auth/me` | Fetch authenticated student profile | Yes |
| `PUT` | `/api/auth/profile` | Update profile name or password | Yes |
| `GET` | `/api/courses` | Retrieve complete course catalog | No |
| `GET` | `/api/courses/:id` | Retrieve course details and lessons | No |
| `GET` | `/api/progress` | Get student lesson progress records | Yes |
| `POST` | `/api/courses/:id/complete-lesson` | Mark lesson as complete | Yes |
| `GET` | `/api/quiz/:courseId` | Fetch sanitized exam questions (anti-cheat) | No |
| `POST` | `/api/quiz/submit` | Server-side exam grading & score recording | Optional |
| `GET` | `/api/quiz/results` | Fetch past quiz assessment records | Yes |
| `POST` | `/api/ai/tutor` | Vertex AI Tutor conversation proxy (`gemini-3.8-flash`) | Optional |
| `POST` | `/api/ai/study-tools` | Explainer, Summarizer & Practice Questions generator | Optional |

---

## 📄 Verified Certificates of Completion

When a student completes 100% of a course's lessons or scores 70%+ on the course assessment, an official certificate is automatically awarded in their **Profile** (`/profile.html`). Clicking **View & Print Certificate** launches an official credential with:
- Student's full name
- Course title and honors distinction
- Verification credential ID
- Academic seal & clean `@media print` support for instant PDF export.

---

## 📖 Evaluation & Viva Guide

For in-depth explanations of the system design, security patterns, database normalization, algorithm complexity, and model selections, refer to **`explain.md`**.
