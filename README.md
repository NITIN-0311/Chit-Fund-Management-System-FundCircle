# Chit Fund Management System

A full-stack Chit Fund Management application built with:
- Frontend: React + Vite
- Backend API: Node.js + Express
- Calculation service: Python + FastAPI
- Database: PostgreSQL

## Features Implemented

- Member registration and profile management
- Chit group creation with amount, duration, and status
- Member assignment to groups
- Monthly contribution recording with payment mode and notes
- Eligibility and pending due calculation
- Auction scheduling and completion with payout computation
- Admin dashboard summary metrics
- Member-wise statement generation
- Authentication with role support (`ADMIN`, `MEMBER`)
- Responsive frontend with tables and charts

## Project Structure

- `backend/`: Express API and business logic
- `python-service/`: FastAPI calculation microservice
- `frontend/`: React dashboard and forms UI
- `database/`: PostgreSQL schema and sample seed

## 1. Database Setup (PostgreSQL)

1. Create a PostgreSQL database, for example `chit_fund_db`.
2. Run schema SQL:

```sql
\i database/schema.sql
```

3. Optionally load sample records:

```sql
\i database/seed.sql
```

## 2. Backend Setup (Node.js)

1. Navigate to backend:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create environment file:

```bash
copy .env.example .env
```

4. Update `.env` values for your PostgreSQL connection and JWT secret.

5. Start backend:

```bash
npm run dev
```

Backend runs on `http://localhost:5000` by default.

## 3. Python Calculation Service Setup

1. Navigate to Python service:

```bash
cd python-service
```

2. Create and activate a virtual environment (recommended), then install packages:

```bash
pip install -r requirements.txt
```

3. Start FastAPI service:

```bash
uvicorn app:app --reload --port 8001
```

Service runs on `http://localhost:8001`.

## 4. Frontend Setup (React)

1. Navigate to frontend:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Create frontend environment file:

```bash
copy .env.example .env
```

4. Start frontend:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Main API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/members`
- `POST /api/members`
- `GET /api/groups`
- `POST /api/groups`
- `POST /api/groups/:groupId/members`
- `GET /api/contributions`
- `POST /api/contributions`
- `GET /api/auctions`
- `POST /api/auctions`
- `POST /api/auctions/:auctionId/complete`
- `GET /api/dashboard/summary`
- `GET /api/dashboard/statement/me`
- `GET /api/dashboard/statement/member/:memberId`

## Optional Enhancements (Not Yet Implemented)

- Email notification workflow for due reminders and auction results
- PDF export endpoint for statements

These can be added incrementally on top of this foundation.
