# TaiwanStay Frontend

This is the frontend for TaiwanStay, a work exchange platform connecting travelers with hosts in Taiwan.
It is built with **Next.js 13+ (App Router)**, **Shadcn UI**, and **Tailwind CSS**.

## Prerequisites

- Node.js 18+
- Go 1.21+ (for the backend)
- MongoDB (local or Atlas)

## Getting Started

### 1. Setup Backend

Ensure your Go backend is running. By default, it runs on `http://localhost:8080`.

```bash
cd ../taiwanstay-back
make run
```

### 2. Setup Frontend Environment

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and ensure `NEXT_PUBLIC_API_URL` points to your backend:

```properties
# Go Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth (Get these from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `app/`: Next.js App Router pages and layouts.
- `components/`: React components (Shadcn UI in `ui/`, others in `common/`, `layout/`, etc.).
- `lib/`: Utility functions and API clients (`api.ts`, `auth.ts`).
- `types/`: TypeScript type definitions (extracted from backend models).
- `styles/`: Global styles and Tailwind configuration.

## Features

- **Authentication**: Google OAuth & Email/Password (via Go Backend).
- **Opportunities**: Browse, search, and filter work exchange opportunities.
- **Host Dashboard**: Manage your listings and applications.
- **Image Upload**: Upload images via backend proxy (GCS + Vision AI).
