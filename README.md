# Smart Driving Learning Platform - Backend

## Description

This project is the backend for the Smart Driving Learning Platform.
It provides RESTful APIs for authentication, lessons, quizzes, and user progress tracking.

---

## Setup

Install dependencies:

npm install

Create your environment file from the example:

copy .env.example .env

---

## Run

Start the server in development mode:

npm run dev

Or start normally:

npm start

---

## Environment Variables

Create a .env file in the root directory and add the following:

PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key

For local MongoDB development you can use:

MONGO_URI=mongodb://127.0.0.1:27017/smart-driving-learning-platform

---

## API Documentation

After running the server, open the following URL in your browser:

http://localhost:3000/api-docs

---

## Tech Stack

Node.js
Express.js
MongoDB
Mongoose
JWT Authentication
Swagger

---

## Author

Ahmad Atiat
