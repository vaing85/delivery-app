# Environment Setup Guide

This guide explains how to set up environment variables for the Delivery App across different environments.

## 📁 Environment Files

- `backend/env.example` - Backend environment template
- `env.production.example` - Production environment template
- `web-portal/.env.example` - Frontend environment template (if needed)

## 🔧 Backend Environment Variables

### Required Variables

```bash
# Database Configuration
DATABASE_URL="file:./dev.db"  # Development (SQLite)
# DATABASE_URL="postgresql://username:password@localhost:5432/delivery_app_db"  # Production

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-minimum-32-characters
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here-minimum-32-characters
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### Optional Variables

```bash
# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp

# AWS S3 Configuration (for production file storage)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=delivery-app-uploads

# Redis Configuration (for caching and sessions)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Google Maps API (for geocoding and routing)
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Rapyd Payment Configuration
RAPYD_ACCESS_KEY=your-rapyd-access-key
RAPYD_SECRET_KEY=your-rapyd-secret-key
RAPYD_BASE_URL=https://sandboxapi.rapyd.net

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging Configuration
LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log

# Socket.IO Configuration
SOCKET_CORS_ORIGIN=http://localhost:3000
SOCKET_PING_TIMEOUT=60000
SOCKET_PING_INTERVAL=25000

# Development Configuration
ENABLE_SWAGGER=true
ENABLE_GRAPHIQL=false
```

## 🌐 Frontend Environment Variables

### Required Variables

```bash
# API Configuration
VITE_API_URL=http://localhost:5000  # Development
# VITE_API_URL=https://your-domain.com/api  # Production

# Google Maps API
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### Optional Variables

```bash
# Environment
VITE_NODE_ENV=development

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PUSH_NOTIFICATIONS=true
VITE_ENABLE_OFFLINE_MODE=true
```

## 🚀 Quick Setup

### 1. Development Setup

```bash
# Copy environment template
cp backend/env.example backend/.env

# Edit the .env file with your values
# At minimum, set JWT_SECRET and JWT_REFRESH_SECRET

# Start development servers
npm run dev
```

### 2. Production Setup

```bash
# Copy production environment template
cp env.production.example .env

# Edit the .env file with your production values
# Set all required variables including database credentials

# Build and start production
npm run build
npm start
```

## 🔐 Security Best Practices

### 1. JWT Secrets
- Use strong, random secrets (minimum 32 characters)
- Use different secrets for access and refresh tokens
- Rotate secrets regularly in production

### 2. Database Credentials
- Use strong passwords
- Use environment-specific databases
- Never commit credentials to version control

### 3. API Keys
- Keep API keys secure
- Use different keys for development and production
- Monitor API key usage

### 4. File Uploads
- Set appropriate file size limits
- Validate file types
- Use secure file storage in production

## 🌍 Environment-Specific Configurations

### Development
- Uses SQLite database (file:./dev.db)
- CORS allows localhost:3000
- Detailed error logging
- Hot reload enabled

### Staging
- Uses PostgreSQL database
- CORS allows staging domain
- Moderate logging
- Production-like configuration

### Production
- Uses PostgreSQL database
- CORS allows production domain
- Minimal logging
- All security features enabled
- CDN for static assets

## 🔧 Database Migration

### From SQLite to PostgreSQL

```bash
# 1. Set up PostgreSQL
export DATABASE_URL="postgresql://username:password@localhost:5432/delivery_app_prod"

# 2. Run migration script
cd backend
npm run db:migrate:postgres
npm run db:migrate:data

# 3. Update environment variables
# Change DATABASE_URL to PostgreSQL connection string
```

## 📝 Environment Validation

The application validates required environment variables on startup:

- `DATABASE_URL` - Database connection string
- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - Refresh token secret
- `PORT` - Server port (defaults to 5000)

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL format
   - Ensure database server is running
   - Verify credentials

2. **JWT Token Errors**
   - Check JWT_SECRET and JWT_REFRESH_SECRET
   - Ensure secrets are different
   - Verify token expiry settings

3. **CORS Errors**
   - Check CORS_ORIGIN setting
   - Ensure frontend URL matches
   - Add additional origins if needed

4. **File Upload Issues**
   - Check MAX_FILE_SIZE setting
   - Verify UPLOAD_PATH exists
   - Check ALLOWED_IMAGE_TYPES

### Debug Mode

Enable debug logging by setting:
```bash
LOG_LEVEL=debug
NODE_ENV=development
```

## 📚 Additional Resources

- [Prisma Environment Variables](https://www.prisma.io/docs/reference/database-reference/connection-urls)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [CORS Configuration](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Docker Environment Variables](https://docs.docker.com/compose/environment-variables/)
