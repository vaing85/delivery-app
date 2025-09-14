# 🚀 Production Deployment Guide

## **Complete Production Setup for Delivery App**

This guide provides step-by-step instructions for deploying the Delivery App to production with enterprise-grade monitoring, security, and reliability.

---

## 📋 **Prerequisites**

### **System Requirements**
- **OS**: Ubuntu 20.04+ / CentOS 8+ / RHEL 8+
- **RAM**: Minimum 8GB, Recommended 16GB+
- **CPU**: Minimum 4 cores, Recommended 8 cores+
- **Storage**: Minimum 100GB SSD
- **Network**: Static IP address, Domain name

### **Software Requirements**
- Docker 20.10+
- Docker Compose 2.0+
- Git
- OpenSSL
- Certbot (for SSL certificates)

---

## 🛠 **Step 1: Server Setup**

### **1.1 Update System**
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

### **1.2 Install Docker**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### **1.3 Install Additional Tools**
```bash
# Install Certbot for SSL
sudo apt install certbot -y  # Ubuntu/Debian
# or
sudo yum install certbot -y  # CentOS/RHEL

# Install OpenSSL
sudo apt install openssl -y  # Ubuntu/Debian
# or
sudo yum install openssl -y  # CentOS/RHEL
```

---

## 📁 **Step 2: Application Setup**

### **2.1 Clone Repository**
```bash
git clone https://github.com/your-org/delivery-app.git
cd delivery-app
```

### **2.2 Configure Environment**
```bash
# Copy production environment file
cp production/env.production.example production/.env

# Edit environment variables
nano production/.env
```

### **2.3 Update Environment Variables**
```bash
# Database Configuration
POSTGRES_DB=delivery_app_prod
POSTGRES_USER=delivery_user
POSTGRES_PASSWORD=your-super-secure-postgres-password

# Redis Configuration
REDIS_PASSWORD=your-super-secure-redis-password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this

# Domain Configuration
CORS_ORIGIN=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
VITE_API_URL=https://api.yourdomain.com
```

---

## 🔒 **Step 3: SSL Certificate Setup**

### **3.1 Generate SSL Certificates**
```bash
# Make SSL setup script executable
chmod +x production/scripts/setup-ssl.sh

# Generate Let's Encrypt certificate
./production/scripts/setup-ssl.sh --letsencrypt --domain yourdomain.com --email admin@yourdomain.com

# Or generate self-signed certificate for testing
./production/scripts/setup-ssl.sh --self-signed --domain yourdomain.com
```

### **3.2 Verify SSL Setup**
```bash
# Verify certificate
./production/scripts/setup-ssl.sh --verify

# Test SSL configuration
./production/scripts/setup-ssl.sh --test
```

---

## 🗄️ **Step 4: Database Setup**

### **4.1 Start Database Services**
```bash
# Start PostgreSQL and Redis
docker-compose -f production/docker-compose.prod.yml up -d postgres redis

# Wait for services to be ready
sleep 30
```

### **4.2 Run Database Migrations**
```bash
# Run migrations
docker-compose -f production/docker-compose.prod.yml exec backend npm run db:migrate:prod

# Seed initial data (optional)
docker-compose -f production/docker-compose.prod.yml exec backend npm run db:seed
```

---

## 🚀 **Step 5: Application Deployment**

### **5.1 Deploy Application**
```bash
# Make deployment script executable
chmod +x production/scripts/deploy.sh

# Deploy application
./production/scripts/deploy.sh
```

### **5.2 Verify Deployment**
```bash
# Check deployment status
./production/scripts/deploy.sh --status

# Check service health
curl -f http://localhost/health
```

---

## 📊 **Step 6: Monitoring Setup**

### **6.1 Start Monitoring Stack**
```bash
# Start monitoring services
docker-compose -f monitoring/docker-compose.monitoring.yml up -d

# Wait for services to start
sleep 60
```

### **6.2 Access Monitoring Dashboards**
- **Grafana**: http://yourdomain.com:3001 (admin/admin123)
- **Prometheus**: http://yourdomain.com:9090
- **AlertManager**: http://yourdomain.com:9093

### **6.3 Configure Monitoring**
1. **Import Dashboard**: Import `monitoring/grafana/dashboards/delivery-app-dashboard.json`
2. **Configure Alerts**: Set up email/Slack notifications
3. **Set Up Logging**: Configure log aggregation

---

## 🔄 **Step 7: Backup Setup**

### **7.1 Configure Automated Backups**
```bash
# Make backup script executable
chmod +x production/scripts/backup.sh

# Test backup
./production/scripts/backup.sh

# Set up cron job for daily backups
(crontab -l 2>/dev/null; echo "0 2 * * * $(pwd)/production/scripts/backup.sh") | crontab -
```

### **7.2 Test Backup and Restore**
```bash
# List available backups
./production/scripts/restore.sh --list

# Test restore (be careful in production!)
./production/scripts/restore.sh /backup/backup_20240115_120000.dump
```

---

## 🔧 **Step 8: Production Optimization**

### **8.1 Configure Firewall**
```bash
# Allow necessary ports
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22
sudo ufw enable
```

### **8.2 Configure Log Rotation**
```bash
# Create logrotate configuration
sudo tee /etc/logrotate.d/delivery-app << EOF
/var/log/delivery-app/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
}
EOF
```

### **8.3 Set Up Process Monitoring**
```bash
# Install PM2 for process monitoring
npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'delivery-app',
    script: 'production/scripts/deploy.sh',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
EOF
```

