# Property Management Platform - Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm

### One-Click Setup
```bash
# Run the start script
start.bat
```

### Manual Setup
```bash
# 1. Install dependencies
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..

# 2. Setup environment files
copy server\env.example server\.env
copy client\env.example client\.env

# 3. Setup database
cd server
npx prisma migrate dev --name init
node db.js
cd ..

# 4. Start the app
npm run dev
```

## 🎯 What You Get

- **Frontend**: http://localhost:3000 (React app)
- **Backend**: http://localhost:5000 (API server)
- **Database**: SQLite with sample data

## 👥 Demo Accounts

- **Landlord**: `alice` / `password123`
- **Tenant**: `john_doe` / `tenant123`
- **Contractor**: `mike_contractor` / `contractor123`

## 🏗️ Core Features

### Property Management
- Add, edit, delete properties
- Track property details
- Property listing and search

### Tenant Management
- Add, edit, delete tenants
- Assign tenants to properties
- Track lease information

### Maintenance System
- Submit maintenance requests
- Track request status
- Assign to contractors

### Financial Tracking
- Rent payment tracking
- Payment history
- Financial reporting

## 📁 Clean Project Structure

```
PropertyMNGMT/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.js         # Main app
│   │   └── index.js       # Entry point
│   └── package.json
├── server/                 # Node.js backend
│   ├── routes/            # API routes
│   ├── db/               # Database utilities
│   ├── prisma/           # Database schema
│   ├── index.js          # Server entry point
│   └── package.json
├── package.json           # Root workspace
├── start.bat             # One-click start script
└── README.md
```

## 🛠️ Development Commands

```bash
# Start both frontend and backend
npm run dev

# Start individual services
npm run dev:client    # Frontend only
npm run dev:server    # Backend only

# Database management
npm run db:migrate    # Run migrations
npm run db:studio     # Open Prisma Studio
npm run db:seed       # Seed database

# Build for production
npm run build
```

## 🎯 Next Steps

This clean prototype provides:
1. **Working core functionality** - All basic features work
2. **Clean architecture** - Easy to extend and modify
3. **Proper database design** - Good schema and relationships
4. **Functional UI** - All components work together

When ready to scale:
- Add authentication/authorization
- Implement file uploads
- Add real-time notifications
- Deploy to cloud platform
- Add advanced features

## 📝 Notes

- Uses SQLite for development (easy to switch to PostgreSQL)
- Includes sample data for testing
- All core features implemented and working
- Clean, maintainable codebase
- No complex infrastructure or CI/CD overhead
- Focus on functionality over configuration 