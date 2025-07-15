# Manual Start Guide

## 🚀 Simple Commands

### Option 1: Use the Script
```bash
start-simple.bat
```

### Option 2: Manual Commands

#### Terminal 1 - Backend Server
```bash
cd server
nodemon index.js
```

#### Terminal 2 - Frontend Server
```bash
cd client
npm start
```

## 🔧 One-Time Setup

### Install Dependencies
```bash
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..
```

### Setup Environment Files
```bash
copy server\env.example server\.env
copy client\env.example client\.env
```

### Setup Database
```bash
cd server
npx prisma migrate dev --name init
node db.js
cd ..
```

## 🎯 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 👥 Demo Accounts

- **Landlord**: `alice` / `password123`
- **Tenant**: `john_doe` / `tenant123`
- **Contractor**: `mike_contractor` / `contractor123`

## 📝 Notes

- Backend uses `nodemon` for auto-restart on changes
- Frontend uses `npm start` (React development server)
- Both servers run independently
- Database is SQLite with sample data 