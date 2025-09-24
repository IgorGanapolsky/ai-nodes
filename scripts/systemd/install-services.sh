#!/bin/bash
# AI Nodes Systemd Services Installation Script
# Installs and configures systemd services for AI nodes automation
set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SERVICE_USER="ai-nodes"
SERVICE_GROUP="ai-nodes"
INSTALL_PATH="/opt/ai-nodes"

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
        "INFO")  echo -e "${GREEN}[$timestamp][INFO]${NC} $message" ;;
        "WARN")  echo -e "${YELLOW}[$timestamp][WARN]${NC} $message" ;;
        "ERROR") echo -e "${RED}[$timestamp][ERROR]${NC} $message" ;;
        "DEBUG") echo -e "${BLUE}[$timestamp][DEBUG]${NC} $message" ;;
    esac
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log "ERROR" "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Create system user for AI nodes
create_system_user() {
    log "INFO" "Creating system user: $SERVICE_USER"

    # Check if user already exists
    if id "$SERVICE_USER" >/dev/null 2>&1; then
        log "INFO" "User $SERVICE_USER already exists"
        return 0
    fi

    # Create system user and group
    if useradd --system --group --home-dir "$INSTALL_PATH" --shell /bin/bash "$SERVICE_USER"; then
        log "INFO" "Created system user: $SERVICE_USER"
    else
        log "ERROR" "Failed to create system user: $SERVICE_USER"
        return 1
    fi

    # Set up user directory permissions
    if [[ -d "$INSTALL_PATH" ]]; then
        chown -R "$SERVICE_USER:$SERVICE_GROUP" "$INSTALL_PATH"
        log "INFO" "Set ownership of $INSTALL_PATH to $SERVICE_USER:$SERVICE_GROUP"
    fi
}

# Install systemd service files
install_service_files() {
    log "INFO" "Installing systemd service files"

    local services=(
        "ai-nodes-monitor.service"
        "ai-nodes-reinvest.service"
        "ai-nodes-backup.service"
        "ai-nodes-backup.timer"
        "ai-nodes-health.service"
    )

    for service in "${services[@]}"; do
        local source_file="$SCRIPT_DIR/$service"
        local target_file="/etc/systemd/system/$service"

        if [[ -f "$source_file" ]]; then
            log "INFO" "Installing $service"
            cp "$source_file" "$target_file"
            chmod 644 "$target_file"
        else
            log "ERROR" "Service file not found: $source_file"
            return 1
        fi
    done
}

# Configure systemd services
configure_services() {
    log "INFO" "Configuring systemd services"

    # Reload systemd daemon
    systemctl daemon-reload

    # Enable services
    local services_to_enable=(
        "ai-nodes-monitor.service"
        "ai-nodes-reinvest.service"
        "ai-nodes-backup.timer"
        "ai-nodes-health.service"
    )

    for service in "${services_to_enable[@]}"; do
        log "INFO" "Enabling $service"
        if systemctl enable "$service"; then
            log "INFO" "Enabled $service"
        else
            log "WARN" "Failed to enable $service"
        fi
    done
}

# Create necessary directories
create_directories() {
    log "INFO" "Creating necessary directories"

    local dirs=(
        "$INSTALL_PATH/logs"
        "$INSTALL_PATH/data"
        "$INSTALL_PATH/backups"
        "$INSTALL_PATH/db"
        "$INSTALL_PATH/monitoring"
        "/var/log/ai-nodes"
    )

    for dir in "${dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir"
            log "INFO" "Created directory: $dir"
        fi

        # Set appropriate ownership
        if [[ "$dir" == "/var/log/ai-nodes" ]]; then
            chown "$SERVICE_USER:$SERVICE_GROUP" "$dir"
            chmod 755 "$dir"
        else
            chown "$SERVICE_USER:$SERVICE_GROUP" "$dir"
            chmod 755 "$dir"
        fi
    done
}

# Set up log rotation
setup_log_rotation() {
    log "INFO" "Setting up log rotation"

    cat > /etc/logrotate.d/ai-nodes << 'EOF'
/opt/ai-nodes/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
    create 0644 ai-nodes ai-nodes
}

/var/log/ai-nodes/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
    create 0644 ai-nodes ai-nodes
}
EOF

    log "INFO" "Log rotation configured"
}

