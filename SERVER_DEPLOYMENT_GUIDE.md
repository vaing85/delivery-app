# 🚀 Server Deployment Guide

## 📋 Prerequisites

### Server Requirements
- **OS**: Ubuntu 20.04+ or CentOS 7+
- **RAM**: Minimum 2GB, Recommended 4GB+
- **Storage**: Minimum 20GB SSD
- **CPU**: 2+ cores recommended
- **Network**: Public IP with ports 80, 443, 22 open

### Required Software
- Docker & Docker Compose
- Git
- SSL Certificate (Let's Encrypt recommended)
- Domain name (optional but recommended)

## 🔧 Server Setup Steps

### 1. Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y git curl wget unzip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again for Docker group changes
```

### 2. Clone Repository

```bash
# Clone your repository
git clone https://github.com/vaing85/delivery-app.git
cd delivery-app

# Create production environment file
cp env.production.example .env
```

### 3. Configure Environment Variables

Edit the `.env` file with your production values:

```bash
# Database Configuration
POSTGRES_PASSWORD=your_secure_database_password_here
DATABASE_URL=postgresql://delivery_user:your_secure_password@postgres:5432/delivery_app_prod

# JWT Configuration (Generate secure random strings)
JWT_SECRET=your_super_secure_jwt_secret_key_64_chars_minimum_here
JWT_REFRESH_SECRET=your_super_secure_refresh_jwt_secret_key_64_chars_minimum

# Domain Configuration
FRONTEND_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com

# API Keys (Replace with your actual keys)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
SENDGRID_API_KEY=your_sendgrid_api_key
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
```

### 4. SSL Certificate Setup

#### Option A: Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install -y certbot

# Generate SSL certificate (replace yourdomain.com)
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy certificates to nginx directory
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem
sudo chown $USER:$USER nginx/ssl/*.pem
```

#### Option B: Self-Signed (Development)

```bash
# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=yourdomain.com"
```

### 5. Deploy Application

```bash
# Build and start production services
docker-compose -f docker-compose.prod.yml up --build -d

# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs if needed
docker-compose -f docker-compose.prod.yml logs -f
```

### 6. Database Setup

```bash
# Run database migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Generate Prisma client
docker-compose -f docker-compose.prod.yml exec backend npx prisma generate
```

## 🔒 Security Configuration

### Firewall Setup

```bash
# Install and configure UFW
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

## 📊 Monitoring & Maintenance

### Health Checks

```bash
# Check application health
curl -f https://yourdomain.com/api/health

# Check individual services
docker-compose -f docker-compose.prod.yml ps
```

### Backup Strategy

```bash
# Database backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U delivery_user delivery_app_prod > backup_$(date +%Y%m%d).sql
```

## 🚀 Popular Cloud Deployment Options

### 1. DigitalOcean Droplet
- **Cost**: $20/month droplet (4GB RAM, 2 CPUs)
- **Setup**: Use Ubuntu 20.04 image

### 2. AWS EC2
- **Instance**: t3.medium (4GB RAM, 2 vCPUs)
- **AMI**: Ubuntu 20.04
- **Security Groups**: Ports 22, 80, 443

### 3. Google Cloud Platform
- **Instance**: e2-medium (4GB RAM, 2 vCPUs)
- **Image**: Ubuntu 20.04

### 4. Linode
- **Plan**: Linode 4GB
- **Image**: Ubuntu 20.04

## ✅ Post-Deployment Checklist

- [ ] Application accessible via HTTPS
- [ ] SSL certificate valid and secure
- [ ] Database connected and migrations applied
- [ ] Email notifications working
- [ ] Payment processing working (Stripe)
- [ ] Real-time features working (WebSocket)
- [ ] Monitoring and logging configured
- [ ] Security headers configured
- [ ] Firewall properly configured

## 🆘 Troubleshooting

### Common Issues

1. **Port conflicts**: Check if ports are already in use
2. **SSL issues**: Verify certificate paths and permissions
3. **Database connection**: Check environment variables and network
4. **Memory issues**: Monitor RAM usage, upgrade server if needed

### Debug Commands

```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs backend

# Check resource usage
docker stats
```

## 🎉 Success!

Your delivery app is now deployed to production! 

**Access URLs:**
- **Web Application**: https://yourdomain.com
- **API Documentation**: https://yourdomain.com/api/docs

---

**Need Help?** Check the logs, review the configuration, or consult the troubleshooting section above.
