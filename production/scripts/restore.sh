#!/bin/bash

# Database restore script for production
# This script restores the PostgreSQL database from a backup

set -e

# Configuration
DB_NAME="delivery_app_prod"
DB_USER="delivery_user"
DB_HOST="postgres"
BACKUP_DIR="/backup"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Function to list available backups
list_backups() {
    log "Available backups:"
    ls -la "$BACKUP_DIR"/backup_*.dump 2>/dev/null | while read -r line; do
        echo "  $line"
    done
}

# Function to restore from dump file
restore_from_dump() {
    local backup_file=$1
    
    if [ ! -f "$backup_file" ]; then
        error_exit "Backup file not found: $backup_file"
    fi
    
    log "Restoring from dump file: $backup_file"
    
    # Drop existing database and recreate
    log "Dropping existing database..."
    if psql -h "$DB_HOST" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null; then
        success "Database dropped"
    else
        warning "Failed to drop database (may not exist)"
    fi
    
    log "Creating new database..."
    if psql -h "$DB_HOST" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null; then
        success "Database created"
    else
        error_exit "Failed to create database"
    fi
    
    # Restore from backup
    log "Restoring data..."
    if pg_restore -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" \
        --verbose \
        --no-password \
        --clean \
        --if-exists \
        "$backup_file" 2>/dev/null; then
        success "Database restored successfully"
    else
        error_exit "Failed to restore database"
    fi
}

# Function to restore from SQL file
restore_from_sql() {
    local backup_file=$1
    
    if [ ! -f "$backup_file" ]; then
        error_exit "Backup file not found: $backup_file"
    fi
    
    log "Restoring from SQL file: $backup_file"
    
    # Drop existing database and recreate
    log "Dropping existing database..."
    if psql -h "$DB_HOST" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null; then
        success "Database dropped"
    else
        warning "Failed to drop database (may not exist)"
    fi
    
    log "Creating new database..."
    if psql -h "$DB_HOST" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null; then
        success "Database created"
    else
        error_exit "Failed to create database"
    fi
    
    # Restore from SQL file
    log "Restoring data..."
    if psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$backup_file" 2>/dev/null; then
        success "Database restored successfully"
    else
        error_exit "Failed to restore database"
    fi
}

# Function to verify restore
verify_restore() {
    log "Verifying restore..."
    
    # Check if database is accessible
    if ! pg_isready -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; then
        error_exit "Database is not accessible after restore"
    fi
    
    # Check table count
    local table_count=$(psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
    
    if [ "$table_count" -gt 0 ]; then
        success "Restore verification passed - $table_count tables found"
    else
        error_exit "Restore verification failed - no tables found"
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS] [BACKUP_FILE]"
    echo ""
    echo "Options:"
    echo "  -l, --list          List available backups"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Arguments:"
    echo "  BACKUP_FILE         Path to backup file (.dump or .sql.gz)"
    echo ""
    echo "Examples:"
    echo "  $0 --list"
    echo "  $0 /backup/backup_20240115_120000.dump"
    echo "  $0 /backup/backup_20240115_120000.sql.gz"
}

# Main execution
main() {
    local backup_file=""
    local list_only=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -l|--list)
                list_only=true
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
                backup_file="$1"
                shift
                ;;
        esac
    done
    
    # List backups if requested
    if [ "$list_only" = true ]; then
        list_backups
        exit 0
    fi
    
    # Check if backup file is provided
    if [ -z "$backup_file" ]; then
        error_exit "Backup file not provided. Use --list to see available backups."
    fi
    
    log "=== Database Restore Started ==="
    
    # Check if database is accessible
    if ! pg_isready -h "$DB_HOST" -U "$DB_USER" -d postgres > /dev/null 2>&1; then
        error_exit "PostgreSQL server is not accessible"
    fi
    
    # Determine backup type and restore
    if [[ "$backup_file" == *.dump ]]; then
        restore_from_dump "$backup_file"
    elif [[ "$backup_file" == *.sql.gz ]]; then
        # Decompress if needed
        if [ ! -f "${backup_file%.gz}" ]; then
            log "Decompressing backup file..."
            gunzip -c "$backup_file" > "${backup_file%.gz}"
        fi
        restore_from_sql "${backup_file%.gz}"
    elif [[ "$backup_file" == *.sql ]]; then
        restore_from_sql "$backup_file"
    else
        error_exit "Unsupported backup file format. Use .dump or .sql.gz files."
    fi
    
    # Verify restore
    verify_restore
    
    success "=== Database Restore Completed ==="
}

# Run main function
main "$@"
