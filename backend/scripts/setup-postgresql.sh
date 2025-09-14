#!/bin/bash

# PostgreSQL Setup Script for Delivery App
# This script sets up PostgreSQL database for production deployment

set -e

echo "🚀 Setting up PostgreSQL for Delivery App..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    echo "   On Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
    echo "   On macOS: brew install postgresql"
    echo "   On Windows: Download from https://www.postgresql.org/download/"
    exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set."
    echo "   Please set DATABASE_URL to your PostgreSQL connection string."
    echo "   Example: export DATABASE_URL='postgresql://username:password@localhost:5432/delivery_app_prod'"
    exit 1
fi

# Extract database connection details
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')

echo "📊 Database Details:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"

# Test database connection
echo "🔌 Testing database connection..."
if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ Cannot connect to database. Please check your DATABASE_URL and ensure PostgreSQL is running."
    exit 1
fi

# Create database if it doesn't exist
echo "🗄️  Creating database if it doesn't exist..."
psql "$DATABASE_URL" -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Database already exists"

# Run Prisma migrations
echo "🔄 Running Prisma migrations..."
npm run db:generate:postgres
npm run db:push:postgres

# Run data migration if SQLite database exists
if [ -f "prisma/dev.db" ]; then
    echo "📦 Migrating data from SQLite to PostgreSQL..."
    npm run db:migrate:data
else
    echo "⚠️  SQLite database not found. Skipping data migration."
    echo "   Run 'npm run db:seed' to populate with sample data."
fi

echo "✅ PostgreSQL setup completed successfully!"
echo ""
echo "🎯 Next steps:"
echo "   1. Update your .env file to use PostgreSQL DATABASE_URL"
echo "   2. Restart your application"
echo "   3. Test the application to ensure everything works"
echo ""
echo "📝 Useful commands:"
echo "   - View database: npm run db:studio"
echo "   - Run migrations: npm run db:migrate:postgres"
echo "   - Reset database: npm run db:push:postgres"