---

## 🚨 **Step 9: Security Hardening**

### **9.1 Configure Security Headers**
- SSL/TLS configuration is already set in `nginx.prod.conf`
- Security headers are configured
- Rate limiting is enabled

### **9.2 Set Up Intrusion Detection**
```bash
# Install fail2ban
sudo apt install fail2ban -y

# Configure fail2ban for nginx
sudo tee /etc/fail2ban/jail.local << EOF
[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
EOF

# Start fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### **9.3 Regular Security Updates**
```bash
# Set up automatic security updates
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 📈 **Step 10: Performance Optimization**

### **10.1 Database Optimization**
```sql
-- Connect to PostgreSQL
psql -h localhost -U delivery_user -d delivery_app_prod

-- Analyze tables for better performance
ANALYZE;

-- Check query performance
EXPLAIN ANALYZE SELECT * FROM orders WHERE status = 'PENDING';
```

### **10.2 Application Optimization**
- **Caching**: Redis is configured for session and data caching
- **CDN**: Consider using CloudFlare or AWS CloudFront
- **Load Balancing**: Nginx is configured for load balancing

### **10.3 Monitoring Performance**
- Use Grafana dashboards to monitor performance
- Set up alerts for high CPU/memory usage
- Monitor database query performance

---

## 🔍 **Step 11: Health Checks and Monitoring**

### **11.1 Application Health Checks**
```bash
# Check application health
curl -f https://yourdomain.com/health

# Check API health
curl -f https://api.yourdomain.com/health

# Check database connectivity
docker-compose -f production/docker-compose.prod.yml exec postgres pg_isready
```

### **11.2 Monitoring Alerts**
- **High Error Rate**: > 10 errors per second
- **High Response Time**: > 1 second 95th percentile
- **High Memory Usage**: > 90% memory usage
- **Database Issues**: Connection failures
- **SSL Certificate**: Expiration warnings

---

## 🚀 **Step 12: Scaling and Load Balancing**

### **12.1 Horizontal Scaling**
```bash
# Scale backend services
docker-compose -f production/docker-compose.prod.yml up -d --scale backend=3

# Scale frontend services
docker-compose -f production/docker-compose.prod.yml up -d --scale frontend=2
```

### **12.2 Load Balancer Configuration**
- Nginx is configured for load balancing
- Health checks are enabled
- Sticky sessions are configured

---

## 📋 **Step 13: Maintenance and Updates**

### **13.1 Regular Maintenance Tasks**
```bash
# Daily backup verification
./production/scripts/backup.sh

# Weekly security updates
sudo apt update && sudo apt upgrade -y

# Monthly certificate renewal
./production/scripts/setup-ssl.sh --renew
```

### **13.2 Application Updates**
```bash
# Pull latest changes
git pull origin main

# Deploy updates
./production/scripts/deploy.sh

# Rollback if needed
./production/scripts/deploy.sh --rollback
```

---

## 🆘 **Troubleshooting**

### **Common Issues**

#### **1. SSL Certificate Issues**
```bash
# Check certificate validity
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Renew certificate
./production/scripts/setup-ssl.sh --renew
```

#### **2. Database Connection Issues**
```bash
# Check database status
docker-compose -f production/docker-compose.prod.yml exec postgres pg_isready

# Check database logs
docker-compose -f production/docker-compose.prod.yml logs postgres
```

#### **3. Application Not Starting**
```bash
# Check application logs
docker-compose -f production/docker-compose.prod.yml logs backend

# Check service status
./production/scripts/deploy.sh --status
```

#### **4. High Memory Usage**
```bash
# Check memory usage
docker stats

# Restart services
docker-compose -f production/docker-compose.prod.yml restart
```

---

## 📞 **Support and Maintenance**

### **Monitoring Dashboards**
- **Grafana**: http://yourdomain.com:3001
- **Prometheus**: http://yourdomain.com:9090
- **Application**: http://yourdomain.com

### **Log Locations**
- **Application Logs**: `./backend/logs/`
- **Nginx Logs**: `./nginx/logs/`
- **Database Logs**: Docker container logs

### **Backup Locations**
- **Database Backups**: `./postgres/backup/`
- **Configuration Backups**: `./backup/`

---

## ✅ **Production Checklist**

- [ ] **Server Setup**: OS updated, Docker installed
- [ ] **SSL Certificates**: Valid certificates installed
- [ ] **Environment Variables**: All production values set
- [ ] **Database**: Migrations run, data seeded
- [ ] **Application**: Deployed and healthy
- [ ] **Monitoring**: Grafana and Prometheus running
- [ ] **Backups**: Automated backups configured
- [ ] **Security**: Firewall, fail2ban configured
- [ ] **Performance**: Optimized and monitored
- [ ] **Health Checks**: All endpoints responding
- [ ] **Documentation**: Team trained on procedures

---

## 🎯 **Next Steps**

1. **Set up CI/CD pipeline** for automated deployments
2. **Configure monitoring alerts** for critical metrics
3. **Set up log aggregation** (ELK stack, Splunk)
4. **Implement disaster recovery** procedures
5. **Set up staging environment** for testing
6. **Configure CDN** for static assets
7. **Set up load testing** for performance validation

---

**🎉 Congratulations! Your Delivery App is now production-ready with enterprise-grade features!**

*For additional support, refer to the API documentation and monitoring dashboards.*
