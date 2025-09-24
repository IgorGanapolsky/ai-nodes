#!/bin/bash
# AI Nodes Comprehensive Health Check Script
# Runs all available health checks and generates a unified report
set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_FILE="$PROJECT_ROOT/logs/health-comprehensive-$(date +%Y%m%d-%H%M%S).log"

# Configuration
PARALLEL_CHECKS="${PARALLEL_CHECKS:-false}"
SEND_ALERTS="${SEND_ALERTS:-true}"
GENERATE_SUMMARY="${GENERATE_SUMMARY:-true}"

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

# Health check modules
HEALTH_MODULES=(
    "basic"
    "solana"
)

# Results storage
declare -A MODULE_RESULTS
declare -A MODULE_REPORTS

# Run a single health check module
run_health_module() {
    local module="$1"
    local module_script="$SCRIPT_DIR/${module}.sh"

    if [[ ! -f "$module_script" ]]; then
        log "ERROR" "Health check module not found: $module_script"
        return 1
    fi

    log "INFO" "Running $module health checks..."

    local start_time=$(date +%s)
    local temp_log=$(mktemp)

    # Run the health check module
    if bash "$module_script" > "$temp_log" 2>&1; then
        MODULE_RESULTS["$module"]="PASS"
        log "INFO" "✓ $module health checks passed"
    else
        MODULE_RESULTS["$module"]="FAIL"
        log "ERROR" "✗ $module health checks failed"
    fi

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    # Store module output
    MODULE_REPORTS["$module"]=$(cat "$temp_log")

    # Append to main log
    echo "=== $module Health Check Output ===" >> "$LOG_FILE"
    cat "$temp_log" >> "$LOG_FILE"
    echo "=== End $module Output ===" >> "$LOG_FILE"

    rm -f "$temp_log"

    log "INFO" "$module health check completed in ${duration}s"
    return 0
}

# Run health checks in parallel
run_parallel_checks() {
    log "INFO" "Running health checks in parallel"

    local pids=()
    local temp_dir=$(mktemp -d)

    # Start all modules in background
    for module in "${HEALTH_MODULES[@]}"; do
        (
            run_health_module "$module"
            echo "${MODULE_RESULTS["$module"]:-FAIL}" > "$temp_dir/$module.result"
            echo "${MODULE_REPORTS["$module"]:-}" > "$temp_dir/$module.report"
        ) &
        pids+=($!)
    done

    # Wait for all background jobs
    local failed_modules=()
    for i in "${!pids[@]}"; do
        local pid=${pids[$i]}
        local module=${HEALTH_MODULES[$i]}

        if wait $pid; then
            log "DEBUG" "$module module completed successfully"
        else
            log "WARN" "$module module completed with errors"
            failed_modules+=("$module")
        fi

        # Read results back
        if [[ -f "$temp_dir/$module.result" ]]; then
            MODULE_RESULTS["$module"]=$(cat "$temp_dir/$module.result")
        fi
        if [[ -f "$temp_dir/$module.report" ]]; then
            MODULE_REPORTS["$module"]=$(cat "$temp_dir/$module.report")
        fi
    done

    # Cleanup
    rm -rf "$temp_dir"

    if [[ ${#failed_modules[@]} -gt 0 ]]; then
        log "WARN" "Some modules completed with errors: ${failed_modules[*]}"
    fi
}

# Run health checks sequentially
run_sequential_checks() {
    log "INFO" "Running health checks sequentially"

    for module in "${HEALTH_MODULES[@]}"; do
        run_health_module "$module"
    done
}

# Parse health check reports
parse_reports() {
    log "INFO" "Parsing health check reports"

    # Look for recent health reports
    local reports_dir="$PROJECT_ROOT/monitoring"
    if [[ ! -d "$reports_dir" ]]; then
        log "WARN" "Monitoring directory not found: $reports_dir"
        return 1
    fi

    # Find the most recent reports for each module
    for module in "${HEALTH_MODULES[@]}"; do
        local latest_report
        if [[ "$module" == "basic" ]]; then
            latest_report=$(find "$reports_dir" -name "health-report-*.json" -type f | sort | tail -1)
        elif [[ "$module" == "solana" ]]; then
            latest_report=$(find "$reports_dir" -name "solana-health-*.json" -type f | sort | tail -1)
        fi

        if [[ -n "$latest_report" ]] && [[ -f "$latest_report" ]]; then
            log "DEBUG" "Found report for $module: $latest_report"
            MODULE_REPORTS["$module"]=$(cat "$latest_report")
        fi
    done
}

# Generate comprehensive health summary
generate_comprehensive_report() {
    local report_file="$PROJECT_ROOT/monitoring/comprehensive-health-$(date +%Y%m%d-%H%M%S).json"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    log "INFO" "Generating comprehensive health report"

    # Ensure monitoring directory exists
    mkdir -p "$PROJECT_ROOT/monitoring"

    # Calculate overall statistics
    local total_modules=${#HEALTH_MODULES[@]}
    local passed_modules=0
    local failed_modules=0

    for module in "${HEALTH_MODULES[@]}"; do
        if [[ "${MODULE_RESULTS["$module"]:-FAIL}" == "PASS" ]]; then
            ((passed_modules++))
        else
            ((failed_modules++))
        fi
    done

    local overall_health_score=0
    if [[ $total_modules -gt 0 ]]; then
        overall_health_score=$(echo "scale=2; ($passed_modules * 100) / $total_modules" | bc -l)
    fi

    local overall_status="DEGRADED"
    if [[ $failed_modules -eq 0 ]]; then
        overall_status="HEALTHY"
    elif [[ $passed_modules -eq 0 ]]; then
        overall_status="CRITICAL"
    fi

    # Build module results JSON
    local modules_json=""
    for module in "${HEALTH_MODULES[@]}"; do
        if [[ -n "$modules_json" ]]; then
            modules_json+=","
        fi

        local module_status="${MODULE_RESULTS["$module"]:-UNKNOWN}"
        local module_report="${MODULE_REPORTS["$module"]:-{}}"

        # Try to parse the module report as JSON, fallback to text
        local module_data
        if echo "$module_report" | jq . >/dev/null 2>&1; then
            module_data="$module_report"
        else
            # Escape and wrap as text
            module_data="{\"type\":\"text\",\"content\":$(echo "$module_report" | jq -R -s .)}"
        fi

        modules_json+="{\"name\":\"$module\",\"status\":\"$module_status\",\"data\":$module_data}"
    done

    # Generate comprehensive report
    local report=$(cat << EOF
{
    "timestamp": "$timestamp",
    "report_type": "comprehensive",
    "overall_status": "$overall_status",
    "overall_health_score": $overall_health_score,
    "modules": {
        "total": $total_modules,
        "passed": $passed_modules,
        "failed": $failed_modules
    },
    "module_results": [$modules_json],
    "system_info": {
        "hostname": "$(hostname)",
        "os": "$OSTYPE",
        "uptime": "$(uptime | awk '{print $3,$4}' | sed 's/,//')",
        "load_average": "$(uptime | awk -F'load average:' '{print $2}' | sed 's/^ *//')"
    },
    "metadata": {
        "check_duration": "$(date +%s)",
        "parallel_execution": $PARALLEL_CHECKS,
        "log_file": "$LOG_FILE"
    }
}
EOF
)

    echo "$report" > "$report_file"
    log "INFO" "Comprehensive health report saved: $report_file"

    # Return report file path for further processing
    echo "$report_file"
}

# Send health alerts
send_health_alerts() {
    local report_file="$1"

    if [[ "$SEND_ALERTS" != "true" ]]; then
        log "DEBUG" "Health alerts disabled"
        return 0
    fi

    if [[ ! -f "$report_file" ]]; then
        log "ERROR" "Report file not found for alerts: $report_file"
        return 1
    fi

    log "INFO" "Checking if health alerts should be sent"

    local overall_status=$(jq -r '.overall_status' "$report_file" 2>/dev/null || echo "UNKNOWN")
    local failed_modules=$(jq -r '.modules.failed' "$report_file" 2>/dev/null || echo "0")

    if [[ "$overall_status" != "HEALTHY" ]] && [[ $failed_modules -gt 0 ]]; then
        log "WARN" "System health degraded, sending alerts"

        # Use existing alert functionality from monitor script
        local monitor_script="$PROJECT_ROOT/scripts/monitor.sh"
        if [[ -f "$monitor_script" ]]; then
            # Extract alert functions and send notification
            source "$monitor_script"

            local alert_message="Comprehensive health check failed. Status: $overall_status, Failed modules: $failed_modules"
            send_alert_notification "HEALTH_CHECK_FAILED" "$alert_message" "$(hostname)"
        else
            log "WARN" "Monitor script not found, cannot send alerts"
        fi
    else
        log "INFO" "System health is good, no alerts needed"
    fi
}

# Generate health summary for console output
show_health_summary() {
    local report_file="$1"

    if [[ "$GENERATE_SUMMARY" != "true" ]]; then
        return 0
    fi

    if [[ ! -f "$report_file" ]]; then
        log "ERROR" "Report file not found for summary: $report_file"
        return 1
    fi

    echo
    echo -e "${BLUE}=== AI Nodes Comprehensive Health Summary ===${NC}"
    echo

    local overall_status=$(jq -r '.overall_status' "$report_file" 2>/dev/null || echo "UNKNOWN")
    local health_score=$(jq -r '.overall_health_score' "$report_file" 2>/dev/null || echo "0")
    local total_modules=$(jq -r '.modules.total' "$report_file" 2>/dev/null || echo "0")
    local passed_modules=$(jq -r '.modules.passed' "$report_file" 2>/dev/null || echo "0")
    local failed_modules=$(jq -r '.modules.failed' "$report_file" 2>/dev/null || echo "0")

    # Show overall status with color
    case "$overall_status" in
        "HEALTHY")
            echo -e "Overall Status: ${GREEN}$overall_status${NC} (${health_score}% health score)"
            ;;
        "DEGRADED")
            echo -e "Overall Status: ${YELLOW}$overall_status${NC} (${health_score}% health score)"
            ;;
        "CRITICAL")
            echo -e "Overall Status: ${RED}$overall_status${NC} (${health_score}% health score)"
            ;;
        *)
            echo -e "Overall Status: ${RED}$overall_status${NC} (${health_score}% health score)"
            ;;
    esac

    echo "Modules: $passed_modules/$total_modules passed"

    if [[ $failed_modules -gt 0 ]]; then
        echo
        echo "Failed modules:"
        for module in "${HEALTH_MODULES[@]}"; do
            if [[ "${MODULE_RESULTS["$module"]:-FAIL}" == "FAIL" ]]; then
                echo -e "  ${RED}✗${NC} $module"
            fi
        done
    fi

    echo
    echo "Detailed reports available in: $PROJECT_ROOT/monitoring/"
    echo "Full log: $LOG_FILE"
    echo
}

# Cleanup old health reports
cleanup_old_reports() {
    local retention_days="${HEALTH_REPORT_RETENTION_DAYS:-7}"

    log "INFO" "Cleaning up health reports older than $retention_days days"

    find "$PROJECT_ROOT/monitoring" -name "*health*.json" -mtime +$retention_days -delete 2>/dev/null || true
    find "$PROJECT_ROOT/logs" -name "health-*.log" -mtime +$retention_days -delete 2>/dev/null || true
}

# Main execution
main() {
    log "INFO" "Starting comprehensive AI Nodes health check"

    # Ensure directories exist
    mkdir -p "$PROJECT_ROOT/logs" "$PROJECT_ROOT/monitoring"

    # Initialize results arrays
    for module in "${HEALTH_MODULES[@]}"; do
        MODULE_RESULTS["$module"]="UNKNOWN"
        MODULE_REPORTS["$module"]=""
    done

    # Run health checks
    if [[ "$PARALLEL_CHECKS" == "true" ]]; then
        run_parallel_checks
    else
        run_sequential_checks
    fi

    # Parse any existing reports
    parse_reports

    # Generate comprehensive report
    local report_file
    report_file=$(generate_comprehensive_report)

    # Send alerts if needed
    send_health_alerts "$report_file"

    # Show summary
    show_health_summary "$report_file"

    # Cleanup old reports
    cleanup_old_reports

    # Determine exit code
    local failed_modules=0
    for module in "${HEALTH_MODULES[@]}"; do
        if [[ "${MODULE_RESULTS["$module"]:-FAIL}" == "FAIL" ]]; then
            ((failed_modules++))
        fi
    done

    if [[ $failed_modules -eq 0 ]]; then
        log "INFO" "All health checks passed successfully"
        exit 0
    else
        log "ERROR" "$failed_modules health check module(s) failed"
        exit 1
    fi
}

# Show usage
show_usage() {
    echo "AI Nodes Comprehensive Health Check"
    echo
    echo "Usage: $0 [options]"
    echo
    echo "Options:"
    echo "  --parallel       Run health checks in parallel"
    echo "  --no-alerts      Disable health alerts"
    echo "  --no-summary     Disable console summary"
    echo "  --help           Show this help message"
    echo
    echo "Environment variables:"
    echo "  PARALLEL_CHECKS=true/false    - Enable parallel execution"
    echo "  SEND_ALERTS=true/false        - Enable health alerts"
    echo "  GENERATE_SUMMARY=true/false   - Enable console summary"
    echo "  HEALTH_REPORT_RETENTION_DAYS  - Days to keep old reports (default: 7)"
    echo
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --parallel)
            PARALLEL_CHECKS="true"
            shift
            ;;
        --no-alerts)
            SEND_ALERTS="false"
            shift
            ;;
        --no-summary)
            GENERATE_SUMMARY="false"
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            log "ERROR" "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi