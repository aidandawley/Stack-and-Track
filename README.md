Stack and Track

A full-stack Pokémon TCG collection manager built with React, TypeScript, Firebase, and Spring Boot.
Link:
Note: May take up to 2 minutes to load the back-end.
Overview:https://stack-and-track-77f80.web.app/login

Stack and Track is a modern web application that allows users to search, view, and manage Pokémon card collections securely.
It integrates a TypeScript React frontend with a Spring Boot backend and uses Firebase for authentication and data storage.
Each user’s data is scoped and verified using Firebase ID tokens, ensuring secure, authenticated access to Firestore.

Features

Secure Google sign-in via Firebase Authentication

Real-time Firestore persistence for user collections

Search and add Pokémon cards through the Pokémon TCG API

Token-verified API routes between frontend and backend

Fully deployed using Firebase Hosting (frontend) and Render (backend)

Architecture
Layer	Technology
Frontend	React (Vite) · TypeScript · React Router · Firebase Web SDK
Backend	Spring Boot 3.5 · Java 17 · Firebase Admin SDK · Firestore
Hosting	Firebase Hosting · Render
External API	Pokémon TCG API (proxied via Cloudflare Worker)
Authentication Flow

The user signs in with Google through Firebase Authentication.

The frontend obtains a Firebase ID token for the active user.

Each backend API request includes this token in the Authorization: Bearer <token> header.

The Spring Boot backend verifies the token with Firebase Admin SDK before allowing database actions.

This architecture ensures secure, user-specific data access across the stack.

Environment Configuration
Frontend (.env.local)
VITE_API_BASE_URL=https://stack-and-track.onrender.com
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=stack-and-track-77f80.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=stack-and-track-77f80
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id

Backend (Render Environment Variables)
GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/firebase-service-account.json

Project Structure
stack-and-track/
├── server/
│   ├── src/main/java/com/stacktrack/
│   │   ├── api/             # Controllers (Collections, Search)
│   │   ├── collections/     # Firestore models and services
│   │   └── security/        # Firebase and Spring Security configuration
│   ├── Dockerfile
│   └── application.properties
│
├── web/
│   ├── src/
│   │   ├── pages/           # React pages (Home, Collections, etc.)
│   │   ├── auth/            # AuthProvider and Firebase integration
│   │   ├── lib/             # Firebase initialization
│   │   └── main.tsx
│   ├── public/
│   └── vite.config.ts
│
└── README.md

Local Development
Frontend
cd web
npm install
npm run dev


Access the frontend at http://localhost:5173
.

Backend
cd server
./mvnw spring-boot:run


API will run at http://localhost:8080
.
