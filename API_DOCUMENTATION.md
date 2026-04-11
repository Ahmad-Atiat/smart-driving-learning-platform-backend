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
   - [Assistant APIs](#96-assistant-api)
10. [Error Handling](#10-error-handling)
11. [Seed Data](#11-seed-data)
12. [How to Run](#12-how-to-run)

---

## 1. Application Overview

The **Smart Driving Learning Platform** is a full-stack web application that helps students learn driving rules, understand traffic signs, and prepare for driving exams. The backend provides a REST API for:

- **User authentication** (register, login, session via JWT)
- **Lessons** (structured chapters with sub-lessons, mark as completed)
- **Quizzes** (multiple-choice questions, submit & grade, exam simulation)
- **Progress tracking** (per-user completion, quiz scores, overall percentage)
- **AI Assistant** (a chat interface powered by Google Gemini AI, scoped to driving topics only)

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
| **@google/generative-ai** | Google Gemini AI SDK for the assistant feature |
| **swagger-jsdoc + swagger-ui-express** | API documentation |
| **nodemon** | Development auto-restart |

---

## 3. Architecture

The application follows the **Controller-Service-Repository** (Template) pattern:

```
Client Request
     |
   Routes         (define HTTP endpoints, attach middleware)
     |
   Controllers    (parse request, call service, send response — thin, no business logic)
     |
   Services       (all business logic, validation, orchestration, AI calls)
     |
   Repositories   (data access layer — wraps Mongoose operations)
     |
   Models          (Mongoose schemas — define data shape)
```

**Key principles:**
- Controllers never access the database directly
- Services contain all business rules and logic
- Repositories are the only layer that talks to MongoDB
- Models define the schema and are used only by repositories

---

## 4. Folder Structure

```
smart-driving-learning-platform-backend/
├── config/
│   └── db.js                     # MongoDB connection
├── controllers/
│   ├── authController.js         # Auth request handling
│   ├── lessonController.js       # Lesson request handling
│   ├── quizController.js         # Quiz request handling
│   ├── progressController.js     # Progress request handling
│   └── assistantController.js    # AI assistant request handling
├── middleware/
│   ├── authMiddleware.js         # JWT verification (protect)
│   ├── adminMiddleware.js        # Admin role check (adminOnly)
│   └── errorHandler.js           # Global error handler
├── models/
│   ├── User.js                   # User schema
│   ├── Lesson.js                 # Lesson/chapter schema
│   ├── Quiz.js                   # Quiz question schema
│   └── Progress.js               # User progress schema
├── repositories/
│   ├── userRepository.js         # User data access
│   ├── lessonRepository.js       # Lesson data access
│   ├── quizRepository.js         # Quiz data access
│   └── progressRepository.js     # Progress data access
├── routes/
│   ├── authRoutes.js             # /api/auth/*
│   ├── lessonRoutes.js           # /api/lessons/*
│   ├── quizRoutes.js             # /api/quizzes/*
│   ├── progressRoutes.js         # /api/progress/*
│   └── assistantRoutes.js        # /api/assistant/*
├── seeds/
│   └── seedData.js               # Database seeder
├── services/
│   ├── authService.js            # Auth business logic
│   ├── lessonService.js          # Lesson business logic
│   ├── quizService.js            # Quiz business logic
│   ├── progressService.js        # Progress business logic
│   └── assistantService.js       # Gemini AI integration
├── utils/
│   └── apiError.js               # Custom ApiError class
├── index.js                      # Express app setup
├── server.js                     # Server entry point
├── swagger.js                    # Swagger/OpenAPI config
├── package.json
├── .env                          # Environment variables (not in git)
├── .env.example                  # Environment template
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

A "Lesson" is actually a **chapter** that contains an array of **sub-lessons**.

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
| `createdAt` | Date | Auto | — | |
| `updatedAt` | Date | Auto | — | |

### 5.3 Quiz

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `question` | String | Yes | — | The question text, trimmed |
| `options` | [String] | Yes | — | **Exactly 4 options** (validated) |
| `correctAnswer` | String | Yes | — | Must match one of the 4 options |
| `chapterTitle` | String | Yes | — | Links quiz to a Lesson by title string |
| `explanation` | String | No | `""` | Explanation of the correct answer |
| `difficulty` | String | No | `"easy"` | Enum: `easy`, `medium`, `hard` |
| `createdAt` | Date | Auto | — | |
| `updatedAt` | Date | Auto | — | |

### 5.4 Progress

One document per user. Created automatically on first activity.

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `userId` | ObjectId | Yes | — | References `User` collection |
| `completedLessons` | [String] | No | `[]` | Array of identifiers like `"Traffic Signs:Warning Signs"` |
| `quizResults` | [Object] | No | `[]` | Array of quiz attempt records |
| `quizResults[].chapterTitle` | String | Yes | — | Which chapter the quiz covered |
| `quizResults[].score` | Number | Yes | — | Score as percentage (0-100) |
| `quizResults[].totalQuestions` | Number | Yes | — | Number of questions in that attempt |
| `overallProgress` | Number | No | `0` | Percentage of completed chapters (0-100) |
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
| `GEMINI_API_KEY` | Google Gemini AI API key (get free from Google AI Studio) | `AIzaSy...` |

---

## 7. Authentication & Authorization

### 7.1 JWT Authentication

- Tokens are generated on **register** and **login**
- Token payload: `{ id: userId }` signed with `JWT_SECRET`
- Token expiration: **7 days**
- Client sends token as: `Authorization: Bearer <token>`

### 7.2 Middleware

**`protect` middleware** (in `middleware/authMiddleware.js`):
- Extracts Bearer token from the `Authorization` header
- Verifies the token using `jsonwebtoken`
- Loads the user from DB (excluding password field)
- Attaches user to `req.user`
- Returns `401` if token is missing, invalid, or user not found

**`adminOnly` middleware** (in `middleware/adminMiddleware.js`):
- Checks if `req.user.role === 'admin'`
- Returns `403` if not admin
- Must be used AFTER `protect` middleware

### 7.3 Role-Based Access

| Role | Can Access |
|---|---|
| `student` | All GET endpoints, complete lessons, submit quizzes, view/reset progress, chat with assistant |
| `admin` | Everything a student can + create/update/delete lessons + create/update/delete quizzes |

---

## 8. Business Rules

### 8.1 Authentication Rules

1. Email is normalized: trimmed and converted to lowercase before any operation
2. Email must be unique across all users
3. Password is hashed using bcrypt with 10 salt rounds before storage
4. Registration automatically logs the user in (returns token immediately)
5. Users cannot self-register as admin; default role is always `student`
6. Login returns the same response shape as register (user data + token)

### 8.2 Lesson Rules

1. Lessons are **chapters**, each containing an array of **sub-lessons**
2. Chapters are sorted by the `order` field (ascending: 1, 2, 3...)
3. Students only see **published** chapters (`isPublished: true`)
4. Admins see **all** chapters (including unpublished)
5. Only admins can create, update, or delete chapters
6. When a student marks a sub-lesson as complete, the identifier is saved as `"ChapterTitle:SubLessonTitle"` in their Progress document
7. A chapter is considered "completed" when **ALL** its sub-lessons are in the `completedLessons` array
8. Completing a sub-lesson automatically recalculates the overall progress percentage

### 8.3 Quiz Rules

1. Every quiz question must have **exactly 4 options** (Mongoose validates this)
2. The `correctAnswer` must be one of the 4 options (text must match exactly)
3. Questions are linked to chapters by `chapterTitle` (string match, not ObjectId)
4. Difficulty levels: `easy`, `medium`, `hard` (default: `easy`)
5. When submitting a quiz, the client sends an array of `{ questionId, selectedAnswer }`
6. Score is calculated as: `Math.round((correct / total) * 100)` = percentage
7. The response includes **per-question feedback**: whether each answer was correct, what the correct answer was, and the explanation
8. **Exam simulation** randomly picks 10 questions from all chapters; the response does NOT include `correctAnswer` or `explanation` (so the student can't cheat)
9. Each quiz submission is saved to the user's Progress document under `quizResults`
10. Only admins can create, update, or delete quiz questions

### 8.4 Progress Rules

1. One Progress document per user — created automatically on first lesson completion or quiz submission
2. `completedLessons` stores identifier strings in the format `"ChapterTitle:SubLessonTitle"`
3. `overallProgress` is a percentage: `Math.round((completedChapters / totalPublishedChapters) * 100)`
4. A chapter counts as "completed" only when **every** sub-lesson in it is in `completedLessons`
5. The **summary** endpoint calculates per-chapter status:
   - `"Not Started"` — zero sub-lessons completed
   - `"In Progress"` — some but not all sub-lessons completed
   - `"Completed"` — all sub-lessons completed
6. Quiz stats in the summary: `lastScore`, `totalAttempts`, `averageScore`
7. **Reset** clears everything: `completedLessons = []`, `quizResults = []`, `overallProgress = 0`
8. Progress is always scoped to the authenticated user (no user can see another user's progress)

### 8.5 AI Assistant Rules

1. Powered by **Google Gemini API** (model: `gemini-2.0-flash`)
2. The AI is constrained by a **system prompt** to ONLY answer driving-related questions
3. If a student asks something unrelated to driving, the AI politely redirects them
4. The backend is **stateless** — conversation history is sent from the frontend with each request
5. If the Gemini API is not configured (`GEMINI_API_KEY` missing), returns `503`
6. If the Gemini API fails or is rate-limited (429), returns a friendly fallback message instead of an error
7. Requires authentication (JWT) to use

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

Check if the API is running.

**Auth:** None

**Request:**
```
GET / HTTP/1.1
Host: localhost:3000
```

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
POST /api/auth/register
Content-Type: application/json

{
  "name": "Ahmad Atiat",
  "email": "ahmad@example.com",
  "password": "StrongPassword123"
}
```

**Response `201` (Success):**
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

**Response `400` (Missing fields):**
```json
{
  "message": "Please fill all fields"
}
```

**Response `400` (Duplicate email):**
```json
{
  "message": "User already exists"
}
```

---

#### `POST /api/auth/login`

Login with existing credentials.

**Auth:** None

**Request:**
```json
POST /api/auth/login
Content-Type: application/json

{
  "email": "student@driving.com",
  "password": "student123"
}
```

**Response `200` (Success):**
```json
{
  "message": "Login successful",
  "_id": "664a1b2c3d4e5f6a7b8c9d0e",
  "name": "Student User",
  "email": "student@driving.com",
  "role": "student",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response `400` (Wrong credentials):**
```json
{
  "message": "Invalid email or password"
}
```

**Response `400` (Missing fields):**
```json
{
  "message": "Please fill all fields"
}
```

---

#### `GET /api/auth/me`

Get the currently authenticated user's profile.

**Auth:** Bearer Token (required)

**Request:**
```
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response `200` (Success):**
```json
{
  "message": "Authenticated user fetched successfully",
  "user": {
    "_id": "664a1b2c3d4e5f6a7b8c9d0e",
    "name": "Student User",
    "email": "student@driving.com",
    "role": "student",
    "createdAt": "2026-04-12T10:30:00.000Z",
    "updatedAt": "2026-04-12T10:30:00.000Z"
  }
}
```

**Response `401` (No token):**
```json
{
  "message": "Not authorized, token missing"
}
```

**Response `401` (Invalid token):**
```json
{
  "message": "Not authorized, invalid token"
}
```

---

### 9.3 Lesson APIs

#### `GET /api/lessons`

Get all lessons (chapters). Students see published only. Admins see all.

**Auth:** Bearer Token (required)

**Request:**
```
GET /api/lessons
Authorization: Bearer <token>
```

**Response `200` (Success):**
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
      {
        "title": "Getting into the Car",
        "content": "Before entering the vehicle, walk around it to check for obstacles..."
      },
      {
        "title": "Starting the Car",
        "content": "Ensure the gear is in Park (automatic) or Neutral (manual)..."
      },
      {
        "title": "Basic Vehicle Controls",
        "content": "The steering wheel controls direction..."
      }
    ],
    "createdAt": "2026-04-12T10:30:00.000Z",
    "updatedAt": "2026-04-12T10:30:00.000Z"
  },
  {
    "_id": "664b1c2d3e4f5a6b7c8d9e10",
    "title": "Traffic Signs",
    "description": "Understand the most important road signs and their meanings.",
    "image": "",
    "order": 2,
    "isPublished": true,
    "lessons": [
      {
        "title": "Warning Signs",
        "content": "Warning signs are usually yellow or orange with a diamond shape..."
      },
      {
        "title": "Mandatory Signs",
        "content": "Mandatory signs are circular with a blue background..."
      },
      {
        "title": "Prohibitory Signs",
        "content": "Prohibitory signs are circular with a red border..."
      },
      {
        "title": "Informational Signs",
        "content": "Informational signs are usually rectangular with a blue or green background..."
      }
    ],
    "createdAt": "2026-04-12T10:30:00.000Z",
    "updatedAt": "2026-04-12T10:30:00.000Z"
  }
]
```

---

#### `GET /api/lessons/:id`

Get a single lesson by its ID.

**Auth:** Bearer Token (required)

**Request:**
```
GET /api/lessons/664b1c2d3e4f5a6b7c8d9e0f
Authorization: Bearer <token>
```

**Response `200` (Success):**
```json
{
  "_id": "664b1c2d3e4f5a6b7c8d9e0f",
  "title": "Basic Driving Skills",
  "description": "Learn the fundamental steps before and during driving.",
  "image": "",
  "order": 1,
  "isPublished": true,
  "lessons": [
    {
      "title": "Getting into the Car",
      "content": "Before entering the vehicle, walk around it to check for obstacles. Adjust your seat so you can reach the pedals comfortably. Adjust all mirrors (rearview and side mirrors) for clear visibility. Always fasten your seatbelt before starting the engine."
    },
    {
      "title": "Starting the Car",
      "content": "Ensure the gear is in Park (automatic) or Neutral (manual). Press the brake pedal firmly. Turn the ignition key or press the start button. Check all dashboard indicators before moving. Release the parking brake when ready to drive."
    },
    {
      "title": "Basic Vehicle Controls",
      "content": "The steering wheel controls direction. The accelerator pedal increases speed. The brake pedal slows or stops the vehicle. The turn signals indicate your intended direction to other drivers. Use mirrors frequently to stay aware of your surroundings."
    }
  ],
  "createdAt": "2026-04-12T10:30:00.000Z",
  "updatedAt": "2026-04-12T10:30:00.000Z"
}
```

**Response `404` (Not found):**
```json
{
  "message": "Lesson not found"
}
```

---

#### `POST /api/lessons/:id/complete`

Mark a sub-lesson as completed for the authenticated user.

**Auth:** Bearer Token (required)

**Request:**
```json
POST /api/lessons/664b1c2d3e4f5a6b7c8d9e0f/complete
Authorization: Bearer <token>
Content-Type: application/json

{
  "subLessonTitle": "Getting into the Car"
}
```

**Response `200` (Success):**
```json
{
  "message": "Sub-lesson completed",
  "identifier": "Basic Driving Skills:Getting into the Car",
  "overallProgress": 0
}
```

> Note: `overallProgress` only increases when ALL sub-lessons in a chapter are completed. After completing all 3 sub-lessons of "Basic Driving Skills", it would become `20` (1 out of 5 chapters = 20%).

**Response `400` (Missing subLessonTitle):**
```json
{
  "message": "subLessonTitle is required"
}
```

**Response `404` (Lesson not found):**
```json
{
  "message": "Lesson not found"
}
```

**Response `404` (Sub-lesson not found):**
```json
{
  "message": "Sub-lesson not found"
}
```

---

#### `POST /api/lessons` (Admin Only)

Create a new lesson/chapter.

**Auth:** Bearer Token + Admin Role (required)

**Request:**
```json
POST /api/lessons
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "Parking Rules",
  "description": "Learn proper parking techniques and rules.",
  "order": 6,
  "isPublished": true,
  "lessons": [
    {
      "title": "Parallel Parking",
      "content": "Parallel parking requires pulling up next to the car in front of the space..."
    },
    {
      "title": "Angle Parking",
      "content": "Angle parking is common in parking lots..."
    }
  ]
}
```

**Response `201` (Success):**
```json
{
  "_id": "664c2d3e4f5a6b7c8d9e0f11",
  "title": "Parking Rules",
  "description": "Learn proper parking techniques and rules.",
  "image": "",
  "order": 6,
  "isPublished": true,
  "lessons": [
    {
      "title": "Parallel Parking",
      "content": "Parallel parking requires pulling up next to the car in front of the space..."
    },
    {
      "title": "Angle Parking",
      "content": "Angle parking is common in parking lots..."
    }
  ],
  "createdAt": "2026-04-12T12:00:00.000Z",
  "updatedAt": "2026-04-12T12:00:00.000Z"
}
```

**Response `403` (Not admin):**
```json
{
  "message": "Access denied. Admin only."
}
```

---

#### `PUT /api/lessons/:id` (Admin Only)

Update an existing lesson/chapter.

**Auth:** Bearer Token + Admin Role (required)

**Request:**
```json
PUT /api/lessons/664b1c2d3e4f5a6b7c8d9e0f
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "Basic Driving Skills (Updated)",
  "description": "Updated description for basic driving."
}
```

**Response `200` (Success):**
```json
{
  "_id": "664b1c2d3e4f5a6b7c8d9e0f",
  "title": "Basic Driving Skills (Updated)",
  "description": "Updated description for basic driving.",
  "image": "",
  "order": 1,
  "isPublished": true,
  "lessons": [
    { "title": "Getting into the Car", "content": "..." },
    { "title": "Starting the Car", "content": "..." },
    { "title": "Basic Vehicle Controls", "content": "..." }
  ],
  "createdAt": "2026-04-12T10:30:00.000Z",
  "updatedAt": "2026-04-12T12:30:00.000Z"
}
```

**Response `404` (Not found):**
```json
{
  "message": "Lesson not found"
}
```

---

#### `DELETE /api/lessons/:id` (Admin Only)

Delete a lesson/chapter.

**Auth:** Bearer Token + Admin Role (required)

**Request:**
```
DELETE /api/lessons/664b1c2d3e4f5a6b7c8d9e0f
Authorization: Bearer <admin_token>
```

**Response `200` (Success):**
```json
{
  "message": "Lesson deleted successfully"
}
```

**Response `404` (Not found):**
```json
{
  "message": "Lesson not found"
}
```

---

### 9.4 Quiz APIs

#### `GET /api/quizzes`

Get all quiz questions grouped by chapter title.

**Auth:** Bearer Token (required)

**Request:**
```
GET /api/quizzes
Authorization: Bearer <token>
```

**Response `200` (Success):**
```json
{
  "Basic Driving Skills": [
    {
      "_id": "664d3e4f5a6b7c8d9e0f1122",
      "question": "What is the first thing you should do before starting the car?",
      "options": ["Turn on the radio", "Fasten your seatbelt", "Check your phone", "Adjust the AC"],
      "correctAnswer": "Fasten your seatbelt",
      "chapterTitle": "Basic Driving Skills",
      "explanation": "Safety first — always fasten your seatbelt before starting the engine.",
      "difficulty": "easy",
      "createdAt": "2026-04-12T10:30:00.000Z",
      "updatedAt": "2026-04-12T10:30:00.000Z"
    },
    {
      "_id": "664d3e4f5a6b7c8d9e0f1123",
      "question": "What should you check before entering a vehicle?",
      "options": ["Walk around and check for obstacles", "Nothing, just get in", "Honk the horn", "Flash the headlights"],
      "correctAnswer": "Walk around and check for obstacles",
      "chapterTitle": "Basic Driving Skills",
      "explanation": "A safety walk-around helps you spot any obstacles, children, or animals near the vehicle.",
      "difficulty": "easy",
      "createdAt": "2026-04-12T10:30:00.000Z",
      "updatedAt": "2026-04-12T10:30:00.000Z"
    }
  ],
  "Traffic Signs": [
    {
      "_id": "664d3e4f5a6b7c8d9e0f1126",
      "question": "What does a red stop sign mean?",
      "options": ["Slow down only", "Stop completely", "Parking allowed", "Turn right only"],
      "correctAnswer": "Stop completely",
      "chapterTitle": "Traffic Signs",
      "explanation": "A red stop sign requires the driver to stop the vehicle completely before proceeding.",
      "difficulty": "easy",
      "createdAt": "2026-04-12T10:30:00.000Z",
      "updatedAt": "2026-04-12T10:30:00.000Z"
    }
  ],
  "Road Priorities & Right of Way": [ ... ],
  "Speed Limits & Safe Following": [ ... ],
  "Seat Belt Safety & Passenger Rules": [ ... ]
}
```

---

#### `GET /api/quizzes/chapter/:chapterTitle`

Get quiz questions for a specific chapter.

**Auth:** Bearer Token (required)

**Request:**
```
GET /api/quizzes/chapter/Traffic%20Signs
Authorization: Bearer <token>
```

> Note: URL-encode the chapter title (spaces become `%20`)

**Response `200` (Success):**
```json
[
  {
    "_id": "664d3e4f5a6b7c8d9e0f1126",
    "question": "What does a red stop sign mean?",
    "options": ["Slow down only", "Stop completely", "Parking allowed", "Turn right only"],
    "correctAnswer": "Stop completely",
    "chapterTitle": "Traffic Signs",
    "explanation": "A red stop sign requires the driver to stop the vehicle completely before proceeding.",
    "difficulty": "easy",
    "createdAt": "2026-04-12T10:30:00.000Z",
    "updatedAt": "2026-04-12T10:30:00.000Z"
  },
  {
    "_id": "664d3e4f5a6b7c8d9e0f1127",
    "question": "What shape are warning signs typically?",
    "options": ["Circular", "Diamond or triangular", "Square", "Octagonal"],
    "correctAnswer": "Diamond or triangular",
    "chapterTitle": "Traffic Signs",
    "explanation": "Warning signs are usually diamond-shaped (in North America) or triangular (internationally) with yellow or orange colors.",
    "difficulty": "easy",
    "createdAt": "2026-04-12T10:30:00.000Z",
    "updatedAt": "2026-04-12T10:30:00.000Z"
  },
  {
    "_id": "664d3e4f5a6b7c8d9e0f1128",
    "question": "A circular sign with a red border indicates what?",
    "options": ["A warning", "A prohibition", "Information", "A mandatory action"],
    "correctAnswer": "A prohibition",
    "chapterTitle": "Traffic Signs",
    "explanation": "Circular signs with red borders are prohibitory signs that tell drivers what they cannot do.",
    "difficulty": "medium",
    "createdAt": "2026-04-12T10:30:00.000Z",
    "updatedAt": "2026-04-12T10:30:00.000Z"
  },
  {
    "_id": "664d3e4f5a6b7c8d9e0f1129",
    "question": "What does a blue circular sign indicate?",
    "options": ["Warning", "Prohibition", "Mandatory action", "Speed limit"],
    "correctAnswer": "Mandatory action",
    "chapterTitle": "Traffic Signs",
    "explanation": "Blue circular signs are mandatory signs that tell drivers what they must do.",
    "difficulty": "medium",
    "createdAt": "2026-04-12T10:30:00.000Z",
    "updatedAt": "2026-04-12T10:30:00.000Z"
  },
  {
    "_id": "664d3e4f5a6b7c8d9e0f112a",
    "question": "What color background do informational road signs usually have?",
    "options": ["Red", "Yellow", "Blue or green", "Orange"],
    "correctAnswer": "Blue or green",
    "chapterTitle": "Traffic Signs",
    "explanation": "Informational signs typically have blue or green backgrounds and provide useful information like distances and services.",
    "difficulty": "easy",
    "createdAt": "2026-04-12T10:30:00.000Z",
    "updatedAt": "2026-04-12T10:30:00.000Z"
  }
]
```

**Response `404` (No quizzes for this chapter):**
```json
{
  "message": "No quizzes found for this chapter"
}
```

---

#### `GET /api/quizzes/exam`

Get 10 random questions for exam simulation mode. Correct answers and explanations are NOT included.

**Auth:** Bearer Token (required)

**Request:**
```
GET /api/quizzes/exam
Authorization: Bearer <token>
```

**Response `200` (Success):**
```json
[
  {
    "_id": "664d3e4f5a6b7c8d9e0f1122",
    "question": "What is the first thing you should do before starting the car?",
    "options": ["Turn on the radio", "Fasten your seatbelt", "Check your phone", "Adjust the AC"],
    "chapterTitle": "Basic Driving Skills",
    "difficulty": "easy"
  },
  {
    "_id": "664d3e4f5a6b7c8d9e0f1126",
    "question": "What does a red stop sign mean?",
    "options": ["Slow down only", "Stop completely", "Parking allowed", "Turn right only"],
    "chapterTitle": "Traffic Signs",
    "difficulty": "easy"
  },
  {
    "_id": "664d3e4f5a6b7c8d9e0f112b",
    "question": "Who has priority at a pedestrian crossing?",
    "options": ["The fastest car", "The pedestrian", "The larger vehicle", "The vehicle on the left"],
    "chapterTitle": "Road Priorities & Right of Way",
    "difficulty": "easy"
  }
]
```

> Note: Response will contain up to 10 questions (or fewer if the database has less than 10 total). The `correctAnswer` and `explanation` fields are **stripped out** so the student cannot see the answers.

---

#### `POST /api/quizzes/submit`

Submit quiz answers and get graded results with instant feedback.

**Auth:** Bearer Token (required)

**Request:**
```json
POST /api/quizzes/submit
Authorization: Bearer <token>
Content-Type: application/json

