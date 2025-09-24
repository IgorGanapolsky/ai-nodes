#!/bin/bash
# AI Nodes Backup Script
# Creates backups of database, configuration, and logs with cloud storage support
set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_FILE="$PROJECT_ROOT/logs/backup-$(date +%Y%m%d).log"

# Load environment variables
if [[ -f "$PROJECT_ROOT/.env" ]]; then
    set -a
    source "$PROJECT_ROOT/.env"
    set +a
fi

# Default configuration
BACKUP_DIR="$PROJECT_ROOT/backups"
DATABASE_PATH="${DATABASE_PATH:-$PROJECT_ROOT/db/ai_nodes.db}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
BACKUP_S3_BUCKET="${BACKUP_S3_BUCKET:-}"
AWS_REGION="${AWS_REGION:-us-east-1}"
BACKUP_ENCRYPTION="${BACKUP_ENCRYPTION:-true}"
ENCRYPTION_KEY="${ENCRYPTION_KEY:-}"
COMPRESSION="${COMPRESSION:-true}"

# Backup types
BACKUP_TYPE="${1:-full}" # full, incremental, config, database

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    case "$level" in
        "INFO")  echo -e "${GREEN}[$timestamp][INFO]${NC} $message" | tee -a "$LOG_FILE" ;;
        "WARN")  echo -e "${YELLOW}[$timestamp][WARN]${NC} $message" | tee -a "$LOG_FILE" ;;
        "ERROR") echo -e "${RED}[$timestamp][ERROR]${NC} $message" | tee -a "$LOG_FILE" ;;
        "DEBUG") echo -e "${BLUE}[$timestamp][DEBUG]${NC} $message" | tee -a "$LOG_FILE" ;;
    esac
}

# Check dependencies
check_dependencies() {
    local required_tools=("sqlite3" "tar" "gzip")
    local missing_tools=()

    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            missing_tools+=("$tool")
        fi
    done

    # Check for optional tools
    if [[ "$BACKUP_ENCRYPTION" == "true" ]] && ! command -v "openssl" >/dev/null 2>&1; then
        missing_tools+=("openssl")
    fi

    if [[ -n "$BACKUP_S3_BUCKET" ]] && ! command -v "aws" >/dev/null 2>&1; then
        log "WARN" "AWS CLI not found, S3 backup will be skipped"
    fi

    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log "ERROR" "Missing required tools: ${missing_tools[*]}"
        exit 1
    fi
}

# Create backup directory structure
create_backup_structure() {
    local backup_date=$(date +%Y%m%d-%H%M%S)
    local backup_path="$BACKUP_DIR/$backup_date"

    mkdir -p "$backup_path"/{database,config,logs,scripts,data}

    echo "$backup_path"
}

# Calculate file checksum
calculate_checksum() {
    local file="$1"

    if command -v sha256sum >/dev/null 2>&1; then
        sha256sum "$file" | awk '{print $1}'
    elif command -v shasum >/dev/null 2>&1; then
        shasum -a 256 "$file" | awk '{print $1}'
    else
        log "WARN" "No checksum tool available"
        echo "unknown"
    fi
}

# Encrypt file
encrypt_file() {
    local input_file="$1"
    local output_file="$2"

    if [[ "$BACKUP_ENCRYPTION" != "true" ]]; then
        cp "$input_file" "$output_file"
        return 0
    fi

    if [[ -z "$ENCRYPTION_KEY" ]]; then
        log "ERROR" "Encryption enabled but ENCRYPTION_KEY not set"
        return 1
    fi

    log "DEBUG" "Encrypting file: $input_file"

    if openssl enc -aes-256-cbc -salt -in "$input_file" -out "$output_file" -k "$ENCRYPTION_KEY" 2>/dev/null; then
        log "DEBUG" "File encrypted successfully: $output_file"
        return 0
    else
        log "ERROR" "Failed to encrypt file: $input_file"
        return 1
    fi
}

# Compress and optionally encrypt file
compress_file() {
    local input_file="$1"
    local output_path="$2"
    local filename=$(basename "$input_file")

    if [[ "$COMPRESSION" == "true" ]]; then
        local compressed_file="$output_path/${filename}.gz"
        gzip -c "$input_file" > "$compressed_file"

        if [[ "$BACKUP_ENCRYPTION" == "true" ]]; then
            local encrypted_file="$output_path/${filename}.gz.enc"
            encrypt_file "$compressed_file" "$encrypted_file"
            rm -f "$compressed_file"
            echo "$encrypted_file"
        else
            echo "$compressed_file"
        fi
    else
        if [[ "$BACKUP_ENCRYPTION" == "true" ]]; then
            local encrypted_file="$output_path/${filename}.enc"
            encrypt_file "$input_file" "$encrypted_file"
            echo "$encrypted_file"
        else
            cp "$input_file" "$output_path/"
            echo "$output_path/$filename"
        fi
    fi
}

