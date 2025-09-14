#!/bin/bash

# Production deployment script for Delivery App
# This script handles the complete deployment process

set -e

# Configuration
PROJECT_NAME="delivery-app"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env"
BACKUP_BEFORE_DEPLOY=true
HEALTH_CHECK_TIMEOUT=300

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
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error_exit "Docker is not installed"
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error_exit "Docker Compose is not installed"
    fi
    
    # Check if .env file exists
    if [ ! -f "$ENV_FILE" ]; then
        error_exit "Environment file $ENV_FILE not found. Please copy from env.production.example"
    fi
    
    # Check if SSL certificates exist
    if [ ! -f "nginx/ssl/cert.pem" ] || [ ! -f "nginx/ssl/key.pem" ]; then
        warning "SSL certificates not found. Please add them to nginx/ssl/ directory"
    fi
    
    success "Prerequisites check passed"
}

# Function to create backup before deployment
create_backup() {
    if [ "$BACKUP_BEFORE_DEPLOY" = true ]; then
        log "Creating backup before deployment..."
        
        if [ -f "scripts/backup.sh" ]; then
            chmod +x scripts/backup.sh
            ./scripts/backup.sh || warning "Backup failed, continuing with deployment"
        else
            warning "Backup script not found, skipping backup"
        fi
    fi
}

# Function to pull latest images
pull_images() {
    log "Pulling latest Docker images..."
    
    docker-compose -f "$COMPOSE_FILE" pull || error_exit "Failed to pull images"
    success "Images pulled successfully"
}

# Function to build images
build_images() {
    log "Building Docker images..."
    
    docker-compose -f "$COMPOSE_FILE" build --no-cache || error_exit "Failed to build images"
    success "Images built successfully"
}

# Function to stop existing services
stop_services() {
    log "Stopping existing services..."
    
    docker-compose -f "$COMPOSE_FILE" down --remove-orphans || warning "Failed to stop some services"
    success "Services stopped"
}

# Function to start services
start_services() {
    log "Starting services..."
    
    docker-compose -f "$COMPOSE_FILE" up -d || error_exit "Failed to start services"
    success "Services started"
}

# Function to wait for services to be healthy
wait_for_health() {
    log "Waiting for services to be healthy..."
    
    local timeout=$HEALTH_CHECK_TIMEOUT
    local start_time=$(date +%s)
    
    while [ $(($(date +%s) - start_time)) -lt $timeout ]; do
        local healthy_services=0
        local total_services=5
        
        # Check PostgreSQL
        if docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U delivery_user -d delivery_app_prod > /dev/null 2>&1; then
            ((healthy_services++))
        fi
        
        # Check Redis
        if docker-compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping > /dev/null 2>&1; then
            ((healthy_services++))
        fi
        
        # Check Backend
        if curl -f http://localhost:5000/health > /dev/null 2>&1; then
            ((healthy_services++))
        fi
        
        # Check Frontend
        if curl -f http://localhost:3000 > /dev/null 2>&1; then
            ((healthy_services++))
        fi
        
        # Check Nginx
        if curl -f http://localhost/health > /dev/null 2>&1; then
            ((healthy_services++))
        fi
        
        if [ $healthy_services -eq $total_services ]; then
            success "All services are healthy"
            return 0
        fi
        
        info "Health check: $healthy_services/$total_services services healthy"
        sleep 10
    done
    
    error_exit "Health check timeout - services not healthy after $timeout seconds"
}

# Function to run database migrations
run_migrations() {
    log "Running database migrations..."
    
    # Wait for database to be ready
    local timeout=60
    local start_time=$(date +%s)
    
    while [ $(($(date +%s) - start_time)) -lt $timeout ]; do
        if docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U delivery_user -d delivery_app_prod > /dev/null 2>&1; then
            break
        fi
        sleep 5
    done
    
    # Run migrations
    docker-compose -f "$COMPOSE_FILE" exec -T backend npm run db:migrate:prod || error_exit "Database migration failed"
    success "Database migrations completed"
}

