# Technology Stack Reference

Complete breakdown of all technologies used in the Chit Fund Management System.

## Frontend Stack

### React & Ecosystem
- **React 18.3.1** - UI library
- **React Router 6.20.1** - Client-side routing
- **Vite 5.4.8** - Build tool (ES modules, fast HMR)
- **axios 1.7.7** - HTTP client for API calls

### Styling
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **PostCSS 8.4.35** - CSS transformation
- **Autoprefixer 10.4.17** - Vendor prefix auto-add

### Data Visualization
- **Recharts 2.12.7** - React charting library
  - LineChart, BarChart, PieChart
  - Responsive containers
  - Custom tooltips

### Export/Reporting
- **jsPDF 2.5.1** - PDF generation
- **PapaParse 5.4.1** - CSV parsing and generation

## Backend Stack

### Core Framework
- **Express.js 4.19.2** - Web framework
- **Node.js 18+** - Runtime

### Database
- **PostgreSQL** - Relational database
- **pg 8.12.0** - PostgreSQL driver

### Authentication & Security
- **bcryptjs 2.4.3** - Password hashing
- **jsonwebtoken 9.0.2** - JWT token handling
- **dotenv 16.4.5** - Environment variable management

### Data Validation
- **zod 3.23.8** - Schema validation
- **cors 2.8.5** - Cross-origin resource sharing

### HTTP Requests
- **axios 1.7.7** - Internal API calls to Python service

## Python Service Stack

### Web Framework
- **Flask** - Lightweight web framework
- **Python 3.9+** - Runtime

### Calculations
- **NumPy** - Numerical computing (optional)
- **Pandas** - Data manipulation (optional)

### Deployment
- **Gunicorn** - Production WSGI server
- **WhiteNoise** - Static files serving

## Database Schema

### PostgreSQL 12+

**Key Tables:**
- `users` - Authentication with roles
- `members` - Member profiles
- `chit_groups` - Group definitions
- `group_members` - Membership mapping
- `contributions` - Payment tracking
- `auctions` - Monthly auctions
- `payouts` - Payout records

**Features:**
- Foreign keys for referential integrity
- Indexes on commonly queried columns
- Timestamps (created_at, updated_at)
- Transaction support for complex operations

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                  BROWSER/FRONTEND                    │
│  React + Router + Tailwind + Recharts + jsPDF       │
└────────────────────┬────────────────────────────────┘
                     │ HTTP/CORS
                     │ Axios Client
┌────────────────────▼────────────────────────────────┐
│         EXPRESS API (Node.js Backend)               │
│  JWT Auth │ Routes │ Middleware │ Business Logic   │
└────────────────────┬────────────────────────────────┘
         │           │           │
    ┌────▼─────┐ ┌───▼────┐ ┌───▼──────┐
    │PostgreSQL│ │ Python │ │  Cache   │
    │Database  │ │Service │ │(Optional)│
    └──────────┘ └────────┘ └──────────┘
```

## Development Tools Recommended

### IDEs
- **VS Code** - Lightweight, excellent extensions
- **WebStorm** - Full-featured (paid)

### Browser Extensions
- **React Developer Tools** - React debugging
- **Redux DevTools** - State management (if using Redux)
- **Tailwind CSS IntelliSense** - CSS autocomplete
- **REST Client** - API testing in editor

### CLI Tools
- **nodemon** - Auto-restart Node.js
- **concurrently** - Run multiple commands
- **git** - Version control

### Database Tools
- **pgAdmin** - PostgreSQL GUI
- **DBeaver** - Database explorer
- **Adminer** - Web-based database management

## Version Numbers (Tested)

```json
{
  "node": "18.0.0+",
  "npm": "9.0.0+",
  "python": "3.9+",
  "postgresql": "12+",
  "react": "18.3.1",
  "express": "4.19.2",
  "vite": "5.4.8",
  "tailwindcss": "3.4.1"
}
```

## Performance Considerations

### Frontend
- Vite provides fast development mode with ES modules
- Production build optimized with tree-shaking
- Lazy loading for code-split routes possible
- Recharts renders efficiently for large datasets

### Backend
- Connection pooling via pg library
- Transaction support for consistency
- Parameterized queries prevent SQL injection
- JWT for stateless authentication
- Fallback calculations if Python service down

### Database
- Indexes on foreign keys
- Normalized schema to avoid redundancy
- Connection limits configurable
- Backup/restore capabilities

## Deployment Targets

### Frontend
- Vercel (recommended for Vite)
- Netlify
- AWS S3 + CloudFront
- DigitalOcean App Platform

### Backend
- Heroku
- Railway
- DigitalOcean App Platform
- AWS EC2 + ECS
- Render (formerly Render)

### Python Service
- Same as backend
- Separate dyno on Heroku (if needed)
- Containerized with Docker

### Database
- AWS RDS PostgreSQL
- DigitalOcean Managed Database
- Heroku Postgres
- Railway PostgreSQL
- Self-hosted PostgreSQL

## Security Best Practices

- All passwords hashed with bcrypt
- JWT tokens with 12-hour expiry
- CORS configured for specific origins
- Environment variables for secrets
- Parameterized queries for SQL safety
- Role-based access control (RBAC)
- HTTPS in production
- Regular security updates

## Scalability Roadmap

**Current Capacity:**
- Thousands of members
- Hundreds of groups
- Unlimited transactions

**For Higher Scale:**
- Add Redis caching layer
- Implement database read replicas
- Horizontal scaling with load balancer
- Separate Python service for heavy calculations
- Queue system (Bull, Celery) for async jobs
- CDN for frontend static assets

## Dependencies Count

- Frontend: ~30 packages
- Backend: ~10 packages
- Python: ~5 packages
- Total: ~45 production dependencies

## License & Attribution

- React, Express, PostgreSQL - Open source (MIT/PostgreSQL licenses)
- Tailwind CSS - MIT License
- Recharts - Apache 2.0
- All dependencies respect open source licensing
