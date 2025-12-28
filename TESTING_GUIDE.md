# Testing Guide - Phases 2, 3, 4

This guide provides step-by-step instructions to test the newly implemented Phases 2, 3, and 4 of the DATASITE upgrade.

## Prerequisites

- MongoDB Atlas cluster created and connection string ready
- Node.js v18+ installed
- Two terminal windows (one for backend, one for frontend)

## Phase 4: Backend Testing

### Step 1: Update MongoDB Connection

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster if you don't have one
3. Click "Connect" and copy the connection string
4. Update `backend/.env`:

```env
MONGODB_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/agentOne?retryWrites=true&w=majority
```

### Step 2: Start Backend Server

```bash
cd backend
npm run dev
```

You should see:
```
✓ MongoDB connected successfully
✓ Server running on port 5000
```

### Step 3: Test Backend Endpoints

Use PowerShell for these tests:

#### Health Check

```powershell
curl http://localhost:5000/health
```

Expected response:
```json
{"success":true,"message":"Server is running"}
```

#### Register User

```powershell
$body = @{
    email = "test@example.com"
    password = "Test123!"
    name = "Test User"
} | ConvertTo-Json

curl -X POST http://localhost:5000/api/auth/register `
  -ContentType "application/json" `
  -Body $body
```

Expected response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "test@example.com",
    "name": "Test User",
    "balance": 0
  }
}
```

Save the token from this response for next tests.

#### Login User

```powershell
$body = @{
    email = "test@example.com"
    password = "Test123!"
} | ConvertTo-Json

curl -X POST http://localhost:5000/api/auth/login `
  -ContentType "application/json" `
  -Body $body
```

#### Get Profile

```powershell
$token = "YOUR_TOKEN_HERE"

curl -H "Authorization: Bearer $token" `
  http://localhost:5000/api/auth/profile
```

#### Get Balance

```powershell
$token = "YOUR_TOKEN_HERE"

curl -H "Authorization: Bearer $token" `
  http://localhost:5000/api/wallet/balance
```

#### Top Up Wallet

```powershell
$token = "YOUR_TOKEN_HERE"

$body = @{
    amount = 50
    paystackReference = "test_ref_123"
} | ConvertTo-Json

curl -X POST http://localhost:5000/api/wallet/topup `
  -H "Authorization: Bearer $token" `
  -ContentType "application/json" `
  -Body $body
```

#### Get Transactions

```powershell
$token = "YOUR_TOKEN_HERE"

curl -H "Authorization: Bearer $token" `
  "http://localhost:5000/api/wallet/transactions?limit=10&offset=0"
```

#### Create Purchase

```powershell
$token = "YOUR_TOKEN_HERE"

$body = @{
    network = "MTN"
    gb = 1
    price = 5
    recipient = "0501234567"
} | ConvertTo-Json

curl -X POST http://localhost:5000/api/purchases/create `
  -H "Authorization: Bearer $token" `
  -ContentType "application/json" `
  -Body $body
```

Expected response:
```json
{
  "success": true,
  "purchase": {
    "id": "...",
    "network": "MTN",
    "gb": 1,
    "price": 5,
    "recipient": "0501234567",
    "reference": "PUR1702468...",
    "status": "completed",
    "createdAt": "2025-12-13T..."
  }
}
```

#### Get Purchase History

```powershell
$token = "YOUR_TOKEN_HERE"

curl -H "Authorization: Bearer $token" `
  "http://localhost:5000/api/purchases/list?limit=10&offset=0"
```

### Step 4: Check MongoDB Data

You can verify data is being saved by:
1. Going to MongoDB Atlas
2. Clicking "Collections" in your cluster
3. Looking at the `agentOne` database
4. Viewing the `users`, `transactions`, `purchases` collections

---

## Phase 4: Frontend Testing

### Step 1: Start Frontend Server

In a new terminal:

```bash
cd frontend
npm run dev
```

You should see:
```
  ➜  Local:   http://localhost:5173/
```

