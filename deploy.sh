#!/bin/bash

# Delivery App Deployment Script
# This script deploys the delivery app to production

set -e

echo "🚀 Starting Delivery App Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from example..."
    if [ -f env.production.example ]; then
        cp env.production.example .env
        print_warning "Please edit .env file with your actual values before continuing."
        exit 1
    else
        print_error "env.production.example file not found. Please create .env file manually."
        exit 1
    fi
fi

# Load environment variables
source .env

# Validate required environment variables
required_vars=("POSTGRES_PASSWORD" "JWT_SECRET" "JWT_REFRESH_SECRET" "VITE_GOOGLE_MAPS_API_KEY")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        print_error "Required environment variable $var is not set in .env file"
        exit 1
    fi
done

print_status "Environment variables validated successfully"

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p nginx/ssl
mkdir -p backend/uploads
mkdir -p logs

# Generate SSL certificates (self-signed for development)
if [ ! -f nginx/ssl/cert.pem ] || [ ! -f nginx/ssl/key.pem ]; then
    print_warning "SSL certificates not found. Generating self-signed certificates..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/key.pem \
        -out nginx/ssl/cert.pem \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    print_status "SSL certificates generated"
fi

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down --remove-orphans

# Build and start services
print_status "Building and starting services..."
docker-compose -f docker-compose.prod.yml up --build -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Check if services are running
print_status "Checking service health..."

# Check backend health
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    print_status "Backend service is healthy"
else
    print_error "Backend service is not responding"
    docker-compose -f docker-compose.prod.yml logs backend
    exit 1
fi

# Check web portal
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_status "Web portal is accessible"
else
    print_error "Web portal is not accessible"
    docker-compose -f docker-compose.prod.yml logs web-portal
    exit 1
fi

# Run database migrations
print_status "Running database migrations..."
docker-compose -f docker-compose.prod.yml exec backend npx prisma db push

# Seed database (optional)
read -p "Do you want to seed the database with sample data? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Seeding database..."
    docker-compose -f docker-compose.prod.yml exec backend npm run db:seed
fi

# Show deployment summary
print_status "Deployment completed successfully!"
echo
echo "📊 Deployment Summary:"
echo "======================"
echo "Backend API: http://localhost:5000"
echo "Web Portal: http://localhost:3000"
echo "Nginx Proxy: http://localhost:80 (HTTP) / https://localhost:443 (HTTPS)"
echo
echo "🔧 Management Commands:"
echo "======================"
echo "View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "Stop services: docker-compose -f docker-compose.prod.yml down"
echo "Restart services: docker-compose -f docker-compose.prod.yml restart"
echo "Update services: docker-compose -f docker-compose.prod.yml up --build -d"
echo
echo "📝 Next Steps:"
echo "=============="
echo "1. Configure your domain name in the .env file"
echo "2. Set up proper SSL certificates for production"
echo "3. Configure your reverse proxy/DNS"
echo "4. Set up monitoring and logging"
echo "5. Configure backup strategies"
echo
print_status "Deployment script completed!"
