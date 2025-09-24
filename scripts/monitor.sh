#!/bin/bash
# AI Nodes Monitoring Script
# Monitors node status, logs metrics, and sends alerts
set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_FILE="$PROJECT_ROOT/logs/monitor-$(date +%Y%m%d).log"

# Load environment variables
if [[ -f "$PROJECT_ROOT/.env" ]]; then
    set -a
    source "$PROJECT_ROOT/.env"
    set +a
fi

# Default configuration
DATABASE_PATH="${DATABASE_PATH:-$PROJECT_ROOT/db/ai_nodes.db}"
MONITORING_INTERVAL="${MONITORING_INTERVAL:-900}"
DISCORD_WEBHOOK_URL="${DISCORD_WEBHOOK_URL:-}"
EMAIL_TO="${EMAIL_TO:-}"
ALERT_THRESHOLD_CPU="${ALERT_THRESHOLD_CPU:-80}"
ALERT_THRESHOLD_MEMORY="${ALERT_THRESHOLD_MEMORY:-85}"
ALERT_THRESHOLD_DISK="${ALERT_THRESHOLD_DISK:-90}"

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

# Check if required tools are available
check_dependencies() {
    local required_tools=("sqlite3" "curl" "jq" "bc")
    local missing_tools=()

    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            missing_tools+=("$tool")
        fi
    done

    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log "ERROR" "Missing required tools: ${missing_tools[*]}"
        log "ERROR" "Please run setup.sh first or install these tools manually"
        exit 1
    fi
}

# Get system metrics
get_system_metrics() {
    local metrics=()

    # CPU Usage
    if command -v top >/dev/null 2>&1; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            local cpu_usage=$(top -l 1 -s 0 | grep "CPU usage" | awk '{print $3}' | sed 's/%//')
        else
            # Linux
            local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2+$4}' | sed 's/%us,//')
        fi
    else
        cpu_usage="0"
    fi

    # Memory Usage
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        local memory_info=$(vm_stat | grep -E "(free|Pages being used)")
        local free_pages=$(echo "$memory_info" | grep "Pages free" | awk '{print $3}' | sed 's/\.//')
        local used_pages=$(echo "$memory_info" | grep "Pages being used" | awk '{print $5}' | sed 's/\.//')
        local total_pages=$((free_pages + used_pages))
        local memory_usage=$(echo "scale=2; ($used_pages * 100) / $total_pages" | bc -l)
    else
        # Linux
        local memory_usage=$(free | grep Mem | awk '{printf "%.2f", ($3/$2) * 100.0}')
    fi

    # Disk Usage
    local disk_usage=$(df "$PROJECT_ROOT" | tail -1 | awk '{print $5}' | sed 's/%//')

    # Network latency (ping Google DNS)
    local network_latency=$(ping -c 1 8.8.8.8 2>/dev/null | grep "time=" | awk -F'time=' '{print $2}' | awk '{print $1}' || echo "0")

    # System uptime
    if [[ "$OSTYPE" == "darwin"* ]]; then
        local uptime_seconds=$(sysctl -n kern.boottime | awk '{print $4}' | sed 's/,//')
        uptime_seconds=$(($(date +%s) - uptime_seconds))
    else
        local uptime_seconds=$(awk '{print int($1)}' /proc/uptime)
    fi

    echo "${cpu_usage:-0}|${memory_usage:-0}|${disk_usage:-0}|${network_latency:-0}|${uptime_seconds:-0}"
}

# Get Solana node metrics
get_solana_metrics() {
    local solana_metrics="0|0|0" # Default values for earnings_balance|staked_amount|rewards_earned

    if [[ -n "${SOLANA_RPC_URL:-}" ]] && [[ -n "${SOLANA_PUBLIC_KEY:-}" ]]; then
        log "DEBUG" "Fetching Solana metrics for ${SOLANA_PUBLIC_KEY}"

        # Get account balance
        local balance_response=$(curl -s -X POST -H "Content-Type: application/json" \
            -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getBalance\",\"params\":[\"$SOLANA_PUBLIC_KEY\"]}" \
            "$SOLANA_RPC_URL" 2>/dev/null || echo '{"result":{"value":0}}')

        local balance=$(echo "$balance_response" | jq -r '.result.value // 0' 2>/dev/null || echo "0")
        local balance_sol=$(echo "scale=9; $balance / 1000000000" | bc -l 2>/dev/null || echo "0")

        # Get stake account info (simplified - you may need to adjust based on your staking setup)
        local stake_accounts_response=$(curl -s -X POST -H "Content-Type: application/json" \
            -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getProgramAccounts\",\"params\":[\"Stake11111111111111111111111111111111111111\",{\"filters\":[{\"memcmp\":{\"offset\":12,\"bytes\":\"$SOLANA_PUBLIC_KEY\"}}]}]}" \
            "$SOLANA_RPC_URL" 2>/dev/null || echo '{"result":[]}')

        local staked_amount="0"
        if [[ -n "$stake_accounts_response" ]]; then
            # This is a simplified calculation - adjust based on your actual staking implementation
            staked_amount=$(echo "$stake_accounts_response" | jq -r '.result | length' 2>/dev/null || echo "0")
        fi

        # Calculate rewards (this is a placeholder - implement based on your actual rewards tracking)
        local rewards_earned="0"

        solana_metrics="${balance_sol}|${staked_amount}|${rewards_earned}"
    fi

    echo "$solana_metrics"
}