# Backup database
backup_database() {
    local backup_path="$1"

    log "INFO" "Backing up database..."

    if [[ ! -f "$DATABASE_PATH" ]]; then
        log "WARN" "Database file not found: $DATABASE_PATH"
        return 1
    fi

    # Create database dump
    local db_dump="$backup_path/database/ai_nodes_dump.sql"
    if sqlite3 "$DATABASE_PATH" ".dump" > "$db_dump" 2>/dev/null; then
        log "DEBUG" "Database dump created: $db_dump"
    else
        log "ERROR" "Failed to create database dump"
        return 1
    fi

    # Copy database file
    local db_backup=$(compress_file "$DATABASE_PATH" "$backup_path/database")
    local db_checksum=$(calculate_checksum "$DATABASE_PATH")

    # Create database backup metadata
    cat > "$backup_path/database/metadata.json" << EOF
{
    "original_file": "$DATABASE_PATH",
    "backup_file": "$(basename "$db_backup")",
    "checksum": "$db_checksum",
    "size_bytes": $(stat -f%z "$DATABASE_PATH" 2>/dev/null || stat -c%s "$DATABASE_PATH" 2>/dev/null || echo "0"),
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "compressed": $COMPRESSION,
    "encrypted": $BACKUP_ENCRYPTION
}
EOF

    log "INFO" "Database backup completed: $db_backup"
    return 0
}

# Backup configuration files
backup_config() {
    local backup_path="$1"

    log "INFO" "Backing up configuration files..."

    local config_files=(
        "$PROJECT_ROOT/.env"
        "$PROJECT_ROOT/package.json"
        "$PROJECT_ROOT/package-lock.json"
    )

    local backed_up_files=()

    for config_file in "${config_files[@]}"; do
        if [[ -f "$config_file" ]]; then
            local backup_file=$(compress_file "$config_file" "$backup_path/config")
            backed_up_files+=("$(basename "$backup_file")")
            log "DEBUG" "Config file backed up: $config_file"
        else
            log "DEBUG" "Config file not found: $config_file"
        fi
    done

    # Create config backup metadata
    cat > "$backup_path/config/metadata.json" << EOF
{
    "files": [
$(printf '        "%s"' "${backed_up_files[@]}" | sed 's/$/,/g' | sed '$s/,$//')
    ],
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "compressed": $COMPRESSION,
    "encrypted": $BACKUP_ENCRYPTION
}
EOF

    log "INFO" "Configuration backup completed"
    return 0
}

# Backup logs
backup_logs() {
    local backup_path="$1"

    log "INFO" "Backing up log files..."

    if [[ ! -d "$PROJECT_ROOT/logs" ]]; then
        log "WARN" "Logs directory not found"
        return 1
    fi

    # Create logs archive
    local logs_archive="$backup_path/logs/logs_archive.tar"
    if tar -cf "$logs_archive" -C "$PROJECT_ROOT" "logs" 2>/dev/null; then
        log "DEBUG" "Logs archive created: $logs_archive"
    else
        log "ERROR" "Failed to create logs archive"
        return 1
    fi

    # Compress and encrypt logs archive
    local final_archive=$(compress_file "$logs_archive" "$backup_path/logs")
    rm -f "$logs_archive"

    # Create logs backup metadata
    local logs_size=$(du -sb "$PROJECT_ROOT/logs" 2>/dev/null | awk '{print $1}' || echo "0")
    cat > "$backup_path/logs/metadata.json" << EOF
{
    "archive_file": "$(basename "$final_archive")",
    "original_size_bytes": $logs_size,
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "compressed": $COMPRESSION,
    "encrypted": $BACKUP_ENCRYPTION
}
EOF

    log "INFO" "Logs backup completed: $final_archive"
    return 0
}

# Backup scripts
backup_scripts() {
    local backup_path="$1"

    log "INFO" "Backing up scripts..."

    if [[ ! -d "$PROJECT_ROOT/scripts" ]]; then
        log "WARN" "Scripts directory not found"
        return 1
    fi

    # Create scripts archive
    local scripts_archive="$backup_path/scripts/scripts_archive.tar"
    if tar -cf "$scripts_archive" -C "$PROJECT_ROOT" "scripts" 2>/dev/null; then
        log "DEBUG" "Scripts archive created: $scripts_archive"
    else
        log "ERROR" "Failed to create scripts archive"
        return 1
    fi

    # Compress and encrypt scripts archive
    local final_archive=$(compress_file "$scripts_archive" "$backup_path/scripts")
    rm -f "$scripts_archive"

    # Create scripts backup metadata
    cat > "$backup_path/scripts/metadata.json" << EOF
{
    "archive_file": "$(basename "$final_archive")",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "compressed": $COMPRESSION,
    "encrypted": $BACKUP_ENCRYPTION
}
EOF

    log "INFO" "Scripts backup completed: $final_archive"
    return 0
}