# Function to run tests
run_tests() {
    log "Running production tests..."
    
    # Run backend tests
    docker-compose -f "$COMPOSE_FILE" exec -T backend npm test || warning "Backend tests failed"
    
    # Run frontend tests
    docker-compose -f "$COMPOSE_FILE" exec -T frontend npm test || warning "Frontend tests failed"
    
    success "Tests completed"
}

# Function to show deployment status
show_status() {
    log "Deployment Status:"
    echo ""
    
    # Show running containers
    docker-compose -f "$COMPOSE_FILE" ps
    
    echo ""
    log "Service URLs:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend API: http://localhost:5000"
    echo "  Health Check: http://localhost/health"
    echo "  Prometheus: http://localhost:9090"
    echo "  Grafana: http://localhost:3001"
}

# Function to cleanup old images
cleanup_images() {
    log "Cleaning up old Docker images..."
    
    # Remove unused images
    docker image prune -f || warning "Failed to clean up images"
    
    # Remove unused volumes
    docker volume prune -f || warning "Failed to clean up volumes"
    
    success "Cleanup completed"
}

# Function to rollback deployment
rollback() {
    log "Rolling back deployment..."
    
    # Stop current services
    docker-compose -f "$COMPOSE_FILE" down
    
    # Restore from backup if available
    if [ -f "scripts/restore.sh" ]; then
        chmod +x scripts/restore.sh
        ./scripts/restore.sh --list
        warning "Please select a backup to restore from"
    fi
    
    error_exit "Rollback completed - manual intervention required"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --no-backup         Skip backup before deployment"
    echo "  --no-tests          Skip running tests"
    echo "  --no-migrations     Skip database migrations"
    echo "  --build-only        Only build images, don't deploy"
    echo "  --status            Show deployment status"
    echo "  --rollback          Rollback to previous version"
    echo "  --cleanup           Clean up old images and volumes"
    echo "  -h, --help          Show this help message"
}

# Main execution
main() {
    local no_backup=false
    local no_tests=false
    local no_migrations=false
    local build_only=false
    local show_status_only=false
    local rollback_deploy=false
    local cleanup_only=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --no-backup)
                no_backup=true
                shift
                ;;
            --no-tests)
                no_tests=true
                shift
                ;;
            --no-migrations)
                no_migrations=true
                shift
                ;;
            --build-only)
                build_only=true
                shift
                ;;
            --status)
                show_status_only=true
                shift
                ;;
            --rollback)
                rollback_deploy=true
                shift
                ;;
            --cleanup)
                cleanup_only=true
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
    if [ "$show_status_only" = true ]; then
        show_status
        exit 0
    fi
    
    if [ "$rollback_deploy" = true ]; then
        rollback
        exit 0
    fi
    
    if [ "$cleanup_only" = true ]; then
        cleanup_images
        exit 0
    fi
    
    log "=== Starting Production Deployment ==="
    
    # Check prerequisites
    check_prerequisites
    
    # Create backup if requested
    if [ "$no_backup" = false ]; then
        create_backup
    fi
    
    # Pull and build images
    pull_images
    build_images
    
    # Exit if build-only
    if [ "$build_only" = true ]; then
        success "Build completed"
        exit 0
    fi
    
    # Stop existing services
    stop_services
    
    # Start services
    start_services
    
    # Wait for services to be healthy
    wait_for_health
    
    # Run migrations if requested
    if [ "$no_migrations" = false ]; then
        run_migrations
    fi
    
    # Run tests if requested
    if [ "$no_tests" = false ]; then
        run_tests
    fi
    
    # Show status
    show_status
    
    # Cleanup
    cleanup_images
    
    success "=== Production Deployment Completed Successfully ==="
}

# Run main function
main "$@"
