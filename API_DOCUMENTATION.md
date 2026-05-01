# Smart Driving Learning Platform - Backend API Documentation

## Table of Contents

1. [Application Overview](#1-application-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture](#3-architecture)
4. [Folder Structure](#4-folder-structure)
5. [Database Models](#5-database-models)
6. [Environment Variables](#6-environment-variables)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Business Rules](#8-business-rules)
9. [API Endpoints](#9-api-endpoints)
   - [Health Check](#91-health-check)
   - [Auth APIs](#92-auth-apis)
   - [Lesson APIs](#93-lesson-apis)
   - [Quiz APIs](#94-quiz-apis)
   - [Progress APIs](#95-progress-apis)
   - [Assistant API](#96-assistant-api)
   - [Admin - User Management](#97-admin---user-management)
   - [Admin - Document Management](#98-admin---document-management)
   - [Admin - Dashboard Reports](#99-admin---dashboard-reports)
10. [Error Handling](#10-error-handling)
11. [Seed Data](#11-seed-data)
12. [How to Run](#12-how-to-run)

---

## 1. Application Overview

The **Smart Driving Learning Platform** is a comprehensive backend system that helps students learn driving rules, understand traffic signs, and prepare for driving license exams. It combines structured learning content, interactive quizzes, AI-powered tutoring, and a full admin management panel.

### Key Features

- **User Authentication** — Register, login, JWT-based sessions
- **Structured Lessons** — Chapters with sub-lessons, progress tracking per sub-lesson
- **Interactive Quizzes** — Multiple-choice questions, instant grading, exam simulation mode
- **Progress Tracking** — Per-chapter completion status, quiz scores, overall percentage
- **AI-Powered Assistant** — Google Gemini-powered chatbot that:
  - Knows the student's learning progress and quiz history from the database
  - Uses admin-uploaded documents (PDF, DOC, DOCX, TXT) as a knowledge base
  - Only answers driving-related questions
- **Admin Panel APIs** — Full platform management:
  - User management (list, update email/password, delete)
  - Document/knowledge base management (upload, list, delete files for AI)
  - Dashboard reports (platform stats, per-chapter analytics, recent activity)
  - Content management (CRUD for lessons and quizzes)
- **Auto-seeded Admin Account** — A hardcoded admin account (`admin@driving.com` / `admin123`) is automatically created on server startup

### How the AI Works

The AI assistant builds a personalized context for every chat request:

1. **Base System Prompt** — Driving education assistant personality and rules
2. **User Learning Context** — Fetched from the database: overall progress, completed lessons, quiz scores, weak areas
3. **Knowledge Base** — Text extracted from all admin-uploaded documents (PDF/DOC/DOCX/TXT)

All three layers are combined into a single `systemInstruction` sent to Google Gemini, so the AI can give personalized, document-informed answers.

---

## 2. Tech Stack

| Technology | Purpose |
|---|---|
| **Node.js** | Runtime |
| **Express v5** | Web framework |
| **MongoDB** | Database |
| **Mongoose v9** | ODM (Object Document Mapper) |
| **JWT (jsonwebtoken)** | Authentication tokens |
| **bcryptjs** | Password hashing |
| **cors** | Cross-Origin Resource Sharing |
| **@google/generative-ai** | Google Gemini AI SDK for the assistant |
| **multer** | File upload middleware (multipart/form-data) |
| **pdf-parse** | Extract text from PDF files |
| **mammoth** | Extract text from DOC/DOCX files |
| **swagger-jsdoc + swagger-ui-express** | Interactive API documentation |
| **nodemon** | Development auto-restart |

---

## 3. Architecture

The application follows the **Controller-Service-Repository** pattern:

```
Client Request
     |
   Routes         (define HTTP endpoints, attach middleware)
     |
   Controllers    (parse request, call service, send response)
     |
   Services       (all business logic, validation, orchestration)
     |
   Repositories   (data access layer — wraps Mongoose operations)
     |
   Models          (Mongoose schemas — define data shape)
```

---

## 4. Folder Structure

```
smart-driving-learning-platform-backend/
├── config/
│   └── db.js                        # MongoDB connection
├── controllers/
│   ├── authController.js            # Auth request handling
│   ├── lessonController.js          # Lesson request handling
│   ├── quizController.js            # Quiz request handling
│   ├── progressController.js        # Progress request handling
│   ├── assistantController.js       # AI assistant request handling
│   ├── userController.js            # Admin user management
│   ├── documentController.js        # Admin document management
│   └── dashboardController.js       # Admin dashboard reports
├── middleware/
│   ├── authMiddleware.js            # JWT verification (protect)
│   ├── adminMiddleware.js           # Admin role check (adminOnly)
│   ├── upload.js                    # Multer file upload config
│   └── errorHandler.js             # Global error handler
├── models/
│   ├── User.js                      # User schema
│   ├── Lesson.js                    # Lesson/chapter schema
│   ├── Quiz.js                      # Quiz question schema
│   ├── Progress.js                  # User progress schema
│   └── Document.js                  # Uploaded document schema
├── repositories/
│   ├── userRepository.js            # User data access
│   ├── lessonRepository.js          # Lesson data access
│   ├── quizRepository.js            # Quiz data access
│   ├── progressRepository.js        # Progress data access
│   └── documentRepository.js        # Document data access
├── routes/
│   ├── authRoutes.js                # /api/auth/*
│   ├── lessonRoutes.js              # /api/lessons/*
│   ├── quizRoutes.js                # /api/quizzes/*
│   ├── progressRoutes.js            # /api/progress/*
│   ├── assistantRoutes.js           # /api/assistant/*
│   └── adminRoutes.js               # /api/admin/* (users, documents, dashboard)
├── seeds/
│   ├── seedUsers.js                 # Demo user seeder
│   ├── seedLessons.js               # Lesson/chapter seeder
│   ├── seedQuestions.js             # Quiz question seeder
│   └── seedAdmin.js                 # Auto-seed admin on startup
├── services/
│   ├── authService.js               # Auth business logic
│   ├── lessonService.js             # Lesson business logic
│   ├── quizService.js               # Quiz business logic
│   ├── progressService.js           # Progress business logic
│   ├── assistantService.js          # Gemini AI + DB context + document knowledge base
│   ├── userService.js               # Admin user management logic
│   ├── documentService.js           # Document upload, delete, text extraction
│   └── dashboardService.js          # Dashboard aggregation logic
├── uploads/                          # Uploaded files directory (gitignored)
├── utils/
│   └── apiError.js                  # Custom ApiError class
├── index.js                         # Express app setup
├── server.js                        # Server entry point + admin seed
├── swagger.js                       # Swagger/OpenAPI config
├── package.json
├── .env                             # Environment variables (not in git)
├── .env.example                     # Environment template
└── .gitignore
```

---

## 5. Database Models

### 5.1 User

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `name` | String | Yes | — | Trimmed |
| `email` | String | Yes | — | Unique, trimmed, stored lowercase |
| `password` | String | Yes | — | Stored as bcrypt hash (salt rounds: 10) |
| `role` | String | No | `"student"` | Enum: `student`, `admin` |
| `createdAt` | Date | Auto | — | Mongoose timestamps |
| `updatedAt` | Date | Auto | — | Mongoose timestamps |

### 5.2 Lesson (Chapter)

A "Lesson" is a **chapter** that contains an array of **sub-lessons**.

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `title` | String | Yes | — | Chapter title, trimmed |
| `description` | String | Yes | — | Chapter description, trimmed |
| `image` | String | No | `""` | Image URL/path |
| `order` | Number | Yes | — | Sorting order (1, 2, 3...) |
| `isPublished` | Boolean | No | `true` | Only published chapters visible to students |
| `lessons` | Array | No | `[]` | Array of sub-lesson objects |
| `lessons[].title` | String | Yes | — | Sub-lesson title |
| `lessons[].content` | String | Yes | — | Sub-lesson content text |

### 5.3 Quiz

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `question` | String | Yes | — | The question text, trimmed |
| `options` | [String] | Yes | — | **Exactly 4 options** (validated) |
| `correctAnswer` | String | Yes | — | Must match one of the 4 options |
| `chapterTitle` | String | Yes | — | Links quiz to a Lesson by title string |
| `explanation` | String | No | `""` | Explanation of the correct answer |
| `difficulty` | String | No | `"easy"` | Enum: `easy`, `medium`, `hard` |

### 5.4 Progress

One document per user. Created automatically on first activity.

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `userId` | ObjectId | Yes | — | References `User` collection |
| `completedLessons` | [Object] | No | `[]` | Completed sub-lessons by `chapterId`, `subLessonIndex`, and `completedAt` |
| `completedLessons[].chapterId` | ObjectId | Yes | - | References the Lesson/chapter |
| `completedLessons[].subLessonIndex` | Number | Yes | - | Zero-based index in the chapter `lessons` array |
| `completedLessons[].completedAt` | Date | No | `Date.now` | Completion timestamp |
| `quizResults` | [Object] | No | `[]` | Array of quiz attempt records |
| `quizResults[].chapterTitle` | String | Yes | — | Which chapter the quiz covered |
| `quizResults[].score` | Number | Yes | — | Number of correct answers |
| `quizResults[].totalQuestions` | Number | Yes | — | Total questions in that attempt |
| `overallProgress` | Number | No | `0` | Percentage of completed chapters (0-100) |

### 5.5 Document

Tracks files uploaded by admins for the AI knowledge base.

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `filename` | String | Yes | — | Disk filename (e.g. `1713000000000-rules.pdf`) |
| `originalName` | String | Yes | — | Original upload name (e.g. `driving-rules.pdf`) |
| `mimeType` | String | Yes | — | MIME type (e.g. `application/pdf`) |
| `size` | Number | Yes | — | File size in bytes |
| `path` | String | Yes | — | Disk path to the file |
| `uploadedBy` | ObjectId | Yes | — | References `User` (the admin who uploaded) |
| `createdAt` | Date | Auto | — | |
| `updatedAt` | Date | Auto | — | |

---

## 6. Environment Variables

File: `.env` (not committed to git)

| Variable | Description | Example |
|---|---|---|
| `PORT` | Server port | `3000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/smart-driving-learning-platform` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `my_super_secret_key_here` |
| `GEMINI_API_KEY` | Google Gemini AI API key | `AIzaSy...` |

---

## 7. Authentication & Authorization

### 7.1 JWT Authentication

- Tokens are generated on **register** and **login**
- Token payload: `{ id: userId }` signed with `JWT_SECRET`
- Token expiration: **7 days**
- Client sends token as: `Authorization: Bearer <token>`

### 7.2 Middleware

**`protect`** — Extracts Bearer token, verifies JWT, loads user into `req.user`. Returns `401` if invalid.

**`adminOnly`** — Checks `req.user.role === 'admin'`. Returns `403` if not admin. Must be used after `protect`.

### 7.3 Role-Based Access

| Role | Can Access |
|---|---|
| `student` | Lessons (read, complete), quizzes (read, submit), progress (read, reset), AI assistant chat |
| `admin` | Everything a student can + CRUD lessons/quizzes + user management + document management + dashboard reports |

---

## 8. Business Rules

### 8.1 Authentication Rules

1. Email is normalized (trimmed, lowercase) before any operation
2. Email must be unique across all users
3. Password is hashed with bcrypt (10 salt rounds)
4. Registration returns a token immediately (auto-login)
5. Default role is `student` — users cannot self-register as admin

### 8.2 Lesson Rules

1. Chapters contain sub-lessons and are sorted by `order`
2. Students only see published chapters; admins see all
3. Completing a sub-lesson saves `"ChapterTitle:SubLessonTitle"` to progress
4. A chapter is "completed" when ALL its sub-lessons are done
5. Overall progress = `(completedChapters / totalPublishedChapters) * 100`

### 8.3 Quiz Rules

1. Each question has exactly 4 options (validated)
2. Score = `Math.round((correct / total) * 100)`
3. Exam mode picks 10 random questions and strips correct answers
4. Each submission is saved to user's progress

### 8.4 Progress Rules

1. One Progress document per user (auto-created)
2. Summary calculates per-chapter status: "Not Started" / "In Progress" / "Completed"
3. Reset clears everything to zero

### 8.5 AI Assistant Rules

1. Powered by **Google Gemini** (model: `gemini-2.0-flash`)
2. **Reads user's database data**: progress, completed lessons, quiz results, weak areas
3. **Reads uploaded documents**: extracts text from PDF/DOC/DOCX/TXT files uploaded by admin
4. Combines all context into a single `systemInstruction` for personalized responses
5. Only answers driving-related questions
6. Stateless — conversation history sent from frontend each request
7. Document text capped at ~50,000 characters to fit context window
8. Graceful fallbacks on API failure or rate limiting

### 8.6 Admin Rules

1. **Admin account auto-seeded** on server startup (`admin@driving.com` / `admin123`)
2. Primary admin (`admin@driving.com`) cannot be deleted
3. Admin can update any user's email or password
4. Admin can upload PDF, DOC, DOCX, TXT files (max 10MB each)
5. Uploaded files are stored on disk in `uploads/` directory
6. Deleting a document removes both the DB record and the file from disk
7. Dashboard provides real-time aggregated stats from the database

---

## 9. API Endpoints

**Base URL:** `http://localhost:3000`

**Swagger Docs:** `http://localhost:3000/api-docs`

**Common Headers:**
```
Content-Type: application/json
Authorization: Bearer <jwt_token>    (for protected endpoints)
```

---

### 9.1 Health Check

#### `GET /`

**Auth:** None

**Response `200`:**
```json
{
  "message": "Smart Driving API is running",
  "docs": "/api-docs"
}
```

---

### 9.2 Auth APIs

#### `POST /api/auth/register`

Register a new user account.

**Auth:** None

**Request:**
```json
{
  "name": "Ahmad Atiat",
  "email": "ahmad@example.com",
  "password": "StrongPassword123"
}
```

**Response `201`:**
```json
{
  "message": "User registered successfully",
  "_id": "664a1b2c3d4e5f6a7b8c9d0e",
  "name": "Ahmad Atiat",
  "email": "ahmad@example.com",
  "role": "student",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:** `400` — Missing fields, duplicate email

---

#### `POST /api/auth/login`

Login with existing credentials.

**Auth:** None

**Request:**
```json
{
  "email": "admin@driving.com",
  "password": "admin123"
}
```

**Response `200`:**
```json
{
  "message": "Login successful",
  "_id": "664a1b2c3d4e5f6a7b8c9d0e",
  "name": "Admin User",
  "email": "admin@driving.com",
  "role": "admin",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:** `400` — Missing fields, invalid credentials

---

#### `GET /api/auth/me`

Get the currently authenticated user's profile.

**Auth:** Bearer Token

**Response `200`:**
```json
{
  "message": "Authenticated user fetched successfully",
  "user": {
    "_id": "664a1b2c3d4e5f6a7b8c9d0e",
    "name": "Admin User",
    "email": "admin@driving.com",
    "role": "admin",
    "createdAt": "2026-04-12T10:30:00.000Z",
    "updatedAt": "2026-04-12T10:30:00.000Z"
  }
}
```

**Errors:** `401` — Missing/invalid token

---

### 9.3 Lesson APIs

#### `GET /api/lessons`

Get all lessons. Students see published only. Admins see all.

**Auth:** Bearer Token

**Response `200`:**
```json
[
  {
    "_id": "664b1c2d3e4f5a6b7c8d9e0f",
    "title": "Basic Driving Skills",
    "description": "Learn the fundamental steps before and during driving.",
    "image": "",
    "order": 1,
    "isPublished": true,
    "lessons": [
      { "title": "Getting into the Car", "content": "Before entering the vehicle..." },
      { "title": "Starting the Car", "content": "Ensure the gear is in Park..." },
      { "title": "Basic Vehicle Controls", "content": "The steering wheel controls..." }
    ],
    "createdAt": "2026-04-12T10:30:00.000Z",
    "updatedAt": "2026-04-12T10:30:00.000Z"
  }
]
```

---

#### `GET /api/lessons/:id`

**Auth:** Bearer Token

**Response `200`:** Single lesson object (same shape as above)

**Errors:** `404` — Lesson not found

---

#### `POST /api/lessons/:id/complete`

Mark a sub-lesson as completed.

**Auth:** Bearer Token

**Request:**
```json
{
  "subLessonTitle": "Getting into the Car"
}
```

**Response `200`:**
```json
{
  "message": "Sub-lesson completed",
  "completedLesson": {
    "chapterId": "664b1c2d3e4f5a6b7c8d9e0f",
    "subLessonIndex": 0,
    "completedAt": "2026-04-30T14:00:00.000Z"
  },
  "overallProgress": 0
}
```

**Errors:** `400` — Missing subLessonTitle, `404` — Lesson/sub-lesson not found

---

#### `POST /api/lessons` (Admin Only)

**Auth:** Bearer Token + Admin

**Request:**
```json
{
  "title": "Parking Rules",
  "description": "Learn proper parking techniques.",
  "order": 6,
  "isPublished": true,
  "lessons": [
    { "title": "Parallel Parking", "content": "Pull up next to the car..." },
    { "title": "Angle Parking", "content": "Common in parking lots..." }
  ]
}
```

**Response `201`:** Created lesson object

---

#### `PUT /api/lessons/:id` (Admin Only)

**Auth:** Bearer Token + Admin

**Request:** Any subset of lesson fields to update

**Response `200`:** Updated lesson object

---

#### `DELETE /api/lessons/:id` (Admin Only)

**Auth:** Bearer Token + Admin

**Response `200`:**
```json
{ "message": "Lesson deleted successfully" }
```

---

### 9.4 Quiz APIs

#### `GET /api/quizzes`

Get all quizzes grouped by chapter title.

**Auth:** Bearer Token

**Response `200`:**
```json
{
  "Basic Driving Skills": [
    {
      "_id": "664d3e4f5a6b7c8d9e0f1122",
      "question": "What is the first thing you should do before starting the car?",
      "options": ["Turn on the radio", "Fasten your seatbelt", "Check your phone", "Adjust the AC"],
      "correctAnswer": "Fasten your seatbelt",
      "chapterTitle": "Basic Driving Skills",
      "explanation": "Safety first...",
      "difficulty": "easy"
    }
  ],
  "Traffic Signs": [ ... ]
}
```

---

#### `GET /api/quizzes/chapter/:chapterTitle`

**Auth:** Bearer Token

**Example:** `GET /api/quizzes/chapter/Traffic%20Signs`

**Response `200`:** Array of quiz objects for that chapter

**Errors:** `404` — No quizzes found

---

#### `GET /api/quizzes/exam`

Get 10 random questions (no correct answers shown).

**Auth:** Bearer Token

**Response `200`:**
```json
[
  {
    "_id": "664d3e4f5a6b7c8d9e0f1122",
    "question": "What is the first thing you should do before starting the car?",
    "options": ["Turn on the radio", "Fasten your seatbelt", "Check your phone", "Adjust the AC"],
    "chapterTitle": "Basic Driving Skills",
    "difficulty": "easy"
  }
]
```

---

#### `POST /api/quizzes/submit`

Submit quiz answers and get graded results.

**Auth:** Bearer Token

**Request:**
```json
{
  "answers": [
    { "questionId": "664d3e4f5a6b7c8d9e0f1122", "selectedAnswer": "Fasten your seatbelt" },
    { "questionId": "664d3e4f5a6b7c8d9e0f1126", "selectedAnswer": "Slow down only" }
  ]
}
```

**Response `200`:**
```json
{
  "score": 50,
  "totalQuestions": 2,
  "correct": 1,
  "results": [
    {
      "questionId": "664d3e4f5a6b7c8d9e0f1122",
      "question": "What is the first thing you should do before starting the car?",
      "selectedAnswer": "Fasten your seatbelt",
      "correctAnswer": "Fasten your seatbelt",
      "isCorrect": true,
      "explanation": "Safety first..."
    },
    {
      "questionId": "664d3e4f5a6b7c8d9e0f1126",
      "question": "What does a red stop sign mean?",
      "selectedAnswer": "Slow down only",
      "correctAnswer": "Stop completely",
      "isCorrect": false,
      "explanation": "A red stop sign requires complete stop..."
    }
  ]
}
```

---

#### `POST /api/quizzes` (Admin Only)

**Auth:** Bearer Token + Admin

**Request:**
```json
{
  "question": "What does a flashing yellow light mean?",
  "options": ["Stop immediately", "Proceed with caution", "Speed up", "Turn around"],
  "correctAnswer": "Proceed with caution",
  "chapterTitle": "Traffic Signs",
  "explanation": "A flashing yellow light means slow down and proceed with caution.",
  "difficulty": "medium"
}
```

**Response `201`:** Created quiz object

---

#### `PUT /api/quizzes/:id` (Admin Only)

**Auth:** Bearer Token + Admin

**Request:** Any subset of quiz fields

**Response `200`:** Updated quiz object

---

#### `DELETE /api/quizzes/:id` (Admin Only)

**Auth:** Bearer Token + Admin

**Response `200`:**
```json
{ "message": "Quiz question deleted successfully" }
```

---

### 9.5 Progress APIs

#### `GET /api/progress`

Get full raw progress for the authenticated user.

**Auth:** Bearer Token

**Response `200`:**
```json
{
  "_id": "664f5a6b7c8d9e0f11223344",
  "userId": "664a1b2c3d4e5f6a7b8c9d0e",
  "completedLessons": [
    {
      "chapterId": "664b1c2d3e4f5a6b7c8d9e0f",
      "subLessonIndex": 0,
      "completedAt": "2026-04-30T14:00:00.000Z"
    }
  ],
  "quizResults": [
    { "chapterTitle": "Basic Driving Skills", "score": 3, "totalQuestions": 4 }
  ],
  "overallProgress": 0
}
```

---

#### `GET /api/progress/lessons`

Get completed lesson entries for the authenticated user.

**Auth:** Bearer Token

**Response `200`:**
```json
{
  "completedLessons": [
    {
      "chapterId": "664b1c2d3e4f5a6b7c8d9e0f",
      "subLessonIndex": 0,
      "completedAt": "2026-04-30T14:00:00.000Z"
    }
  ]
}
```

---

#### `POST /api/progress/lessons/complete`

Mark a chapter sub-lesson as completed. Duplicate completions are ignored.

**Auth:** Bearer Token

**Request:**
```json
{
  "chapterId": "664b1c2d3e4f5a6b7c8d9e0f",
  "subLessonIndex": 0
}
```

**Response `200`:** Same completion response as `POST /api/lessons/:id/complete`.

**Errors:** `400` - Invalid request, `404` - Lesson/sub-lesson not found

---

#### `GET /api/progress/summary`

Get calculated progress summary with per-chapter statuses and quiz stats.

**Auth:** Bearer Token

**Response `200`:**
```json
{
  "overallProgress": 20,
  "lessons": [
    {
      "chapterId": "664b1c2d3e4f5a6b7c8d9e0f",
      "title": "Basic Driving Skills",
      "description": "Learn the fundamental steps...",
      "totalSubLessons": 3,
      "completedSubLessons": 3,
      "status": "Completed"
    },
    {
      "chapterId": "664b1c2d3e4f5a6b7c8d9e10",
      "title": "Traffic Signs",
      "description": "Understand road signs...",
      "totalSubLessons": 4,
      "completedSubLessons": 1,
      "status": "In Progress"
    }
  ],
  "quizStats": {
    "totalAttempts": 2,
    "lastScore": 100,
    "averageScore": 88
  }
}
```

---

#### `DELETE /api/progress/reset`

Reset all progress for the authenticated user.

**Auth:** Bearer Token

**Response `200`:**
```json
{ "message": "Progress reset successfully" }
```

---

### 9.6 Assistant API

#### `POST /api/assistant/chat`

Send a message to the AI driving assistant. The AI now uses the student's progress data and uploaded knowledge base documents for personalized responses.

**Auth:** Bearer Token

**Request (simple):**
```json
{
  "message": "What does a stop sign mean?"
}
```

**Response `200`:**
```json
{
  "reply": "A stop sign is an octagonal red sign that requires you to bring your vehicle to a complete stop..."
}
```

**Request (with conversation history):**
```json
{
  "message": "What if two cars arrive at the same time?",
  "conversationHistory": [
    { "role": "user", "content": "Can you explain four-way stop rules?" },
    { "role": "assistant", "content": "At a four-way stop, the first vehicle to arrive has right-of-way..." }
  ]
}
```

**Response `200`:**
```json
{
  "reply": "If two cars arrive at a four-way stop at the same time, the vehicle on the right has the right of way..."
}
```

**Errors:** `400` — Empty message, `503` — API key not configured

---

### 9.7 Admin - User Management

All admin endpoints require `Authorization: Bearer <admin_token>`. Students receive `403`.

#### `GET /api/admin/users`

List all users (passwords excluded).

**Auth:** Bearer Token + Admin

**Response `200`:**
```json
[
  {
    "_id": "664a1b2c3d4e5f6a7b8c9d0e",
    "name": "Admin User",
    "email": "admin@driving.com",
    "role": "admin",
    "createdAt": "2026-04-12T10:30:00.000Z",
    "updatedAt": "2026-04-12T10:30:00.000Z"
  },
  {
    "_id": "664a1b2c3d4e5f6a7b8c9d0f",
    "name": "Student User",
    "email": "student@driving.com",
    "role": "student",
    "createdAt": "2026-04-12T10:30:00.000Z",
    "updatedAt": "2026-04-12T10:30:00.000Z"
  }
]
```

---

#### `PUT /api/admin/users/:id`

Update a user's email and/or password.

**Auth:** Bearer Token + Admin

**Request:**
```json
{
  "email": "newemail@example.com",
  "password": "newSecurePassword123"
}
```

> Both fields are optional. Provide at least one.

**Response `200`:**
```json
{
  "_id": "664a1b2c3d4e5f6a7b8c9d0f",
  "name": "Student User",
  "email": "newemail@example.com",
  "role": "student",
  "createdAt": "2026-04-12T10:30:00.000Z",
  "updatedAt": "2026-04-12T14:00:00.000Z"
}
```

**Errors:**
- `400` — Email already in use, password too short (min 6), no fields provided
- `404` — User not found

---

#### `DELETE /api/admin/users/:id`

Delete a user and their progress data.

**Auth:** Bearer Token + Admin

**Response `200`:**
```json
{ "message": "User deleted successfully" }
```

**Errors:**
- `403` — Cannot delete the primary admin (`admin@driving.com`)
- `404` — User not found

---

### 9.8 Admin - Document Management

Manage files that the AI uses as its knowledge base.

#### `POST /api/admin/documents`

Upload a document for the AI knowledge base.

**Auth:** Bearer Token + Admin

**Content-Type:** `multipart/form-data`

**Request:** Form field `file` with a PDF, DOC, DOCX, or TXT file (max 10MB)

```
POST /api/admin/documents
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

file: [binary file data]
```

**Response `201`:**
```json
{
  "_id": "665a1b2c3d4e5f6a7b8c9d10",
  "filename": "1713000000000-jordan-traffic-law.pdf",
  "originalName": "jordan-traffic-law.pdf",
  "mimeType": "application/pdf",
  "size": 1245678,
  "path": "uploads/1713000000000-jordan-traffic-law.pdf",
  "uploadedBy": "664a1b2c3d4e5f6a7b8c9d0e",
  "createdAt": "2026-04-12T14:00:00.000Z",
  "updatedAt": "2026-04-12T14:00:00.000Z"
}
```

**Errors:**
- `400` — No file uploaded, invalid file type, file exceeds 10MB

**Allowed file types:**
| Type | MIME |
|---|---|
| PDF | `application/pdf` |
| DOC | `application/msword` |
| DOCX | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| TXT | `text/plain` |

---

#### `GET /api/admin/documents`

List all uploaded documents.

**Auth:** Bearer Token + Admin

**Response `200`:**
```json
[
  {
    "_id": "665a1b2c3d4e5f6a7b8c9d10",
    "filename": "1713000000000-jordan-traffic-law.pdf",
    "originalName": "jordan-traffic-law.pdf",
    "mimeType": "application/pdf",
    "size": 1245678,
    "path": "uploads/1713000000000-jordan-traffic-law.pdf",
    "uploadedBy": {
      "_id": "664a1b2c3d4e5f6a7b8c9d0e",
      "name": "Admin User",
      "email": "admin@driving.com"
    },
    "createdAt": "2026-04-12T14:00:00.000Z",
    "updatedAt": "2026-04-12T14:00:00.000Z"
  },
  {
    "_id": "665a1b2c3d4e5f6a7b8c9d11",
    "filename": "1713000100000-road-signs-guide.docx",
    "originalName": "road-signs-guide.docx",
    "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "size": 567890,
    "path": "uploads/1713000100000-road-signs-guide.docx",
    "uploadedBy": {
      "_id": "664a1b2c3d4e5f6a7b8c9d0e",
      "name": "Admin User",
      "email": "admin@driving.com"
    },
    "createdAt": "2026-04-12T14:05:00.000Z",
    "updatedAt": "2026-04-12T14:05:00.000Z"
  }
]
```

---

#### `DELETE /api/admin/documents/:id`

Delete a document (removes from database AND from disk).

**Auth:** Bearer Token + Admin

**Response `200`:**
```json
{ "message": "Document deleted successfully" }
```

**Errors:** `404` — Document not found

---

### 9.9 Admin - Dashboard Reports

Real-time analytics and reporting endpoints for the admin panel.

#### `GET /api/admin/dashboard/stats`

Get platform overview statistics.

**Auth:** Bearer Token + Admin

**Response `200`:**
```json
{
  "users": {
    "total": 150,
    "students": 148,
    "admins": 2
  },
  "content": {
    "totalChapters": 5,
    "totalSubLessons": 15,
    "totalQuizQuestions": 22,
    "questionsByDifficulty": {
      "easy": 11,
      "medium": 9,
      "hard": 2
    }
  },
  "progress": {
    "averageProgress": 42,
    "completionRate": 15,
    "progressDistribution": {
      "0-25": 60,
      "26-50": 40,
      "51-75": 30,
      "76-100": 20
    }
  },
  "quizzes": {
    "totalAttempts": 320,
    "averageScore": 68,
    "passRate": 72
  },
  "documents": {
    "totalDocuments": 3,
    "totalSize": 2450000
  }
}
```

**Field descriptions:**

| Field | Description |
|---|---|
| `users.total` | Total registered users |
| `users.students` | Users with role `student` |
| `users.admins` | Users with role `admin` |
| `content.totalChapters` | Published lesson chapters |
| `content.totalSubLessons` | Total sub-lessons across all chapters |
| `content.totalQuizQuestions` | Total quiz questions in database |
| `content.questionsByDifficulty` | Quiz questions grouped by difficulty |
| `progress.averageProgress` | Average `overallProgress` across all users (0-100) |
| `progress.completionRate` | Percentage of students with 76-100% progress |
| `progress.progressDistribution` | Number of users in each progress range |
| `quizzes.totalAttempts` | Total quiz submissions across all users |
| `quizzes.averageScore` | Average quiz score (number of correct answers) |
| `quizzes.passRate` | Percentage of quiz attempts with >= 70% score |
| `documents.totalDocuments` | Number of uploaded knowledge base documents |
| `documents.totalSize` | Total size of all documents in bytes |

---

#### `GET /api/admin/dashboard/chapters`

Get per-chapter analytics report.

**Auth:** Bearer Token + Admin

**Response `200`:**
```json
[
  {
    "chapterTitle": "Basic Driving Skills",
    "totalSubLessons": 3,
    "completionRate": 65,
    "quizStats": {
      "totalQuestions": 4,
      "totalAttempts": 80,
      "averageScore": 72,
      "passRate": 78
    }
  },
  {
    "chapterTitle": "Traffic Signs",
    "totalSubLessons": 4,
    "completionRate": 45,
    "quizStats": {
      "totalQuestions": 5,
      "totalAttempts": 60,
      "averageScore": 65,
      "passRate": 62
    }
  },
  {
    "chapterTitle": "Road Priorities & Right of Way",
    "totalSubLessons": 3,
    "completionRate": 30,
    "quizStats": {
      "totalQuestions": 4,
      "totalAttempts": 40,
      "averageScore": 58,
      "passRate": 50
    }
  },
  {
    "chapterTitle": "Speed Limits & Safe Following",
    "totalSubLessons": 3,
    "completionRate": 20,
    "quizStats": {
      "totalQuestions": 5,
      "totalAttempts": 35,
      "averageScore": 55,
      "passRate": 45
    }
  },
  {
    "chapterTitle": "Seat Belt Safety & Passenger Rules",
    "totalSubLessons": 2,
    "completionRate": 50,
    "quizStats": {
      "totalQuestions": 4,
      "totalAttempts": 45,
      "averageScore": 70,
      "passRate": 68
    }
  }
]
```

**Field descriptions:**

| Field | Description |
|---|---|
| `chapterTitle` | The chapter/lesson title |
| `totalSubLessons` | Number of sub-lessons in this chapter |
| `completionRate` | Percentage of students who completed ALL sub-lessons |
| `quizStats.totalQuestions` | Number of quiz questions for this chapter |
| `quizStats.totalAttempts` | Total quiz submissions for this chapter |
| `quizStats.averageScore` | Average score for this chapter's quizzes |
| `quizStats.passRate` | Percentage of attempts scoring >= 70% |

---

#### `GET /api/admin/dashboard/activity`

Get recent platform activity (latest signups and quiz attempts).

**Auth:** Bearer Token + Admin

**Response `200`:**
```json
{
  "recentUsers": [
    {
      "id": "664a1b2c3d4e5f6a7b8c9d20",
      "name": "Lina Hassan",
      "email": "lina@example.com",
      "role": "student",
      "createdAt": "2026-04-12T13:00:00.000Z"
    },
    {
      "id": "664a1b2c3d4e5f6a7b8c9d1f",
      "name": "Omar Khalil",
      "email": "omar@example.com",
      "role": "student",
      "createdAt": "2026-04-11T09:30:00.000Z"
    }
  ],
  "recentQuizAttempts": [
    {
      "userName": "Lina Hassan",
      "userEmail": "lina@example.com",
      "chapterTitle": "Traffic Signs",
      "score": 4,
      "totalQuestions": 5,
      "date": "2026-04-12T14:30:00.000Z"
    },
    {
      "userName": "Omar Khalil",
      "userEmail": "omar@example.com",
      "chapterTitle": "Basic Driving Skills",
      "score": 3,
      "totalQuestions": 4,
      "date": "2026-04-11T11:00:00.000Z"
    }
  ]
}
```

**Field descriptions:**

| Field | Description |
|---|---|
| `recentUsers` | Last 10 registered users (newest first) |
| `recentQuizAttempts` | Last 10 quiz submissions with user info |
| `recentQuizAttempts[].score` | Number of correct answers |
| `recentQuizAttempts[].totalQuestions` | Total questions in the attempt |
| `recentQuizAttempts[].date` | When the quiz was submitted |

---

## 10. Error Handling

### 10.1 Error Response Format

All errors return:
```json
{
  "message": "Description of what went wrong"
}
```

### 10.2 Common Status Codes

| Status | Meaning | When |
|---|---|---|
| `400` | Bad Request | Missing fields, invalid data, duplicate email, file too large |
| `401` | Unauthorized | Missing/invalid/expired token |
| `403` | Forbidden | Non-admin accessing admin endpoints, deleting primary admin |
| `404` | Not Found | Resource not found, unknown route |
| `500` | Internal Error | Unhandled server errors |
| `503` | Unavailable | Gemini API key not configured |

### 10.3 Invalid ObjectId

```json
{ "message": "Invalid _id: not-a-valid-id" }
```
Status: `400`

### 10.4 Route Not Found

```json
{ "message": "Route not found" }
```
Status: `404`

---

## 11. Seed Data

### Auto-Seed Admin (on every startup)

The server automatically creates the admin account on startup if it doesn't exist:

| Name | Email | Password | Role |
|---|---|---|---|
| Admin User | `admin@driving.com` | `admin123` | admin |

This is **idempotent** — if the admin already exists, nothing happens.

### Manual Seed (`npm run seed`)

Run `npm run seed` to upsert demo users, lessons, and quiz questions. This uses the dedicated seeders:

- `npm run seed:users`
- `npm run seed:lessons`
- `npm run seed:questions`

The seeders update or insert matching records; they do not clear the whole database.

**2 Users:**
| Name | Email | Password | Role |
|---|---|---|---|
| Student User | `student@driving.com` | `student123` | student |
| Admin User | `admin@driving.com` | `admin123` | admin |

**Lesson chapters:**

| # | Chapter | Sub-lessons |
|---|---|---|
| 1 | Basic Driving Skills | Getting into the Car, Starting the Car, Basic Vehicle Controls |
| 2 | Traffic Signs | Warning Signs, Mandatory Signs, Prohibitory Signs, Informational Signs |
| 3 | Road Priorities & Right of Way | Priority at Intersections, Pedestrian Priority, Emergency Vehicles |
| 4 | Speed Limits & Safe Following | Speed Limit Rules, Safe Following Distance, Driving in Bad Weather |
| 5 | Seat Belt Safety & Passenger Rules | Seat Belt Laws, Child Safety Seats |

**Quiz Questions:** seeded from `seeds/questions_final.json` across all chapters with easy/medium/hard difficulty levels.

---

## 12. How to Run

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Google Gemini API key (free from [Google AI Studio](https://aistudio.google.com/apikey))

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Create .env from template
cp .env.example .env

# 3. Edit .env with your values:
#    MONGO_URI, JWT_SECRET, GEMINI_API_KEY

# 4. (Optional) Seed with demo data
npm run seed

# 5. Start development server
npm run dev
```

> The admin account (`admin@driving.com` / `admin123`) is created automatically on startup — no seed required.

### Available Scripts

| Command | Description |
|---|---|
| `npm start` | Start the server (production) |
| `npm run dev` | Start with nodemon (auto-restart) |
| `npm run seed` | Seed database with demo data |

### URLs

| URL | Description |
|---|---|
| `http://localhost:3000` | API health check |
| `http://localhost:3000/api-docs` | Swagger UI |
| `http://localhost:3000/api-docs.json` | Raw OpenAPI JSON |

### Quick Test Flow

1. Start the server: `npm run dev`
2. Open `http://localhost:3000/api-docs`
3. Login as admin: `POST /api/auth/login` with `admin@driving.com` / `admin123`
4. Copy the `token` from the response
5. Click "Authorize" in Swagger and paste the token
6. Upload a document: `POST /api/admin/documents`
7. View dashboard: `GET /api/admin/dashboard/stats`
8. Manage users: `GET /api/admin/users`

### All API Endpoints Summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | None | Health check |
| POST | `/api/auth/register` | None | Register |
| POST | `/api/auth/login` | None | Login |
| GET | `/api/auth/me` | Token | Current user profile |
| GET | `/api/lessons` | Token | List lessons |
| GET | `/api/lessons/:id` | Token | Get lesson |
| POST | `/api/lessons/:id/complete` | Token | Complete sub-lesson |
| POST | `/api/lessons` | Admin | Create lesson |
| PUT | `/api/lessons/:id` | Admin | Update lesson |
| DELETE | `/api/lessons/:id` | Admin | Delete lesson |
| GET | `/api/quizzes` | Token | List quizzes by chapter |
| GET | `/api/quizzes/exam` | Token | 10 random exam questions |
| GET | `/api/quizzes/chapter/:title` | Token | Quizzes by chapter |
| POST | `/api/quizzes/submit` | Token | Submit quiz answers |
| POST | `/api/quizzes` | Admin | Create quiz question |
| PUT | `/api/quizzes/:id` | Admin | Update quiz question |
| DELETE | `/api/quizzes/:id` | Admin | Delete quiz question |
| GET | `/api/progress` | Token | Get user progress |
| GET | `/api/progress/summary` | Token | Get progress summary |
| DELETE | `/api/progress/reset` | Token | Reset progress |
| POST | `/api/assistant/chat` | Token | AI assistant chat |
| GET | `/api/admin/users` | Admin | List all users |
| PUT | `/api/admin/users/:id` | Admin | Update user email/password |
| DELETE | `/api/admin/users/:id` | Admin | Delete user |
| POST | `/api/admin/documents` | Admin | Upload document |
| GET | `/api/admin/documents` | Admin | List documents |
| DELETE | `/api/admin/documents/:id` | Admin | Delete document |
| GET | `/api/admin/dashboard/stats` | Admin | Platform overview stats |
| GET | `/api/admin/dashboard/chapters` | Admin | Per-chapter report |
| GET | `/api/admin/dashboard/activity` | Admin | Recent activity |
