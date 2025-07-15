@echo off
echo 🚀 Starting Property Management Platform (Simple Mode)...

echo.
echo 📦 Installing dependencies...
call npm install
cd client && call npm install && cd ..
cd server && call npm install && cd ..

echo.
echo 🔧 Setting up environment files...
if not exist "server\.env" (
    copy "server\env.example" "server\.env"
    echo ✅ Created server\.env
) else (
    echo ℹ️  server\.env already exists
)

if not exist "client\.env" (
    copy "client\env.example" "client\.env"
    echo ✅ Created client\.env
) else (
    echo ℹ️  client\.env already exists
)

echo.
echo 🗄️  Setting up database...
cd server
call npx prisma migrate dev --name init
call node db.js
cd ..

echo.
echo 🎯 Starting servers with simple commands...
echo.
echo 🌐 Frontend: npm start (in client directory)
echo 🔌 Backend: nodemon index.js (in server directory)
echo.
echo 📝 Demo accounts:
echo    Landlord: alice / password123
echo    Tenant: john_doe / tenant123
echo    Contractor: mike_contractor / contractor123
echo.
echo ⏳ Starting servers... (Press Ctrl+C to stop)
echo.

echo Starting backend server...
start "Backend Server" cmd /k "cd server && nodemon index.js"

echo Starting frontend server...
start "Frontend Server" cmd /k "cd client && npm start" 