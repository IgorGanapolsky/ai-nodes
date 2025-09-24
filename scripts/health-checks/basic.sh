#!/bin/bash
# AI Nodes Basic Health Check Script
# Performs fundamental system and application health checks
set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_FILE="$PROJECT_ROOT/logs/health-$(date +%Y%m%d).log"

# Load environment variables
if [[ -f "$PROJECT_ROOT/.env" ]]; then
    set -a
    source "$PROJECT_ROOT/.env"
    set +a
fi

# Configuration
DATABASE_PATH="${DATABASE_PATH:-$PROJECT_ROOT/db/ai_nodes.db}"
HEALTH_CHECK_TIMEOUT="${HEALTH_CHECK_TIMEOUT:-30}"
EXIT_ON_FAILURE="${EXIT_ON_FAILURE:-true}"

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

# Health check results
HEALTH_CHECKS=()
FAILED_CHECKS=()

# Add health check result
add_check_result() {
    local check_name="$1"
    local status="$2" # PASS, WARN, FAIL
    local message="$3"

    HEALTH_CHECKS+=("$check_name:$status:$message")

    case "$status" in
        "PASS")
            log "INFO" "✓ $check_name: $message"
            ;;
        "WARN")
            log "WARN" "⚠ $check_name: $message"
            ;;
        "FAIL")
            log "ERROR" "✗ $check_name: $message"
            FAILED_CHECKS+=("$check_name")
            ;;
    esac
}

# Check system resources
check_system_resources() {
    local check_name="System Resources"

    # CPU usage
    local cpu_usage
    if command -v top >/dev/null 2>&1; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            cpu_usage=$(top -l 1 -s 0 | grep "CPU usage" | awk '{print $3}' | sed 's/%//' || echo "0")
        else
            cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2+$4}' | sed 's/%us,//' || echo "0")
        fi
    else
        cpu_usage="0"
    fi

    # Memory usage
    local memory_usage
    if [[ "$OSTYPE" == "darwin"* ]]; then
        local memory_info=$(vm_stat | grep -E "(free|Pages being used)")
        local free_pages=$(echo "$memory_info" | grep "Pages free" | awk '{print $3}' | sed 's/\.//')
        local used_pages=$(echo "$memory_info" | grep "Pages being used" | awk '{print $5}' | sed 's/\.//')
        if [[ -n "$free_pages" ]] && [[ -n "$used_pages" ]]; then
            local total_pages=$((free_pages + used_pages))
            memory_usage=$(echo "scale=2; ($used_pages * 100) / $total_pages" | bc -l 2>/dev/null || echo "0")
        else
            memory_usage="0"
        fi
    else
        memory_usage=$(free | grep Mem | awk '{printf "%.2f", ($3/$2) * 100.0}' 2>/dev/null || echo "0")
    fi

    # Disk usage
    local disk_usage=$(df "$PROJECT_ROOT" | tail -1 | awk '{print $5}' | sed 's/%//' || echo "0")

    # Evaluate thresholds
    local status="PASS"
    local message="CPU: ${cpu_usage}%, Memory: ${memory_usage}%, Disk: ${disk_usage}%"

    if (( $(echo "$cpu_usage > 90" | bc -l 2>/dev/null || echo "0") )) || \
       (( $(echo "$memory_usage > 90" | bc -l 2>/dev/null || echo "0") )) || \
       (( $(echo "$disk_usage > 90" | bc -l 2>/dev/null || echo "0") )); then
        status="FAIL"
    elif (( $(echo "$cpu_usage > 80" | bc -l 2>/dev/null || echo "0") )) || \
         (( $(echo "$memory_usage > 80" | bc -l 2>/dev/null || echo "0") )) || \
         (( $(echo "$disk_usage > 80" | bc -l 2>/dev/null || echo "0") )); then
        status="WARN"
    fi

    add_check_result "$check_name" "$status" "$message"
}

# Check database connectivity
check_database() {
    local check_name="Database"

    if [[ ! -f "$DATABASE_PATH" ]]; then
        add_check_result "$check_name" "FAIL" "Database file not found: $DATABASE_PATH"
        return 1
    fi

    # Test database connectivity
    local query="SELECT COUNT(*) FROM sqlite_master WHERE type='table';"
    local table_count

    if table_count=$(sqlite3 "$DATABASE_PATH" "$query" 2>/dev/null); then
        add_check_result "$check_name" "PASS" "Connected successfully, $table_count tables found"
        return 0
    else
        add_check_result "$check_name" "FAIL" "Cannot connect to database"
        return 1
    fi
}

# Check network connectivity
check_network() {
    local check_name="Network Connectivity"

    # Test internet connectivity
    if ping -c 1 8.8.8.8 >/dev/null 2>&1; then
        # Test Solana RPC
        if [[ -n "${SOLANA_RPC_URL:-}" ]]; then
            if curl -s --max-time 10 -X POST -H "Content-Type: application/json" \
                -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' \
                "$SOLANA_RPC_URL" >/dev/null 2>&1; then
                add_check_result "$check_name" "PASS" "Internet and Solana RPC accessible"
            else
                add_check_result "$check_name" "WARN" "Internet OK, but Solana RPC unreachable"
            fi
        else
            add_check_result "$check_name" "PASS" "Internet connectivity OK"
        fi
    else
        add_check_result "$check_name" "FAIL" "No internet connectivity"
    fi
}

# Check required tools
check_required_tools() {
    local check_name="Required Tools"
    local required_tools=("sqlite3" "curl" "jq" "bc")
    local missing_tools=()

    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            missing_tools+=("$tool")
        fi
    done

    if [[ ${#missing_tools[@]} -eq 0 ]]; then
        add_check_result "$check_name" "PASS" "All required tools available"
    else
        add_check_result "$check_name" "FAIL" "Missing tools: ${missing_tools[*]}"
    fi
}

# Check environment configuration
check_environment() {
    local check_name="Environment Configuration"

    if [[ ! -f "$PROJECT_ROOT/.env" ]]; then
        add_check_result "$check_name" "WARN" ".env file not found"
        return 1
    fi

    # Check critical environment variables
    local required_vars=("SOLANA_RPC_URL")
    local missing_vars=()

    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done

    if [[ ${#missing_vars[@]} -eq 0 ]]; then
        add_check_result "$check_name" "PASS" "Environment configured"
    else
        add_check_result "$check_name" "WARN" "Missing variables: ${missing_vars[*]}"
    fi
}

# Check directory structure
check_directories() {
    local check_name="Directory Structure"
    local required_dirs=(
        "$PROJECT_ROOT/logs"
        "$PROJECT_ROOT/data"
        "$PROJECT_ROOT/backups"
        "$PROJECT_ROOT/scripts"
    )
    local missing_dirs=()

    for dir in "${required_dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            missing_dirs+=("$dir")
        fi
    done

    if [[ ${#missing_dirs[@]} -eq 0 ]]; then
        add_check_result "$check_name" "PASS" "All directories exist"
    else
        add_check_result "$check_name" "WARN" "Missing directories: ${missing_dirs[*]}"
    fi
}

# Check log file sizes
check_log_sizes() {
    local check_name="Log File Sizes"

    if [[ ! -d "$PROJECT_ROOT/logs" ]]; then
        add_check_result "$check_name" "WARN" "Logs directory not found"
        return 1
    fi

    # Find large log files (>100MB)
    local large_logs=()
    while IFS= read -r -d '' file; do
        large_logs+=("$(basename "$file")")
    done < <(find "$PROJECT_ROOT/logs" -name "*.log" -size +100M -print0 2>/dev/null)

    if [[ ${#large_logs[@]} -eq 0 ]]; then
        add_check_result "$check_name" "PASS" "Log sizes are reasonable"
    else
        add_check_result "$check_name" "WARN" "Large log files: ${large_logs[*]}"
    fi
}

# Check process status (if running in systemd)
check_processes() {
    local check_name="Process Status"

    # Check if we're running under systemd
    if command -v systemctl >/dev/null 2>&1; then
        local services=("ai-nodes-monitor" "ai-nodes-reinvest" "ai-nodes-health")
        local running_services=()
        local stopped_services=()

        for service in "${services[@]}"; do
            if systemctl is-active "${service}.service" >/dev/null 2>&1; then
                running_services+=("$service")
            else
                stopped_services+=("$service")
            fi
        done

        if [[ ${#stopped_services[@]} -eq 0 ]]; then
            add_check_result "$check_name" "PASS" "All services running: ${running_services[*]}"
        elif [[ ${#running_services[@]} -gt 0 ]]; then
            add_check_result "$check_name" "WARN" "Some services stopped: ${stopped_services[*]}"
        else
            add_check_result "$check_name" "FAIL" "No AI Nodes services running"
        fi
    else
        add_check_result "$check_name" "PASS" "Systemd not available, skipping process check"
    fi
}

# Generate health report
generate_health_report() {
    local report_file="$PROJECT_ROOT/monitoring/health-report-$(date +%Y%m%d-%H%M%S).json"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    # Ensure monitoring directory exists
    mkdir -p "$PROJECT_ROOT/monitoring"

    local total_checks=${#HEALTH_CHECKS[@]}
    local failed_checks=${#FAILED_CHECKS[@]}
    local passed_checks=$((total_checks - failed_checks))

    # Calculate overall health score
    local health_score=0
    if [[ $total_checks -gt 0 ]]; then
        health_score=$(echo "scale=2; ($passed_checks * 100) / $total_checks" | bc -l)
    fi

    # Generate JSON report
    local checks_json=""
    for check in "${HEALTH_CHECKS[@]}"; do
        IFS=':' read -r name status message <<< "$check"
        if [[ -n "$checks_json" ]]; then
            checks_json+=","
        fi
        checks_json+="{\"name\":\"$name\",\"status\":\"$status\",\"message\":\"$message\"}"
    done

    local report=$(cat << EOF
{
    "timestamp": "$timestamp",
    "health_score": $health_score,
    "total_checks": $total_checks,
    "passed_checks": $passed_checks,
    "failed_checks": $failed_checks,
    "overall_status": "$([ $failed_checks -eq 0 ] && echo "HEALTHY" || echo "DEGRADED")",
    "checks": [$checks_json]
}
EOF
)

    echo "$report" > "$report_file"
    log "INFO" "Health report generated: $report_file"
}

# Main health check execution
main() {
    log "INFO" "Starting AI Nodes health check"

    # Ensure log directory exists
    mkdir -p "$PROJECT_ROOT/logs"

    # Run all health checks
    check_system_resources
    check_database
    check_network
    check_required_tools
    check_environment
    check_directories
    check_log_sizes
    check_processes

    # Generate report
    generate_health_report

    # Summary
    local total_checks=${#HEALTH_CHECKS[@]}
    local failed_checks=${#FAILED_CHECKS[@]}

    echo
    log "INFO" "Health check completed: $((total_checks - failed_checks))/$total_checks checks passed"

    if [[ $failed_checks -eq 0 ]]; then
        log "INFO" "✓ All health checks passed - System is healthy"
        exit 0
    else
        log "ERROR" "✗ $failed_checks health check(s) failed: ${FAILED_CHECKS[*]}"
        if [[ "$EXIT_ON_FAILURE" == "true" ]]; then
            exit 1
        else
            exit 0
        fi
    fi
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi