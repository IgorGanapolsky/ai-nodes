#!/bin/bash
# AI Nodes Docker Management Script
# Simplifies Docker Compose operations for AI Nodes
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
COMPOSE_DEV_FILE="$SCRIPT_DIR/docker-compose.dev.yml"
ENV_FILE="$PROJECT_ROOT/.env"

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

# Check if Docker and Docker Compose are available
check_docker() {
    if ! command -v docker >/dev/null 2>&1; then
        log "ERROR" "Docker is not installed or not in PATH"
        exit 1
    fi

    if ! command -v docker-compose >/dev/null 2>&1 && ! docker compose version >/dev/null 2>&1; then
        log "ERROR" "Docker Compose is not installed or not in PATH"
        exit 1
    fi

    # Use 'docker compose' if available, fallback to 'docker-compose'
    if docker compose version >/dev/null 2>&1; then
        DOCKER_COMPOSE="docker compose"
    else
        DOCKER_COMPOSE="docker-compose"
    fi
}

# Check environment setup
check_environment() {
    if [[ ! -f "$ENV_FILE" ]]; then
        log "WARN" "Environment file not found: $ENV_FILE"
        if [[ -f "$PROJECT_ROOT/.env.template" ]]; then
            log "INFO" "Copying template to .env"
            cp "$PROJECT_ROOT/.env.template" "$ENV_FILE"
            log "WARN" "Please configure $ENV_FILE before starting services"
        else
            log "ERROR" "No environment template found"
            return 1
        fi
    fi
}

# Build Docker images
build_images() {
    local environment="${1:-production}"

    log "INFO" "Building Docker images for $environment environment"

    case "$environment" in
        "dev"|"development")
            $DOCKER_COMPOSE -f "$COMPOSE_DEV_FILE" build
            ;;
        "prod"|"production")
            $DOCKER_COMPOSE -f "$COMPOSE_FILE" build
            ;;
        *)
            log "ERROR" "Unknown environment: $environment"
            return 1
            ;;
    esac

    log "INFO" "Docker images built successfully"
}

# Start services
start_services() {
    local environment="${1:-production}"
    local profiles="${2:-}"

    log "INFO" "Starting AI Nodes services ($environment environment)"

    local compose_args=()
    local compose_file

    case "$environment" in
        "dev"|"development")
            compose_file="$COMPOSE_DEV_FILE"
            ;;
        "prod"|"production")
            compose_file="$COMPOSE_FILE"
            ;;
        *)
            log "ERROR" "Unknown environment: $environment"
            return 1
            ;;
    esac

    # Add profiles if specified
    if [[ -n "$profiles" ]]; then
        IFS=',' read -ra PROFILE_ARRAY <<< "$profiles"
        for profile in "${PROFILE_ARRAY[@]}"; do
            compose_args+=(--profile "$profile")
        done
    fi

    $DOCKER_COMPOSE -f "$compose_file" "${compose_args[@]}" up -d

    log "INFO" "Services started successfully"
    show_status "$environment"
}

# Stop services
stop_services() {
    local environment="${1:-production}"

    log "INFO" "Stopping AI Nodes services ($environment environment)"

    case "$environment" in
        "dev"|"development")
            $DOCKER_COMPOSE -f "$COMPOSE_DEV_FILE" down
            ;;
        "prod"|"production")
            $DOCKER_COMPOSE -f "$COMPOSE_FILE" down
            ;;
        *)
            log "ERROR" "Unknown environment: $environment"
            return 1
            ;;
    esac

    log "INFO" "Services stopped successfully"
}

# Restart services
restart_services() {
    local environment="${1:-production}"
    local profiles="${2:-}"

    log "INFO" "Restarting AI Nodes services"
    stop_services "$environment"
    sleep 2
    start_services "$environment" "$profiles"
}

# Show service status
show_status() {
    local environment="${1:-production}"

    case "$environment" in
        "dev"|"development")
            $DOCKER_COMPOSE -f "$COMPOSE_DEV_FILE" ps
            ;;
        "prod"|"production")
            $DOCKER_COMPOSE -f "$COMPOSE_FILE" ps
            ;;
        *)
            log "ERROR" "Unknown environment: $environment"
            return 1
            ;;
    esac
}

# Show service logs
show_logs() {
    local environment="${1:-production}"
    local service="${2:-}"
    local follow="${3:-false}"

    local compose_file
    case "$environment" in
        "dev"|"development")
            compose_file="$COMPOSE_DEV_FILE"
            ;;
        "prod"|"production")
            compose_file="$COMPOSE_FILE"
            ;;
        *)
            log "ERROR" "Unknown environment: $environment"
            return 1
            ;;
    esac

    local log_args=()
    if [[ "$follow" == "true" ]]; then
        log_args+=(-f)
    fi

    if [[ -n "$service" ]]; then
        $DOCKER_COMPOSE -f "$compose_file" logs "${log_args[@]}" "$service"
    else
        $DOCKER_COMPOSE -f "$compose_file" logs "${log_args[@]}"
    fi
}

