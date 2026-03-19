# Backend API Setup Guide

Complete setup instructions for the Node.js Express backend.

## Prerequisites

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher
- PostgreSQL running on localhost:5432

## Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Copy example env file:
```bash
cp .env.example .env
```

Edit `.env`:
```env
# Server
PORT=5000

# Database
DATABASE_URL=postgresql://chit_user:chit_password@localhost:5432/chit_fund_db

# JWT
JWT_SECRET=your_super_secret_key_replace_in_production

# Python Service
PYTHON_CALC_URL=http://localhost:8001
```

### 3. Start Development Server

```bash
npm run dev
```

Server runs on `http://localhost:5000`

### 4. Test Backend

```bash
curl http://localhost:5000/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@chit.com","password":"password123"}'
```

## Project Structure

```
backend/
├── src/
│   ├── routes/
│   │   ├── auth.js          # Authentication (login/register)
│   │   ├── members.js       # Member CRUD
│   │   ├── groups.js        # Group management
│   │   ├── contributions.js # Contribution tracking
│   │   ├── auctions.js      # Auction management
│   │   └── dashboard.js     # Reports and statements
│   ├── services/
│   │   └── calculationClient.js  # Python service client
│   ├── middleware/
│   │   └── auth.js          # JWT authentication
│   ├── db.js                # Database client
│   └── server.js            # Express app setup
├── .env.example
└── package.json
```

## API Routes Summary

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get token

### Members (Protected, Admin only)
- `GET /members` - List all members
- `POST /members` - Create member
- `GET /members/:id` - Get member details
- `PUT /members/:id` - Update member
- `DELETE /members/:id` - Delete member

### Groups (Protected, Admin only)
- `GET /groups` - List groups
- `POST /groups` - Create group
- `GET /groups/:id` - Get group details
- `PUT /groups/:id` - Update group
- `POST /groups/:id/members` - Add members to group

### Contributions (Protected)
- `GET /contributions` - Get contributions
- `POST /contributions` - Record contribution
- `GET /contributions/history/:memberId` - Contribution history
- `GET /contributions/eligibility/:memberId/:groupId` - Check eligibility

### Auctions (Protected)
- `GET /auctions` - List auctions
- `POST /auctions` - Schedule auction (Admin)
- `POST /auctions/:id/bid` - Place bid
- `GET /auctions/winners/:groupId` - Get winners

### Dashboard (Protected)
- `GET /summary/:memberId` - Get summary
- `GET /statements/:memberId` - Get statement

## Request/Response Examples

### Register User
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "role": "MEMBER",
    "memberId": 1
  }'
```

Response:
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "MEMBER"
  }
}
```

### Create Member
```bash
curl -X POST http://localhost:5000/members \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "address": "123 Main St"
  }'
```

## Error Handling

All endpoints return standardized error responses:

```json
{
  "message": "Error description",
  "issues": ["Detailed error info"] // For validation errors
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad request
- `401` - Unauthorized
- `403` - Forbidden
- `409` - Conflict
- `500` - Server error

## Troubleshooting

### Port 5000 Already in Use
```bash
# Find process using port
netstat -ano | findstr :5000

# Kill process (Windows)
taskkill /PID <pid> /F
```

### Database Connection Error
```bash
# Test connection
psql -U chit_user -d chit_fund_db -c "SELECT 1"
```

### JWT Token Issues
- Ensure JWT_SECRET is set in .env
- Token expires after 12 hours by default
- Include `Authorization: Bearer <token>` header

## Development Tips

- Use VS Code REST Client extension to test APIs
- Install `nodemon` for auto-restart: `npm install -g nodemon`
- Enable debug logs: `DEBUG=* npm run dev`
- Check transaction handling in db.js for complex operations

## Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for production setup.
