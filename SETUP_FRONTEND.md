# Frontend React Setup Guide

Complete setup instructions for the React Vite frontend.

## Prerequisites

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher
- Backend API running on http://localhost:5000

## Installation

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

Frontend runs on `http://localhost:3000` (or next available port)

### 3. Access Application

Open browser and go to: `http://localhost:3000`

## Project Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── LoginPage.jsx              # Auth page
│   │   ├── AdminDashboard.jsx         # Admin overview
│   │   ├── MemberDashboard.jsx        # Member overview
│   │   ├── MemberManagementPage.jsx   # Admin: manage members
│   │   ├── ChitGroupsPage.jsx         # Admin: manage groups
│   │   ├── ContributionPage.jsx       # Member: make payments
│   │   ├── AuctionPage.jsx            # Auction participation
│   │   ├── ReportsPage.jsx            # Statements & reports
│   │   └── ProfilePage.jsx            # User settings
│   ├── components/
│   │   ├── Header.jsx                 # Top navigation
│   │   ├── Sidebar.jsx                # Left navigation
│   │   ├── Layout.jsx                 # Main layout wrapper
│   │   └── ProtectedRoute.jsx         # Route guard
│   ├── context/
│   │   ├── AuthContext.jsx            # Auth state management
│   │   └── DataContext.jsx            # Data state management
│   ├── services/
│   │   └── api.js                     # API client
│   ├── styles/
│   │   └── globals.css                # Global Tailwind styles
│   ├── App.jsx                        # App with routing
│   └── main.jsx                       # Entry point
├── index.html                         # HTML template
├── vite.config.js                     # Vite configuration
├── tailwind.config.js                 # Tailwind configuration
└── package.json
```

## Key Pages & Features

### 1. Login/Signup (LoginPage.jsx)
- Email/password authentication
- Role-based login (Admin/Member)
- Demo credentials display

### 2. Admin Dashboard (AdminDashboard.jsx)
- Summary cards: members, groups, collections, pending
- Line chart: Collections vs pending
- Pie chart: Group status
- Recent groups table

### 3. Member Dashboard (MemberDashboard.jsx)
- Summary: total due, paid, pending, next due date
- Contribution chart
- Payout chart (bar chart)
- My groups table with action buttons

### 4. Member Management (MemberManagementPage.jsx)
- Search and filter members
- Add new member form
- Edit/delete member
- Member table with contact info

### 5. Chit Groups (ChitGroupsPage.jsx)
- Create group form
- Assign members to group
- Group list with status
- Edit/delete group

### 6. Contributions (ContributionPage.jsx)
- Show group details
- Payment form
- Eligibility status and percentage
- Contribution history table

### 7. Auctions (AuctionPage.jsx)
- Filter by group
- Active auctions grid
- Bid placement form
- Previous winners table

### 8. Reports (ReportsPage.jsx)
- Summary cards: due, paid, pending, completion %
- Progress bar
- Contribution breakdown
- Payout history
- Export PDF/CSV buttons

### 9. Profile (ProfilePage.jsx)
- View account info
- Edit profile form
- Change password
- Logout button

## Styling with Tailwind CSS

Global styles defined in [src/styles/globals.css](src/styles/globals.css):

```css
.btn-primary          /* Blue primary button */
.btn-secondary        /* Gray secondary button */
.btn-danger           /* Red danger button */
.card                 /* White card with shadow */
.form-input           /* Styled input field */
.form-label           /* Form label styling */
.table-responsive     /* Responsive table wrapper */
```

## State Management

### AuthContext
```javascript
const { user, login, register, logout, loading, error } = useAuth();
```

### DataContext
```javascript
const { 
  members, groups, contributions, auctions, 
  loading, error,
  fetchMembers, fetchGroups, createMember, createGroup 
} = useData();
```

## API Client (services/api.js)

Auto-includes JWT token in all requests:

```javascript
import { memberAPI, groupAPI, contributionAPI, auctionAPI, reportAPI } from './services/api';

// Example usage
const members = await memberAPI.getAll();
const created = await memberAPI.create({ name, email, phone, address });
```

## Protected Routes

Routes require authentication via ProtectedRoute component:

```javascript
<Route
  path="/members"
  element={
    <ProtectedRoute requiredRole="ADMIN">
      <Layout>
        <MemberManagementPage />
      </Layout>
    </ProtectedRoute>
  }
/>
```

## Demo Credentials

### Admin
- Email: admin@chit.com
- Password: password123

### Member
- Email: member@chit.com
- Password: password123

## Build for Production

```bash
npm run build
# Creates optimized build in dist/ folder

npm run preview
# Preview production build locally
```

## Troubleshooting

### API Connection Issues
- Check backend is running: `curl http://localhost:5000`
- Verify VITE_API_URL environment variable
- Check browser Network tab for failed requests

### CORS Errors
- Backend needs to have CORS enabled
- Check backend CORS configuration

### Port 3000 Not Available
```bash
npm run dev -- --port 3001
# Use different port
```

### Module Not Found
```bash
npm install
npm cache clean --force
```

## Development Tips

- Use React Developer Tools browser extension
- Check Console tab for JavaScript errors
- Use Network tab to debug API calls
- Tailwind CSS IntelliSense plugin recommended in VS Code

## Component Usage Examples

### Using Protected Route
```javascript
<ProtectedRoute requiredRole="ADMIN">
  <AdminPage />
</ProtectedRoute>
```

### Using Data Context
```javascript
function MyComponent() {
  const { members, fetchMembers, loading } = useData();
  
  useEffect(() => {
    fetchMembers();
  }, []);
  
  if (loading) return <div>Loading...</div>;
  return <div>{members.length} members</div>;
}
```

### Using Auth Context
```javascript
function LoginBtn() {
  const { user, logout } = useAuth();
  
  if (!user) return <a href="/login">Login</a>;
  
  return (
    <div>
      {user.email}
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## Responsive Design

All pages use Tailwind's responsive utilities:
- `hidden md:block` - Hide on mobile, show on desktop
- `grid-cols-1 md:grid-cols-2` - 1 column on mobile, 2 on desktop
- `text-sm md:text-base` - Smaller text on mobile

## Next Steps

See [DEPLOYMENT.md](DEPLOYMENT.md) for deploying frontend to production.