{
  "answers": [
    {
      "questionId": "664d3e4f5a6b7c8d9e0f1122",
      "selectedAnswer": "Fasten your seatbelt"
    },
    {
      "questionId": "664d3e4f5a6b7c8d9e0f1126",
      "selectedAnswer": "Slow down only"
    },
    {
      "questionId": "664d3e4f5a6b7c8d9e0f112b",
      "selectedAnswer": "The pedestrian"
    }
  ]
}
```

**Response `200` (Success):**
```json
{
  "score": 67,
  "totalQuestions": 3,
  "correct": 2,
  "results": [
    {
      "questionId": "664d3e4f5a6b7c8d9e0f1122",
      "question": "What is the first thing you should do before starting the car?",
      "selectedAnswer": "Fasten your seatbelt",
      "correctAnswer": "Fasten your seatbelt",
      "isCorrect": true,
      "explanation": "Safety first — always fasten your seatbelt before starting the engine."
    },
    {
      "questionId": "664d3e4f5a6b7c8d9e0f1126",
      "question": "What does a red stop sign mean?",
      "selectedAnswer": "Slow down only",
      "correctAnswer": "Stop completely",
      "isCorrect": false,
      "explanation": "A red stop sign requires the driver to stop the vehicle completely before proceeding."
    },
    {
      "questionId": "664d3e4f5a6b7c8d9e0f112b",
      "question": "Who has priority at a pedestrian crossing?",
      "selectedAnswer": "The pedestrian",
      "correctAnswer": "The pedestrian",
      "isCorrect": true,
      "explanation": "Pedestrians always have the right of way at marked pedestrian crossings."
    }
  ]
}
```

**Response `400` (Missing answers):**
```json
{
  "message": "Answers array is required"
}
```

---

#### `POST /api/quizzes` (Admin Only)

Create a new quiz question.

**Auth:** Bearer Token + Admin Role (required)

**Request:**
```json
POST /api/quizzes
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "question": "What does a flashing yellow light mean?",
  "options": ["Stop immediately", "Proceed with caution", "Speed up", "Turn around"],
  "correctAnswer": "Proceed with caution",
  "chapterTitle": "Traffic Signs",
  "explanation": "A flashing yellow light means slow down and proceed with caution.",
  "difficulty": "medium"
}
```

**Response `201` (Success):**
```json
{
  "_id": "664e4f5a6b7c8d9e0f112233",
  "question": "What does a flashing yellow light mean?",
  "options": ["Stop immediately", "Proceed with caution", "Speed up", "Turn around"],
  "correctAnswer": "Proceed with caution",
  "chapterTitle": "Traffic Signs",
  "explanation": "A flashing yellow light means slow down and proceed with caution.",
  "difficulty": "medium",
  "createdAt": "2026-04-12T13:00:00.000Z",
  "updatedAt": "2026-04-12T13:00:00.000Z"
}
```

**Response `403` (Not admin):**
```json
{
  "message": "Access denied. Admin only."
}
```

---

#### `PUT /api/quizzes/:id` (Admin Only)

Update an existing quiz question.

**Auth:** Bearer Token + Admin Role (required)

**Request:**
```json
PUT /api/quizzes/664d3e4f5a6b7c8d9e0f1126
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "question": "What does a red octagonal stop sign require?",
  "difficulty": "medium"
}
```

**Response `200` (Success):**
```json
{
  "_id": "664d3e4f5a6b7c8d9e0f1126",
  "question": "What does a red octagonal stop sign require?",
  "options": ["Slow down only", "Stop completely", "Parking allowed", "Turn right only"],
  "correctAnswer": "Stop completely",
  "chapterTitle": "Traffic Signs",
  "explanation": "A red stop sign requires the driver to stop the vehicle completely before proceeding.",
  "difficulty": "medium",
  "createdAt": "2026-04-12T10:30:00.000Z",
  "updatedAt": "2026-04-12T13:30:00.000Z"
}
```

**Response `404` (Not found):**
```json
{
  "message": "Quiz question not found"
}
```

---

#### `DELETE /api/quizzes/:id` (Admin Only)

Delete a quiz question.

**Auth:** Bearer Token + Admin Role (required)

**Request:**
```
DELETE /api/quizzes/664d3e4f5a6b7c8d9e0f1126
Authorization: Bearer <admin_token>
```

**Response `200` (Success):**
```json
{
  "message": "Quiz question deleted successfully"
}
```

**Response `404` (Not found):**
```json
{
  "message": "Quiz question not found"
}
```

---

### 9.5 Progress APIs

#### `GET /api/progress`

Get the full raw progress document for the authenticated user.

**Auth:** Bearer Token (required)

**Request:**
```
GET /api/progress
Authorization: Bearer <token>
```

**Response `200` (Success):**
```json
{
  "_id": "664f5a6b7c8d9e0f11223344",
  "userId": "664a1b2c3d4e5f6a7b8c9d0e",
  "completedLessons": [
    "Basic Driving Skills:Getting into the Car",
    "Basic Driving Skills:Starting the Car",
    "Basic Driving Skills:Basic Vehicle Controls",
    "Traffic Signs:Warning Signs"
  ],
  "quizResults": [
    {
      "chapterTitle": "Basic Driving Skills",
      "score": 75,
      "totalQuestions": 4
    },
    {
      "chapterTitle": "Traffic Signs",
      "score": 100,
      "totalQuestions": 5
    }
  ],
  "overallProgress": 20,
  "createdAt": "2026-04-12T11:00:00.000Z",
  "updatedAt": "2026-04-12T12:00:00.000Z"
}
```

> Note: If no progress exists yet, an empty progress document is created and returned.

---

#### `GET /api/progress/summary`

Get a calculated summary of progress with per-lesson statuses and quiz statistics.

**Auth:** Bearer Token (required)

**Request:**
```
GET /api/progress/summary
Authorization: Bearer <token>
```

**Response `200` (Success):**
```json
{
  "overallProgress": 20,
  "lessons": [
    {
      "chapterId": "664b1c2d3e4f5a6b7c8d9e0f",
      "title": "Basic Driving Skills",
      "description": "Learn the fundamental steps before and during driving.",
      "totalSubLessons": 3,
      "completedSubLessons": 3,
      "status": "Completed"
    },
    {
      "chapterId": "664b1c2d3e4f5a6b7c8d9e10",
      "title": "Traffic Signs",
      "description": "Understand the most important road signs and their meanings.",
      "totalSubLessons": 4,
      "completedSubLessons": 1,
      "status": "In Progress"
    },
    {
      "chapterId": "664b1c2d3e4f5a6b7c8d9e11",
      "title": "Road Priorities & Right of Way",
      "description": "Master who has the right of way in different traffic situations.",
      "totalSubLessons": 3,
      "completedSubLessons": 0,
      "status": "Not Started"
    },
    {
      "chapterId": "664b1c2d3e4f5a6b7c8d9e12",
      "title": "Speed Limits & Safe Following",
      "description": "Understand speed regulations and safe following distances.",
      "totalSubLessons": 3,
      "completedSubLessons": 0,
      "status": "Not Started"
    },
    {
      "chapterId": "664b1c2d3e4f5a6b7c8d9e13",
      "title": "Seat Belt Safety & Passenger Rules",
      "description": "Learn the importance of seat belts and rules for carrying passengers.",
      "totalSubLessons": 2,
      "completedSubLessons": 0,
      "status": "Not Started"
    }
  ],
  "quizStats": {
    "totalAttempts": 2,
    "lastScore": 100,
    "averageScore": 88
  }
}
```

**Response `200` (Fresh user, no activity yet):**
```json
{
  "overallProgress": 0,
  "lessons": [
    {
      "chapterId": "664b1c2d3e4f5a6b7c8d9e0f",
      "title": "Basic Driving Skills",
      "description": "Learn the fundamental steps before and during driving.",
      "totalSubLessons": 3,
      "completedSubLessons": 0,
      "status": "Not Started"
    },
    {
      "chapterId": "664b1c2d3e4f5a6b7c8d9e10",
      "title": "Traffic Signs",
      "description": "Understand the most important road signs and their meanings.",
      "totalSubLessons": 4,
      "completedSubLessons": 0,
      "status": "Not Started"
    },
    {
      "chapterId": "664b1c2d3e4f5a6b7c8d9e11",
      "title": "Road Priorities & Right of Way",
      "description": "Master who has the right of way in different traffic situations.",
      "totalSubLessons": 3,
      "completedSubLessons": 0,
      "status": "Not Started"
    },
    {
      "chapterId": "664b1c2d3e4f5a6b7c8d9e12",
      "title": "Speed Limits & Safe Following",
      "description": "Understand speed regulations and safe following distances.",
      "totalSubLessons": 3,
      "completedSubLessons": 0,
      "status": "Not Started"
    },
    {
      "chapterId": "664b1c2d3e4f5a6b7c8d9e13",
      "title": "Seat Belt Safety & Passenger Rules",
      "description": "Learn the importance of seat belts and rules for carrying passengers.",
      "totalSubLessons": 2,
      "completedSubLessons": 0,
      "status": "Not Started"
    }
  ],
  "quizStats": {
    "totalAttempts": 0,
    "lastScore": null,
    "averageScore": 0
  }
}
```

---

#### `DELETE /api/progress/reset`

Reset all progress for the authenticated user. Clears completed lessons, quiz results, and sets overall progress to 0.

**Auth:** Bearer Token (required)

**Request:**
```
DELETE /api/progress/reset
Authorization: Bearer <token>
```

**Response `200` (Success):**
```json
{
  "message": "Progress reset successfully"
}
```

**Response `404` (No progress to reset):**
```json
{
  "message": "No progress found to reset"
}
```

---

### 9.6 Assistant API

#### `POST /api/assistant/chat`

Send a message to the AI driving assistant and get a response. The AI will only answer driving-related questions.

**Auth:** Bearer Token (required)

**Request (simple question):**
```json
POST /api/assistant/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "What does a stop sign mean?"
}
```

**Response `200` (Success):**
```json
{
  "reply": "A stop sign is an octagonal (8-sided) red sign with white lettering. It requires you to bring your vehicle to a **complete stop** before the stop line, crosswalk, or intersection. You must wait until it is safe to proceed. At a four-way stop, the first vehicle to arrive has the right of way. If two vehicles arrive at the same time, the one on the right goes first."
}
```

**Request (with conversation history for context):**
```json
POST /api/assistant/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "What if two cars arrive at the same time?",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Can you explain the rules for a four-way stop?"
    },
    {
      "role": "assistant",
      "content": "At a four-way stop, the first vehicle to arrive has the right-of-way. If two vehicles arrive at the same time, the one on the right goes first."
    }
  ]
}
```

**Response `200` (Success with context):**
```json
{
  "reply": "If two cars arrive at a four-way stop at the same time, the vehicle on the **right** has the right of way. The driver on the left must yield. If you're facing each other and one is turning left while the other is going straight, the vehicle going straight has priority."
}
```

**Request (off-topic question):**
```json
POST /api/assistant/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "What is the capital of France?"
}
```

**Response `200` (Redirect to driving topics):**
```json
{
  "reply": "That's a great question, but I'm specifically designed to help with driving education! I can help you with things like traffic rules, road signs, driving exam preparation, and explaining quiz answers. Is there anything about driving you'd like to learn?"
}
```

**Response `400` (Empty message):**
```json
{
  "message": "Message is required"
}
```

**Response `503` (API key not configured):**
```json
{
  "message": "AI assistant is not configured. Please set GEMINI_API_KEY in the environment."
}
```

**Response `200` (API failure — graceful fallback):**
```json
{
  "reply": "I'm sorry, the assistant is temporarily unavailable. Please try again later."
}
```

**Response `200` (Rate limited — graceful fallback):**
```json
{
  "reply": "The assistant is receiving too many requests right now. Please try again in a moment."
}
```

---

## 10. Error Handling

### 10.1 Global Error Handler

All errors pass through `middleware/errorHandler.js`:
- **ApiError instances** return `{ message }` with the appropriate status code
- **Unhandled errors** return `500` with `{ message: "Internal server error" }`


### 10.2 Common Error Responses

| Status | Meaning | When |
|---|---|---|
| `400` | Bad Request | Missing required fields, invalid data, duplicate email, invalid MongoDB ObjectId |
| `401` | Unauthorized | Missing token, invalid token, expired token, user not found |
| `403` | Forbidden | Non-admin trying to access admin-only endpoints |
| `404` | Not Found | Resource (lesson, quiz, progress) not found, or unknown route |
| `500` | Internal Server Error | Unhandled server errors |
| `503` | Service Unavailable | Gemini API key not configured |

### 10.3 Invalid ObjectId

When an invalid MongoDB ObjectId is passed (e.g., `GET /api/lessons/not-a-valid-id`):
```json
{
  "message": "Invalid _id: not-a-valid-id"
}
```
Status: `400`

### 10.4 404 Catch-All

Any request to a route that doesn't exist returns:
```json
{
  "message": "Route not found"
}
```

---

## 11. Seed Data

Run `npm run seed` to populate the database with demo data.

### What gets seeded:

**2 Users:**
| Name | Email | Password | Role |
|---|---|---|---|
| Student User | `student@driving.com` | `student123` | student |
| Admin User | `admin@driving.com` | `admin123` | admin |

**5 Chapters (15 sub-lessons total):**

| # | Chapter | Sub-lessons |
|---|---|---|
| 1 | Basic Driving Skills | Getting into the Car, Starting the Car, Basic Vehicle Controls |
| 2 | Traffic Signs | Warning Signs, Mandatory Signs, Prohibitory Signs, Informational Signs |
| 3 | Road Priorities & Right of Way | Priority at Intersections, Pedestrian Priority, Emergency Vehicles |
| 4 | Speed Limits & Safe Following | Speed Limit Rules, Safe Following Distance, Driving in Bad Weather |
| 5 | Seat Belt Safety & Passenger Rules | Seat Belt Laws, Child Safety Seats |

**22 Quiz Questions:**

| Chapter | Easy | Medium | Hard | Total |
|---|---|---|---|---|
| Basic Driving Skills | 3 | 1 | 0 | 4 |
| Traffic Signs | 3 | 2 | 0 | 5 |
| Road Priorities & Right of Way | 2 | 2 | 0 | 4 |
| Speed Limits & Safe Following | 2 | 2 | 1 | 5 |
| Seat Belt Safety & Passenger Rules | 1 | 2 | 1 | 4 |
| **Total** | **11** | **9** | **2** | **22** |

> Note: The seed script **clears all existing data** (users, lessons, quizzes) before inserting. Progress data is NOT cleared by the seed script.

---

## 12. How to Run

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Google Gemini API key (free from Google AI Studio)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Create .env file from the template
cp .env.example .env

# 3. Edit .env with your values:
#    - MONGO_URI (your MongoDB connection string)
#    - JWT_SECRET (any secure random string)
#    - GEMINI_API_KEY (from https://aistudio.google.com/apikey)

# 4. Seed the database with demo data
npm run seed

# 5. Start the development server
npm run dev
```

### Available Scripts

| Command | Description |
|---|---|
| `npm start` | Start the server (production) |
| `npm run dev` | Start with nodemon (auto-restart on changes) |
| `npm run seed` | Seed the database with demo data |

### URLs

| URL | Description |
|---|---|
| `http://localhost:3000` | API health check |
| `http://localhost:3000/api-docs` | Swagger UI (interactive API documentation) |
| `http://localhost:3000/api-docs.json` | Raw OpenAPI JSON spec |

### Quick Test Flow

1. Open `http://localhost:3000/api-docs`
2. Use `POST /api/auth/login` with `student@driving.com` / `student123`
3. Copy the `token` from the response
4. Click "Authorize" in Swagger UI and paste the token
5. Now you can test all protected endpoints
