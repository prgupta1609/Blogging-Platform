#!/bin/bash

# BlogHub Setup Script
# This script helps you set up your BlogHub blogging platform

echo "🚀 Welcome to BlogHub Setup!"
echo "=============================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) is installed"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm $(npm -v) is installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "🔧 Creating environment configuration..."
    cat > .env.local << EOF
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Optional: Enable debug mode
VITE_DEBUG=false
EOF
    echo "✅ Created .env.local file"
    echo "⚠️  Please update .env.local with your Supabase credentials"
else
    echo "✅ .env.local already exists"
fi

# Check if Supabase is configured
if grep -q "your_supabase_project_url_here" .env.local; then
    echo "⚠️  Please configure your Supabase credentials in .env.local"
    echo "   Visit: https://supabase.com/ to create a project"
fi

echo ""
echo "🎉 Setup complete! Next steps:"
echo "1. Configure your Supabase credentials in .env.local"
echo "2. Run the database migrations in supabase/migrations/"
echo "3. Start the development server: npm run dev"
echo ""
echo "📚 For more information, check the README.md and DEPLOYMENT.md files"
echo ""
echo "Happy blogging! 🚀"