# Execute command in container
exec_command() {
    local environment="${1:-production}"
    local service="${2:-ai-nodes-app}"
    local command="${3:-bash}"

    local compose_file
    case "$environment" in
        "dev"|"development")
            compose_file="$COMPOSE_DEV_FILE"
            service="${service/ai-nodes-/ai-nodes-dev}"
            ;;
        "prod"|"production")
            compose_file="$COMPOSE_FILE"
            ;;
        *)
            log "ERROR" "Unknown environment: $environment"
            return 1
            ;;
    esac

    log "INFO" "Executing command in $service: $command"
    $DOCKER_COMPOSE -f "$compose_file" exec "$service" $command
}

# Run backup
run_backup() {
    local environment="${1:-production}"
    local backup_type="${2:-full}"

    log "INFO" "Running backup ($backup_type)"

    case "$environment" in
        "dev"|"development")
            $DOCKER_COMPOSE -f "$COMPOSE_DEV_FILE" run --rm ai-nodes-dev bash /app/scripts/backup.sh "$backup_type"
            ;;
        "prod"|"production")
            $DOCKER_COMPOSE -f "$COMPOSE_FILE" --profile backup run --rm ai-nodes-backup
            ;;
        *)
            log "ERROR" "Unknown environment: $environment"
            return 1
            ;;
    esac

    log "INFO" "Backup completed"
}

# Clean up Docker resources
cleanup() {
    local environment="${1:-production}"
    local deep_clean="${2:-false}"

    log "INFO" "Cleaning up Docker resources"

    # Stop services
    stop_services "$environment"

    # Remove containers
    case "$environment" in
        "dev"|"development")
            $DOCKER_COMPOSE -f "$COMPOSE_DEV_FILE" rm -f
            ;;
        "prod"|"production")
            $DOCKER_COMPOSE -f "$COMPOSE_FILE" rm -f
            ;;
    esac

    if [[ "$deep_clean" == "true" ]]; then
        log "INFO" "Performing deep cleanup (removing volumes and images)"

        # Remove volumes
        case "$environment" in
            "dev"|"development")
                docker volume rm $(docker volume ls -q --filter label=com.ai-nodes.volume 2>/dev/null) 2>/dev/null || true
                ;;
            "prod"|"production")
                docker volume rm $(docker volume ls -q --filter label=com.ai-nodes.volume 2>/dev/null) 2>/dev/null || true
                ;;
        esac

        # Remove images
        docker image rm ai-nodes:latest ai-nodes:dev 2>/dev/null || true

        # Clean up unused Docker resources
        docker system prune -f
    fi

    log "INFO" "Cleanup completed"
}

# Update and rebuild
update() {
    local environment="${1:-production}"

    log "INFO" "Updating AI Nodes Docker setup"

    # Pull latest code (if in git repo)
    if [[ -d "$PROJECT_ROOT/.git" ]]; then
        log "INFO" "Pulling latest code"
        cd "$PROJECT_ROOT"
        git pull
    fi

    # Rebuild images
    build_images "$environment"

    # Restart services
    restart_services "$environment"

    log "INFO" "Update completed"
}

# Show usage
show_usage() {
    echo "AI Nodes Docker Management Script"
    echo
    echo "Usage: $0 <command> [options]"
    echo
    echo "Commands:"
    echo "  build <env>           - Build Docker images (env: dev|prod)"
    echo "  start <env> [profiles] - Start services (profiles: web,monitoring,backup)"
    echo "  stop <env>            - Stop services"
    echo "  restart <env>         - Restart services"
    echo "  status <env>          - Show service status"
    echo "  logs <env> [service] [follow] - Show logs (follow: true|false)"
    echo "  exec <env> <service> <cmd> - Execute command in container"
    echo "  backup <env> [type]   - Run backup (type: full|database|config)"
    echo "  cleanup <env> [deep]  - Clean up resources (deep: true|false)"
    echo "  update <env>          - Update and rebuild"
    echo
    echo "Environments:"
    echo "  dev, development      - Development environment"
    echo "  prod, production      - Production environment (default)"
    echo
    echo "Examples:"
    echo "  $0 build prod"
    echo "  $0 start prod web,monitoring"
    echo "  $0 logs prod ai-nodes-monitor true"
    echo "  $0 exec dev ai-nodes-dev bash"
    echo "  $0 backup prod full"
    echo "  $0 cleanup dev true"
    echo
}

# Main execution
main() {
    local command="${1:-}"

    if [[ -z "$command" ]]; then
        show_usage
        exit 1
    fi

    # Check dependencies
    check_docker

    # Change to script directory
    cd "$SCRIPT_DIR"

    case "$command" in
        "build")
            check_environment
            build_images "${2:-production}"
            ;;
        "start")
            check_environment
            start_services "${2:-production}" "${3:-}"
            ;;
        "stop")
            stop_services "${2:-production}"
            ;;
        "restart")
            check_environment
            restart_services "${2:-production}" "${3:-}"
            ;;
        "status")
            show_status "${2:-production}"
            ;;
        "logs")
            show_logs "${2:-production}" "${3:-}" "${4:-false}"
            ;;
        "exec")
            exec_command "${2:-production}" "${3:-ai-nodes-app}" "${4:-bash}"
            ;;
        "backup")
            run_backup "${2:-production}" "${3:-full}"
            ;;
        "cleanup")
            cleanup "${2:-production}" "${3:-false}"
            ;;
        "update")
            check_environment
            update "${2:-production}"
            ;;
        *)
            log "ERROR" "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"