# Backup data directory
backup_data() {
    local backup_path="$1"

    log "INFO" "Backing up data directory..."

    if [[ ! -d "$PROJECT_ROOT/data" ]]; then
        log "WARN" "Data directory not found"
        return 0 # Not an error, data directory might not exist
    fi

    # Create data archive
    local data_archive="$backup_path/data/data_archive.tar"
    if tar -cf "$data_archive" -C "$PROJECT_ROOT" "data" 2>/dev/null; then
        log "DEBUG" "Data archive created: $data_archive"
    else
        log "ERROR" "Failed to create data archive"
        return 1
    fi

    # Compress and encrypt data archive
    local final_archive=$(compress_file "$data_archive" "$backup_path/data")
    rm -f "$data_archive"

    # Create data backup metadata
    local data_size=$(du -sb "$PROJECT_ROOT/data" 2>/dev/null | awk '{print $1}' || echo "0")
    cat > "$backup_path/data/metadata.json" << EOF
{
    "archive_file": "$(basename "$final_archive")",
    "original_size_bytes": $data_size,
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "compressed": $COMPRESSION,
    "encrypted": $BACKUP_ENCRYPTION
}
EOF

    log "INFO" "Data backup completed: $final_archive"
    return 0
}

# Create backup manifest
create_backup_manifest() {
    local backup_path="$1"
    local backup_type="$2"

    local manifest_file="$backup_path/backup_manifest.json"
    local backup_size=$(du -sb "$backup_path" 2>/dev/null | awk '{print $1}' || echo "0")

    cat > "$manifest_file" << EOF
{
    "backup_id": "$(basename "$backup_path")",
    "backup_type": "$backup_type",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "size_bytes": $backup_size,
    "compression_enabled": $COMPRESSION,
    "encryption_enabled": $BACKUP_ENCRYPTION,
    "retention_days": $BACKUP_RETENTION_DAYS,
    "components": {
        "database": $([ -f "$backup_path/database/metadata.json" ] && echo "true" || echo "false"),
        "config": $([ -f "$backup_path/config/metadata.json" ] && echo "true" || echo "false"),
        "logs": $([ -f "$backup_path/logs/metadata.json" ] && echo "true" || echo "false"),
        "scripts": $([ -f "$backup_path/scripts/metadata.json" ] && echo "true" || echo "false"),
        "data": $([ -f "$backup_path/data/metadata.json" ] && echo "true" || echo "false")
    }
}
EOF

    log "INFO" "Backup manifest created: $manifest_file"
}

# Upload to S3
upload_to_s3() {
    local backup_path="$1"

    if [[ -z "$BACKUP_S3_BUCKET" ]]; then
        log "DEBUG" "S3 backup not configured, skipping"
        return 0
    fi

    if ! command -v aws >/dev/null 2>&1; then
        log "WARN" "AWS CLI not found, skipping S3 upload"
        return 1
    fi

    log "INFO" "Uploading backup to S3: s3://$BACKUP_S3_BUCKET/"

    local backup_name=$(basename "$backup_path")
    local s3_path="s3://$BACKUP_S3_BUCKET/ai-nodes-backups/$backup_name/"

    # Create backup archive for S3
    local backup_archive="$BACKUP_DIR/${backup_name}.tar.gz"
    if tar -czf "$backup_archive" -C "$BACKUP_DIR" "$backup_name" 2>/dev/null; then
        log "DEBUG" "Backup archive created for S3: $backup_archive"
    else
        log "ERROR" "Failed to create backup archive for S3"
        return 1
    fi

    # Upload to S3
    if aws s3 cp "$backup_archive" "s3://$BACKUP_S3_BUCKET/ai-nodes-backups/" \
        --region "$AWS_REGION" \
        --storage-class STANDARD_IA \
        --server-side-encryption AES256 >/dev/null 2>&1; then
        log "INFO" "Backup uploaded to S3 successfully"
        rm -f "$backup_archive"
        return 0
    else
        log "ERROR" "Failed to upload backup to S3"
        rm -f "$backup_archive"
        return 1
    fi
}

