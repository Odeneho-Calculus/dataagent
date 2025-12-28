# DATASITE Upgrade Guide: React + Node.js + MongoDB Atlas

**Current Stack**: Firebase + Vanilla JS + HTML/CSS
**Target Stack**: React + Vite + Tailwind CSS + Express.js + MongoDB Atlas + Nodemon

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Pre-Migration Checklist](#pre-migration-checklist)
4. [Phase 0: Project Setup](#phase-0-project-setup)
5. [Phase 1: Backend Development](#phase-1-backend-development)
6. [Phase 2: Frontend Development](#phase-2-frontend-development)
7. [Phase 3: Feature Migration](#phase-3-feature-migration)
8. [Phase 4: Integration & Testing](#phase-4-integration--testing)
9. [Phase 5: Deployment](#phase-5-deployment)
10. [Environment Variables Reference](#environment-variables-reference)
11. [Troubleshooting](#troubleshooting)

---

## Overview

This guide provides a structured approach to migrate **agentOne** from a Firebase + Vanilla JS frontend to a modern, scalable React + Node.js stack with MongoDB Atlas as the database.

### Key Benefits
- **Better Developer Experience**: React components with hot reloading via Vite
- **Modern Styling**: Tailwind CSS with built-in light/dark theme support
- **Scalability**: Express.js backend with proper API structure
- **Cloud Database**: MongoDB Atlas eliminates local database setup
- **Mobile-First**: Responsive design system from the ground up
- **Type Safety**: Option to add TypeScript later

---

## Architecture

```
DATASITE/
├── frontend/                  # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.local             # Frontend env vars
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/                   # Express.js + MongoDB
│   ├── src/
│   │   ├── models/           # MongoDB schemas
│   │   ├── routes/           # API endpoints
│   │   ├── controllers/      # Business logic
│   │   ├── middleware/       # Auth, validation
│   │   ├── utils/            # Helpers
│   │   ├── config/           # Database connection
│   │   └── server.js         # Entry point
│   ├── .env                  # Backend env vars
│   ├── .env.example          # Template
│   ├── nodemon.json          # Nodemon config
│   └── package.json
│
└── DATASITE_UPGRADE.md       # This file
```

---

## Pre-Migration Checklist

- [ ] **Backup Current Project**: Create a backup of current vanilla JS version
- [ ] **Document Current Features**:
  - Authentication (register, login, logout)
  - User profile management
  - Wallet/balance system
  - Data bundle purchase
  - Transaction history
  - Referral system
  - Paystack integration
- [ ] **Identify Data to Migrate**:
  - User accounts
  - Transaction history
  - Bundle pricing/configurations
  - Settings and preferences
- [ ] **Prepare Credentials**:
  - MongoDB Atlas connection string
  - Paystack API keys (live and test)
  - Firebase data export (if needed)
- [ ] **Prepare Development Environment**:
  - Node.js v18+ installed
  - npm or yarn package manager
  - MongoDB Atlas account created
  - Git for version control

---

## Phase 0: Project Setup

### Step 1: Create Directory Structure

```bash
cd c:\Users\kalculusGuy\Desktop\projectEra\others\datasite

# Create frontend and backend directories
mkdir frontend backend

# Initialize Git (if not already)
git init
```

### Step 2: Create .gitignore

Create `.gitignore` in the root directory:

```
# Environment variables
.env
.env.local
.env.*.local

# Dependencies
node_modules/
/.pnp
.pnp.js

# Build outputs
/dist
/build
/.next
/out

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Misc
.cache/
.parcel-cache
.turbo
.env.production.local
```

### Step 3: Create Root package.json

Create `package.json` in root:

```json
{
  "name": "agentOne",
  "version": "2.0.0",
  "description": "Data bundle reseller platform - React + Node.js + MongoDB",
  "main": "backend/src/server.js",
  "scripts": {
    "dev": "concurrently \"npm --prefix backend run dev\" \"npm --prefix frontend run dev\"",
    "build": "npm --prefix backend run build && npm --prefix frontend run build",
    "start": "npm --prefix backend start",
    "test": "npm --prefix backend test && npm --prefix frontend test"
  },
  "dependencies": {
    "concurrently": "^8.2.0"
  },
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
```

Install concurrently:

```bash
npm install
```

---

## Phase 1: Backend Development

### Step 1: Initialize Backend Project

```bash
cd backend

npm init -y

npm install \
  express \
  mongoose \
  dotenv \
  bcryptjs \
  jsonwebtoken \
  cors \
  validator \
  axios

npm install --save-dev \
  nodemon \
  eslint
```

### Step 2: Create Backend Structure

```bash
# Inside backend directory
mkdir -p src/{models,routes,controllers,middleware,utils,config}
touch src/server.js src/config/.gitkeep
```

### Step 3: Configure Nodemon

Create `backend/nodemon.json`:

```json
{
  "watch": ["src"],
  "ext": "js",
  "ignore": ["node_modules"],
  "exec": "node src/server.js",
  "delay": 500
}
```

### Step 4: Update Backend package.json Scripts

Edit `backend/package.json`:

```json
{
  "scripts": {
    "dev": "nodemon",
    "start": "node src/server.js",
    "build": "npm run lint",
    "lint": "eslint src/ --fix"
  }
}
```

### Step 5: Create Environment Template

Create `backend/.env.example`:

```
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/agentOne?retryWrites=true&w=majority

# JWT
JWT_SECRET=your_jwt_secret_key_min_32_characters_long_please
JWT_EXPIRE=30d

# Paystack
PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxxx
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxx

# CORS
CORS_ORIGIN=http://localhost:5173

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

Copy to actual .env:

```bash
cp .env.example .env
# Then edit .env with actual values
```

### Step 6: Create MongoDB Connection

Create `backend/src/config/database.js`:

```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✓ MongoDB connected successfully');
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
```

### Step 7: Create MongoDB Models

**User Model** - Create `backend/src/models/User.js`:

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      default: null,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    referralEarnings: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate referral code
userSchema.pre('save', function (next) {
  if (!this.referralCode) {
    this.referralCode = 'REF' + this._id.toString().slice(-8).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
```

**Transaction Model** - Create `backend/src/models/Transaction.js`:

```javascript
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['wallet_topup', 'purchase_refund', 'referral_bonus'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    reference: {
      type: String,
      unique: true,
      required: true,
    },
    paystackReference: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    description: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
```

**Purchase Model** - Create `backend/src/models/Purchase.js`:

```javascript
const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    network: {
      type: String,
      enum: ['MTN', 'TELECEL', 'AIRTELTIGO'],
      required: true,
    },
    gb: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    recipient: {
      type: String,
      required: true,
    },
    reference: {
      type: String,
      unique: true,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Purchase', purchaseSchema);
```

### Step 8: Create Authentication Middleware

Create `backend/src/middleware/auth.js`:

```javascript
const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

module.exports = { protect };
```

### Step 9: Create Authentication Controller

Create `backend/src/controllers/authController.js`:

```javascript
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

exports.register = async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide email, password, and name' 
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }

    // Create user
    const user = await User.create({ email, password, name, phone });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        balance: user.balance,
      },
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide email and password' 
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        balance: user.balance,
      },
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        balance: user.balance,
        referralCode: user.referralCode,
      },
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};
```

### Step 10: Create API Routes

Create `backend/src/routes/auth.js`:

```javascript
const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);

module.exports = router;
```

### Step 11: Create Express Server

Create `backend/src/server.js`:

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error' 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
});
```

---

## Phase 2: Frontend Development

### Step 1: Create React + Vite Project

```bash
cd frontend

npm create vite@latest . -- --template react

npm install

npm install \
  react-router-dom \
  axios \
  tailwindcss \
  postcss \
  autoprefixer \
  @heroicons/react \
  lucide-react

npm install --save-dev @tailwindcss/forms @tailwindcss/typography
```

### Step 2: Configure Tailwind CSS

Initialize Tailwind:

```bash
npx tailwindcss init -p
```

Update `frontend/tailwind.config.js`:

```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        accent: {
          500: '#f97316',
          600: '#ea580c',
        },
      },
    },
  },
  darkMode: 'class',
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

### Step 3: Create Global Styles

Create `frontend/src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    scroll-behavior: smooth;
  }

  body {
    @apply bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors;
  }
}

@layer components {
  .btn {
    @apply px-4 py-2 rounded-lg font-medium transition-all duration-200;
  }

  .btn-primary {
    @apply bg-primary-500 hover:bg-primary-600 text-white;
  }

  .btn-secondary {
    @apply bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white;
  }

  .card {
    @apply bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm;
  }

  .input-field {
    @apply w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500;
  }
}
```

### Step 4: Create Frontend Structure

```bash
mkdir -p src/{components,pages,hooks,context,services,utils,assets}
```

### Step 5: Create API Service

Create `frontend/src/services/api.js`:

```javascript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle responses
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

export const auth = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

export default api;
```

### Step 6: Create Auth Context

Create `frontend/src/context/AuthContext.jsx`:

```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth as authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await authAPI.getProfile();
      setUser(data.user);
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, name) => {
    const data = await authAPI.register({ email, password, name });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  };

  const login = async (email, password) => {
    const data = await authAPI.login({ email, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### Step 7: Create Theme Context

Create `frontend/src/context/ThemeContext.jsx`:

```javascript
import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

### Step 8: Create Components

**Navbar Component** - Create `frontend/src/components/Navbar.jsx`:

```javascript
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">📡</span>
            <div>
              <div className="font-bold text-slate-900 dark:text-white">agentOne</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">DATA HUB</div>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            {user && (
              <div className="text-sm">
                <span className="text-slate-600 dark:text-slate-400">Balance: </span>
                <span className="font-bold text-primary-600 dark:text-primary-400">
                  GHS {user.balance?.toFixed(2) || '0.00'}
                </span>
              </div>
            )}

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {user ? (
              <button
                onClick={logout}
                className="btn btn-secondary flex items-center gap-2"
              >
                <LogOut size={16} />
                Logout
              </button>
            ) : (
              <Link to="/login" className="btn btn-primary">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
```

### Step 9: Create Pages

**Home Page** - Create `frontend/src/pages/Home.jsx`:

```javascript
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {user && (
          <div className="mb-8 p-6 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg text-white">
            <p className="text-2xl font-bold mb-2">Welcome, {user.name}! 👋</p>
            <p className="text-primary-100">Ready to buy data today?</p>
          </div>
        )}

        {!user && (
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Get Fast, Reliable Data
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
              Buy MTN, TELECEL, and Airteltigo data bundles at the best prices
            </p>
            <Link to="/login" className="btn btn-primary inline-block">
              Get Started
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Add data bundle cards here */}
        </div>
      </div>
    </div>
  );
}
```

### Step 10: Create App.jsx

Create `frontend/src/App.jsx`:

```javascript
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            {/* Add more routes here */}
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
```

### Step 11: Create Environment File

Create `frontend/.env.example`:

```
VITE_API_URL=http://localhost:5000/api
VITE_PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxxx
```

Copy to `.env.local`:

```bash
cp .env.example .env.local
```

---

## Phase 3: Feature Migration

### Step 1: Migrate Authentication

- [x] Register endpoint (Backend)
- [x] Login endpoint (Backend)
- [ ] Create Login page (Frontend)
- [ ] Create Register page (Frontend)
- [ ] Password reset flow
- [ ] Email verification

### Step 2: Migrate User Profile

**Backend** - Create `backend/src/routes/user.js`:

```javascript
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { name, phone },
      { new: true }
    );
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
```

### Step 3: Migrate Wallet System

**Backend** - Create `backend/src/routes/wallet.js`:

```javascript
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

router.get('/balance', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json({ success: true, balance: user.balance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/topup', protect, async (req, res) => {
  try {
    const { amount, paystackReference } = req.body;
    
    const transaction = await Transaction.create({
      userId: req.userId,
      type: 'wallet_topup',
      amount,
      reference: 'TXN' + Date.now(),
      paystackReference,
      status: 'completed',
    });

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $inc: { balance: amount } },
      { new: true }
    );

    res.json({ success: true, balance: user.balance, transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/transactions', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
```

### Step 4: Migrate Data Purchases

**Backend** - Create `backend/src/routes/purchases.js`:

```javascript
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Purchase = require('../models/Purchase');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

router.post('/create', protect, async (req, res) => {
  try {
    const { network, gb, price, recipient } = req.body;

    // Check balance
    const user = await User.findById(req.userId);
    if (user.balance < price) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient balance' 
      });
    }

    // Create purchase
    const purchase = await Purchase.create({
      userId: req.userId,
      network,
      gb,
      price,
      recipient,
      reference: 'PUR' + Date.now(),
      status: 'completed',
    });

    // Deduct from balance
    await User.findByIdAndUpdate(
      req.userId,
      { $inc: { balance: -price } }
    );

    // Create transaction record
    await Transaction.create({
      userId: req.userId,
      type: 'purchase',
      amount: -price,
      reference: purchase.reference,
      status: 'completed',
    });

    res.json({ success: true, purchase });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/list', protect, async (req, res) => {
  try {
    const purchases = await Purchase.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, purchases });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
```

### Step 5: Add Routes to Server

Update `backend/src/server.js`:

```javascript
// Add these lines before listening
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/purchases', require('./routes/purchases'));
```

---

## Phase 4: Integration & Testing

### Step 1: Test Backend Endpoints

Start backend:

```bash
cd backend
npm run dev
```

Test with curl:

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# Get profile (replace TOKEN)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/auth/profile
```

### Step 2: Create Frontend Pages

Create login, register, dashboard, and purchase pages following the same pattern as the examples above.

### Step 3: Update Vite Config

Create `frontend/vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
```

### Step 4: Run Development Environment

In root directory:

```bash
npm run dev
```

This will start both frontend and backend concurrently.

---

## Phase 5: Deployment

### Step 1: Environment Setup for Production

Update `.env` files with production credentials:

**Backend (.env)**:
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://prod_user:prod_pass@cluster.mongodb.net/agentOne
JWT_SECRET=your_long_production_secret_key_min_32_chars
CORS_ORIGIN=https://yourdomain.com
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxx
```

**Frontend (.env.production)**:
```
VITE_API_URL=https://api.yourdomain.com
VITE_PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxxx
```

### Step 2: Build for Production

```bash
npm run build
```

### Step 3: Deploy Backend (Heroku/Render/Railway)

Example for Railway:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Set environment variables
railway variables set NODE_ENV=production

# Deploy
railway up
```

### Step 4: Deploy Frontend (Vercel/Netlify)

**Vercel**:

```bash
npm install -g vercel
vercel
```

**Netlify**:

```bash
npm install -g netlify-cli
netlify deploy
```

### Step 5: Configure Custom Domain

Update DNS records to point to your deployed services.

---

## Environment Variables Reference

### Backend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | JWT signing key (min 32 chars) | `your_secret_key_xxxxx` |
| `JWT_EXPIRE` | Token expiration | `30d` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:5173` |
| `PAYSTACK_PUBLIC_KEY` | Paystack public key | `pk_live_xxxxxxxxxxxxx` |
| `PAYSTACK_SECRET_KEY` | Paystack secret key | `sk_live_xxxxxxxxxxxxx` |

### Frontend (.env.local / .env.production)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:5000/api` |
| `VITE_PAYSTACK_PUBLIC_KEY` | Paystack public key | `pk_live_xxxxxxxxxxxxx` |

---

## Troubleshooting

### Backend Issues

**MongoDB Connection Failed**
- Verify MongoDB Atlas connection string is correct
- Check IP whitelist in MongoDB Atlas (allow 0.0.0.0/0 for development)
- Ensure `.env` file exists with `MONGODB_URI`

**CORS Error**
- Update `CORS_ORIGIN` in backend `.env`
- Ensure frontend URL matches exactly

**Token Invalid**
- Check `JWT_SECRET` matches between sessions
- Verify token hasn't expired
- Check token format: `Bearer <token>`

### Frontend Issues

**Cannot Connect to Backend**
- Verify backend is running on correct port
- Check `VITE_API_URL` in `.env.local`
- Check browser DevTools Network tab for request errors

**Theme Not Persisting**
- Check browser localStorage is enabled
- Verify `ThemeProvider` wraps entire app
- Check `tailwind.config.js` has `darkMode: 'class'`

**Component Not Rendering**
- Check component is exported correctly
- Verify route is added in `App.jsx`
- Check browser console for JavaScript errors

### Data Migration

**Migrating from Firebase**
1. Export Firebase data as JSON
2. Transform JSON to match MongoDB schema
3. Use MongoDB import tools or write migration script
4. Verify data integrity in production

---

## Quick Reference Commands

```bash
# Development
npm run dev              # Run both backend and frontend

# Backend only
cd backend && npm run dev

# Frontend only
cd frontend && npm run dev

# Production build
npm run build

# Linting
npm run lint

# Start production server
npm start
```

---

## Next Steps After Migration

1. ✅ Complete Phase 0-5 implementation
2. ✅ Comprehensive testing (unit, integration, E2E)
3. ✅ Security audit (auth, API validation, HTTPS)
4. ✅ Performance optimization (caching, CDN, compression)
5. ✅ Analytics setup (error tracking, user analytics)
6. ✅ Documentation updates
7. ✅ Team training on new stack

---

## Support & Resources

- **MongoDB Atlas**: https://www.mongodb.com/cloud/atlas
- **Express.js**: https://expressjs.com/
- **React**: https://react.dev/
- **Tailwind CSS**: https://tailwindcss.com/
- **Vite**: https://vitejs.dev/
- **Paystack API**: https://paystack.com/docs/
