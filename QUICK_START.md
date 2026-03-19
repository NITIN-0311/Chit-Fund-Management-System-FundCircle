# Quick Start Guide - 5 Minutes

Get the Chit Fund Management System running in minutes.

## All-in-One Quick Start (Windows)

### Step 1: Database (2 minutes)

```bash
# Assuming PostgreSQL is installed and running
psql -U postgres -f d:\AAATemp\database\schema.sql
```

### Step 2: Python Service (1 minute)

```bash
cd d:\AAATemp\python-service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
# Terminal 1: Python service running on http://localhost:8001
```

### Step 3: Backend (1 minute)

```bash
cd d:\AAATemp\backend
npm install
npm run dev
# Terminal 2: Backend running on http://localhost:5000
```

### Step 4: Frontend (1 minute)

```bash
cd d:\AAATemp\frontend
npm install
npm run dev
# Terminal 3: Frontend running on http://localhost:3000
```

## That's it! 🎉

Open browser to: **http://localhost:3000**

## Demo Credentials

```
Admin:   admin@chit.com / password123
Member:  member@chit.com / password123
```

## Verify Everything Works

1. **Frontend loads**: http://localhost:3000
2. **Can login**: Try admin or member credentials
3. **Can see dashboard**: Admin dashboard or member dashboard
4. **API working**: Contributions, auctions pages load

## Troubleshooting Quick Fixes

### Port Already in Use
```bash
# Kill process using port 5000 (backend)
netstat -ano | findstr :5000
taskkill /PID <pid> /F
```

### Database not connecting
```bash
# Test database
psql -U chit_user -d chit_fund_db -c "SELECT 1"
```

### "Cannot GET /api/..." error
- Make sure backend is running (`npm run dev` in backend folder)
- Check http://localhost:5000 loads

### Missing modules
```bash
cd frontend && npm install
cd ../backend && npm install
cd ../python-service && pip install -r requirements.txt
```

## Next Steps

- Read full documentation in main [README.md](README.md)
- Check [SETUP_DATABASE.md](SETUP_DATABASE.md) for database details
- Read [SETUP_BACKEND.md](SETUP_BACKEND.md) for API documentation
- Review [SETUP_FRONTEND.md](SETUP_FRONTEND.md) for component details

## Terminal Setup (Recommended)

Keep 3 terminals open:

**Terminal 1 - Python Service**
```bash
cd python-service
python app.py
```

**Terminal 2 - Backend**
```bash
cd backend
npm run dev
```

**Terminal 3 - Frontend**
```bash
cd frontend
npm run dev
```

All three must be running for full functionality.

## Common Operations

### Add New Member (Admin)
1. Login with admin@chit.com
2. Click "Members" in sidebar
3. Click "+ Add Member"
4. Fill form and save

### Create Chit Group (Admin)
1. Click "Chit Groups" in sidebar
2. Click "+ Create Group"
3. Set amount, duration, select members
4. Save

### Make Contribution (Member)
1. Login with member@chit.com
2. Click "Contributions" in sidebar
3. Select group
4. Enter amount and submit

### View Statement (Member)
1. Click "Statements" in sidebar
2. View contribution history
3. Export as PDF or CSV

## Questions?

Refer to detailed setup guides:
- Database: [SETUP_DATABASE.md](SETUP_DATABASE.md)
- Backend: [SETUP_BACKEND.md](SETUP_BACKEND.md)
- Frontend: [SETUP_FRONTEND.md](SETUP_FRONTEND.md)

**Happy Chitting!** 💰
