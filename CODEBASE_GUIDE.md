# Smart Driving Learning Platform - Complete Codebase Guide

> A comprehensive deep-dive into every layer, file, pattern, relationship, and decision in this project. Written so you can fully understand how the code works from the ground up.

---

## Table of Contents

1. [The Business: What This Platform Does](#1-the-business-what-this-platform-does)
2. [High-Level Architecture Overview](#2-high-level-architecture-overview)
3. [How a Request Flows Through the System](#3-how-a-request-flows-through-the-system)
4. [The Four Layers Explained in Depth](#4-the-four-layers-explained-in-depth)
5. [Database Models & Relationships](#5-database-models--relationships)
6. [Authentication System: How JWT Works Here](#6-authentication-system-how-jwt-works-here)
7. [The Route Map: Every Endpoint Explained](#7-the-route-map-every-endpoint-explained)
8. [The AI Assistant: How It Works in Detail](#8-the-ai-assistant-how-it-works-in-detail)
9. [The Admin System: How It Works](#9-the-admin-system-how-it-works)
10. [File Upload System: How Documents Work](#10-file-upload-system-how-documents-work)
11. [Dashboard Reporting: How Stats Are Calculated](#11-dashboard-reporting-how-stats-are-calculated)
12. [Error Handling: How Errors Flow](#12-error-handling-how-errors-flow)
13. [Startup Sequence: What Happens When the Server Starts](#13-startup-sequence-what-happens-when-the-server-starts)
14. [File-by-File Reference](#14-file-by-file-reference)
15. [Data Flow Diagrams for Key Operations](#15-data-flow-diagrams-for-key-operations)

---

## 1. The Business: What This Platform Does

### The Problem

Students preparing for a driving license exam need:
- Structured lessons to learn traffic rules, road signs, and safe driving
- Practice quizzes to test their knowledge before the real exam
- An intelligent tutor that can answer their questions and help them understand mistakes
- Progress tracking to know what they've covered and where they're weak

### The Solution

This platform is a **backend API** (no frontend — it provides REST endpoints for a frontend app to consume) that delivers:

#### For Students:
1. **Learn** — Browse structured chapters (e.g., "Traffic Signs", "Speed Limits"), each containing sub-lessons with detailed content
2. **Practice** — Take quizzes linked to chapters, get instant grading with explanations for wrong answers
3. **Simulate Exams** — Take randomized 10-question exam simulations (answers hidden until submission)
4. **Track Progress** — See which chapters are completed, quiz scores, overall completion percentage
5. **Ask AI** — Chat with an AI tutor that knows their personal progress AND has access to uploaded reference documents

#### For Admins:
1. **Manage Content** — Create, update, delete lessons and quiz questions
2. **Manage Users** — View all users, update their emails/passwords, delete accounts
3. **Upload Knowledge Base** — Upload PDF/DOC/DOCX/TXT files that the AI reads and uses to answer questions
4. **View Dashboard** — See platform-wide stats (user counts, quiz pass rates, chapter completion rates, recent activity)

### The AI's Role

The AI assistant is **not a generic chatbot**. It's specifically designed to:

1. **Only answer driving questions** — Off-topic questions get a polite redirect
2. **Know the student's learning state** — It reads the student's quiz results, completed lessons, and overall progress from the database. It can say "I see you struggled with Traffic Signs (60%) — let me explain that topic differently."
3. **Use uploaded reference materials** — Admin uploads official driving law PDFs, study guides, etc. The AI extracts the text and uses it as its primary knowledge source when answering questions.

This means the AI gives **personalized, document-informed** responses — not generic driving advice.

---

## 2. High-Level Architecture Overview

### The Pattern: Controller-Service-Repository

This project uses a **layered architecture** where each layer has a single responsibility:

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT (Frontend)                  │
│              Sends HTTP requests to the API           │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│                   ROUTES (routes/*.js)               │
│                                                      │
│  Define URL patterns + attach middleware              │
│  Example: POST /api/auth/login → protect → login     │
│                                                      │
│  They do NOT contain any logic — just wiring.        │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│              CONTROLLERS (controllers/*.js)           │
│                                                      │
│  Parse the HTTP request (req.body, req.params)       │
│  Call the appropriate service method                  │
│  Send the HTTP response (res.json, res.status)       │
│                                                      │
│  They contain ZERO business logic.                   │
│  They're just translators between HTTP and services. │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│               SERVICES (services/*.js)               │
│                                                      │
│  ALL business logic lives here:                      │
│  - Validation ("is this email already taken?")       │
│  - Orchestration ("hash the password, then save")    │
│  - Calculations ("compute the overall progress %")   │
│  - External APIs ("call Google Gemini AI")           │
│  - Error decisions ("throw 404 if not found")        │
│                                                      │
│  Services NEVER touch req/res directly.              │
│  They receive plain data and return plain data.      │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│           REPOSITORIES (repositories/*.js)            │
│                                                      │
│  Thin wrappers around Mongoose model methods:        │
│  - findByEmail(email) → User.findOne({ email })      │
│  - create(data) → Model.create(data)                 │
│  - deleteById(id) → Model.findByIdAndDelete(id)      │
│                                                      │
│  One-liner functions. No logic. No validation.       │
│  If you need to switch from MongoDB to PostgreSQL,   │
│  you'd only change this layer.                       │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│              MODELS (models/*.js)                     │
│                                                      │
│  Mongoose schemas that define document shape:         │
│  - Field types, required flags, defaults             │
│  - Enums, validators, indexes                        │
│  - Virtual fields, timestamps                        │
│                                                      │
│  Models are ONLY used by repositories.               │
└─────────────────────────────────────────────────────┘
```

### Why This Pattern?

**Separation of concerns.** Each layer does one thing:
- Routes know about HTTP URLs, middleware order
- Controllers know about `req` and `res`
- Services know about business rules
- Repositories know about MongoDB/Mongoose
- Models know about data shape

This means:
- When you add a new endpoint, you touch 4 files (route, controller, service, repository) — but each change is small and focused
- When business rules change, you only touch the service
- When the database changes, you only touch the repository + model
- Testing is easier because layers are decoupled

---

## 3. How a Request Flows Through the System

Let's trace a real request: **Student submitting quiz answers**

```
POST /api/quizzes/submit
Authorization: Bearer eyJhbGciOi...
Body: { "answers": [{ "questionId": "abc123", "selectedAnswer": "Fasten seatbelt" }] }
```

### Step 1: Express receives the request

`index.js` has `app.use('/api/quizzes', quizRoutes)`, so Express matches this to the quiz router.

### Step 2: Route matching + Middleware

In `routes/quizRoutes.js`:
```js
router.post('/submit', protect, submitQuiz);
```

Express runs the middleware chain in order:
1. **`protect`** middleware (from `authMiddleware.js`):
   - Extracts `Bearer eyJhbGciOi...` from the Authorization header
   - Calls `jwt.verify(token, JWT_SECRET)` → gets `{ id: "user123" }`
   - Calls `User.findById("user123").select('-password')` → loads the user
   - Sets `req.user = { _id: "user123", name: "Student", email: "...", role: "student" }`
   - Calls `next()` to continue

2. **`submitQuiz`** controller is called

### Step 3: Controller

In `controllers/quizController.js`:
```js
const submitQuiz = async (req, res, next) => {
    try {
        const result = await quizService.submitQuiz(req.user._id, req.body.answers);
        return res.status(200).json(result);
    } catch (error) {
        next(error);  // Pass errors to the global error handler
    }
};
```

The controller:
- Extracts `req.user._id` (set by protect middleware) and `req.body.answers`
- Calls the service with plain data (not `req` or `res`)
- If success: sends the result as JSON
- If error: passes to Express error handler

### Step 4: Service (business logic)

In `services/quizService.js`, `submitQuiz(userId, answers)`:
1. Validates `answers` is present and non-empty → throws `ApiError(400)` if not
2. Calls `quizRepository.findByIds(questionIds)` to load actual questions from DB
3. Loops through each answer, compares `selectedAnswer` to `correctAnswer`
4. Calculates score: `Math.round((correct / total) * 100)`
5. Builds per-question feedback (isCorrect, correctAnswer, explanation)
6. Calls `progressRepository.findByUserId(userId)` to load progress
7. Pushes `{ chapterTitle, score, totalQuestions }` into `progress.quizResults`
8. Calls `progressRepository.update(progress._id, progress)` to save
9. Returns `{ score, totalQuestions, correct, results }`

### Step 5: Repositories (data access)

Each repository call is a one-liner Mongoose operation:
```js
// quizRepository.js
const findByIds = (ids) => Quiz.find({ _id: { $in: ids } });

// progressRepository.js
const findByUserId = (userId) => Progress.findOne({ userId });
const update = (id, data) => Progress.findByIdAndUpdate(id, data, { returnDocument: 'after' });
```

### Step 6: Response

The data flows back up:
- Repository returns Mongoose documents
- Service processes them and returns a plain object
- Controller calls `res.status(200).json(result)`
- Client receives the JSON response

### If an Error Occurs

If the service throws `new ApiError(400, 'Answers array is required')`:
1. Controller catches it in the `catch` block
2. Calls `next(error)` — passes to Express error handler
3. `middleware/errorHandler.js` checks if it's an `ApiError`
4. Returns `res.status(400).json({ message: 'Answers array is required' })`

---

## 4. The Four Layers Explained in Depth

### 4.1 Models Layer

Models define **what data looks like** in MongoDB. Each model is a Mongoose schema.

**Example: `models/User.js`**
```js
const userSchema = new mongoose.Schema(
    {
        name:     { type: String, required: true, trim: true },
        email:    { type: String, required: true, unique: true, trim: true, lowercase: true },
        password: { type: String, required: true },
        role:     { type: String, enum: ['student', 'admin'], default: 'student' }
    },
    { timestamps: true }  // Adds createdAt and updatedAt automatically
);
```

Key patterns:
- `trim: true` removes whitespace from strings before saving
- `lowercase: true` normalizes email to lowercase
- `unique: true` creates a MongoDB unique index (prevents duplicate emails)
- `enum: [...]` restricts the field to specific values
- `timestamps: true` auto-manages `createdAt` and `updatedAt`

### 4.2 Repository Layer

Repositories wrap Mongoose methods. They're intentionally "dumb" — no logic, just data access.

**Example: `repositories/userRepository.js`**
```js
const User = require('../models/User');

const findByEmail = (email) => User.findOne({ email });
const findById = (id) => User.findById(id).select('-password');  // Exclude password
const create = (data) => User.create(data);
const findAll = () => User.find().select('-password').sort({ createdAt: -1 });
const deleteById = (id) => User.findByIdAndDelete(id);
const updateById = (id, data) =>
    User.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true }).select('-password');

module.exports = { findByEmail, findById, create, findAll, deleteById, updateById };
```

**Why `.select('-password')`?** Never send password hashes to clients. The minus sign excludes that field from query results.

**Why `returnDocument: 'after'`?** When updating, return the updated document (not the old one). In Mongoose 7+, this replaces the older `{ new: true }` option.

### 4.3 Service Layer

Services contain ALL business logic. This is where the "thinking" happens.

**Example: `services/userService.js` → `updateUser`**
```js
const updateUser = async (userId, { email, password }) => {
    // 1. Check if user exists
    const user = await userRepository.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    const updateData = {};

    // 2. If email provided, validate uniqueness
    if (email) {
        const normalizedEmail = email.trim().toLowerCase();
        const existing = await userRepository.findByEmail(normalizedEmail);
        if (existing && existing._id.toString() !== userId) {
            throw new ApiError(400, 'Email already in use');
        }
        updateData.email = normalizedEmail;
    }

    // 3. If password provided, hash it
    if (password) {
        if (password.length < 6) throw new ApiError(400, 'Password must be at least 6 characters');
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(password, salt);
    }

    // 4. Must provide at least one field
    if (Object.keys(updateData).length === 0) {
        throw new ApiError(400, 'No fields to update. Provide email or password.');
    }

    // 5. Update and return
    return await userRepository.updateById(userId, updateData);
};
```

Notice how the service:
- Validates input
- Checks business rules (email uniqueness, password length)
- Transforms data (normalize email, hash password)
- Throws meaningful errors with proper HTTP status codes
- Never touches `req` or `res`

### 4.4 Controller Layer

Controllers are thin translators between HTTP and services.

**Example: `controllers/userController.js`**
```js
const updateUser = async (req, res, next) => {
    try {
        const user = await userService.updateUser(req.params.id, req.body);
        return res.status(200).json(user);
    } catch (error) {
        next(error);
    }
};
```

That's it. Three lines of actual logic:
1. Extract data from the request
2. Call the service
3. Send the response

Every controller function follows this exact pattern. No exceptions.

---

## 5. Database Models & Relationships

### Entity Relationship Diagram

```
┌──────────────┐         ┌──────────────┐
│     User     │         │    Lesson    │
│──────────────│         │──────────────│
│ _id          │         │ _id          │
│ name         │         │ title ◄──────┼──── string link to Quiz.chapterTitle
│ email        │         │ description  │
│ password     │         │ image        │
│ role         │         │ order        │
│ createdAt    │         │ isPublished  │
│ updatedAt    │         │ lessons[] ───┼──── embedded sub-lessons
└──────┬───────┘         │ createdAt    │
       │                 │ updatedAt    │
       │                 └──────────────┘
       │
       │ userId (ObjectId ref)
       ▼
┌──────────────┐         ┌──────────────┐
│   Progress   │         │     Quiz     │
│──────────────│         │──────────────│
│ _id          │         │ _id          │
│ userId ──────┼── ref   │ question     │
│ completedLes │         │ options[4]   │
│ quizResults[]│         │ correctAnswer│
│ overallProg  │         │ chapterTitle ┼──── string link to Lesson.title
│ createdAt    │         │ explanation  │
│ updatedAt    │         │ difficulty   │
└──────────────┘         │ createdAt    │
                         │ updatedAt    │
┌──────────────┐         └──────────────┘
│   Document   │
│──────────────│
│ _id          │
│ filename     │
│ originalName │
│ mimeType     │
│ size         │
│ path         │
│ uploadedBy ──┼── ref to User._id
│ createdAt    │
│ updatedAt    │
└──────────────┘
```

### Relationship Details

**User → Progress** (1:1)
- One Progress document per user
- Linked by `Progress.userId` (ObjectId reference to User)
- Progress is auto-created on first lesson completion or quiz submission

**Lesson → Quiz** (1:Many, by string)
- Quizzes link to lessons via `Quiz.chapterTitle` matching `Lesson.title`
- This is a **string-based relationship**, not an ObjectId reference
- Why? Simpler to seed and query. Tradeoff: renaming a lesson title would break the link.

**Lesson → Sub-lessons** (1:Many, embedded)
- Sub-lessons are **embedded documents** inside the Lesson
- They don't have their own `_id` (set to `false` in schema)
- This is appropriate because sub-lessons never exist independently

**User → Document** (1:Many)
- `Document.uploadedBy` references `User._id`
- Only admins upload documents, but the relationship is generic

**Progress.completedLessons** (string-based tracking)
- Stores strings like `"Traffic Signs:Warning Signs"`
- Format: `"ChapterTitle:SubLessonTitle"`
- To check if a sub-lesson is done: `completedLessons.includes("Traffic Signs:Warning Signs")`
- To check if a chapter is fully done: check that ALL sub-lesson keys exist

**Progress.quizResults** (embedded array)
- Each entry: `{ chapterTitle, score, totalQuestions }`
- Multiple entries per chapter (each quiz attempt adds one)
- Used by dashboard for analytics and by AI for personalization

---

## 6. Authentication System: How JWT Works Here

### The Flow

```
1. REGISTER/LOGIN
   Client sends email + password
   ──────────────────────────────►  Server validates credentials
                                    Server creates JWT: jwt.sign({ id: userId }, SECRET, { expiresIn: '7d' })
   Client receives { token: "eyJ..." }  ◄──────────────────────────

2. SUBSEQUENT REQUESTS
   Client sends: Authorization: Bearer eyJ...
   ──────────────────────────────►  protect middleware:
                                      1. Extract token from header
                                      2. jwt.verify(token, SECRET) → { id: "abc123" }
                                      3. User.findById("abc123") → loads user
                                      4. req.user = user
                                      5. next() → controller runs

3. ADMIN ENDPOINTS
   After protect runs:
   ──────────────────────────────►  adminOnly middleware:
                                      1. Check req.user.role === 'admin'
                                      2. If yes: next()
                                      3. If no: return 403 Forbidden
```

### What's Inside a JWT?

A JWT has 3 parts separated by dots: `header.payload.signature`

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2NGExYjJjM2Q0ZTVmNmE3YjhjOWQwZSIsImlhdCI6MTcxMzAwMDAwMCwiZXhwIjoxNzEzNjA0ODAwfQ.abc123signature
```

Decoded payload:
```json
{
  "id": "664a1b2c3d4e5f6a7b8c9d0e",  // MongoDB user ID
  "iat": 1713000000,                    // Issued at (Unix timestamp)
  "exp": 1713604800                     // Expires at (7 days later)
}
```

The server can verify this wasn't tampered with because only the server knows `JWT_SECRET`.

### Code Walkthrough: `middleware/authMiddleware.js`

```js
const protect = async (req, res, next) => {
    // 1. Get token from "Authorization: Bearer <token>"
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Not authorized, token missing' });
    }
    const token = authHeader.split(' ')[1];  // "Bearer xxx" → "xxx"

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);  // Throws if invalid

    // 3. Load user (without password)
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'Not authorized, user not found' });

    // 4. Attach to request and continue
    req.user = user;
    next();
};
```

---

## 7. The Route Map: Every Endpoint Explained

### Route Organization

Routes are organized by resource, with admin routes grouped under `/api/admin`:

```
/api/auth/...        → authRoutes.js        (3 endpoints)
/api/lessons/...     → lessonRoutes.js       (6 endpoints)
/api/quizzes/...     → quizRoutes.js         (7 endpoints)
/api/progress/...    → progressRoutes.js     (3 endpoints)
/api/assistant/...   → assistantRoutes.js    (1 endpoint)
/api/admin/...       → adminRoutes.js        (9 endpoints)
                                              ──────────
                                              29 endpoints + 1 health check
```

### Route → Middleware → Controller Chain

Every route is defined as: `router.METHOD(path, ...middleware, controller)`

```js
// Public (no auth)
router.post('/register', registerUser);

// Authenticated (any user)
router.get('/', protect, getAllLessons);

// Admin only (must be admin)
router.post('/', protect, adminOnly, createLesson);

// Admin + file upload
router.post('/documents', protect, adminOnly, multerErrorHandler, uploadDocument);
```

Middleware runs left-to-right. If any middleware doesn't call `next()`, the chain stops.

### Complete Route Table

| # | Method | Path | Auth | Middleware Chain | Controller | Service Method |
|---|--------|------|------|------------------|------------|----------------|
| 1 | GET | `/` | None | — | (inline) | — |
| 2 | POST | `/api/auth/register` | None | — | `registerUser` | `authService.register` |
| 3 | POST | `/api/auth/login` | None | — | `loginUser` | `authService.login` |
| 4 | GET | `/api/auth/me` | Token | `protect` | `getCurrentUser` | — (returns `req.user`) |
| 5 | GET | `/api/lessons` | Token | `protect` | `getAllLessons` | `lessonService.getAllLessons` |
| 6 | GET | `/api/lessons/:id` | Token | `protect` | `getLessonById` | `lessonService.getLessonById` |
| 7 | POST | `/api/lessons/:id/complete` | Token | `protect` | `completeSubLesson` | `lessonService.completeSubLesson` |
| 8 | POST | `/api/lessons` | Admin | `protect, adminOnly` | `createLesson` | `lessonService.createLesson` |
| 9 | PUT | `/api/lessons/:id` | Admin | `protect, adminOnly` | `updateLesson` | `lessonService.updateLesson` |
| 10 | DELETE | `/api/lessons/:id` | Admin | `protect, adminOnly` | `deleteLesson` | `lessonService.deleteLesson` |
| 11 | GET | `/api/quizzes` | Token | `protect` | `getAllQuizzes` | `quizService.getAllQuizzes` |
| 12 | GET | `/api/quizzes/exam` | Token | `protect` | `getExamQuestions` | `quizService.getExamQuestions` |
| 13 | GET | `/api/quizzes/chapter/:chapterTitle` | Token | `protect` | `getQuizzesByChapter` | `quizService.getQuizzesByChapter` |
| 14 | POST | `/api/quizzes/submit` | Token | `protect` | `submitQuiz` | `quizService.submitQuiz` |
| 15 | POST | `/api/quizzes` | Admin | `protect, adminOnly` | `createQuiz` | `quizService.createQuiz` |
| 16 | PUT | `/api/quizzes/:id` | Admin | `protect, adminOnly` | `updateQuiz` | `quizService.updateQuiz` |
| 17 | DELETE | `/api/quizzes/:id` | Admin | `protect, adminOnly` | `deleteQuiz` | `quizService.deleteQuiz` |
| 18 | GET | `/api/progress` | Token | `protect` | `getProgress` | `progressService.getProgress` |
| 19 | GET | `/api/progress/summary` | Token | `protect` | `getProgressSummary` | `progressService.getProgressSummary` |
| 20 | DELETE | `/api/progress/reset` | Token | `protect` | `resetProgress` | `progressService.resetProgress` |
| 21 | POST | `/api/assistant/chat` | Token | `protect` | `chat` | `assistantService.chat` |
| 22 | GET | `/api/admin/users` | Admin | `protect, adminOnly` | `getAllUsers` | `userService.getAllUsers` |
| 23 | PUT | `/api/admin/users/:id` | Admin | `protect, adminOnly` | `updateUser` | `userService.updateUser` |
| 24 | DELETE | `/api/admin/users/:id` | Admin | `protect, adminOnly` | `deleteUser` | `userService.deleteUser` |
| 25 | POST | `/api/admin/documents` | Admin | `protect, adminOnly, multer` | `uploadDocument` | `documentService.uploadDocument` |
| 26 | GET | `/api/admin/documents` | Admin | `protect, adminOnly` | `getAllDocuments` | `documentService.getAllDocuments` |
| 27 | DELETE | `/api/admin/documents/:id` | Admin | `protect, adminOnly` | `deleteDocument` | `documentService.deleteDocument` |
| 28 | GET | `/api/admin/dashboard/stats` | Admin | `protect, adminOnly` | `getDashboardStats` | `dashboardService.getDashboardStats` |
| 29 | GET | `/api/admin/dashboard/chapters` | Admin | `protect, adminOnly` | `getChapterReport` | `dashboardService.getChapterReport` |
| 30 | GET | `/api/admin/dashboard/activity` | Admin | `protect, adminOnly` | `getRecentActivity` | `dashboardService.getRecentActivity` |

---

## 8. The AI Assistant: How It Works in Detail

This is the most complex part of the system. Let's break it down.

### What Happens When a Student Sends a Chat Message

```
POST /api/assistant/chat
Authorization: Bearer <student_token>
Body: {
  "message": "Why was my answer about stop signs wrong?",
  "conversationHistory": [
    { "role": "user", "content": "What does a stop sign mean?" },
    { "role": "assistant", "content": "A stop sign requires a complete stop..." }
  ]
}
```

### Step-by-Step Inside `assistantService.chat()`

#### Step 1: Validate the message
```js
if (!message || !message.trim()) {
    throw new ApiError(400, 'Message is required');
}
```

#### Step 2: Build the AI's system prompt (3 layers in parallel)

The service runs TWO async operations simultaneously using `Promise.all`:

```js
const [userContext, knowledgeBase] = await Promise.all([
    buildUserContext(userId),     // Reads database
    buildKnowledgeBase()          // Reads uploaded files
]);
```

**Layer 1 — Base System Prompt** (hardcoded string):
```
You are a driving education assistant for the DriveReady learning platform.
You help students learn traffic rules, understand road signs, prepare for driving exams...
You ONLY answer driving-related questions...
When you have access to the student's learning context, use it to personalize your responses.
When you have access to knowledge base documents, prioritize information from those documents.
```

**Layer 2 — User Context** (`buildUserContext` function):
```js
const buildUserContext = async (userId) => {
    const progress = await progressRepository.findByUserId(userId);
    // Formats into:
    // --- USER LEARNING CONTEXT ---
    // Overall progress: 40%
    // Completed lessons: Basic Driving Skills:Getting into the Car, ...
    // Quiz results:
    //   - Basic Driving Skills: 3/4 (75%)
    //   - Traffic Signs: 2/5 (40%)
    // Focus areas (low scores): Traffic Signs
};
```

This reads the student's `Progress` document from MongoDB and formats it into a human-readable text block. The AI can then reference specific quiz failures or uncompleted chapters.

**Layer 3 — Knowledge Base** (`buildKnowledgeBase` function):
```js
const buildKnowledgeBase = async () => {
    const documentsText = await documentService.getAllDocumentsText();
    // Returns array of { name: "file.pdf", text: "extracted content..." }
    // Formats into:
    // --- KNOWLEDGE BASE (Reference Materials) ---
    // [Document: "Jordan Traffic Law.pdf"]
    // Article 1: All drivers must...
    //
    // [Document: "Road Signs Guide.docx"]
    // Warning signs are diamond-shaped...
};
```

This calls `documentService.getAllDocumentsText()` which:
1. Loads all Document records from MongoDB
2. For each document, reads the file from disk and extracts text:
   - **PDF** → `pdf-parse` library reads the buffer and returns `.text`
   - **DOC/DOCX** → `mammoth.extractRawText({ path })` returns `.value`
   - **TXT** → `fs.promises.readFile(path, 'utf-8')`
3. Caps total text at 50,000 characters (to fit Gemini's context window)

#### Step 3: Combine all layers into one system instruction

```js
const fullSystemPrompt = [SYSTEM_PROMPT, userContext, knowledgeBase]
    .filter(Boolean)  // Remove empty strings
    .join('\n');
```

The final prompt sent to Gemini looks like:
```
You are a driving education assistant...
[base rules]

--- USER LEARNING CONTEXT ---
Overall progress: 40%
Completed lessons: Basic Driving Skills:Getting into the Car, ...
Quiz results:
  - Traffic Signs: 2/5 (40%)
Focus areas (low scores): Traffic Signs

--- KNOWLEDGE BASE (Reference Materials) ---
When answering questions, prioritize information from these official documents...

[Document: "Jordan Traffic Law.pdf"]
Article 47: At stop signs, the driver must bring the vehicle to a complete halt...
```

#### Step 4: Build conversation history for Gemini

Gemini expects a specific format. The `assistant` role becomes `model`:
```js
for (const entry of conversationHistory) {
    contents.push({
        role: entry.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: entry.content }]
    });
}
// Add current message
contents.push({ role: 'user', parts: [{ text: message }] });
```

#### Step 5: Call Gemini API

```js
const result = await model.generateContent({
    contents,            // Conversation history + current message
    systemInstruction: { parts: [{ text: fullSystemPrompt }] }  // All 3 layers
});
return { reply: result.response.text() };
```

#### Step 6: Handle errors gracefully

If Gemini fails, the user gets a friendly message (not a 500 error):
```js
if (error.status === 429) {
    return { reply: 'Too many requests, please try again in a moment.' };
}
return { reply: "The assistant is temporarily unavailable. Please try again later." };
```

### Visual Flow

```
Student message
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│                    assistantService.chat()                    │
│                                                              │
│  ┌──────────────────┐    ┌──────────────────────────────┐   │
│  │  buildUserContext │    │  buildKnowledgeBase          │   │
│  │       (async)     │    │       (async)                │   │
│  │                   │    │                              │   │
│  │  MongoDB Query:   │    │  MongoDB: load all Documents │   │
│  │  Progress.findOne │    │  Disk: read each file        │   │
│  │  → format text    │    │  Parse: pdf/docx/txt         │   │
│  │                   │    │  → format text               │   │
│  └────────┬─────────┘    └──────────────┬───────────────┘   │
│           │                              │                    │
│           ▼                              ▼                    │
│  ┌────────────────────────────────────────────────────────┐  │
│  │           Combine into fullSystemPrompt               │  │
│  │  = SYSTEM_PROMPT + userContext + knowledgeBase         │  │
│  └────────────────────────┬──────────────────────────────┘  │
│                           │                                  │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Google Gemini API Call                     │  │
│  │  model.generateContent({                               │  │
│  │    contents: [...history, currentMessage],              │  │
│  │    systemInstruction: fullSystemPrompt                  │  │
│  │  })                                                    │  │
│  └────────────────────────┬──────────────────────────────┘  │
│                           │                                  │
│                           ▼                                  │
│                    { reply: "..." }                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. The Admin System: How It Works

### Admin Account: Auto-Seeded

In `server.js`, after connecting to MongoDB:
```js
await connectDB();
await seedAdmin();  // ← Runs every startup
```

`seeds/seedAdmin.js` does:
```js
const existing = await User.findOne({ email: 'admin@driving.com' });
if (!existing) {
    // Hash password and create admin user
    await User.create({ name: 'Admin User', email: 'admin@driving.com', password: hashed, role: 'admin' });
}
```

This is **idempotent** — runs every startup but only creates the admin once. The admin account is:
- Email: `admin@driving.com`
- Password: `admin123`
- Role: `admin`

### Admin Routes Protection

All admin routes use the middleware chain: `protect` → `adminOnly`

```js
// routes/adminRoutes.js
router.get('/users', protect, adminOnly, getAllUsers);
```

1. `protect` verifies the JWT and loads the user
2. `adminOnly` checks `req.user.role === 'admin'`
3. If either fails, the request is rejected before reaching the controller

### User Management

**List users:** Calls `userRepository.findAll()` which returns all users with `-password` excluded.

**Update user:** Admin provides an `email` and/or `password` in the request body. The service:
- Normalizes the email
- Checks it's not already taken
- Hashes the new password
- Updates the user

**Delete user:** The service:
- Checks the user exists
- Prevents deleting `admin@driving.com` (the primary admin)
- Deletes the user's Progress document first (cleanup)
- Deletes the user

### Why Can't the Primary Admin Be Deleted?

```js
if (user.email === 'admin@driving.com') {
    throw new ApiError(403, 'Cannot delete the primary admin account');
}
```

This prevents locking yourself out. Even if the admin is deleted by mistake, `seedAdmin` would recreate it on next server restart — but we prevent the scenario entirely.

---

## 10. File Upload System: How Documents Work

### The Upload Flow

```
Admin sends: POST /api/admin/documents
Content-Type: multipart/form-data
Body: file=[binary PDF data]

                    ┌─────────────────────────┐
Step 1: MULTER      │  middleware/upload.js    │
                    │                         │
                    │  Validates:              │
                    │  - File type (PDF/DOC/   │
                    │    DOCX/TXT only)        │
                    │  - File size (≤ 10MB)    │
                    │                         │
                    │  Saves to disk:          │
                    │  uploads/1713000000-     │
                    │  traffic-law.pdf         │
                    │                         │
                    │  Sets req.file = {       │
                    │    filename, originalname│
                    │    mimetype, size, path  │
                    │  }                       │
                    └───────────┬─────────────┘
                                │
                                ▼
Step 2: CONTROLLER  documentController.uploadDocument(req, res, next)
                    calls documentService.uploadDocument(req.file, req.user._id)
                                │
                                ▼
Step 3: SERVICE     documentService.uploadDocument(file, userId)
                    → documentRepository.create({
                        filename: "1713000000-traffic-law.pdf",
                        originalName: "traffic-law.pdf",
                        mimeType: "application/pdf",
                        size: 1245678,
                        path: "uploads/1713000000-traffic-law.pdf",
                        uploadedBy: userId
                      })
                                │
                                ▼
Step 4: RESPONSE    201 Created with the document object
```

### How Multer Works

Multer is Express middleware for handling `multipart/form-data` (file uploads).

```js
// middleware/upload.js

// 1. Configure WHERE to store files
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),        // uploads/ directory
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

// 2. Configure WHAT files to accept
const fileFilter = (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);   // Accept
    } else {
        cb(new Error('File type not allowed...'), false);  // Reject
    }
};

// 3. Create the multer instance
const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });
```

In the route, `upload.single('file')` tells multer to expect ONE file in a form field called `file`.

### How Documents Become AI Knowledge

When the AI chat is called, `buildKnowledgeBase()` runs:

```
1. documentRepository.findAll()     →  Load all Document records from MongoDB
2. For each document:
   documentService.extractTextFromDocument(doc)
   │
   ├─ if PDF:    pdf-parse(buffer) → returns .text
   ├─ if DOC/X:  mammoth.extractRawText({ path }) → returns .value
   └─ if TXT:    fs.readFile(path, 'utf-8') → returns string
3. Combine all text, cap at 50,000 chars total
4. Format as:
   "--- KNOWLEDGE BASE ---\n[Document: filename]\ntext content\n..."
5. Include in Gemini's systemInstruction
```

### Text Extraction Libraries

**pdf-parse** — Reads a PDF buffer and extracts all text:
```js
const dataBuffer = await fs.promises.readFile(filePath);
const data = await pdfParse(dataBuffer);
return data.text;  // All text from all pages
```

**mammoth** — Reads DOC/DOCX files and extracts raw text:
```js
const result = await mammoth.extractRawText({ path: filePath });
return result.value;  // Plain text content
```

**fs.readFile** — Reads TXT files directly:
```js
return await fs.promises.readFile(filePath, 'utf-8');
```

---

## 11. Dashboard Reporting: How Stats Are Calculated

The dashboard service uses **MongoDB aggregation pipelines** to compute stats across all users.

### `getDashboardStats()` — Platform Overview

This function runs 11 database queries in parallel using `Promise.all`:

```js
const [totalUsers, totalStudents, totalAdmins, lessons, totalQuizQuestions,
       difficultyAgg, progressAgg, distributionAgg, quizAgg,
       totalDocuments, sizeAgg] = await Promise.all([
    User.countDocuments(),                           // Total users
    User.countDocuments({ role: 'student' }),         // Students only
    User.countDocuments({ role: 'admin' }),           // Admins only
    Lesson.find({ isPublished: true }),               // All published lessons
    Quiz.countDocuments(),                            // Total quiz questions
    Quiz.aggregate([...group by difficulty...]),      // Questions per difficulty
    Progress.aggregate([...avg overallProgress...]),  // Average progress
    Progress.aggregate([...$bucket progress...]),     // Progress distribution
    Progress.aggregate([...$unwind quizResults...]),  // Quiz attempt stats
    Document.countDocuments(),                        // Total documents
    Document.aggregate([...sum size...])              // Total file size
]);
```

**Key aggregation: Progress distribution** uses `$bucket`:
```js
Progress.aggregate([{
    $bucket: {
        groupBy: '$overallProgress',        // The field to bucket by
        boundaries: [0, 26, 51, 76, 101],  // Bucket edges
        default: 'other',
        output: { count: { $sum: 1 } }
    }
}])
// Result: [{ _id: 0, count: 60 }, { _id: 26, count: 40 }, ...]
//          0-25%: 60 users    26-50%: 40 users   etc.
```

**Key aggregation: Quiz stats** uses `$unwind` to flatten the embedded array:
```js
Progress.aggregate([
    { $unwind: '$quizResults' },           // Flatten: 1 doc per quiz attempt
    { $group: {
        _id: null,
        totalAttempts: { $sum: 1 },        // Count all attempts
        avgScore: { $avg: '$quizResults.score' },  // Average score
        scores: { $push: { score: '$quizResults.score', total: '$quizResults.totalQuestions' } }
    }}
])
```

### `getChapterReport()` — Per-Chapter Analytics

For each published chapter:
1. Count how many students completed ALL sub-lessons → `completionRate`
2. Aggregate quiz attempts grouped by `chapterTitle` → `averageScore`, `passRate`

The completion rate logic:
```js
lessons.map(lesson => {
    // Build all expected keys: ["Chapter:Sub1", "Chapter:Sub2", ...]
    const subLessonTitles = lesson.lessons.map(sl => `${lesson.title}:${sl.title}`);

    // Count users who have ALL these keys in their completedLessons array
    const completedCount = allProgress.filter(p =>
        subLessonTitles.every(key => p.completedLessons.includes(key))
    ).length;

    return {
        chapterTitle: lesson.title,
        completionRate: Math.round((completedCount / totalStudents) * 100)
    };
});
```

### `getRecentActivity()` — Recent Events

Returns the 10 most recent user signups and 10 most recent quiz completions:
- **Recent users**: `User.find().sort({ createdAt: -1 }).limit(10)`
- **Recent quizzes**: Load Progress docs with quiz results, extract the latest `quizResult` entry from each, pair with user name, sort by date

---

## 12. Error Handling: How Errors Flow

### The Error Flow

```
Service throws: throw new ApiError(404, 'Lesson not found')
         │
         ▼
Controller catches: catch (error) { next(error); }
         │
         ▼
Express error handler: middleware/errorHandler.js
         │
         ├── Is it an ApiError?
         │   → return res.status(404).json({ message: 'Lesson not found' })
         │
         ├── Is it a CastError? (invalid MongoDB ObjectId)
         │   → return res.status(400).json({ message: 'Invalid _id: not-a-valid-id' })
         │
         └── Unknown error?
             → console.error + return res.status(500).json({ message: 'Internal server error' })
```

### The ApiError Class

```js
// utils/apiError.js
class ApiError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
}
```

Usage in services:
```js
throw new ApiError(404, 'User not found');      // 404 Not Found
throw new ApiError(400, 'Email already in use'); // 400 Bad Request
throw new ApiError(403, 'Admin only');           // 403 Forbidden
```

### The Global Error Handler

```js
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({ message: err.message });
    }
    if (err.name === 'CastError') {
        return res.status(400).json({ message: `Invalid _id: ${err.value}` });
    }
    console.error('Unhandled error:', err);
    return res.status(500).json({ message: 'Internal server error' });
};
```

This is registered as the LAST middleware in `index.js`:
```js
app.use(errorHandler);  // Must be last — catches errors from all routes
```

---

## 13. Startup Sequence: What Happens When the Server Starts

```
$ npm run dev
  → nodemon server.js
    → node server.js

server.js executes:
│
├─ 1. require('dotenv').config()
│     Loads .env file into process.env
│     (PORT, MONGO_URI, JWT_SECRET, GEMINI_API_KEY)
│
├─ 2. require('./index')
│     Creates Express app, registers:
│     - CORS middleware
│     - JSON body parser
│     - Health check route (GET /)
│     - All 6 route groups (/api/auth, /api/lessons, etc.)
│     - Swagger UI (/api-docs)
│     - 404 catch-all
│     - Global error handler
│
├─ 3. await connectDB()
│     Connects to MongoDB using MONGO_URI
│     Console: "MongoDB Connected: localhost"
│
├─ 4. await seedAdmin()
│     Checks if admin@driving.com exists
│     If not: creates it with hashed password
│     Console: "Default admin account created" or (nothing if exists)
│
└─ 5. app.listen(PORT)
      Console: "Server is running on port 3000"
      Console: "Swagger Docs: http://localhost:3000/api-docs"
```

---

## 14. File-by-File Reference

### Config Layer

| File | Purpose | Key exports |
|------|---------|-------------|
| `config/db.js` | MongoDB connection via Mongoose | `connectDB()` |

### Models Layer

| File | Purpose | Collection name |
|------|---------|-----------------|
| `models/User.js` | User accounts | `users` |
| `models/Lesson.js` | Chapters + sub-lessons | `lessons` |
| `models/Quiz.js` | Quiz questions | `quizzes` |
| `models/Progress.js` | User progress tracking | `progresses` |
| `models/Document.js` | Uploaded file metadata | `documents` |

### Repository Layer

| File | Purpose | Functions |
|------|---------|-----------|
| `repositories/userRepository.js` | User queries | `findByEmail`, `findById`, `create`, `findAll`, `deleteById`, `updateById`, `countByRole` |
| `repositories/lessonRepository.js` | Lesson queries | `findAllPublished`, `findAll`, `findById`, `create`, `updateById`, `deleteById`, `countAll` |
| `repositories/quizRepository.js` | Quiz queries | `findAll`, `findByChapter`, `findById`, `findByIds`, `findRandom`, `create`, `updateById`, `deleteById` |
| `repositories/progressRepository.js` | Progress queries | `findByUserId`, `createForUser`, `update`, `resetProgress`, `findAll`, `deleteByUserId` |
| `repositories/documentRepository.js` | Document queries | `findAll`, `findById`, `create`, `deleteById`, `countAll`, `getTotalSize` |

### Service Layer

| File | Purpose | Functions |
|------|---------|-----------|
| `services/authService.js` | Authentication/registration | `register`, `login` |
| `services/lessonService.js` | Lesson CRUD + completion | `getAllLessons`, `getLessonById`, `completeSubLesson`, `createLesson`, `updateLesson`, `deleteLesson` |
| `services/quizService.js` | Quiz CRUD + grading | `getAllQuizzes`, `getQuizzesByChapter`, `getExamQuestions`, `submitQuiz`, `createQuiz`, `updateQuiz`, `deleteQuiz` |
| `services/progressService.js` | Progress tracking | `getProgress`, `getProgressSummary`, `resetProgress` |
| `services/assistantService.js` | AI chat with context | `chat` (+ internal `buildUserContext`, `buildKnowledgeBase`) |
| `services/userService.js` | Admin user management | `getAllUsers`, `deleteUser`, `updateUser` |
| `services/documentService.js` | File upload + text extraction | `uploadDocument`, `getAllDocuments`, `deleteDocument`, `extractTextFromDocument`, `getAllDocumentsText` |
| `services/dashboardService.js` | Analytics aggregation | `getDashboardStats`, `getChapterReport`, `getRecentActivity` |

### Controller Layer

| File | Purpose | Handlers |
|------|---------|----------|
| `controllers/authController.js` | Auth endpoints | `registerUser`, `loginUser`, `getCurrentUser` |
| `controllers/lessonController.js` | Lesson endpoints | `getAllLessons`, `getLessonById`, `completeSubLesson`, `createLesson`, `updateLesson`, `deleteLesson` |
| `controllers/quizController.js` | Quiz endpoints | `getAllQuizzes`, `getExamQuestions`, `getQuizzesByChapter`, `submitQuiz`, `createQuiz`, `updateQuiz`, `deleteQuiz` |
| `controllers/progressController.js` | Progress endpoints | `getProgress`, `getProgressSummary`, `resetProgress` |
| `controllers/assistantController.js` | AI chat endpoint | `chat` |
| `controllers/userController.js` | Admin user endpoints | `getAllUsers`, `deleteUser`, `updateUser` |
| `controllers/documentController.js` | Admin doc endpoints | `uploadDocument`, `getAllDocuments`, `deleteDocument` |
| `controllers/dashboardController.js` | Dashboard endpoints | `getDashboardStats`, `getChapterReport`, `getRecentActivity` |

### Route Layer

| File | Base path | Endpoints |
|------|-----------|-----------|
| `routes/authRoutes.js` | `/api/auth` | 3 (register, login, me) |
| `routes/lessonRoutes.js` | `/api/lessons` | 6 (CRUD + complete) |
| `routes/quizRoutes.js` | `/api/quizzes` | 7 (CRUD + exam + submit) |
| `routes/progressRoutes.js` | `/api/progress` | 3 (get, summary, reset) |
| `routes/assistantRoutes.js` | `/api/assistant` | 1 (chat) |
| `routes/adminRoutes.js` | `/api/admin` | 9 (users, documents, dashboard) |

### Middleware Layer

| File | Purpose | Export |
|------|---------|--------|
| `middleware/authMiddleware.js` | JWT verification | `{ protect }` |
| `middleware/adminMiddleware.js` | Admin role check | `{ adminOnly }` |
| `middleware/errorHandler.js` | Global error handler | `errorHandler` |
| `middleware/upload.js` | Multer file upload config | `upload` (multer instance) |

### Other

| File | Purpose |
|------|---------|
| `utils/apiError.js` | Custom error class with HTTP status |
| `seeds/seedUsers.js` | Demo user seeder |
| `seeds/seedLessons.js` | Lesson/chapter seeder |
| `seeds/seedQuestions.js` | Quiz question seeder |
| `seeds/seedAdmin.js` | Idempotent admin seeder (runs on startup) |
| `swagger.js` | Swagger/OpenAPI spec generation |
| `server.js` | Entry point: dotenv, DB connect, admin seed, listen |
| `index.js` | Express app: middleware, routes, swagger, error handler |

---

## 15. Data Flow Diagrams for Key Operations

### Student Completes a Sub-Lesson

```
POST /api/lessons/:id/complete
Body: { "subLessonTitle": "Warning Signs" }
│
├─ protect middleware → loads user
│
├─ lessonService.completeSubLesson(userId, lessonId, subLessonTitle)
│   │
│   ├─ lessonRepository.findById(lessonId)
│   │   → Lesson: { title: "Traffic Signs", lessons: [...] }
│   │
│   ├─ Verify sub-lesson "Warning Signs" exists in the chapter
│   │
│   ├─ Build identifier: "Traffic Signs:Warning Signs"
│   │
│   ├─ progressRepository.findByUserId(userId)
│   │   → Progress: { completedLessons: ["Basic:Getting in"], ... }
│   │   (creates new Progress doc if none exists)
│   │
│   ├─ Add "Traffic Signs:Warning Signs" to completedLessons[]
│   │
│   ├─ Recalculate overallProgress:
│   │   For each published chapter:
│   │     Are ALL sub-lessons in completedLessons?
│   │   overallProgress = (fullChapters / totalChapters) * 100
│   │
│   └─ progressRepository.update(id, updatedProgress)
│
└─ Response: { message, identifier, overallProgress }
```

### Admin Uploads a Document

```
POST /api/admin/documents (multipart/form-data)
│
├─ protect middleware → loads admin user
├─ adminOnly middleware → checks role === 'admin'
├─ multer middleware → saves file to uploads/, sets req.file
│
├─ documentService.uploadDocument(req.file, req.user._id)
│   │
│   └─ documentRepository.create({
│        filename: "1713000000-law.pdf",
│        originalName: "law.pdf",
│        mimeType: "application/pdf",
│        size: 1245678,
│        path: "uploads/1713000000-law.pdf",
│        uploadedBy: adminUserId
│      })
│
└─ Response: 201 Created with document object

Later, when a student chats with AI:
│
├─ buildKnowledgeBase()
│   ├─ documentRepository.findAll()
│   │   → [{ path: "uploads/1713000000-law.pdf", mimeType: "application/pdf", ... }]
│   │
│   ├─ extractTextFromDocument(doc)
│   │   → pdfParse(buffer) → "Article 1: All drivers must..."
│   │
│   └─ Returns: [{ name: "law.pdf", text: "Article 1: All drivers must..." }]
│
└─ Text is injected into Gemini's systemInstruction
```

### Dashboard Stats Calculation

```
GET /api/admin/dashboard/stats
│
├─ dashboardService.getDashboardStats()
│   │
│   ├─ Promise.all([  ← 11 queries run in parallel
│   │     User.countDocuments()                         → 150
│   │     User.countDocuments({ role: 'student' })      → 148
│   │     User.countDocuments({ role: 'admin' })        → 2
│   │     Lesson.find({ isPublished: true })            → [5 chapters]
│   │     Quiz.countDocuments()                         → 22
│   │     Quiz.aggregate [group by difficulty]           → {easy:11, medium:9, hard:2}
│   │     Progress.aggregate [avg overallProgress]       → 42%
│   │     Progress.aggregate [$bucket distribution]      → {0-25:60, 26-50:40, ...}
│   │     Progress.aggregate [$unwind quizResults]       → {attempts:320, avg:68}
│   │     Document.countDocuments()                     → 3
│   │     Document.aggregate [sum size]                  → 2450000 bytes
│   │   ])
│   │
│   └─ Assemble into response object
│
└─ Response: { users: {...}, content: {...}, progress: {...}, quizzes: {...}, documents: {...} }
```

---

## Summary

This codebase follows a clean, consistent **4-layer architecture** (Route → Controller → Service → Repository) with clear separation of concerns. The AI assistant is the most sophisticated part — it dynamically builds personalized context by reading the student's database records and extracting text from admin-uploaded documents, then sends everything to Google Gemini as a composite system instruction.

Every endpoint is protected by JWT authentication, admin endpoints have an additional role check, and errors flow through a centralized handler. The admin system provides full user management, document/knowledge base management, and real-time dashboard analytics powered by MongoDB aggregation pipelines.
