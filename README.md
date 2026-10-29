# 📸 PhotoDay - AI-Powered Event Photography & Guest Face Recognition Platform

[![Node.js](https://img.shields.io/badge/Node.js-18+-68A063?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![Prisma](https://img.shields.io/badge/Prisma-5.10-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)
[![BullMQ](https://img.shields.io/badge/BullMQ-Queue-orange?style=for-the-badge)](https://bullmq.io)
[![Qdrant](https://img.shields.io/badge/Qdrant-Vector_DB-DC2626?style=for-the-badge&logo=qdrant&logoColor=white)](https://qdrant.tech)
[![TensorFlow](https://img.shields.io/badge/TensorFlow_WASM-4.22-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)](https://www.tensorflow.org/js)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Media_CDN-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com)

**PhotoDay** is an end-to-end event photography platform that empowers photographers to manage events and upload hundreds of high-res photos, while allowing guests to instantly discover **only their photos** by simply scanning an event QR code and uploading a single selfie.

The system features client-server decoupling, asynchronous queue processing via **BullMQ + Redis**, on-the-fly 128-dimensional facial embedding generation using **TensorFlow.js WASM + Face-API**, and high-dimensional vector similarity indexing via **Qdrant Vector Database**.

---

## 📑 Table of Contents
1. [Key Features](#-key-features)
2. [System Architecture](#-system-architecture)
3. [Tech Stack](#-tech-stack)
4. [Project Directory Structure](#-project-directory-structure)
5. [Environment Variables](#-environment-variables)
6. [Complete Backend API Documentation](#-complete-backend-api-documentation)
   - [1. Authentication Endpoints](#1-authentication-endpoints)
   - [2. Event Management Endpoints](#2-event-management-endpoints)
   - [3. Photo Management Endpoints](#3-photo-management-endpoints)
   - [4. Public Guest Gallery & Face Recognition Endpoints](#4-public-guest-gallery--face-recognition-endpoints)
7. [AI Face Recognition Pipeline](#-ai-face-recognition-pipeline)
8. [Local Development Setup](#-local-development-setup)
9. [Deployment Guide](#-deployment-guide)
10. [Testing with Bruno / Postman](#-testing-with-bruno--postman)

---

## ✨ Key Features

### 👨‍🎨 For Photographers
- **Secure Authentication**: JWT-based authentication with bcrypt password hashing.
- **Event Lifecycle Management**: Create, view, manage, and toggle privacy (Public / Private) of events.
- **Batch Photo Upload**: Upload up to 15 high-res photos concurrently (up to 10MB each).
- **Asynchronous AI Worker**: Background image downloading, face landmark detection, and vector embedding calculation without blocking HTTP requests.
- **Dynamic QR Code Generation**: Instant branded QR code generator pointing to the public guest portal.
- **Real-time AI Processing Badges**: Monitor photo status (`PENDING`, `PROCESSING`, `COMPLETED`, `NO_FACE`, `FAILED`).

### 🤳 For Event Guests
- **Zero Friction Access**: No app installation or registration needed. Guests scan the event QR code or open a shareable link.
- **Selfie AI Face Finder**: Upload a single selfie to find all matching photos within seconds.
- **Full Public Gallery**: Browse all public event photos with an immersive lightbox viewer.
- **Direct High-Res Downloads**: Save single photos or batch download matched memories.

---

## 🏛 System Architecture

```
                                  ┌────────────────────────┐
                                  │      Vite React UI     │
                                  │ (Photographer & Guest) │
                                  └───────────┬────────────┘
                                              │ HTTP / JSON / Multipart
                                              ▼
                                  ┌────────────────────────┐
                                  │   Express REST API     │
                                  │    (Node.js Server)    │
                                  └─────┬──────────────┬───┘
                                        │              │
                   ┌────────────────────┴──┐        ┌──┴──────────────────┐
                   ▼                       ▼        ▼                     ▼
          ┌─────────────────┐    ┌─────────────┐ ┌─────────────┐ ┌────────────────┐
          │ PostgreSQL (DB) │    │ Cloudinary  │ │ Redis Queue │ │  Qdrant Cloud  │
          │  (Prisma ORM)   │    │ (Image CDN) │ │  (BullMQ)   │ │  (Vector DB)   │
          └─────────────────┘    └─────────────┘ └──────┬──────┘ └───────▲────────┘
                                                        │                │
                                                        ▼                │ Cosine Search
                                                ┌──────────────┐         │ (128-d Vector)
                                                │  AI Worker   ├─────────┘
                                                │ (TFJS WASM)  │
                                                └──────────────┘
```

---

## 💻 Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + Vite 6 | Lightning-fast SPA with reactive state |
| **Routing** | React Router v7 | Client-side nested routes and public portals |
| **Styling** | Modern CSS / Tailwind | Responsive glassmorphism UI with dark theme accents |
| **Backend Framework** | Node.js + Express 4.x | Modular REST API with centralized error handling |
| **Database & ORM** | PostgreSQL + Prisma 5.x | Fully-typed relational schema and migrations |
| **Queue System** | BullMQ + Redis / ioredis | Fault-tolerant background job queue with auto-retries |
| **Face AI Engine** | TensorFlow.js WASM + Face-API | CPU/WASM accelerated SSD MobileNet & 68 Landmarks |
| **Vector Database** | Qdrant v1.13+ | 128-dimensional Cosine vector index with payload filters |
| **Image Processing** | Sharp + Multer | Raw image memory buffering and format conversions |
| **Cloud Storage** | Cloudinary SDK v2 | Secure cloud image storage and CDN delivery |
| **Testing** | Bruno API Collection | Complete automated API test suite |

---

## 📂 Project Directory Structure

```text
photoday/
├── backend/
│   ├── models/                          # Pre-trained Face-API neural network weights
│   │   ├── ssd_mobilenetv1_model.bin
│   │   ├── face_recognition_model.bin
│   │   └── face_landmark_68_model.bin
│   ├── prisma/
│   │   ├── migrations/                  # SQL migration history
│   │   └── schema.prisma                # Prisma Database Schema
│   ├── src/
│   │   ├── config/                      # Database, Redis, Cloudinary, Qdrant configs
│   │   ├── controllers/                 # Express route controllers
│   │   ├── middleware/                  # JWT auth, error handlers, upload filters
│   │   ├── queues/                      # BullMQ face processing queue
│   │   ├── routes/                      # Route definitions (auth, event, photo, public)
│   │   ├── services/                    # Business logic, Qdrant, Face AI, Cloudinary
│   │   ├── utils/                       # QR code and helper utilities
│   │   ├── workers/                     # Background AI face embedding worker
│   │   ├── app.js                       # Express app configuration
│   │   └── server.js                    # Server bootstrapping and lifecycle
│   ├── .env.example                     # Environment template
│   └── package.json
├── frontend/
│   ├── public/                          # Static assets and SPA redirect rules
│   │   └── _redirects                   # Netlify SPA rewrite
│   ├── src/
│   │   ├── api/                         # Axios API clients
│   │   ├── components/                  # Navbar, Modals, Lightbox, Cards
│   │   ├── context/                     # Auth state provider
│   │   ├── pages/                       # Login, Register, Events, Guest Gallery
│   │   ├── App.jsx                      # App route switches
│   │   └── main.jsx
│   ├── vercel.json                      # Vercel SPA routing configuration
│   ├── vite.config.js                   # Vite config and proxy setup
│   └── package.json
├── bruno/                               # Complete Bruno API test collection
├── docker-compose.yml                   # Local Redis & Qdrant container definitions
└── README.md
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `PORT` | No | Backend HTTP port (default: 5000) | `5000` |
| `NODE_ENV` | No | Application environment | `production` / `development` |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string | `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | **Yes** | Secret key for signing auth tokens | `super_secret_jwt_random_key_12345` |
| `CLOUDINARY_CLOUD_NAME` | **Yes** | Cloudinary cloud name | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | **Yes** | Cloudinary API key | `123456789012345` |
| `CLOUDINARY_API_SECRET` | **Yes** | Cloudinary API secret | `abcdefghijklmnopqrstuvwx` |
| `REDIS_URL` | **Yes** (Cloud) | Complete Redis connection URL | `rediss://default:pass@redis-xxx.upstash.io:6379` |
| `REDIS_HOST` | Optional | Redis host for local dev | `localhost` |
| `REDIS_PORT` | Optional | Redis port for local dev | `6379` |
| `REDIS_PASSWORD` | Optional | Redis password for local dev | `` |
| `QDRANT_URL` | **Yes** | Qdrant host or Cloud cluster URL | `https://xxx.cloud.qdrant.io:6333` |
| `QDRANT_API_KEY` | Cloud | Qdrant Cloud API key | `your_qdrant_api_key` |
| `QDRANT_COLLECTION_NAME`| No | Vector collection name (default: `photoday_faces`) | `photoday_faces` |
| `START_WORKER` | No | Starts worker inside server process (default: `true`) | `true` |

### Frontend (`frontend/.env`)

| Variable | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | **Yes** (Prod) | Base URL of the backend API | `https://photoday-backend.onrender.com/api` |

---

## 📡 Complete Backend API Documentation

Base URL: `/api`  
All authenticated endpoints require an `Authorization: Bearer <JWT_TOKEN>` header.

---

### 1. Authentication Endpoints

#### 1.1 Register Photographer
Creates a new photographer user account.

- **URL**: `POST /api/auth/register`
- **Access**: Public
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```
- **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "Photographer registered successfully.",
  "data": {
    "id": "c1a8bf92-4f81-420a-b31c-32b56fd97d82",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "PHOTOGRAPHER",
    "createdAt": "2026-09-08T12:00:00.000Z"
  }
}
```
- **Error Response (409 Conflict)**:
```json
{
  "success": false,
  "message": "An account with this email already exists."
}
```

---

#### 1.2 Login Photographer
Authenticates credentials and issues a JWT token.

- **URL**: `POST /api/auth/login`
- **Access**: Public
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "c1a8bf92-4f81-420a-b31c-32b56fd97d82",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "PHOTOGRAPHER"
    }
  }
}
```
- **Error Response (401 Unauthorized)**:
```json
{
  "success": false,
  "message": "Invalid email or password."
}
```

---

#### 1.3 Get Current User Profile
Fetches current logged-in photographer profile.

- **URL**: `GET /api/auth/me`
- **Access**: Private (`Bearer <token>`)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "c1a8bf92-4f81-420a-b31c-32b56fd97d82",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "PHOTOGRAPHER",
    "createdAt": "2026-09-08T12:00:00.000Z"
  }
}
```

---

### 2. Event Management Endpoints

#### 2.1 Create Event
Creates a new event owned by the authenticated photographer.

- **URL**: `POST /api/events`
- **Access**: Private (`Bearer <token>`)
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "name": "Annual Gala Night 2026",
  "date": "2026-10-15T18:00:00.000Z",
  "location": "Grand Palace, Mumbai",
  "description": "Annual photography and cultural celebration night."
}
```
- **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "Event created successfully.",
  "data": {
    "id": "e4f8d9b1-382a-4467-b50a-e2759e51c890",
    "name": "Annual Gala Night 2026",
    "date": "2026-10-15T18:00:00.000Z",
    "location": "Grand Palace, Mumbai",
    "description": "Annual photography and cultural celebration night.",
    "isPublic": false,
    "photographerId": "c1a8bf92-4f81-420a-b31c-32b56fd97d82",
    "createdAt": "2026-09-08T12:30:00.000Z"
  }
}
```

---

#### 2.2 Get All My Events
Retrieves all events created by the logged-in photographer with aggregated photo count.

- **URL**: `GET /api/events`
- **Access**: Private (`Bearer <token>`)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "e4f8d9b1-382a-4467-b50a-e2759e51c890",
      "name": "Annual Gala Night 2026",
      "date": "2026-10-15T18:00:00.000Z",
      "location": "Grand Palace, Mumbai",
      "description": "Annual photography and cultural celebration night.",
      "isPublic": true,
      "createdAt": "2026-09-08T12:30:00.000Z",
      "_count": {
        "photos": 142
      }
    }
  ]
}
```

---

#### 2.3 Get Single Event Details
Retrieves detailed information and statistics of an event.

- **URL**: `GET /api/events/:eventId`
- **Access**: Private (`Bearer <token>`)
- **URL Parameters**: `eventId` (UUID)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "e4f8d9b1-382a-4467-b50a-e2759e51c890",
    "name": "Annual Gala Night 2026",
    "date": "2026-10-15T18:00:00.000Z",
    "location": "Grand Palace, Mumbai",
    "description": "Annual photography and cultural celebration night.",
    "isPublic": true,
    "createdAt": "2026-09-08T12:30:00.000Z",
    "_count": {
      "photos": 142
    }
  }
}
```

---

#### 2.4 Toggle Event Public Status
Enables or disables guest public access to the event.

- **URL**: `PATCH /api/events/:eventId/public`
- **Access**: Private (`Bearer <token>`)
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "isPublic": true
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Event public access enabled.",
  "data": {
    "id": "e4f8d9b1-382a-4467-b50a-e2759e51c890",
    "isPublic": true
  }
}
```

---

#### 2.5 Generate Event QR Code
Generates a Base64 QR code Data URL linking directly to the public guest portal.

- **URL**: `GET /api/events/:eventId/qr`
- **Access**: Private (`Bearer <token>`)
- **Query Parameters**: `origin` (Optional frontend base URL, e.g. `https://photoday.vercel.app`)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "eventId": "e4f8d9b1-382a-4467-b50a-e2759e51c890",
    "publicUrl": "https://photoday.vercel.app/public/events/e4f8d9b1-382a-4467-b50a-e2759e51c890",
    "qrCodeDataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAAFA...",
    "isPublic": true
  }
}
```

---

### 3. Photo Management Endpoints

#### 3.1 Upload Batch Photos
Uploads up to 15 photos in a single request. Photos are streamed to Cloudinary, saved in DB as `PENDING`, and queued into BullMQ for AI face detection.

- **URL**: `POST /api/events/:eventId/photos`
- **Access**: Private (`Bearer <token>`)
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `photos`: Files array (JPEG/PNG/WebP, max 10MB per file, max 15 files)
- **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "Photos uploaded successfully.",
  "data": [
    {
      "id": "a12f94b3-04e8-466d-8857-e6a6449195e3",
      "eventId": "e4f8d9b1-382a-4467-b50a-e2759e51c890",
      "imageUrl": "https://res.cloudinary.com/demo/image/upload/v12345/photoday/abc.jpg",
      "cloudinaryPublicId": "photoday/abc",
      "aiStatus": "PENDING",
      "aiError": null,
      "processedAt": null,
      "createdAt": "2026-09-08T13:00:00.000Z"
    }
  ]
}
```

---

#### 3.2 Get Event Photos
Returns all photos uploaded to an event with their current AI status.

- **URL**: `GET /api/events/:eventId/photos`
- **Access**: Private (`Bearer <token>`)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "a12f94b3-04e8-466d-8857-e6a6449195e3",
      "imageUrl": "https://res.cloudinary.com/demo/image/upload/v12345/photoday/abc.jpg",
      "aiStatus": "COMPLETED",
      "aiError": null,
      "processedAt": "2026-09-08T13:00:04.000Z",
      "createdAt": "2026-09-08T13:00:00.000Z"
    }
  ]
}
```

---

#### 3.3 Delete Photo
Deletes a photo from Cloudinary storage, cleans up its facial vector points from Qdrant, and removes the database record.

- **URL**: `DELETE /api/photos/:photoId`
- **Access**: Private (`Bearer <token>`)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Photo deleted successfully."
}
```

---

### 4. Public Guest Gallery & Face Recognition Endpoints

#### 4.1 Get Public Event Information
Public metadata for guests to view event name, date, venue, and cover photo.

- **URL**: `GET /api/public/events/:eventId`
- **Access**: Public (Requires event `isPublic: true`)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "e4f8d9b1-382a-4467-b50a-e2759e51c890",
    "name": "Annual Gala Night 2026",
    "date": "2026-10-15T18:00:00.000Z",
    "location": "Grand Palace, Mumbai",
    "description": "Annual photography and cultural celebration night.",
    "isPublic": true,
    "coverImageUrl": "https://res.cloudinary.com/demo/image/upload/v12345/photoday/cover.jpg",
    "photographer": {
      "id": "c1a8bf92-4f81-420a-b31c-32b56fd97d82",
      "name": "John Doe"
    },
    "createdAt": "2026-09-08T12:30:00.000Z"
  }
}
```
- **Error Response (403 Forbidden)**:
```json
{
  "success": false,
  "message": "This event is currently unavailable."
}
```

---

#### 4.2 Get Public Event Photo Gallery
Fetches all photos in the event for public viewing and downloads.

- **URL**: `GET /api/public/events/:eventId/photos`
- **Access**: Public (Requires event `isPublic: true`)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "a12f94b3-04e8-466d-8857-e6a6449195e3",
      "imageUrl": "https://res.cloudinary.com/demo/image/upload/v12345/photoday/abc.jpg",
      "createdAt": "2026-09-08T13:00:00.000Z"
    }
  ]
}
```

---

#### 4.3 Match Event Photos with Guest Selfie 🤖
Processes a single guest selfie, extracts 128-dimensional facial embeddings, and performs vector cosine similarity search in Qdrant restricted strictly to the event.

- **URL**: `POST /api/public/events/:eventId/match`
- **Access**: Public (Requires event `isPublic: true`)
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `selfie`: Single image file (JPEG/PNG/WebP, max 5MB)
- **Success Response (200 OK - Matches Found)**:
```json
{
  "success": true,
  "count": 2,
  "photos": [
    {
      "id": "a12f94b3-04e8-466d-8857-e6a6449195e3",
      "imageUrl": "https://res.cloudinary.com/demo/image/upload/v12345/photoday/abc.jpg",
      "matchScore": 0.9421,
      "createdAt": "2026-09-08T13:00:00.000Z"
    },
    {
      "id": "b89a42c1-11d2-4309-8812-f12345678901",
      "imageUrl": "https://res.cloudinary.com/demo/image/upload/v12345/photoday/xyz.jpg",
      "matchScore": 0.8876,
      "createdAt": "2026-09-08T13:05:00.000Z"
    }
  ]
}
```
- **Success Response (200 OK - No Matches)**:
```json
{
  "success": true,
  "count": 0,
  "photos": [],
  "message": "No matching photos found in this event."
}
```
- **Error Response (400 Bad Request - No face in selfie)**:
```json
{
  "success": false,
  "message": "No face detected. Please upload a clear selfie."
}
```

---

## 🧠 AI Face Recognition Pipeline

```
┌─────────────┐     Sharp Buffer     ┌────────────────────────┐
│ Guest Selfie│ ───────────────────► │ Face Detection         │
│  or Photo   │                      │ (SSD MobileNet V1)     │
└─────────────┘                      └───────────┬────────────┘
                                                 │ Bounding Box + Landmarks
                                                 ▼
                                     ┌────────────────────────┐
                                     │ Face Recognition Net   │
                                     │ (128-d Vector Tensor)  │
                                     └───────────┬────────────┘
                                                 │ Vector [0.12, -0.45, ...]
                                                 ▼
                                     ┌────────────────────────┐
                                     │ Qdrant Vector Engine   │
                                     │ Cosine Metric >= 0.60  │
                                     │ Filter: eventId == X   │
                                     └────────────────────────┘
```

1. **Detection**: Detects all human faces in image using SSD MobileNet V1.
2. **Landmarking**: Identifies 68 facial landmark coordinates for alignment and tilt correction.
3. **Embedding**: Computes a normalized 128-dimensional mathematical vector representing facial features.
4. **Vector Storage / Indexing**:
   - Each face is assigned a deterministic `UUIDv5` point ID.
   - Vector is stored in Qdrant with payload: `{ photoId, eventId, photographerId, imageUrl }`.
5. **Search**: Guest selfie embedding is matched against all vectors with strict filter `eventId == targetEventId` and threshold `cosine >= 0.60`.

---

## 🛠 Local Development Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm
- Docker & Docker Compose (for local Redis & Qdrant)

### 1. Clone the repository
```bash
git clone https://github.com/pooja701691/photodayyy.git
cd photodayyy
```

### 2. Start local Redis & Qdrant containers
```bash
docker-compose up -d
```
This boots up:
- **Redis**: `localhost:6379`
- **Qdrant**: `localhost:6333` / Web Dashboard at `http://localhost:6333/dashboard`

### 3. Setup Backend
```bash
cd backend
npm install
```

Create `backend/.env` from `.env.example` and configure your PostgreSQL and Cloudinary credentials:
```env
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/photoday"
JWT_SECRET="dev_secret_key_123"
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
REDIS_HOST="localhost"
REDIS_PORT=6379
QDRANT_URL="http://localhost:6333"
```

Run database migrations:
```bash
npx prisma migrate dev --name init
```

Start the backend server (starts Express & AI worker concurrently):
```bash
npm run dev
```

### 4. Setup Frontend
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Visit `http://localhost:5173` in your browser!

---

## 🚀 Deployment Guide

### Free Cloud Stack
| Component | Platform | Free Tier |
| :--- | :--- | :--- |
| **Frontend** | [Vercel](https://vercel.com) | Unlimited deployments, global edge CDN |
| **Backend & Worker** | [Render](https://render.com) | Free Web Service (Node.js) |
| **Database** | [Neon](https://neon.tech) | 500MB free serverless PostgreSQL |
| **Redis Queue** | [Upstash](https://upstash.com) | Serverless Redis (10,000 commands/day free) |
| **Vector Database** | [Qdrant Cloud](https://cloud.qdrant.io) | Free 1GB RAM forever cluster |
| **Image Storage** | [Cloudinary](https://cloudinary.com) | Free 25 credits/month |

### Quick Deployment Steps
1. **Database**: Create database at [neon.tech](https://neon.tech) -> copy connection string -> run `npx prisma db push`.
2. **Redis**: Create free database at [upstash.com](https://upstash.com) -> copy `rediss://...` URL.
3. **Qdrant**: Create free cluster at [cloud.qdrant.io](https://cloud.qdrant.io) -> copy cluster URL & API key.
4. **Backend on Render**:
   - New **Web Service** -> Link GitHub repository.
   - Root directory: `backend`
   - Build Command: `npm install && npx prisma generate`
   - Start Command: `node src/server.js`
   - Add environment variables (`DATABASE_URL`, `REDIS_URL`, `QDRANT_URL`, `QDRANT_API_KEY`, Cloudinary keys, etc.).
5. **Frontend on Vercel**:
   - New **Project** -> Link GitHub repository.
   - Root directory: `frontend`
   - Build Command: `npm run build`
   - Output directory: `dist`
   - Add Environment Variable: `VITE_API_URL=https://<your-render-backend-url>/api`
   - Click **Deploy**!

---

## 🧪 Testing with Bruno / Postman

This repository includes a pre-configured [Bruno](https://www.usebruno.com) API collection in the `/bruno` directory.

1. Download and open **Bruno**.
2. Click **Open Collection** and select the `bruno/` directory.
3. Select the **Local** environment (configured for `http://localhost:5000/api`).
4. Execute requests in sequence:
   - `auth/1-register` -> Registers photographer.
   - `auth/2-login` -> Saves JWT token automatically into environment.
   - `events/*` -> Create and fetch events.
   - `photos/*` -> Batch upload photos.
   - `public-events/*` -> Guest gallery & selfie face-matching.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
