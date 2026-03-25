#!/bin/bash
# scripts/setup.sh

echo "🚀 Setting up Velozity Backend..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please update .env with your database credentials and other settings"
fi

# Generate secure keys
echo "🔑 Generating secure keys..."
npm run generate:keys

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🏗️  Generating Prisma client..."
npm run prisma:generate

# Run database migrations
echo "🗄️  Running database migrations..."
npm run prisma:migrate

# Seed database
echo "🌱 Seeding database..."
npm run prisma:seed

echo "✅ Setup complete! Run 'npm run dev' to start the application"