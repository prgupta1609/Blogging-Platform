@echo off
REM BlogHub Setup Script for Windows
REM This script helps you set up your BlogHub blogging platform

echo 🚀 Welcome to BlogHub Setup!
echo ==============================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    echo    Visit: https://nodejs.org/
    pause
    exit /b 1
)

REM Check Node.js version
for /f "tokens=1,2 delims=." %%a in ('node --version') do set NODE_VERSION=%%a
set NODE_VERSION=%NODE_VERSION:~1%
if %NODE_VERSION% lss 18 (
    echo ❌ Node.js version 18+ is required. Current version: 
    node --version
    pause
    exit /b 1
)

echo ✅ Node.js 
node --version
echo  is installed

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ npm 
npm --version
echo  is installed

REM Install dependencies
echo 📦 Installing dependencies...
npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully

REM Check if .env.local exists
if not exist .env.local (
    echo 🔧 Creating environment configuration...
    (
        echo # Supabase Configuration
        echo VITE_SUPABASE_URL=your_supabase_project_url_here
        echo VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
        echo.
        echo # Optional: Enable debug mode
        echo VITE_DEBUG=false
    ) > .env.local
    echo ✅ Created .env.local file
    echo ⚠️  Please update .env.local with your Supabase credentials
) else (
    echo ✅ .env.local already exists
)

REM Check if Supabase is configured
findstr "your_supabase_project_url_here" .env.local >nul
if %errorlevel% equ 0 (
    echo ⚠️  Please configure your Supabase credentials in .env.local
    echo    Visit: https://supabase.com/ to create a project
)

echo.
echo 🎉 Setup complete! Next steps:
echo 1. Configure your Supabase credentials in .env.local
echo 2. Run the database migrations in supabase/migrations/
echo 3. Start the development server: npm run dev
echo.
echo 📚 For more information, check the README.md and DEPLOYMENT.md files
echo.
echo Happy blogging! 🚀
pause
