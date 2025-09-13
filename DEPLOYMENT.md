# 🚀 Delivery App Deployment Guide

This guide provides comprehensive instructions for deploying the Delivery App to production.

## 📋 Prerequisites

### System Requirements
- **Operating System**: Linux (Ubuntu 20.04+), macOS, or Windows 10/11
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: Minimum 20GB free space
- **CPU**: 2+ cores recommended

### Software Requirements
- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+
- **Git**: For cloning the repository
- **OpenSSL**: For SSL certificate generation (optional)

### External Services
- **Google Maps API Key**: For map functionality
- **Domain Name**: For production deployment
- **SSL Certificate**: For HTTPS (Let's Encrypt recommended)

## 🏗️ Architecture Overview

The application consists of the following services:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │────│   Web Portal    │    │   Backend API   │
│   (Port 80/443) │    │   (Port 3000)   │    │   (Port 5000)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐    ┌─────────────────┐
                    │   PostgreSQL    │    │     Redis       │
                    │   (Port 5432)   │    │   (Port 6379)   │
                    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Deployment

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd delivery-app
```

### 2. Configure Environment
```bash
# Copy the example environment file
cp env.production.example .env

# Edit the .env file with your actual values
nano .env  # or use your preferred editor
```

### 3. Deploy with Scripts

#### For Linux/macOS:
```bash
chmod +x deploy.sh
./deploy.sh
```

#### For Windows PowerShell:
```powershell
.\deploy.ps1
```

### 4. Manual Deployment
```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up --build -d

# Run database migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma db push

# Seed database (optional)
docker-compose -f docker-compose.prod.yml exec backend npm run db:seed
```

## ⚙️ Configuration

### Environment Variables

#### Required Variables
```env
# Database
POSTGRES_PASSWORD=your_secure_password
DATABASE_URL=postgresql://delivery_user:password@postgres:5432/delivery_app_prod

# JWT Secrets (generate strong random strings)
JWT_SECRET=your_super_secure_jwt_secret_key_minimum_32_characters
JWT_REFRESH_SECRET=your_super_secure_refresh_jwt_secret_key_minimum_32_characters

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# URLs
FRONTEND_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com
VITE_API_URL=https://your-domain.com/api
```

#### Optional Variables
```env
# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# SMS (for notifications)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Payments
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# File Storage
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name
```

### SSL Certificates

#### Option 1: Let's Encrypt (Recommended)
```bash
# Install Certbot
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates to nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
```

#### Option 2: Self-Signed (Development)
```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=your-domain.com"
```

## 🔧 Service Management

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f web-portal
docker-compose -f docker-compose.prod.yml logs -f postgres
```

### Restart Services
```bash
# All services
docker-compose -f docker-compose.prod.yml restart

# Specific service
docker-compose -f docker-compose.prod.yml restart backend
```

### Update Services
```bash
# Pull latest changes and rebuild
git pull
docker-compose -f docker-compose.prod.yml up --build -d
```

### Stop Services
```bash
docker-compose -f docker-compose.prod.yml down
```

### Backup Database
```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U delivery_user delivery_app_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U delivery_user delivery_app_prod < backup_file.sql
```

## 📊 Monitoring & Health Checks

### Health Check Endpoints
- **Backend**: `http://your-domain.com/api/health`
- **Web Portal**: `http://your-domain.com/`
- **Database**: Check container logs

### Monitoring Setup
```bash
# Install monitoring tools (optional)
docker run -d --name prometheus -p 9090:9090 prom/prometheus
docker run -d --name grafana -p 3001:3000 grafana/grafana
```

## 🔒 Security Considerations

### 1. Environment Variables
- Never commit `.env` files to version control
- Use strong, unique passwords
- Rotate secrets regularly

### 2. Network Security
- Use HTTPS in production
- Configure firewall rules
- Limit database access

### 3. Container Security
- Keep Docker images updated
- Use non-root users in containers
- Scan images for vulnerabilities

### 4. Database Security
- Use strong passwords
- Enable SSL connections
- Regular backups

## 🚨 Troubleshooting

### Common Issues

#### 1. Services Won't Start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Check disk space
df -h

# Check memory usage
free -h
```

#### 2. Database Connection Issues
```bash
# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres

# Test connection
docker-compose -f docker-compose.prod.yml exec backend npx prisma db push
```

#### 3. SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Regenerate certificates
rm nginx/ssl/cert.pem nginx/ssl/key.pem
# Run SSL generation commands again
```

#### 4. Port Conflicts
```bash
# Check what's using ports
netstat -tulpn | grep :80
netstat -tulpn | grep :443
netstat -tulpn | grep :5000

# Stop conflicting services
sudo systemctl stop apache2  # if Apache is running
sudo systemctl stop nginx    # if system nginx is running
```

### Performance Optimization

#### 1. Database Optimization
```sql
-- Add indexes for better performance
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_deliveries_driver_id ON deliveries(driver_id);
```

#### 2. Nginx Optimization
```nginx
# Add to nginx.conf
worker_processes auto;
worker_connections 1024;

# Enable gzip compression
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

#### 3. Container Resource Limits
```yaml
# Add to docker-compose.prod.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
```

## 📈 Scaling

### Horizontal Scaling
```yaml
# Scale backend services
docker-compose -f docker-compose.prod.yml up --scale backend=3 -d
```

### Load Balancer Configuration
```nginx
upstream backend {
    server backend_1:5000;
    server backend_2:5000;
    server backend_3:5000;
}
```

## 🔄 Updates & Maintenance

### Regular Maintenance Tasks
1. **Weekly**: Check logs for errors
2. **Monthly**: Update dependencies
3. **Quarterly**: Security audit
4. **Annually**: SSL certificate renewal

### Update Process
```bash
# 1. Backup current state
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U delivery_user delivery_app_prod > backup_$(date +%Y%m%d).sql

# 2. Pull latest changes
git pull origin main

# 3. Update services
docker-compose -f docker-compose.prod.yml up --build -d

# 4. Run migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma db push

# 5. Verify deployment
curl -f http://your-domain.com/api/health
```

## 📞 Support

For deployment issues:
1. Check the logs first
2. Review this documentation
3. Check GitHub issues
4. Contact the development team

## 📄 License

This deployment guide is part of the Delivery App project and follows the same license terms.
