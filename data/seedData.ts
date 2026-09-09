/**
 * Seed data for VertexLearn AI LMS
 * Provides curriculum courses, quizzes, and initial demo student
 */

export const seedCourses = [
  {
    id: 'html-css-basics',
    title: 'HTML & CSS Responsive Web Design',
    category: 'frontend',
    categoryLabel: 'Frontend',
    level: 'Beginner',
    duration: '4 hours',
    description: 'Master the fundamental building blocks of web pages: semantic HTML5 tags, CSS box model, Flexbox, Grid, and mobile-friendly layouts.',
    lessons: [
      {
        id: 'html-structure',
        title: '1. Semantic HTML5 & Document Anatomy',
        duration: '20 min',
        content: `### Semantic HTML5
Semantic HTML introduces elements with clear meaning to both the browser and the developer.

#### Key Semantic Elements
- \`<header>\`: Introductory content or navigation links
- \`<nav>\`: Navigation menus
- \`<main>\`: The dominant content of the document
- \`<article>\`: Self-contained, reusable content
- \`<section>\`: Thematic grouping of content
- \`<footer>\`: Footer notes, copyright, and links

#### Example Code
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Semantic Page</title>
</head>
<body>
  <header>
    <h1>VertexLearn AI</h1>
  </header>
  <main>
    <article>
      <h2>Understanding Web Standards</h2>
      <p>Building accessible websites starts with valid markup.</p>
    </article>
  </main>
  <footer>
    <p>&copy; 2026 VertexLearn</p>
  </footer>
</body>
</html>
\`\`\``
      },
      {
        id: 'css-box-model',
        title: '2. The CSS Box Model Explained',
        duration: '25 min',
        content: `### The CSS Box Model
Every HTML element rendered on a web page is treated as a rectangular box.

#### Box Layers (Inside to Outside):
1. **Content**: The text, image, or video itself.
2. **Padding**: Transparent space between the content and the border.
3. **Border**: The stroke surrounding the padding.
4. **Margin**: Transparent space outside the border separating other elements.

#### Best Practice: Border-Box
Always set \`box-sizing: border-box;\` so padding and border do not increase the total calculated width of an element.

\`\`\`css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.card {
  width: 300px;
  padding: 20px;
  border: 1px solid #cbd5e1;
  margin: 16px auto;
}
\`\`\``
      },
      {
        id: 'css-flexbox-layout',
        title: '3. Modern Layouts with CSS Flexbox',
        duration: '35 min',
        content: `### CSS Flexbox (Flexible Box Layout)
Flexbox is a one-dimensional layout model that simplifies distributing space and aligning items.

#### Common Flexbox Properties
- \`display: flex;\` (enables flex container)
- \`justify-content: center | space-between | flex-start;\` (main axis alignment)
- \`align-items: center | stretch | flex-start;\` (cross axis alignment)
- \`flex-wrap: wrap;\` (wraps overflowing items to new line)
- \`gap: 16px;\` (sets gutter between children)

\`\`\`css
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
}
\`\`\``
      }
    ]
  },
  {
    id: 'javascript-fundamentals',
    title: 'Modern JavaScript (ES6+) for Beginners',
    category: 'javascript',
    categoryLabel: 'JavaScript',
    level: 'Beginner',
    duration: '6 hours',
    description: 'Learn variables, data types, arrow functions, DOM manipulation, Promises, and asynchronous programming with async/await.',
    lessons: [
      {
        id: 'js-variables-datatypes',
        title: '1. Variables (let, const) & Data Types',
        duration: '25 min',
        content: `### JavaScript Variables: let vs const vs var
Modern JavaScript favors \`const\` by default and \`let\` when variables must be reassigned.

#### Why avoid \`var\`?
- \`var\` is function-scoped and hoisted with an initial value of \`undefined\`, creating subtle bugs.
- \`let\` and \`const\` are block-scoped (\`{ ... }\`) and prevent accidental variable re-declaration.

\`\`\`javascript
const schoolName = 'VertexLearn AI';
let studentScore = 95;

studentScore = 100; // Allowed with let!
// schoolName = 'Other'; // Error: Assignment to constant variable
\`\`\``
      },
      {
        id: 'js-dom-manipulation',
        title: '2. DOM Manipulation & Event Listeners',
        duration: '35 min',
        content: `### Interacting with the DOM
The Document Object Model (DOM) is the browser's representation of your HTML hierarchy.

#### Essential Methods
- \`document.getElementById(id)\`
- \`document.querySelector(selector)\`
- \`element.addEventListener('click', handler)\`
- \`element.textContent\` vs \`element.innerHTML\`

\`\`\`javascript
const submitBtn = document.getElementById('submitBtn');
submitBtn.addEventListener('click', (event) => {
  event.preventDefault();
  console.log('Button clicked!');
});
\`\`\``
      },
      {
        id: 'js-async-promises',
        title: '3. Asynchronous JavaScript & Async/Await',
        duration: '40 min',
        content: `### Async/Await and Promises
JavaScript is single-threaded. To avoid blocking the browser during network requests, it uses the Event Loop with Promises.

\`\`\`javascript
async function fetchCourseData(courseId) {
  try {
    const response = await fetch(\`/api/courses/\${courseId}\`);
    if (!response.ok) {
      throw new Error('Failed to load course');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Network Error:', error);
  }
}
\`\`\``
      }
    ]
  },
  {
    id: 'fullstack-web-dev',
    title: 'Full-Stack Architecture & REST APIs',
    category: 'backend',
    categoryLabel: 'Backend & DB',
    level: 'Intermediate',
    duration: '8 hours',
    description: 'Understand client-server architecture, HTTP methods (GET, POST, PUT, DELETE), status codes, and building scalable REST endpoints.',
    lessons: [
      {
        id: 'client-server-model',
        title: '1. The Client-Server Architecture',
        duration: '30 min',
        content: `### Client-Server Architecture
In web development, the Client (frontend browser) makes HTTP requests over TCP/IP to the Server (backend), which computes or queries a database and returns an HTTP response.`
      },
      {
        id: 'rest-api-principles',
        title: '2. RESTful API Principles & HTTP Methods',
        duration: '40 min',
        content: `### RESTful APIs
REST (Representational State Transfer) uses standard HTTP verbs:
- **GET**: Retrieve a resource
- **POST**: Create a new resource
- **PUT / PATCH**: Update an existing resource
- **DELETE**: Remove a resource`
      }
    ]
  },
  {
    id: 'mongodb-database',
    title: 'MongoDB & Document Database Storage',
    category: 'backend',
    categoryLabel: 'Backend & DB',
    level: 'Intermediate',
    duration: '5 hours',
    description: 'Store and query JSON-like BSON documents. Design collections, models, indexes, and write efficient CRUD operations.',
    lessons: [
      {
        id: 'mongodb-intro',
        title: '1. Introduction to NoSQL & Documents',
        duration: '30 min',
        content: `### MongoDB Basics
MongoDB is a document-oriented NoSQL database. Rather than tables with rows and columns, data is stored in flexible, JSON-like documents called BSON.

#### Core Concepts:
- **Database**: The container holding all collections.
- **Collection**: Analogous to a SQL table, grouping documents together.
- **Document**: An individual JSON/BSON object with a unique \`_id\`.
- **Mongoose**: An Object Data Modeling (ODM) library that enforces schemas and validation.`
      },
      {
        id: 'mongodb-crud',
        title: '2. Mongoose CRUD Operations',
        duration: '40 min',
        content: `### CRUD in Mongoose
- **Create**: \`await Course.create({ title, category })\`
- **Read**: \`await Course.find({ category: 'frontend' })\`
- **Update**: \`await Course.findByIdAndUpdate(id, { ... })\`
- **Delete**: \`await Course.findByIdAndDelete(id)\``
      }
    ]
  },
  {
    id: 'nodejs-express',
    title: 'Node.js & Express.js Backend Development',
    category: 'backend',
    categoryLabel: 'Backend & DB',
    level: 'Intermediate',
    duration: '7 hours',
    description: 'Build fast backend microservices with Node.js. Implement Express routing, custom middleware, error handling, and JWT authentication.',
    lessons: [
      {
        id: 'express-fundamentals',
        title: '1. Express Server & Routing Fundamentals',
        duration: '35 min',
        content: `### Express.js Routing
Express is a minimalist web framework for Node.js. It simplifies route definitions and middleware chains.

\`\`\`javascript
import express from 'express';
const app = express();

app.get('/api/greeting', (req, res) => {
  res.json({ message: 'Hello from Express!' });
});

app.listen(3000, () => console.log('Server started on port 3000'));
\`\`\``
      }
    ]
  },
  {
    id: 'intro-to-ai',
    title: 'Introduction to AI & Large Language Models',
    category: 'ai',
    categoryLabel: 'Artificial Intelligence',
    level: 'Beginner',
    duration: '4 hours',
    description: 'Explore generative AI, prompt engineering techniques, and integrating intelligent APIs like Google Gemini into web apps.',
    lessons: [
      {
        id: 'generative-ai-basics',
        title: '1. How Large Language Models Work',
        duration: '30 min',
        content: `### Generative AI & LLMs
Large Language Models (LLMs) are trained on massive datasets to predict the most contextually relevant tokens. When paired with APIs like Gemini, web developers can generate explanations, code reviews, and smart tutoring assistants.`
      }
    ]
  }
];

