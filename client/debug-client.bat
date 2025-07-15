@echo off
echo 🔍 Diagnosing Client Issues...
echo.

echo 📋 Checking Node.js version...
node --version
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo 📦 Checking npm version...
npm --version

echo.
echo 🗂️  Checking directory structure...
if not exist "src" (
    echo ❌ src directory not found
    echo Current directory: %CD%
    dir
    pause
    exit /b 1
)

if not exist "package.json" (
    echo ❌ package.json not found
    echo Please run this script from the client directory
    pause
    exit /b 1
)

echo.
echo 🧹 Cleaning up...
if exist "node_modules" (
    echo Removing old node_modules...
    rmdir /s /q node_modules
)

if exist "package-lock.json" (
    echo Removing package-lock.json...
    del package-lock.json
)

echo.
echo 📦 Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo ❌ npm install failed
    echo.
    echo 🔧 Trying alternative installation...
    call npm install --legacy-peer-deps
)

echo.
echo 🔍 Checking for common issues...

echo.
echo 📁 Checking src files...
if not exist "src\App.js" (
    echo ❌ src\App.js not found
) else (
    echo ✅ src\App.js exists
)

if not exist "src\index.js" (
    echo ❌ src\index.js not found
) else (
    echo ✅ src\index.js exists
)

echo.
echo 🔧 Checking environment...
if not exist ".env" (
    echo ⚠️  .env file not found, creating from template...
    if exist "env.example" (
        copy env.example .env
        echo ✅ Created .env from template
    ) else (
        echo ❌ env.example not found
    )
) else (
    echo ✅ .env file exists
)

echo.
echo 🧪 Testing React Scripts...
call npx react-scripts --version

echo.
echo 🚀 Attempting to start development server...
echo.
echo If you see errors below, they will help identify the issue:
echo.

call npm start

pause 