# Log backup to database
log_backup_to_database() {
    local backup_path="$1"
    local backup_type="$2"
    local status="$3"

    local backup_size=$(du -sb "$backup_path" 2>/dev/null | awk '{print $1}' || echo "0")
    local checksum=$(calculate_checksum "$backup_path/backup_manifest.json")

    local query="INSERT INTO backups
        (backup_type, file_path, size_bytes, checksum, status)
        VALUES
        ('$backup_type', '$backup_path', $backup_size, '$checksum', '$status');"

    if sqlite3 "$DATABASE_PATH" "$query" 2>/dev/null; then
        log "DEBUG" "Backup logged to database"
    else
        log "WARN" "Failed to log backup to database"
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    log "INFO" "Cleaning up backups older than $BACKUP_RETENTION_DAYS days"

    # Local cleanup
    find "$BACKUP_DIR" -type d -name "????????-??????" -mtime +$BACKUP_RETENTION_DAYS -exec rm -rf {} + 2>/dev/null || true

    # Database cleanup
    local cleanup_query="DELETE FROM backups WHERE timestamp < datetime('now', '-$BACKUP_RETENTION_DAYS days');"
    sqlite3 "$DATABASE_PATH" "$cleanup_query" 2>/dev/null || true

    # S3 cleanup (if configured)
    if [[ -n "$BACKUP_S3_BUCKET" ]] && command -v aws >/dev/null 2>&1; then
        log "DEBUG" "Cleaning up old S3 backups"
        aws s3api list-objects-v2 --bucket "$BACKUP_S3_BUCKET" --prefix "ai-nodes-backups/" \
            --query "Contents[?LastModified<='$(date -d "$BACKUP_RETENTION_DAYS days ago" -u +%Y-%m-%dT%H:%M:%SZ)'].Key" \
            --output text 2>/dev/null | while read -r key; do
            if [[ -n "$key" ]] && [[ "$key" != "None" ]]; then
                aws s3 rm "s3://$BACKUP_S3_BUCKET/$key" 2>/dev/null || true
            fi
        done
    fi

    log "INFO" "Cleanup completed"
}

# Execute backup based on type
execute_backup() {
    local backup_type="$1"
    local backup_path

    backup_path=$(create_backup_structure)
    log "INFO" "Created backup directory: $backup_path"

    local backup_success=true

    case "$backup_type" in
        "full")
            log "INFO" "Performing full backup"
            backup_database "$backup_path" || backup_success=false
            backup_config "$backup_path" || backup_success=false
            backup_logs "$backup_path" || backup_success=false
            backup_scripts "$backup_path" || backup_success=false
            backup_data "$backup_path" || backup_success=false
            ;;
        "database")
            log "INFO" "Performing database backup"
            backup_database "$backup_path" || backup_success=false
            ;;
        "config")
            log "INFO" "Performing configuration backup"
            backup_config "$backup_path" || backup_success=false
            ;;
        "incremental")
            log "INFO" "Performing incremental backup"
            # For incremental, only backup changed files (simplified implementation)
            backup_database "$backup_path" || backup_success=false
            backup_config "$backup_path" || backup_success=false
            ;;
        *)
            log "ERROR" "Unknown backup type: $backup_type"
            return 1
            ;;
    esac

    # Create backup manifest
    create_backup_manifest "$backup_path" "$backup_type"

    # Upload to S3 if configured
    upload_to_s3 "$backup_path"

    # Log backup to database
    local status="success"
    if [[ "$backup_success" != "true" ]]; then
        status="failed"
    fi

    log_backup_to_database "$backup_path" "$backup_type" "$status"

    if [[ "$backup_success" == "true" ]]; then
        log "INFO" "Backup completed successfully: $backup_path"
        return 0
    else
        log "ERROR" "Backup completed with errors: $backup_path"
        return 1
    fi
}

# Main execution
main() {
    log "INFO" "AI Nodes backup script started (type: $BACKUP_TYPE)"

    # Ensure directories exist
    mkdir -p "$BACKUP_DIR" "$PROJECT_ROOT/logs"

    # Check dependencies
    check_dependencies

    # Check if database exists for database-related operations
    if [[ "$BACKUP_TYPE" =~ ^(full|database|incremental)$ ]] && [[ ! -f "$DATABASE_PATH" ]]; then
        log "ERROR" "Database not found: $DATABASE_PATH"
        exit 1
    fi

    # Execute backup
    if execute_backup "$BACKUP_TYPE"; then
        log "INFO" "Backup operation successful"
    else
        log "ERROR" "Backup operation failed"
        exit 1
    fi

    # Cleanup old backups
    cleanup_old_backups

    log "INFO" "Backup script completed"
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi