# Real Estate Admin Panel

A Next.js admin panel for managing rental properties.

## Prerequisites

- Node.js 18+
- npm or yarn
- Backend server running (see `/backend` folder)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create `.env.local` file (already created):

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

### 3. Start the development server

```bash
npm run dev
```

### 4. Open in browser

Navigate to http://localhost:3000

## Features

- **Dashboard**: Overview of rental statistics
- **Rentals Management**: CRUD operations for rental properties
- **Image Upload**: Upload and manage property images
- **Status Management**: Update listing status (Active, Pending, Rented, Inactive)
- **Search & Filter**: Search rentals by various criteria

## Project Structure

```
realadmin/
├── app/
│   ├── page.tsx              # Dashboard
│   ├── layout.tsx            # Root layout with sidebar
│   ├── analytics/
│   │   └── page.tsx          # Analytics page
│   ├── rentals/
│   │   ├── page.tsx          # Rentals list
│   │   ├── new/
│   │   │   └── page.tsx      # Create rental form
│   │   └── [id]/
│   │       ├── page.tsx      # Rental detail view
│   │       └── edit/
│   │           └── page.tsx  # Edit rental form
│   └── settings/
│       └── page.tsx          # Settings page
├── components/
│   └── Sidebar.tsx           # Navigation sidebar
├── lib/
│   └── api.ts                # API client functions
└── .env.local                # Environment variables
```

## Running with Backend

1. Start the Spring Boot backend:
   ```bash
   cd ../backend
   ./mvnw spring-boot:run
   ```

2. Start the admin panel:
   ```bash
   npm run dev
   ```

3. Open http://localhost:3000 in your browser

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **Icons**: Heroicons
- **Language**: TypeScript
