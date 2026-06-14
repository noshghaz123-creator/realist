# REALIST – Real Estate Lead Platform

A full-stack clone of [REALIST](https://realist-system-pink.vercel.app) built with **React**, **Node.js**, and **MongoDB**.

## Features

- Landing page with live marketplace preview, pricing, testimonials
- Auth (login/signup) with demo accounts
- **Buyer Dashboard**: Overview, Browse Leads, My Leads (CRM), Favourites, Pricing, Profile, Settings, Notifications
- **Admin Dashboard**: Stats, Manage Leads, Users, Plans, Teams
- **Team Dashboard**: Lead management and verification
- ARV Calculator, About, Contact, and other static pages

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 19, Vite, Tailwind CSS v4     |
| Backend  | Node.js, Express 5                |
| Database | MongoDB (Mongoose)                  |
| Auth     | JWT + bcrypt                        |

## Prerequisites

- Node.js 18+
- MongoDB running locally, MongoDB Atlas URI, **or** leave `MONGODB_URI` empty to use built-in in-memory MongoDB for dev

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run seed    # seed demo data
npm run dev     # http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev     # http://localhost:5173
```

## Demo Accounts

| Role  | Email             | Password |
|-------|-------------------|----------|
| Buyer | alex@realist.com  | demo123  |
| Admin | admin@realist.com | demo123  |
| Team  | team@realist.com  | demo123  |

## API Endpoints

- `POST /api/auth/login` – Login
- `POST /api/auth/register` – Register
- `GET /api/leads` – Browse leads (auth)
- `GET /api/leads/public` – Public leads for homepage
- `POST /api/leads/:id/purchase` – Purchase/unlock lead
- `GET /api/purchases/my` – My purchased leads
- `GET /api/admin/stats` – Admin dashboard stats

## Project Structure

```
real-estate/
├── backend/
│   ├── models/       # User, Lead, Purchase, Notification
│   ├── routes/       # API routes
│   ├── middleware/   # JWT auth
│   └── seed.js       # Demo data
└── frontend/
    └── src/
        ├── pages/    # All pages
        ├── components/
        └── context/  # Auth context
```
