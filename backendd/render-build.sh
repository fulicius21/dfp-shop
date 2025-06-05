#!/bin/bash
# Render.com Build Script - Optimiert für kostenlose Tier
# Für DressForPleasure Backend

echo "🚀 Starting Render Build Process..."

# Update npm to latest version for better performance
npm install -g npm@latest

echo "📦 Installing dependencies..."
# Use npm install instead of npm ci for better compatibility
npm install --omit=dev --silent

echo "🔨 Building TypeScript..."
# Build the TypeScript project
npm run build

echo "✅ Build completed successfully!"

# Verify build
if [ -d "dist" ]; then
    echo "✅ Build directory created successfully"
    ls -la dist/
else
    echo "❌ Build failed - no dist directory found"
    exit 1
fi

echo "🎉 Ready for deployment!"
