#!/bin/bash

# Database backup script for production
# This script creates automated backups of the PostgreSQL database

set -e

# Configuration
DB_NAME="delivery_app_prod"
DB_USER="delivery_user"
DB_HOST="postgres"
BACKUP_DIR="/backup"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${DATE}.sql"
LOG_FILE="${BACKUP_DIR}/backup.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
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

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    log "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
fi

# Function to create backup
create_backup() {
    log "Starting database backup..."
    
    # Create the backup
    if pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" \
        --verbose \
        --no-password \
        --format=custom \
        --compress=9 \
        --file="${BACKUP_FILE}.dump" 2>>"$LOG_FILE"; then
        success "Database backup created: ${BACKUP_FILE}.dump"
    else
        error_exit "Failed to create database backup"
    fi
    
    # Also create a plain SQL backup for easier restoration
    if pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" \
        --verbose \
        --no-password \
        --format=plain \
        --file="$BACKUP_FILE" 2>>"$LOG_FILE"; then
        success "Plain SQL backup created: $BACKUP_FILE"
    else
        warning "Failed to create plain SQL backup"
    fi
    
    # Compress the plain SQL backup
    if gzip "$BACKUP_FILE"; then
        success "Plain SQL backup compressed: ${BACKUP_FILE}.gz"
    else
        warning "Failed to compress plain SQL backup"
    fi
}

# Function to clean old backups
cleanup_old_backups() {
    log "Cleaning up old backups (older than $RETENTION_DAYS days)..."
    
    # Find and remove old backup files
    find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -name "backup_*.dump" -mtime +$RETENTION_DAYS -delete
    
    success "Old backups cleaned up"
}

# Function to verify backup
verify_backup() {
    log "Verifying backup integrity..."
    
    if [ -f "${BACKUP_FILE}.dump" ]; then
        if pg_restore --list "${BACKUP_FILE}.dump" > /dev/null 2>&1; then
            success "Backup verification passed"
        else
            error_exit "Backup verification failed"
        fi
    else
        error_exit "Backup file not found"
    fi
}

# Function to get backup statistics
get_backup_stats() {
    local dump_size=$(du -h "${BACKUP_FILE}.dump" 2>/dev/null | cut -f1)
    local sql_size=$(du -h "${BACKUP_FILE}.gz" 2>/dev/null | cut -f1)
    
    log "Backup statistics:"
    log "  Dump file size: $dump_size"
    log "  SQL file size: $sql_size"
    log "  Total files: $(ls -1 "$BACKUP_DIR"/backup_* 2>/dev/null | wc -l)"
}

# Function to send notification (if configured)
send_notification() {
    local status=$1
    local message=$2
    
    # This would integrate with your notification system
    # For example, sending to Slack, email, or webhook
    if [ -n "$WEBHOOK_URL" ]; then
        curl -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"Database backup $status: $message\"}" \
            > /dev/null 2>&1 || warning "Failed to send notification"
    fi
}

# Main execution
main() {
    log "=== Database Backup Started ==="
    
    # Check if database is accessible
    if ! pg_isready -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; then
        error_exit "Database is not accessible"
    fi
    
    # Create backup
    create_backup
    
    # Verify backup
    verify_backup
    
    # Get statistics
    get_backup_stats
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Send success notification
    send_notification "SUCCESS" "Backup completed successfully"
    
    success "=== Database Backup Completed ==="
}

# Run main function
main "$@"
