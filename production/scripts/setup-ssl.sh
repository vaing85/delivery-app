#!/bin/bash

# SSL Certificate setup script for production
# This script helps set up SSL certificates for the delivery app

set -e

# Configuration
DOMAIN="deliveryapp.com"
EMAIL="admin@deliveryapp.com"
SSL_DIR="nginx/ssl"
CERT_FILE="$SSL_DIR/cert.pem"
KEY_FILE="$SSL_DIR/key.pem"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Error handling
error_exit() {
    log "${RED}ERROR: $1${NC}"
    exit 1
}

# Success message
success() {
    log "${GREEN}SUCCESS: $1${NC}"
}

# Warning message
warning() {
    log "${YELLOW}WARNING: $1${NC}"
}

# Info message
info() {
    log "${BLUE}INFO: $1${NC}"
}

# Function to check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if certbot is installed
    if ! command -v certbot &> /dev/null; then
        warning "Certbot is not installed. Installing..."
        install_certbot
    fi
    
    # Check if openssl is installed
    if ! command -v openssl &> /dev/null; then
        error_exit "OpenSSL is not installed"
    fi
    
    success "Prerequisites check passed"
}

# Function to install certbot
install_certbot() {
    log "Installing Certbot..."
    
    # Detect OS and install certbot
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v apt-get &> /dev/null; then
            sudo apt-get update
            sudo apt-get install -y certbot
        elif command -v yum &> /dev/null; then
            sudo yum install -y certbot
        else
            error_exit "Unsupported Linux distribution"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            brew install certbot
        else
            error_exit "Homebrew is not installed"
        fi
    else
        error_exit "Unsupported operating system"
    fi
    
    success "Certbot installed"
}

# Function to create SSL directory
create_ssl_directory() {
    log "Creating SSL directory..."
    
    if [ ! -d "$SSL_DIR" ]; then
        mkdir -p "$SSL_DIR"
        success "SSL directory created: $SSL_DIR"
    else
        info "SSL directory already exists: $SSL_DIR"
    fi
}

# Function to generate self-signed certificate
generate_self_signed() {
    log "Generating self-signed certificate..."
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$KEY_FILE" \
        -out "$CERT_FILE" \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN" \
        -addext "subjectAltName=DNS:$DOMAIN,DNS:www.$DOMAIN,DNS:api.$DOMAIN"
    
    success "Self-signed certificate generated"
}

# Function to obtain Let's Encrypt certificate
obtain_letsencrypt() {
    log "Obtaining Let's Encrypt certificate..."
    
    # Stop nginx if running
    if docker-compose -f docker-compose.prod.yml ps nginx | grep -q "Up"; then
        log "Stopping nginx for certificate generation..."
        docker-compose -f docker-compose.prod.yml stop nginx
    fi
    
    # Generate certificate
    sudo certbot certonly --standalone \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        -d "$DOMAIN" \
        -d "www.$DOMAIN" \
        -d "api.$DOMAIN"
    
    # Copy certificates to SSL directory
    sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$CERT_FILE"
    sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$KEY_FILE"
    sudo chown $(whoami):$(whoami) "$CERT_FILE" "$KEY_FILE"
    
    success "Let's Encrypt certificate obtained"
}

# Function to setup certificate renewal
setup_renewal() {
    log "Setting up certificate renewal..."
    
    # Create renewal script
    cat > "scripts/renew-ssl.sh" << EOF
#!/bin/bash
# SSL Certificate renewal script

set -e

# Renew certificates
sudo certbot renew --quiet

# Copy renewed certificates
sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$CERT_FILE"
sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$KEY_FILE"
sudo chown $(whoami):$(whoami) "$CERT_FILE" "$KEY_FILE"

# Reload nginx
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload

echo "SSL certificates renewed successfully"
EOF
    
    chmod +x "scripts/renew-ssl.sh"
    
    # Add cron job for automatic renewal
    (crontab -l 2>/dev/null; echo "0 2 * * * $(pwd)/scripts/renew-ssl.sh") | crontab -
    
    success "Certificate renewal setup completed"
}

# Function to verify certificate
verify_certificate() {
    log "Verifying certificate..."
    
    if [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; then
        error_exit "Certificate files not found"
    fi
    
    # Check certificate validity
    if openssl x509 -in "$CERT_FILE" -text -noout > /dev/null 2>&1; then
        success "Certificate is valid"
        
        # Show certificate details
        info "Certificate details:"
        openssl x509 -in "$CERT_FILE" -text -noout | grep -E "(Subject:|Issuer:|Not Before:|Not After:|DNS:)"
    else
        error_exit "Certificate is invalid"
    fi
}

# Function to test SSL configuration
test_ssl() {
    log "Testing SSL configuration..."
    
    # Start nginx if not running
    if ! docker-compose -f docker-compose.prod.yml ps nginx | grep -q "Up"; then
        log "Starting nginx for SSL test..."
        docker-compose -f docker-compose.prod.yml up -d nginx
        sleep 10
    fi
    
    # Test SSL connection
    if openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" < /dev/null > /dev/null 2>&1; then
        success "SSL connection test passed"
    else
        warning "SSL connection test failed - check your domain configuration"
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --domain DOMAIN     Domain name (default: $DOMAIN)"
    echo "  --email EMAIL       Email for Let's Encrypt (default: $EMAIL)"
    echo "  --self-signed       Generate self-signed certificate"
    echo "  --letsencrypt       Obtain Let's Encrypt certificate"
    echo "  --verify            Verify existing certificate"
    echo "  --test              Test SSL configuration"
    echo "  --renew             Setup certificate renewal"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --self-signed"
    echo "  $0 --letsencrypt --domain example.com --email admin@example.com"
    echo "  $0 --verify"
}

# Main execution
main() {
    local generate_self=false
    local generate_letsencrypt=false
    local verify_only=false
    local test_only=false
    local renew_only=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --domain)
                DOMAIN="$2"
                shift 2
                ;;
            --email)
                EMAIL="$2"
                shift 2
                ;;
            --self-signed)
                generate_self=true
                shift
                ;;
            --letsencrypt)
                generate_letsencrypt=true
                shift
                ;;
            --verify)
                verify_only=true
                shift
                ;;
            --test)
                test_only=true
                shift
                ;;
            --renew)
                renew_only=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            -*)
                error_exit "Unknown option: $1"
                ;;
            *)
                error_exit "Unknown argument: $1"
                ;;
        esac
    done
    
    # Handle special operations
    if [ "$verify_only" = true ]; then
        verify_certificate
        exit 0
    fi
    
    if [ "$test_only" = true ]; then
        test_ssl
        exit 0
    fi
    
    if [ "$renew_only" = true ]; then
        setup_renewal
        exit 0
    fi
    
    log "=== SSL Certificate Setup ==="
    
    # Check prerequisites
    check_prerequisites
    
    # Create SSL directory
    create_ssl_directory
    
    # Generate certificate
    if [ "$generate_self" = true ]; then
        generate_self_signed
    elif [ "$generate_letsencrypt" = true ]; then
        obtain_letsencrypt
        setup_renewal
    else
        error_exit "Please specify --self-signed or --letsencrypt"
    fi
    
    # Verify certificate
    verify_certificate
    
    # Test SSL configuration
    test_ssl
    
    success "=== SSL Certificate Setup Completed ==="
}

# Run main function
main "$@"