# Start services (optional)
start_services() {
    local start_now="${1:-false}"

    if [[ "$start_now" != "true" ]]; then
        log "INFO" "Services installed but not started. Use 'systemctl start <service>' to start them."
        return 0
    fi

    log "INFO" "Starting AI Nodes services"

    # Check if .env file exists
    if [[ ! -f "$INSTALL_PATH/.env" ]]; then
        log "WARN" "Environment file not found: $INSTALL_PATH/.env"
        log "WARN" "Please configure the environment before starting services"
        return 1
    fi

    local services_to_start=(
        "ai-nodes-health.service"
        "ai-nodes-monitor.service"
        "ai-nodes-backup.timer"
        "ai-nodes-reinvest.service"
    )

    for service in "${services_to_start[@]}"; do
        log "INFO" "Starting $service"
        if systemctl start "$service"; then
            log "INFO" "Started $service"
        else
            log "ERROR" "Failed to start $service"
            systemctl status "$service" --no-pager -l
        fi
    done
}

# Show service status
show_status() {
    log "INFO" "AI Nodes service status:"

    local services=(
        "ai-nodes-monitor.service"
        "ai-nodes-reinvest.service"
        "ai-nodes-backup.service"
        "ai-nodes-backup.timer"
        "ai-nodes-health.service"
    )

    for service in "${services[@]}"; do
        echo
        echo "=== $service ==="
        systemctl status "$service" --no-pager -l || true
    done
}

# Uninstall services
uninstall_services() {
    log "INFO" "Uninstalling AI Nodes systemd services"

    local services=(
        "ai-nodes-monitor.service"
        "ai-nodes-reinvest.service"
        "ai-nodes-backup.service"
        "ai-nodes-backup.timer"
        "ai-nodes-health.service"
    )

    # Stop and disable services
    for service in "${services[@]}"; do
        log "INFO" "Stopping and disabling $service"
        systemctl stop "$service" 2>/dev/null || true
        systemctl disable "$service" 2>/dev/null || true
        rm -f "/etc/systemd/system/$service"
    done

    # Remove log rotation config
    rm -f /etc/logrotate.d/ai-nodes

    # Reload systemd
    systemctl daemon-reload

    log "INFO" "Services uninstalled successfully"
}

# Print post-installation instructions
print_instructions() {
    echo
    echo -e "${GREEN}=== AI Nodes Systemd Services Installed ===${NC}"
    echo
    echo "Services installed:"
    echo "  • ai-nodes-monitor.service  - Monitors node status every 15 minutes"
    echo "  • ai-nodes-reinvest.service - Handles auto-reinvestment every hour"
    echo "  • ai-nodes-backup.timer     - Daily backups at 2:00 AM"
    echo "  • ai-nodes-health.service   - Health checks every 5 minutes"
    echo
    echo "Management commands:"
    echo "  • Start all services:  sudo systemctl start ai-nodes-{monitor,reinvest,health}"
    echo "  • Stop all services:   sudo systemctl stop ai-nodes-{monitor,reinvest,health}"
    echo "  • Check status:        sudo systemctl status ai-nodes-monitor"
    echo "  • View logs:           sudo journalctl -u ai-nodes-monitor -f"
    echo "  • Enable backup timer: sudo systemctl start ai-nodes-backup.timer"
    echo
    echo "Configuration:"
    echo "  • Environment file: $INSTALL_PATH/.env"
    echo "  • Application logs: $INSTALL_PATH/logs/"
    echo "  • System logs:      journalctl -u ai-nodes-*"
    echo
    echo -e "${YELLOW}Important:${NC} Configure $INSTALL_PATH/.env before starting services!"
    echo
}

# Main execution
main() {
    local action="${1:-install}"

    case "$action" in
        "install")
            log "INFO" "Installing AI Nodes systemd services"
            check_root
            create_system_user
            create_directories
            install_service_files
            configure_services
            setup_log_rotation
            print_instructions
            ;;
        "start")
            log "INFO" "Starting AI Nodes services"
            check_root
            start_services "true"
            ;;
        "status")
            show_status
            ;;
        "uninstall")
            log "INFO" "Uninstalling AI Nodes services"
            check_root
            uninstall_services
            ;;
        *)
            echo "AI Nodes Systemd Services Manager"
            echo
            echo "Usage: $0 [action]"
            echo
            echo "Actions:"
            echo "  install    - Install and configure systemd services (default)"
            echo "  start      - Start all services"
            echo "  status     - Show service status"
            echo "  uninstall  - Remove all services"
            echo
            echo "Examples:"
            echo "  sudo $0 install"
            echo "  sudo $0 start"
            echo "  $0 status"
            echo
            exit 1
            ;;
    esac
}

# Run main function
main "$@"