### Step 2: Test Frontend Pages

Open `http://localhost:5173` in your browser

#### Test Home Page
- [ ] Logo displays correctly
- [ ] Light/Dark theme toggle works
- [ ] Content is responsive (test on mobile)
- [ ] "Sign up" and "Login" buttons visible when not logged in

#### Test Register Page

1. Click "Sign up" button
2. Fill in form:
   - Name: John Doe
   - Email: john@example.com
   - Password: Test123!
   - Confirm Password: Test123!
3. Click "Create Account"

Expected:
- [ ] No errors
- [ ] Redirected to home page
- [ ] Logged in (see balance, Dashboard button)
- [ ] Dark/Light theme preference saved

#### Test Login Page

1. Logout first
2. Click "Login"
3. Fill in:
   - Email: john@example.com
   - Password: Test123!
4. Click "Sign In"

Expected:
- [ ] Successfully logs in
- [ ] Redirected to home page
- [ ] User balance displays

#### Test Navbar
- [ ] Logo clickable and goes to home
- [ ] Balance displays when logged in
- [ ] Dark/Light toggle works
- [ ] Dashboard button appears when logged in
- [ ] Logout button works

#### Test Dashboard Page

1. Click "Dashboard" in navbar
2. Verify all sections display:
   - [ ] Account Balance
   - [ ] Email
   - [ ] Phone (or "Not set")
   - [ ] Referral Code

---

## Phase 4: Full Integration Test

### Test Complete User Journey

1. **Register**
   - Go to home page
   - Click "Sign up"
   - Fill registration form with valid data
   - Account created successfully

2. **Login**
   - Logout
   - Click "Login"
   - Login with same credentials
   - Back to home page logged in

3. **View Profile**
   - Click "Dashboard"
   - See user information

4. **Check Dark Mode**
   - Click theme toggle
   - Page changes to dark mode
   - Refresh page - dark mode persists

5. **Logout**
   - Click "Logout"
   - Back to home page not logged in
   - Cannot access /dashboard (redirects to login)

---

## Troubleshooting

### Backend Issues

**MongoDB connection fails**
- Check connection string in `.env`
- Verify IP whitelist in MongoDB Atlas (allow 0.0.0.0/0)
- Ensure cluster is running

**Port 5000 already in use**
```bash
# Kill the process using port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Nodemon not reloading**
- Check file paths in `nodemon.json`
- Ensure files are in `src/` directory

### Frontend Issues

**API calls fail (CORS error)**
- Ensure backend is running
- Check `VITE_API_URL` in `.env.local`
- Verify `CORS_ORIGIN` in backend `.env` includes frontend URL

**Dark mode not working**
- Clear browser localStorage: `localStorage.clear()`
- Check browser console for errors
- Verify `tailwind.config.js` has `darkMode: 'class'`

**Pages not loading**
- Check browser console for errors
- Verify routes in `App.jsx`
- Ensure all components are properly exported

---

## Verification Checklist

### Backend ✅
- [ ] Health endpoint responds
- [ ] Register creates user in MongoDB
- [ ] Login returns valid JWT token
- [ ] Protected routes reject requests without token
- [ ] Wallet top-up updates balance
- [ ] Purchase deducts from balance
- [ ] Transactions are recorded

### Frontend ✅
- [ ] Vite dev server starts without errors
- [ ] All pages load correctly
- [ ] Auth context works (user data persists)
- [ ] Theme context works (dark mode toggles)
- [ ] API calls reach backend
- [ ] Protected routes redirect to login
- [ ] Responsive design works on mobile

---

## Next Steps

Once all tests pass:

1. **Phase 5**: Deploy to production
2. **Additional Features**: Add data bundle selection, Paystack integration, referral system
3. **Performance**: Add caching, optimize bundle size
4. **Security**: Add rate limiting, input validation, HTTPS

---

## Test Credentials

For quick testing:

```
Email: test@example.com
Password: Test123!
Name: Test User
```

Register this account and use it for testing.