export const seedQuizzes = [
  {
    courseId: 'html-css-basics',
    courseTitle: 'HTML & CSS Responsive Web Design',
    questions: [
      {
        id: 'q1',
        question: 'Which HTML5 element represents self-contained, reusable content (like a blog post)?',
        options: ['<section>', '<article>', '<div>', '<header>'],
        correctIndex: 1,
        explanation: '<article> is explicitly designed for independent, syndicatable content such as news articles or blog posts.'
      },
      {
        id: 'q2',
        question: 'Which CSS property defines how element widths are calculated, ensuring padding does not expand total width?',
        options: ['display: block;', 'box-sizing: border-box;', 'margin: auto;', 'overflow: hidden;'],
        correctIndex: 1,
        explanation: 'box-sizing: border-box includes both padding and border within the specified element width.'
      },
      {
        id: 'q3',
        question: 'In Flexbox, which property aligns items along the primary (main) axis?',
        options: ['align-items', 'justify-content', 'flex-direction', 'align-content'],
        correctIndex: 1,
        explanation: 'justify-content controls alignment along the main axis, while align-items aligns along the cross axis.'
      },
      {
        id: 'q4',
        question: 'What is the default layout direction of a flex container?',
        options: ['column', 'row', 'row-reverse', 'wrap'],
        correctIndex: 1,
        explanation: 'flex-direction defaults to "row" in standard CSS Flexbox.'
      }
    ]
  },
  {
    courseId: 'javascript-fundamentals',
    courseTitle: 'Modern JavaScript (ES6+) for Beginners',
    questions: [
      {
        id: 'q1',
        question: 'What is the main difference between "let" and "var" in modern JavaScript?',
        options: [
          'let is block-scoped, while var is function-scoped',
          'var is block-scoped, while let is function-scoped',
          'let cannot be reassigned once defined',
          'There is no difference between let and var'
        ],
        correctIndex: 0,
        explanation: 'let is constrained to the block ({ ... }) where it was defined, helping prevent unintended variable pollution.'
      },
      {
        id: 'q2',
        question: 'Which keyword is used to pause asynchronous function execution until a Promise settles?',
        options: ['wait', 'pause', 'await', 'defer'],
        correctIndex: 2,
        explanation: 'The "await" keyword pauses an async function execution until the targeted Promise resolves or rejects.'
      },
      {
        id: 'q3',
        question: 'Which DOM method attaches an interactive event listener to an element without overwriting existing ones?',
        options: ['element.onclick = fn', 'element.attachEvent()', 'element.addEventListener()', 'element.on()'],
        correctIndex: 2,
        explanation: 'addEventListener allows multiple independent listener callbacks on the same DOM element.'
      }
    ]
  },
  {
    courseId: 'mongodb-database',
    courseTitle: 'MongoDB & Document Database Storage',
    questions: [
      {
        id: 'q1',
        question: 'In MongoDB terminology, what is analogous to a SQL table?',
        options: ['Document', 'Collection', 'Index', 'Field'],
        correctIndex: 1,
        explanation: 'A collection is a group of MongoDB documents, corresponding directly to a table in relational databases.'
      },
      {
        id: 'q2',
        question: 'What is the format used by MongoDB to store documents internally?',
        options: ['XML', 'YAML', 'BSON', 'CSV'],
        correctIndex: 2,
        explanation: 'MongoDB stores data in BSON (Binary JSON), which extends JSON with data types like Date and raw Binary.'
      },
      {
        id: 'q3',
        question: 'What does Mongoose provide on top of native MongoDB driver?',
        options: ['Relational SQL queries', 'Schema validation and middleware modeling', 'Graphical user interface', 'CSS stylesheet compilation'],
        correctIndex: 1,
        explanation: 'Mongoose provides schema-based modeling, type casting, validation, and lifecycle middleware.'
      }
    ]
  },
  {
    courseId: 'nodejs-express',
    courseTitle: 'Node.js & Express.js Backend Development',
    questions: [
      {
        id: 'q1',
        question: 'What core design pattern defines how Express handles incoming HTTP requests through a chain of functions?',
        options: ['Model-View-Controller', 'Middleware Pipeline', 'Observer Pattern', 'Singleton Factory'],
        correctIndex: 1,
        explanation: 'Express functions as a middleware pipeline where request handlers invoke next() to pass control downstream.'
      },
      {
        id: 'q2',
        question: 'Which built-in Express middleware is required to parse incoming JSON request bodies into req.body?',
        options: ['express.static()', 'express.json()', 'express.urlencoded()', 'express.router()'],
        correctIndex: 1,
        explanation: 'express.json() is the standard middleware for parsing application/json payloads.'
      },
      {
        id: 'q3',
        question: 'What argument signature distinguishes Express error-handling middleware from standard route middleware?',
        options: ['(req, res)', '(err, req, res, next)', '(req, res, next)', '(err, res)'],
        correctIndex: 1,
        explanation: 'Error-handling middleware must declare 4 parameters: (err, req, res, next) so Express recognizes it.'
      }
    ]
  },
  {
    courseId: 'rest-api-design',
    courseTitle: 'RESTful API Architecture & Design Principles',
    questions: [
      {
        id: 'q1',
        question: 'Which HTTP method should be used to retrieve data without causing side-effects on the server (safe & idempotent)?',
        options: ['POST', 'GET', 'PATCH', 'DELETE'],
        correctIndex: 1,
        explanation: 'GET requests must be safe and idempotent, meaning they read data without modifying server state.'
      },
      {
        id: 'q2',
        question: 'Which HTTP status code signifies that a resource was successfully created on the server?',
        options: ['200 OK', '201 Created', '204 No Content', '301 Moved Permanently'],
        correctIndex: 1,
        explanation: '201 Created explicitly communicates that a new entity was created and stored.'
      },
      {
        id: 'q3',
        question: 'What is the key principle of statelessness in REST architecture?',
        options: [
          'The server stores all user session states in memory',
          'Every request must contain all information required to understand and process it',
          'Databases must not save any transactions',
          'Clients must not cache responses'
        ],
        correctIndex: 1,
        explanation: 'Statelessness means each client request contains all authentication and query context without relying on stored session affinity.'
      }
    ]
  },
  {
    courseId: 'ai-web-development',
    courseTitle: 'AI-Powered Web Development with Google Gemini',
    questions: [
      {
        id: 'q1',
        question: 'What is the crucial architectural rule regarding Gemini API keys in full-stack web applications?',
        options: [
          'Store the API key in client-side localStorage',
          'Keep the API key in server-side environment variables and proxy requests via /api routes',
          'Hardcode the key in HTML meta tags',
          'Send the key directly from the browser in headers'
        ],
        correctIndex: 1,
        explanation: 'Private API keys must always stay server-side to prevent unauthorized usage and quota exhaustion.'
      },
      {
        id: 'q2',
        question: 'Which prompt engineering technique provides few demonstrations of input and expected output before the final task?',
        options: ['Zero-shot prompting', 'Few-shot prompting', 'Negative prompting', 'Token clipping'],
        correctIndex: 1,
        explanation: 'Few-shot prompting supplies 2-3 sample pairs to guide the model towards the desired structure and tone.'
      },
      {
        id: 'q3',
        question: 'What official SDK is recommended for Node.js / TypeScript integration with Gemini?',
        options: ['@google/genai', 'gemini-legacy-core', 'google-ai-studio-client', 'open-gemini-node'],
        correctIndex: 0,
        explanation: 'The modern @google/genai SDK provides the standard interface for Gemini models.'
      }
    ]
  }
];

export const seedUsers = [
  {
    name: 'Alex Student',
    email: 'student@example.com',
    password: 'password123',
    role: 'student' as const
  }
];

export const seedProgress = [
  {
    userId: 'demo-student-1',
    courseId: 'html-css-basics',
    completedLessons: ['html-structure', 'css-box-model'],
    percentage: 67
  },
  {
    userId: 'demo-student-1',
    courseId: 'javascript-fundamentals',
    completedLessons: ['js-variables-datatypes'],
    percentage: 33
  }
];

export const seedQuizResults = [
  {
    userId: 'demo-student-1',
    courseId: 'html-css-basics',
    courseTitle: 'HTML & CSS Responsive Web Design',
    score: 4,
    totalQuestions: 4,
    percentage: 100
  }
];