# Store metrics in database
store_metrics() {
    local node_id="$1"
    local status="$2"
    local system_metrics="$3"
    local solana_metrics="$4"

    IFS='|' read -r cpu_usage memory_usage disk_usage network_latency uptime_seconds <<< "$system_metrics"
    IFS='|' read -r earnings_balance staked_amount rewards_earned <<< "$solana_metrics"

    local query="INSERT INTO node_metrics
        (node_id, status, cpu_usage, memory_usage, disk_usage, network_latency, uptime_seconds, earnings_balance, staked_amount, rewards_earned)
        VALUES
        ('$node_id', '$status', $cpu_usage, $memory_usage, $disk_usage, $network_latency, $uptime_seconds, $earnings_balance, $staked_amount, $rewards_earned);"

    if sqlite3 "$DATABASE_PATH" "$query" 2>/dev/null; then
        log "DEBUG" "Metrics stored successfully for node $node_id"
    else
        log "ERROR" "Failed to store metrics for node $node_id"
        return 1
    fi
}

# Check for alert conditions
check_alerts() {
    local node_id="$1"
    local system_metrics="$2"

    IFS='|' read -r cpu_usage memory_usage disk_usage network_latency uptime_seconds <<< "$system_metrics"

    local alerts=()

    # CPU usage alert
    if (( $(echo "$cpu_usage > $ALERT_THRESHOLD_CPU" | bc -l) )); then
        alerts+=("HIGH_CPU:CPU usage is ${cpu_usage}% (threshold: ${ALERT_THRESHOLD_CPU}%)")
    fi

    # Memory usage alert
    if (( $(echo "$memory_usage > $ALERT_THRESHOLD_MEMORY" | bc -l) )); then
        alerts+=("HIGH_MEMORY:Memory usage is ${memory_usage}% (threshold: ${ALERT_THRESHOLD_MEMORY}%)")
    fi

    # Disk usage alert
    if (( $(echo "$disk_usage > $ALERT_THRESHOLD_DISK" | bc -l) )); then
        alerts+=("HIGH_DISK:Disk usage is ${disk_usage}% (threshold: ${ALERT_THRESHOLD_DISK}%)")
    fi

    # Network latency alert (> 1000ms)
    if (( $(echo "$network_latency > 1000" | bc -l) )); then
        alerts+=("HIGH_LATENCY:Network latency is ${network_latency}ms")
    fi

    # Process alerts
    for alert in "${alerts[@]}"; do
        IFS=':' read -r alert_type alert_message <<< "$alert"
        log "WARN" "ALERT [$alert_type]: $alert_message"

        # Store alert in database
        local query="INSERT INTO alerts (type, message, node_id) VALUES ('warning', '$alert_message', '$node_id');"
        sqlite3 "$DATABASE_PATH" "$query" 2>/dev/null || log "ERROR" "Failed to store alert in database"

        # Send notification
        send_alert_notification "$alert_type" "$alert_message" "$node_id"
    done
}

# Send alert notifications
send_alert_notification() {
    local alert_type="$1"
    local message="$2"
    local node_id="$3"

    # Discord notification
    if [[ -n "$DISCORD_WEBHOOK_URL" ]]; then
        send_discord_alert "$alert_type" "$message" "$node_id"
    fi

    # Email notification
    if [[ -n "$EMAIL_TO" ]]; then
        send_email_alert "$alert_type" "$message" "$node_id"
    fi
}

# Send Discord alert
send_discord_alert() {
    local alert_type="$1"
    local message="$2"
    local node_id="$3"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    local color="16776960" # Yellow for warnings
    if [[ "$alert_type" == *"HIGH"* ]]; then
        color="16711680" # Red for high severity
    fi

    local payload=$(jq -n \
        --arg title "AI Node Alert: $alert_type" \
        --arg description "$message" \
        --arg node_id "$node_id" \
        --arg timestamp "$timestamp" \
        --argjson color "$color" \
        '{
            embeds: [{
                title: $title,
                description: $description,
                color: $color,
                fields: [
                    {name: "Node ID", value: $node_id, inline: true},
                    {name: "Timestamp", value: $timestamp, inline: true}
                ],
                footer: {text: "AI Nodes Monitoring System"}
            }]
        }')

    if curl -s -H "Content-Type: application/json" -X POST -d "$payload" "$DISCORD_WEBHOOK_URL" >/dev/null 2>&1; then
        log "DEBUG" "Discord alert sent successfully"
    else
        log "ERROR" "Failed to send Discord alert"
    fi
}

# Send email alert
send_email_alert() {
    local alert_type="$1"
    local message="$2"
    local node_id="$3"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    # Check if email configuration is available
    if [[ -z "${EMAIL_SMTP_HOST:-}" ]] || [[ -z "${EMAIL_USERNAME:-}" ]] || [[ -z "${EMAIL_PASSWORD:-}" ]]; then
        log "DEBUG" "Email configuration not complete, skipping email alert"
        return 0
    fi

    # Create email content
    local subject="AI Node Alert: $alert_type - $node_id"
    local body="AI Nodes Monitoring Alert

Alert Type: $alert_type
Node ID: $node_id
Message: $message
Timestamp: $timestamp

This is an automated alert from the AI Nodes monitoring system.
Please check your node status and take appropriate action if necessary.

--
AI Nodes Monitoring System"

    # Use Node.js to send email (requires nodemailer)
    node -e "
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
    host: '$EMAIL_SMTP_HOST',
    port: ${EMAIL_SMTP_PORT:-587},
    secure: false,
    auth: {
        user: '$EMAIL_USERNAME',
        pass: '$EMAIL_PASSWORD'
    }
});

const mailOptions = {
    from: '$EMAIL_USERNAME',
    to: '$EMAIL_TO',
    subject: '$subject',
    text: \`$body\`
};

transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.error('Email error:', error);
        process.exit(1);
    } else {
        console.log('Email sent:', info.messageId);
        process.exit(0);
    }
});
" 2>/dev/null

    if [[ $? -eq 0 ]]; then
        log "DEBUG" "Email alert sent successfully"
    else
        log "ERROR" "Failed to send email alert"
    fi
}

# Generate monitoring report
generate_report() {
    local report_file="$PROJECT_ROOT/monitoring/daily-report-$(date +%Y%m%d).json"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    # Create monitoring directory if it doesn't exist
    mkdir -p "$PROJECT_ROOT/monitoring"

    # Get recent metrics (last 24 hours)
    local metrics_query="SELECT
        AVG(cpu_usage) as avg_cpu,
        MAX(cpu_usage) as max_cpu,
        AVG(memory_usage) as avg_memory,
        MAX(memory_usage) as max_memory,
        AVG(disk_usage) as avg_disk,
        MAX(disk_usage) as max_disk,
        AVG(network_latency) as avg_latency,
        MAX(network_latency) as max_latency,
        COUNT(*) as total_checks
    FROM node_metrics
    WHERE timestamp >= datetime('now', '-24 hours');"

    local metrics_result=$(sqlite3 "$DATABASE_PATH" "$metrics_query" 2>/dev/null || echo "0|0|0|0|0|0|0|0|0")

    # Get alert count (last 24 hours)
    local alerts_query="SELECT COUNT(*) FROM alerts WHERE timestamp >= datetime('now', '-24 hours');"
    local alert_count=$(sqlite3 "$DATABASE_PATH" "$alerts_query" 2>/dev/null || echo "0")

    # Generate JSON report
    IFS='|' read -r avg_cpu max_cpu avg_memory max_memory avg_disk max_disk avg_latency max_latency total_checks <<< "$metrics_result"

    local report=$(jq -n \
        --arg timestamp "$timestamp" \
        --arg avg_cpu "${avg_cpu:-0}" \
        --arg max_cpu "${max_cpu:-0}" \
        --arg avg_memory "${avg_memory:-0}" \
        --arg max_memory "${max_memory:-0}" \
        --arg avg_disk "${avg_disk:-0}" \
        --arg max_disk "${max_disk:-0}" \
        --arg avg_latency "${avg_latency:-0}" \
        --arg max_latency "${max_latency:-0}" \
        --arg total_checks "${total_checks:-0}" \
        --arg alert_count "$alert_count" \
        '{
            timestamp: $timestamp,
            period: "24 hours",
            metrics: {
                cpu: {
                    average: ($avg_cpu | tonumber),
                    maximum: ($max_cpu | tonumber)
                },
                memory: {
                    average: ($avg_memory | tonumber),
                    maximum: ($max_memory | tonumber)
                },
                disk: {
                    average: ($avg_disk | tonumber),
                    maximum: ($max_disk | tonumber)
                },
                network_latency: {
                    average: ($avg_latency | tonumber),
                    maximum: ($max_latency | tonumber)
                }
            },
            monitoring: {
                total_checks: ($total_checks | tonumber),
                alert_count: ($alert_count | tonumber)
            }
        }')

    echo "$report" > "$report_file"
    log "INFO" "Daily report generated: $report_file"
}

# Cleanup old data
cleanup_old_data() {
    local retention_days="${RETENTION_DAYS:-30}"

    log "INFO" "Cleaning up data older than $retention_days days"

    # Clean old metrics
    local cleanup_query="DELETE FROM node_metrics WHERE timestamp < datetime('now', '-$retention_days days');"
    sqlite3 "$DATABASE_PATH" "$cleanup_query" 2>/dev/null || log "WARN" "Failed to cleanup old metrics"

    # Clean old alerts
    cleanup_query="DELETE FROM alerts WHERE timestamp < datetime('now', '-$retention_days days');"
    sqlite3 "$DATABASE_PATH" "$cleanup_query" 2>/dev/null || log "WARN" "Failed to cleanup old alerts"

    # Clean old reports
    find "$PROJECT_ROOT/monitoring" -name "daily-report-*.json" -mtime +$retention_days -delete 2>/dev/null || true

    # Clean old logs
    find "$PROJECT_ROOT/logs" -name "*.log" -mtime +$retention_days -delete 2>/dev/null || true

    log "INFO" "Cleanup completed"
}

# Main monitoring function
monitor_node() {
    local node_id="${1:-$(hostname)}"

    log "INFO" "Starting monitoring check for node: $node_id"

    # Get system metrics
    local system_metrics=$(get_system_metrics)
    log "DEBUG" "System metrics: $system_metrics"

    # Get Solana metrics
    local solana_metrics=$(get_solana_metrics)
    log "DEBUG" "Solana metrics: $solana_metrics"

    # Determine node status
    local status="online"
    IFS='|' read -r cpu_usage memory_usage disk_usage network_latency uptime_seconds <<< "$system_metrics"

    # Mark as degraded if any metric is above threshold
    if (( $(echo "$cpu_usage > $ALERT_THRESHOLD_CPU" | bc -l) )) || \
       (( $(echo "$memory_usage > $ALERT_THRESHOLD_MEMORY" | bc -l) )) || \
       (( $(echo "$disk_usage > $ALERT_THRESHOLD_DISK" | bc -l) )); then
        status="degraded"
    fi

    # Store metrics
    if store_metrics "$node_id" "$status" "$system_metrics" "$solana_metrics"; then
        log "INFO" "Metrics stored successfully"
    else
        log "ERROR" "Failed to store metrics"
    fi

    # Check for alerts
    check_alerts "$node_id" "$system_metrics"

    log "INFO" "Monitoring check completed for node: $node_id (Status: $status)"
}

# Main execution
main() {
    log "INFO" "AI Nodes monitoring script started"

    # Ensure log directory exists
    mkdir -p "$PROJECT_ROOT/logs"

    # Check dependencies
    check_dependencies

    # Check if database exists
    if [[ ! -f "$DATABASE_PATH" ]]; then
        log "ERROR" "Database not found: $DATABASE_PATH"
        log "ERROR" "Please run setup.sh first"
        exit 1
    fi

    # Monitor node
    monitor_node "${1:-}"

    # Generate daily report (only at midnight)
    if [[ "$(date +%H:%M)" == "00:00" ]]; then
        generate_report
    fi

    # Cleanup old data (weekly, on Sundays at midnight)
    if [[ "$(date +%u)" == "7" ]] && [[ "$(date +%H:%M)" == "00:00" ]]; then
        cleanup_old_data
    fi

    log "INFO" "Monitoring script completed"
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi