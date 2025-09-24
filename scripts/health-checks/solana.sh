#!/bin/bash
# AI Nodes Solana-specific Health Check Script
# Focuses on Solana blockchain connectivity and wallet status
set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_FILE="$PROJECT_ROOT/logs/health-solana-$(date +%Y%m%d).log"

# Load environment variables
if [[ -f "$PROJECT_ROOT/.env" ]]; then
    set -a
    source "$PROJECT_ROOT/.env"
    set +a
fi

# Configuration
SOLANA_RPC_URL="${SOLANA_RPC_URL:-https://api.mainnet-beta.solana.com}"
SOLANA_PUBLIC_KEY="${SOLANA_PUBLIC_KEY:-}"
MIN_BALANCE_SOL="${MIN_BALANCE_SOL:-0.1}"
MAX_RESPONSE_TIME="${MAX_RESPONSE_TIME:-5000}" # milliseconds

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

# Check Solana RPC endpoint health
check_rpc_health() {
    local check_name="Solana RPC Health"

    log "DEBUG" "Testing RPC endpoint: $SOLANA_RPC_URL"

    # Measure response time
    local start_time=$(date +%s%3N)
    local response=$(curl -s --max-time 10 -w "%{http_code}" -X POST -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' \
        "$SOLANA_RPC_URL" 2>/dev/null)
    local end_time=$(date +%s%3N)
    local response_time=$((end_time - start_time))

    local http_code="${response: -3}"
    local response_body="${response%???}"

    if [[ "$http_code" == "200" ]]; then
        local result=$(echo "$response_body" | jq -r '.result // empty' 2>/dev/null)
        if [[ "$result" == "ok" ]]; then
            if [[ $response_time -le $MAX_RESPONSE_TIME ]]; then
                add_check_result "$check_name" "PASS" "RPC healthy (${response_time}ms)"
            else
                add_check_result "$check_name" "WARN" "RPC healthy but slow (${response_time}ms)"
            fi
        else
            add_check_result "$check_name" "WARN" "RPC responding but not healthy"
        fi
    else
        add_check_result "$check_name" "FAIL" "RPC unreachable (HTTP $http_code)"
    fi
}

# Check Solana network status
check_network_status() {
    local check_name="Solana Network Status"

    local response=$(curl -s --max-time 10 -X POST -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","id":1,"method":"getEpochInfo"}' \
        "$SOLANA_RPC_URL" 2>/dev/null)

    if [[ -z "$response" ]]; then
        add_check_result "$check_name" "FAIL" "No response from RPC"
        return 1
    fi

    local error=$(echo "$response" | jq -r '.error // empty' 2>/dev/null)
    if [[ -n "$error" ]]; then
        add_check_result "$check_name" "FAIL" "RPC error: $error"
        return 1
    fi

    local epoch=$(echo "$response" | jq -r '.result.epoch // 0' 2>/dev/null)
    local slot_index=$(echo "$response" | jq -r '.result.slotIndex // 0' 2>/dev/null)
    local slots_in_epoch=$(echo "$response" | jq -r '.result.slotsInEpoch // 0' 2>/dev/null)

    if [[ $epoch -gt 0 ]]; then
        local progress=$(echo "scale=2; ($slot_index * 100) / $slots_in_epoch" | bc -l 2>/dev/null || echo "0")
        add_check_result "$check_name" "PASS" "Epoch $epoch, Progress: ${progress}%"
    else
        add_check_result "$check_name" "FAIL" "Invalid epoch info received"
    fi
}

# Check wallet balance
check_wallet_balance() {
    local check_name="Wallet Balance"

    if [[ -z "$SOLANA_PUBLIC_KEY" ]]; then
        add_check_result "$check_name" "WARN" "No public key configured"
        return 1
    fi

    log "DEBUG" "Checking balance for: $SOLANA_PUBLIC_KEY"

    local response=$(curl -s --max-time 10 -X POST -H "Content-Type: application/json" \
        -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getBalance\",\"params\":[\"$SOLANA_PUBLIC_KEY\"]}" \
        "$SOLANA_RPC_URL" 2>/dev/null)

    if [[ -z "$response" ]]; then
        add_check_result "$check_name" "FAIL" "No response from RPC"
        return 1
    fi

    local error=$(echo "$response" | jq -r '.error // empty' 2>/dev/null)
    if [[ -n "$error" ]]; then
        add_check_result "$check_name" "FAIL" "RPC error: $error"
        return 1
    fi

    local balance_lamports=$(echo "$response" | jq -r '.result.value // 0' 2>/dev/null)
    local balance_sol=$(echo "scale=9; $balance_lamports / 1000000000" | bc -l 2>/dev/null || echo "0")

    if (( $(echo "$balance_sol >= $MIN_BALANCE_SOL" | bc -l 2>/dev/null || echo "0") )); then
        add_check_result "$check_name" "PASS" "Balance: $balance_sol SOL"
    else
        add_check_result "$check_name" "WARN" "Low balance: $balance_sol SOL (min: $MIN_BALANCE_SOL)"
    fi
}

# Check recent transaction activity
check_transaction_activity() {
    local check_name="Transaction Activity"

    if [[ -z "$SOLANA_PUBLIC_KEY" ]]; then
        add_check_result "$check_name" "WARN" "No public key configured"
        return 1
    fi

    local response=$(curl -s --max-time 10 -X POST -H "Content-Type: application/json" \
        -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getSignaturesForAddress\",\"params\":[\"$SOLANA_PUBLIC_KEY\",{\"limit\":10}]}" \
        "$SOLANA_RPC_URL" 2>/dev/null)

    if [[ -z "$response" ]]; then
        add_check_result "$check_name" "FAIL" "No response from RPC"
        return 1
    fi

    local error=$(echo "$response" | jq -r '.error // empty' 2>/dev/null)
    if [[ -n "$error" ]]; then
        add_check_result "$check_name" "FAIL" "RPC error: $error"
        return 1
    fi

    local tx_count=$(echo "$response" | jq -r '.result | length' 2>/dev/null || echo "0")

    if [[ $tx_count -gt 0 ]]; then
        local latest_tx=$(echo "$response" | jq -r '.result[0].signature' 2>/dev/null)
        local latest_slot=$(echo "$response" | jq -r '.result[0].slot' 2>/dev/null)
        add_check_result "$check_name" "PASS" "$tx_count recent transactions, latest at slot $latest_slot"
    else
        add_check_result "$check_name" "WARN" "No recent transaction activity"
    fi
}

# Check stake account status
check_stake_accounts() {
    local check_name="Stake Accounts"

    if [[ -z "$SOLANA_PUBLIC_KEY" ]]; then
        add_check_result "$check_name" "WARN" "No public key configured"
        return 1
    fi

    local response=$(curl -s --max-time 15 -X POST -H "Content-Type: application/json" \
        -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getProgramAccounts\",\"params\":[\"Stake11111111111111111111111111111111111111\",{\"filters\":[{\"memcmp\":{\"offset\":12,\"bytes\":\"$SOLANA_PUBLIC_KEY\"}}]}]}" \
        "$SOLANA_RPC_URL" 2>/dev/null)

    if [[ -z "$response" ]]; then
        add_check_result "$check_name" "FAIL" "No response from RPC"
        return 1
    fi

    local error=$(echo "$response" | jq -r '.error // empty' 2>/dev/null)
    if [[ -n "$error" ]]; then
        add_check_result "$check_name" "WARN" "Could not check stake accounts: $error"
        return 1
    fi

    local stake_count=$(echo "$response" | jq -r '.result | length' 2>/dev/null || echo "0")

    if [[ $stake_count -gt 0 ]]; then
        add_check_result "$check_name" "PASS" "$stake_count stake account(s) found"
    else
        add_check_result "$check_name" "WARN" "No stake accounts found"
    fi
}

# Check Jupiter API availability
check_jupiter_api() {
    local check_name="Jupiter API"

    local jupiter_url="${JUPITER_API_URL:-https://quote-api.jup.ag/v6}"

    local response=$(curl -s --max-time 10 "$jupiter_url/tokens" 2>/dev/null)

    if [[ -n "$response" ]]; then
        local token_count=$(echo "$response" | jq -r 'length' 2>/dev/null || echo "0")
        if [[ $token_count -gt 0 ]]; then
            add_check_result "$check_name" "PASS" "API responding, $token_count tokens available"
        else
            add_check_result "$check_name" "WARN" "API responding but no token data"
        fi
    else
        add_check_result "$check_name" "FAIL" "Jupiter API unreachable"
    fi
}

# Check slot progression
check_slot_progression() {
    local check_name="Slot Progression"

    # Get current slot
    local response1=$(curl -s --max-time 5 -X POST -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","id":1,"method":"getSlot"}' \
        "$SOLANA_RPC_URL" 2>/dev/null)

    if [[ -z "$response1" ]]; then
        add_check_result "$check_name" "FAIL" "No response from RPC"
        return 1
    fi

    local slot1=$(echo "$response1" | jq -r '.result // 0' 2>/dev/null)

    # Wait 3 seconds and get slot again
    sleep 3

    local response2=$(curl -s --max-time 5 -X POST -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","id":1,"method":"getSlot"}' \
        "$SOLANA_RPC_URL" 2>/dev/null)

    if [[ -z "$response2" ]]; then
        add_check_result "$check_name" "FAIL" "No response from RPC on second check"
        return 1
    fi

    local slot2=$(echo "$response2" | jq -r '.result // 0' 2>/dev/null)

    if [[ $slot2 -gt $slot1 ]]; then
        local slot_diff=$((slot2 - slot1))
        add_check_result "$check_name" "PASS" "Network progressing (+$slot_diff slots in 3s)"
    else
        add_check_result "$check_name" "WARN" "Network not progressing (slot: $slot1 -> $slot2)"
    fi
}

# Generate Solana-specific health report
generate_solana_report() {
    local report_file="$PROJECT_ROOT/monitoring/solana-health-$(date +%Y%m%d-%H%M%S).json"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    # Ensure monitoring directory exists
    mkdir -p "$PROJECT_ROOT/monitoring"

    local total_checks=${#HEALTH_CHECKS[@]}
    local failed_checks=${#FAILED_CHECKS[@]}
    local passed_checks=$((total_checks - failed_checks))

    # Calculate health score
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
    "check_type": "solana",
    "rpc_endpoint": "$SOLANA_RPC_URL",
    "wallet_address": "${SOLANA_PUBLIC_KEY:-"not_configured"}",
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
    log "INFO" "Solana health report generated: $report_file"
}

# Main execution
main() {
    log "INFO" "Starting Solana health check"

    # Ensure log directory exists
    mkdir -p "$PROJECT_ROOT/logs"

    # Check if required tools are available
    local required_tools=("curl" "jq" "bc")
    local missing_tools=()

    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            missing_tools+=("$tool")
        fi
    done

    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log "ERROR" "Missing required tools: ${missing_tools[*]}"
        exit 1
    fi

    # Run Solana-specific health checks
    check_rpc_health
    check_network_status
    check_wallet_balance
    check_transaction_activity
    check_stake_accounts
    check_jupiter_api
    check_slot_progression

    # Generate report
    generate_solana_report

    # Summary
    local total_checks=${#HEALTH_CHECKS[@]}
    local failed_checks=${#FAILED_CHECKS[@]}

    echo
    log "INFO" "Solana health check completed: $((total_checks - failed_checks))/$total_checks checks passed"

    if [[ $failed_checks -eq 0 ]]; then
        log "INFO" "✓ All Solana health checks passed"
        exit 0
    else
        log "ERROR" "✗ $failed_checks Solana health check(s) failed: ${FAILED_CHECKS[*]}"
        exit 1
    fi
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi