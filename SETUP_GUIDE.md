# 🚚 Delivery App - Complete Setup Guide

This guide will walk you through setting up the complete delivery management application with backend, web portal, and mobile app components.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- **PostgreSQL** 14+ ([Download](https://www.postgresql.org/download/))
- **Redis** 6+ ([Download](https://redis.io/download))
- **Flutter** 3.0+ ([Download](https://flutter.dev/docs/get-started/install))
- **Git** ([Download](https://git-scm.com/downloads))

## 🏗️ Project Structure

```
delivery-app/
├── backend/              # Node.js/Express API server
├── web-portal/           # React web application
├── mobile-app/           # Flutter mobile app
├── shared/               # Shared types and utilities
├── package.json          # Root package.json with workspaces
└── README.md            # Project overview
```

## 🚀 Quick Start

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd delivery-app

# Install all dependencies (root, backend, and web-portal)
npm run install:all
```

### 2. Environment Configuration

Create environment files for each component:

#### Backend (.env)
```bash
cd backend
cp .env.example .env
```

Fill in the following required variables:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/delivery_app"

# JWT Secrets (generate strong random strings)
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-here

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Redis
REDIS_URL=redis://localhost:6379

# File Upload (local storage)
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

#### Web Portal (.env)
```bash
cd web-portal
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=Delivery App
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### 3. Database Setup

#### PostgreSQL Setup
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE delivery_app;

# Create user (optional)
CREATE USER delivery_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE delivery_app TO delivery_user;

# Exit psql
\q
```

#### Run Database Migrations
```bash
cd backend

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Seed database with sample data
npm run db:seed
```

### 4. Start Development Servers

#### Option 1: Start All Services (Recommended)
```bash
# From root directory
npm run dev
```

This will start both backend and web-portal simultaneously.

#### Option 2: Start Services Individually

**Backend:**
```bash
cd backend
npm run dev
```

**Web Portal:**
```bash
cd web-portal
npm run dev
```

### 5. Access the Application

- **Backend API**: http://localhost:5000
- **Web Portal**: http://localhost:3000
- **API Health Check**: http://localhost:5000/health
- **API Documentation**: http://localhost:5000/api-docs

## 🔧 Detailed Setup Instructions

### Backend Setup

#### 1. Install Dependencies
```bash
cd backend
npm install
```

#### 2. Database Configuration
The backend uses Prisma ORM with PostgreSQL. The schema is already defined in `prisma/schema.prisma`.

#### 3. Environment Variables
Ensure all required environment variables are set in your `.env` file.

#### 4. File Upload Directory
```bash
# Create uploads directory
mkdir uploads
chmod 755 uploads
```

#### 5. Redis Setup
```bash
# Start Redis server
redis-server

# Test Redis connection
redis-cli ping
# Should return: PONG
```

### Web Portal Setup

#### 1. Install Dependencies
```bash
cd web-portal
npm install
```

#### 2. Environment Configuration
Set the API URL to point to your backend server.

#### 3. Google Maps Integration
To enable map functionality:
1. Get a Google Maps API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Add it to your `.env` file
3. Enable the following APIs:
   - Maps JavaScript API
   - Geocoding API
   - Directions API
   - Places API

### Mobile App Setup

#### 1. Flutter Environment
```bash
cd mobile-app

# Check Flutter installation
flutter doctor

# Get dependencies
flutter pub get
```

#### 2. Platform Setup

**Android:**
```bash
# Ensure Android SDK is configured
flutter doctor --android-licenses

# Run on Android device/emulator
flutter run -d android
```

**iOS:**
```bash
# Ensure Xcode is installed and configured
flutter doctor

# Run on iOS simulator/device
flutter run -d ios
```

## 🗄️ Database Schema

The application includes the following main entities:

- **Users**: Customers, Drivers, Admins, Dispatchers
- **Orders**: Delivery orders with items and status tracking
- **Deliveries**: Driver assignments and delivery tracking
- **Signatures**: Digital signature capture
- **Photos**: Delivery proof and documentation
- **Notifications**: User alerts and updates

## 🔐 Authentication & Security

- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Rate limiting and DDoS protection
- Input validation and sanitization
- CORS configuration

## 📱 Features

### Core Functionality
- User authentication and authorization
- Order creation and management
- Driver assignment and tracking
- Real-time status updates
- Digital signature capture
- Photo documentation
- Push notifications

### Web Portal
- Responsive Material-UI design
- Real-time dashboard with charts
- Order management interface
- User management (Admin)
- Delivery tracking
- Analytics and reporting

### Mobile App
- Cross-platform (iOS/Android)
- Offline capability
- GPS tracking
- Camera integration
- Signature capture
- Push notifications

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
npm run test:watch
npm run test:coverage
```

### Web Portal Tests
```bash
cd web-portal
npm test
npm run test:ui
npm run test:coverage
```

### Mobile App Tests
```bash
cd mobile-app
flutter test
```

## 🚀 Deployment

### Backend Deployment
```bash
cd backend

# Build for production
npm run build

# Start production server
npm start
```

### Web Portal Deployment
```bash
cd web-portal

# Build for production
npm run build

# Deploy to your hosting service
# (Netlify, Vercel, AWS S3, etc.)
```

### Mobile App Deployment
```bash
cd mobile-app

# Build APK
flutter build apk --release

# Build iOS
flutter build ios --release
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Database Connection Failed
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure database exists
- Verify user permissions

#### 2. Redis Connection Failed
- Verify Redis server is running
- Check REDIS_URL in .env
- Test with `redis-cli ping`

#### 3. Port Already in Use
- Change PORT in .env
- Kill process using the port: `lsof -ti:5000 | xargs kill -9`

#### 4. CORS Issues
- Verify FRONTEND_URL in backend .env
- Check CORS configuration in backend/src/index.ts

#### 5. File Upload Issues
- Ensure uploads directory exists
- Check directory permissions
- Verify MAX_FILE_SIZE in .env

### Debug Mode

Enable debug logging:
```bash
# Backend
NODE_ENV=development DEBUG=* npm run dev

# Web Portal
npm run dev -- --debug
```

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:5000/swagger
- **ReDoc**: http://localhost:5000/redoc
- **OpenAPI JSON**: http://localhost:5000/api-docs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests for new functionality
5. Run the test suite: `npm test`
6. Commit your changes: `git commit -am 'Add feature'`
7. Push to the branch: `git push origin feature-name`
8. Submit a pull request

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the logs for error messages
3. Check the GitHub issues page
4. Create a new issue with detailed information

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎯 Next Steps

After successful setup:

1. **Explore the API**: Test endpoints using the Swagger UI
2. **Create Test Data**: Use the seed script to populate the database
3. **Test Features**: Try creating orders, assigning drivers, and tracking deliveries
4. **Customize**: Modify the UI, add new features, or integrate with external services
5. **Deploy**: Set up production environment and deploy to your hosting platform

---

**Happy Coding! 🚀**

For additional help, refer to the individual component README files or create an issue in the repository.
