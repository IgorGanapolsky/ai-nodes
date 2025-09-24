#!/bin/bash
# AI Nodes Setup Script
# Main setup script for AI node automation infrastructure
set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_FILE="$PROJECT_ROOT/logs/setup-$(date +%Y%m%d-%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    case "$level" in
        "INFO")  echo -e "${GREEN}[INFO]${NC} $message" | tee -a "$LOG_FILE" ;;
        "WARN")  echo -e "${YELLOW}[WARN]${NC} $message" | tee -a "$LOG_FILE" ;;
        "ERROR") echo -e "${RED}[ERROR]${NC} $message" | tee -a "$LOG_FILE" ;;
        "DEBUG") echo -e "${BLUE}[DEBUG]${NC} $message" | tee -a "$LOG_FILE" ;;
    esac
}

# Error handling
error_exit() {
    log "ERROR" "$1"
    exit 1
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log "WARN" "Running as root. Some operations may behave differently."
    fi
}

# Detect OS and package manager
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v apt-get >/dev/null 2>&1; then
            PACKAGE_MANAGER="apt"
            UPDATE_CMD="apt-get update"
            INSTALL_CMD="apt-get install -y"
        elif command -v yum >/dev/null 2>&1; then
            PACKAGE_MANAGER="yum"
            UPDATE_CMD="yum update -y"
            INSTALL_CMD="yum install -y"
        elif command -v dnf >/dev/null 2>&1; then
            PACKAGE_MANAGER="dnf"
            UPDATE_CMD="dnf update -y"
            INSTALL_CMD="dnf install -y"
        elif command -v pacman >/dev/null 2>&1; then
            PACKAGE_MANAGER="pacman"
            UPDATE_CMD="pacman -Syu --noconfirm"
            INSTALL_CMD="pacman -S --noconfirm"
        else
            error_exit "Unsupported Linux distribution"
        fi
        OS_TYPE="linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        PACKAGE_MANAGER="brew"
        UPDATE_CMD="brew update"
        INSTALL_CMD="brew install"
        OS_TYPE="macos"
    else
        error_exit "Unsupported operating system: $OSTYPE"
    fi

    log "INFO" "Detected OS: $OS_TYPE with package manager: $PACKAGE_MANAGER"
}

# Create necessary directories
create_directories() {
    log "INFO" "Creating necessary directories..."

    local dirs=(
        "$PROJECT_ROOT/logs"
        "$PROJECT_ROOT/data"
        "$PROJECT_ROOT/backups"
        "$PROJECT_ROOT/config"
        "$PROJECT_ROOT/tmp"
        "$PROJECT_ROOT/monitoring"
        "$PROJECT_ROOT/db"
    )

    for dir in "${dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir"
            log "INFO" "Created directory: $dir"
        else
            log "DEBUG" "Directory already exists: $dir"
        fi
    done
}

# Install system dependencies
install_system_dependencies() {
    log "INFO" "Installing system dependencies..."

    # Update package manager
    log "INFO" "Updating package manager..."
    if ! sudo $UPDATE_CMD >/dev/null 2>&1; then
        log "WARN" "Failed to update package manager, continuing anyway..."
    fi

    # Common dependencies
    local deps=()

    if [[ "$OS_TYPE" == "linux" ]]; then
        deps+=(curl wget git build-essential sqlite3 jq bc cron rsync)
        if [[ "$PACKAGE_MANAGER" == "apt" ]]; then
            deps+=(software-properties-common apt-transport-https ca-certificates gnupg lsb-release)
        fi
    elif [[ "$OS_TYPE" == "macos" ]]; then
        deps+=(curl wget git sqlite3 jq bc rsync)
    fi

    for dep in "${deps[@]}"; do
        if ! command -v "$dep" >/dev/null 2>&1; then
            log "INFO" "Installing $dep..."
            if ! sudo $INSTALL_CMD "$dep" >/dev/null 2>&1; then
                log "WARN" "Failed to install $dep, continuing..."
            fi
        else
            log "DEBUG" "$dep is already installed"
        fi
    done
}

# Install Node.js and npm
install_nodejs() {
    log "INFO" "Setting up Node.js environment..."

    # Check if Node.js is already installed
    if command -v node >/dev/null 2>&1; then
        local node_version=$(node --version)
        log "INFO" "Node.js is already installed: $node_version"

        # Check if version is acceptable (v18+)
        local major_version=$(echo "$node_version" | sed 's/v\([0-9]*\).*/\1/')
        if [[ "$major_version" -ge 18 ]]; then
            log "INFO" "Node.js version is acceptable"
            return 0
        else
            log "WARN" "Node.js version is too old, installing newer version..."
        fi
    fi

    # Install Node.js via NodeSource repository (Linux) or Homebrew (macOS)
    if [[ "$OS_TYPE" == "linux" ]]; then
        log "INFO" "Installing Node.js 20.x LTS..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo $INSTALL_CMD nodejs
    elif [[ "$OS_TYPE" == "macos" ]]; then
        log "INFO" "Installing Node.js via Homebrew..."
        $INSTALL_CMD node
    fi

    # Verify installation
    if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
        log "INFO" "Node.js $(node --version) and npm $(npm --version) installed successfully"
    else
        error_exit "Failed to install Node.js and npm"
    fi

    # Install global npm packages
    log "INFO" "Installing global npm packages..."
    local global_packages=(pm2 nodemon)

    for package in "${global_packages[@]}"; do
        if ! npm list -g "$package" >/dev/null 2>&1; then
            log "INFO" "Installing global package: $package"
            npm install -g "$package"
        else
            log "DEBUG" "Global package already installed: $package"
        fi
    done
}

# Setup database
setup_database() {
    log "INFO" "Setting up SQLite database..."

    local db_file="$PROJECT_ROOT/db/ai_nodes.db"

    # Create database if it doesn't exist
    if [[ ! -f "$db_file" ]]; then
        log "INFO" "Creating database file: $db_file"
        touch "$db_file"
    fi

    # Create tables
    log "INFO" "Creating database tables..."
    sqlite3 "$db_file" << 'EOF'
-- Node monitoring table
CREATE TABLE IF NOT EXISTS node_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    node_id TEXT NOT NULL,
    status TEXT NOT NULL,
    cpu_usage REAL,
    memory_usage REAL,
    disk_usage REAL,
    network_latency REAL,
    uptime_seconds INTEGER,
    earnings_balance REAL,
    staked_amount REAL,
    rewards_earned REAL
);

-- Transaction logs
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    transaction_hash TEXT UNIQUE,
    type TEXT NOT NULL, -- 'stake', 'unstake', 'swap', 'reward'
    amount REAL NOT NULL,
    token TEXT NOT NULL,
    status TEXT NOT NULL, -- 'pending', 'confirmed', 'failed'
    gas_fee REAL,
    block_number INTEGER
);

-- Alert logs
CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    type TEXT NOT NULL, -- 'error', 'warning', 'info'
    message TEXT NOT NULL,
    node_id TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    notified BOOLEAN DEFAULT FALSE
);

-- Configuration settings
CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Backup logs
CREATE TABLE IF NOT EXISTS backups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    backup_type TEXT NOT NULL, -- 'full', 'incremental', 'config'
    file_path TEXT NOT NULL,
    size_bytes INTEGER,
    checksum TEXT,
    status TEXT NOT NULL -- 'success', 'failed'
);

-- Insert default configuration
INSERT OR IGNORE INTO config (key, value) VALUES
    ('monitoring_interval', '900'), -- 15 minutes
    ('reinvest_threshold', '100'), -- $100 threshold
    ('backup_retention_days', '30'),
    ('alert_discord_enabled', 'false'),
    ('alert_email_enabled', 'false'),
    ('max_gas_price', '50'); -- 50 gwei

EOF

    if [[ $? -eq 0 ]]; then
        log "INFO" "Database setup completed successfully"
    else
        error_exit "Failed to setup database"
    fi
}

# Load and validate environment variables
setup_environment() {
    log "INFO" "Setting up environment configuration..."

    local env_file="$PROJECT_ROOT/.env"
    local env_template="$PROJECT_ROOT/.env.template"

    # Create .env.template if it doesn't exist
    if [[ ! -f "$env_template" ]]; then
        log "INFO" "Creating .env.template file..."
        cat > "$env_template" << 'EOF'
# AI Nodes Configuration
NODE_ENV=production

# Database
DATABASE_PATH=./db/ai_nodes.db

# Solana Configuration
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_PRIVATE_KEY=your_solana_private_key_here
SOLANA_PUBLIC_KEY=your_solana_public_key_here

# DeFi Protocol Settings
JUPITER_API_URL=https://quote-api.jup.ag/v6
MARINADE_STAKE_POOL=8szGkuLTAux9XMgZ2vtY39jVSowEcpBfFfD8hXSEqdGC

# Monitoring Settings
MONITORING_INTERVAL=900
REINVEST_THRESHOLD=100
MAX_GAS_PRICE=50

# Alert Settings
DISCORD_WEBHOOK_URL=your_discord_webhook_url_here
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_USERNAME=your_email_here
EMAIL_PASSWORD=your_app_password_here
EMAIL_TO=alerts@yourcompany.com

# Backup Settings
BACKUP_RETENTION_DAYS=30
BACKUP_S3_BUCKET=your_s3_bucket_name
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1

# Security
ENCRYPTION_KEY=generate_a_32_character_key_here

EOF
        log "INFO" "Created .env.template file. Please copy to .env and configure."
    fi

    # Check if .env exists
    if [[ ! -f "$env_file" ]]; then
        log "WARN" ".env file not found. Copying from template..."
        cp "$env_template" "$env_file"
        log "WARN" "Please edit $env_file with your actual configuration values"
    fi

    # Source environment variables
    if [[ -f "$env_file" ]]; then
        set -a
        source "$env_file"
        set +a
        log "INFO" "Environment variables loaded from .env file"
    fi

    # Validate critical environment variables
    local required_vars=(
        "SOLANA_RPC_URL"
        "DATABASE_PATH"
    )

    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done

    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log "ERROR" "Missing required environment variables: ${missing_vars[*]}"
        log "ERROR" "Please configure these variables in $env_file"
        exit 1
    fi
}

# Install project dependencies
install_project_dependencies() {
    log "INFO" "Installing project dependencies..."

    # Create package.json if it doesn't exist
    local package_json="$PROJECT_ROOT/package.json"
    if [[ ! -f "$package_json" ]]; then
        log "INFO" "Creating package.json..."
        cat > "$package_json" << 'EOF'
{
  "name": "ai-nodes-automation",
  "version": "1.0.0",
  "description": "AI Nodes automation and monitoring system",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "monitor": "bash scripts/monitor.sh",
    "reinvest": "bash scripts/reinvest.sh",
    "backup": "bash scripts/backup.sh",
    "setup": "bash scripts/setup.sh",
    "deploy": "bash scripts/deploy.sh",
    "test": "jest",
    "health-check": "bash scripts/health-checks/basic.sh"
  },
  "dependencies": {
    "@solana/web3.js": "^1.87.6",
    "@solana/spl-token": "^0.3.9",
    "axios": "^1.6.0",
    "sqlite3": "^5.1.6",
    "nodemailer": "^6.9.7",
    "node-cron": "^3.0.3",
    "winston": "^3.11.0",
    "dotenv": "^16.3.1",
    "joi": "^17.11.0",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "rate-limiter-flexible": "^3.0.8"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "nodemon": "^3.0.1",
    "eslint": "^8.52.0",
    "@types/node": "^20.8.0"
  },
  "keywords": [
    "ai-nodes",
    "automation",
    "solana",
    "defi",
    "monitoring"
  ],
  "author": "AI Nodes Team",
  "license": "MIT"
}
EOF
    fi

    # Install dependencies
    log "INFO" "Installing npm dependencies..."
    cd "$PROJECT_ROOT"
    npm install

    if [[ $? -eq 0 ]]; then
        log "INFO" "Project dependencies installed successfully"
    else
        error_exit "Failed to install project dependencies"
    fi
}

# Setup cron jobs
setup_cron_jobs() {
    log "INFO" "Setting up cron jobs..."

    # Check if cron is available
    if ! command -v crontab >/dev/null 2>&1; then
        log "WARN" "Cron not available on this system. Skipping cron setup."
        return 0
    fi

    # Create temporary cron file
    local temp_cron=$(mktemp)

    # Get existing crontab
    crontab -l 2>/dev/null > "$temp_cron" || true

    # Remove existing AI nodes cron jobs
    grep -v "# AI Nodes:" "$temp_cron" > "${temp_cron}.new" || true
    mv "${temp_cron}.new" "$temp_cron"

    # Add new cron jobs
    cat >> "$temp_cron" << EOF
# AI Nodes: Monitor nodes every 15 minutes
*/15 * * * * cd $PROJECT_ROOT && bash scripts/monitor.sh >> logs/monitor.log 2>&1

# AI Nodes: Check for reinvestment opportunities every hour
0 * * * * cd $PROJECT_ROOT && bash scripts/reinvest.sh >> logs/reinvest.log 2>&1

# AI Nodes: Daily backup at 2 AM
0 2 * * * cd $PROJECT_ROOT && bash scripts/backup.sh >> logs/backup.log 2>&1

# AI Nodes: Health check every 5 minutes
*/5 * * * * cd $PROJECT_ROOT && bash scripts/health-checks/basic.sh >> logs/health.log 2>&1

# AI Nodes: Log rotation weekly
0 0 * * 0 cd $PROJECT_ROOT && find logs/ -name "*.log" -type f -mtime +7 -delete

EOF

    # Install new crontab
    if crontab "$temp_cron"; then
        log "INFO" "Cron jobs installed successfully"
    else
        log "WARN" "Failed to install cron jobs"
    fi

    # Clean up
    rm -f "$temp_cron"
}

# Setup systemd services (Linux only)
setup_systemd_services() {
    if [[ "$OS_TYPE" != "linux" ]]; then
        log "INFO" "Skipping systemd setup (not on Linux)"
        return 0
    fi

    log "INFO" "Setting up systemd services..."

    # This will be handled by the systemd scripts we'll create later
    log "INFO" "Systemd service files will be created separately"
}

# Verify installation
verify_installation() {
    log "INFO" "Verifying installation..."

    local errors=0

    # Check Node.js
    if ! command -v node >/dev/null 2>&1; then
        log "ERROR" "Node.js not found"
        ((errors++))
    else
        log "INFO" "Node.js: $(node --version)"
    fi

    # Check npm
    if ! command -v npm >/dev/null 2>&1; then
        log "ERROR" "npm not found"
        ((errors++))
    else
        log "INFO" "npm: $(npm --version)"
    fi

    # Check database
    local db_file="$PROJECT_ROOT/db/ai_nodes.db"
    if [[ ! -f "$db_file" ]]; then
        log "ERROR" "Database file not found: $db_file"
        ((errors++))
    else
        log "INFO" "Database file exists: $db_file"
    fi

    # Check environment file
    if [[ ! -f "$PROJECT_ROOT/.env" ]]; then
        log "WARN" ".env file not found - please configure it"
    else
        log "INFO" ".env file exists"
    fi

    # Check directories
    local required_dirs=(
        "$PROJECT_ROOT/logs"
        "$PROJECT_ROOT/data"
        "$PROJECT_ROOT/backups"
        "$PROJECT_ROOT/scripts"
    )

    for dir in "${required_dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            log "ERROR" "Required directory not found: $dir"
            ((errors++))
        fi
    done

    if [[ $errors -eq 0 ]]; then
        log "INFO" "Installation verification completed successfully"
        return 0
    else
        log "ERROR" "Installation verification failed with $errors errors"
        return 1
    fi
}

# Print post-installation instructions
print_post_install_instructions() {
    log "INFO" "Setup completed successfully!"
    echo
    echo -e "${GREEN}=== Post-Installation Instructions ===${NC}"
    echo
    echo "1. Configure your environment:"
    echo "   Edit $PROJECT_ROOT/.env with your actual configuration values"
    echo
    echo "2. Test the monitoring system:"
    echo "   cd $PROJECT_ROOT && bash scripts/monitor.sh"
    echo
    echo "3. Start the main application:"
    echo "   cd $PROJECT_ROOT && npm start"
    echo
    echo "4. Check logs:"
    echo "   tail -f $PROJECT_ROOT/logs/setup-$(date +%Y%m%d)*.log"
    echo
    echo "5. Optional: Set up systemd services (Linux only):"
    echo "   sudo bash scripts/systemd/install-services.sh"
    echo
    echo -e "${YELLOW}Important:${NC} Make sure to configure your Solana private key and other sensitive"
    echo "information in the .env file before running the automation scripts."
    echo
}

# Main execution
main() {
    log "INFO" "Starting AI Nodes setup script..."
    log "INFO" "Script directory: $SCRIPT_DIR"
    log "INFO" "Project root: $PROJECT_ROOT"

    # Check if we're running in the right directory
    if [[ ! -d "$PROJECT_ROOT" ]]; then
        error_exit "Project root directory not found: $PROJECT_ROOT"
    fi

    # Run setup steps
    check_root
    detect_os
    create_directories
    install_system_dependencies
    install_nodejs
    setup_database
    setup_environment
    install_project_dependencies
    setup_cron_jobs
    setup_systemd_services

    # Verify installation
    if verify_installation; then
        print_post_install_instructions
        log "INFO" "Setup completed successfully!"
        exit 0
    else
        error_exit "Setup completed with errors. Please check the logs."
    fi
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi