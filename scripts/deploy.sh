#!/bin/bash
# AI Nodes Deployment Script
# Automates deployment to VPS/cloud servers with multiple provider support
set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_FILE="$PROJECT_ROOT/logs/deploy-$(date +%Y%m%d-%H%M%S).log"

# Load environment variables
if [[ -f "$PROJECT_ROOT/.env" ]]; then
    set -a
    source "$PROJECT_ROOT/.env"
    set +a
fi

# Deployment configuration
DEPLOYMENT_TYPE="${1:-vps}" # vps, docker, systemd, aws, gcp, digitalocean
TARGET_HOST="${2:-}"
DEPLOY_USER="${DEPLOY_USER:-root}"
DEPLOY_PATH="${DEPLOY_PATH:-/opt/ai-nodes}"
SSH_KEY="${SSH_KEY:-~/.ssh/id_rsa}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
USE_DOCKER="${USE_DOCKER:-false}"
AUTO_START="${AUTO_START:-true}"

# Cloud provider configurations
AWS_INSTANCE_TYPE="${AWS_INSTANCE_TYPE:-t3.micro}"
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_KEY_PAIR="${AWS_KEY_PAIR:-}"
GCP_INSTANCE_TYPE="${GCP_INSTANCE_TYPE:-e2-micro}"
GCP_ZONE="${GCP_ZONE:-us-central1-a}"
GCP_PROJECT_ID="${GCP_PROJECT_ID:-}"
DO_DROPLET_SIZE="${DO_DROPLET_SIZE:-s-1vcpu-1gb}"
DO_REGION="${DO_REGION:-nyc1}"

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
    local required_tools=("git" "tar" "ssh")
    local missing_tools=()

    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            missing_tools+=("$tool")
        fi
    done

    # Check cloud provider specific tools
    case "$DEPLOYMENT_TYPE" in
        "aws")
            if ! command -v "aws" >/dev/null 2>&1; then
                missing_tools+=("aws-cli")
            fi
            ;;
        "gcp")
            if ! command -v "gcloud" >/dev/null 2>&1; then
                missing_tools+=("gcloud")
            fi
            ;;
        "digitalocean")
            if ! command -v "doctl" >/dev/null 2>&1; then
                missing_tools+=("doctl")
            fi
            ;;
        "docker")
            if ! command -v "docker" >/dev/null 2>&1; then
                missing_tools+=("docker")
            fi
            ;;
    esac

    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log "ERROR" "Missing required tools: ${missing_tools[*]}"
        exit 1
    fi
}

# Generate deployment package
create_deployment_package() {
    local package_path="$PROJECT_ROOT/tmp/deployment-$(date +%Y%m%d-%H%M%S).tar.gz"

    log "INFO" "Creating deployment package..."

    # Ensure tmp directory exists
    mkdir -p "$PROJECT_ROOT/tmp"

    # Create temporary directory for packaging
    local temp_dir=$(mktemp -d)
    local app_dir="$temp_dir/ai-nodes"

    mkdir -p "$app_dir"

    # Copy application files
    cp -r "$PROJECT_ROOT/scripts" "$app_dir/"
    cp -r "$PROJECT_ROOT/config" "$app_dir/" 2>/dev/null || mkdir -p "$app_dir/config"

    # Copy package files if they exist
    [[ -f "$PROJECT_ROOT/package.json" ]] && cp "$PROJECT_ROOT/package.json" "$app_dir/"
    [[ -f "$PROJECT_ROOT/package-lock.json" ]] && cp "$PROJECT_ROOT/package-lock.json" "$app_dir/"

    # Copy environment template
    [[ -f "$PROJECT_ROOT/.env.template" ]] && cp "$PROJECT_ROOT/.env.template" "$app_dir/"

    # Create directory structure
    mkdir -p "$app_dir"/{logs,data,backups,db,monitoring}

    # Create deployment info
    cat > "$app_dir/deployment_info.json" << EOF
{
    "deployment_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "git_branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')",
    "deployment_type": "$DEPLOYMENT_TYPE",
    "packaged_by": "$(whoami)@$(hostname)"
}
EOF

    # Create the package
    tar -czf "$package_path" -C "$temp_dir" "ai-nodes" 2>/dev/null

    # Cleanup
    rm -rf "$temp_dir"

    if [[ -f "$package_path" ]]; then
        log "INFO" "Deployment package created: $package_path"
        echo "$package_path"
    else
        log "ERROR" "Failed to create deployment package"
        return 1
    fi
}

# Test SSH connection
test_ssh_connection() {
    local host="$1"
    local user="$2"

    log "INFO" "Testing SSH connection to $user@$host"

    if ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$user@$host" "echo 'SSH connection successful'" >/dev/null 2>&1; then
        log "INFO" "SSH connection successful"
        return 0
    else
        log "ERROR" "Failed to connect via SSH to $user@$host"
        return 1
    fi
}

# Deploy to existing VPS
deploy_to_vps() {
    local host="$1"
    local user="$2"
    local package_path="$3"

    log "INFO" "Deploying to VPS: $user@$host"

    # Test SSH connection
    if ! test_ssh_connection "$host" "$user"; then
        return 1
    fi

    # Copy deployment package
    log "INFO" "Copying deployment package to server"
    if ! scp -i "$SSH_KEY" -o StrictHostKeyChecking=no "$package_path" "$user@$host:/tmp/"; then
        log "ERROR" "Failed to copy deployment package"
        return 1
    fi

    local package_name=$(basename "$package_path")

    # Execute deployment on remote server
    log "INFO" "Executing deployment on remote server"

    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$user@$host" << EOF
set -euo pipefail

# Stop existing services
sudo systemctl stop ai-nodes-monitor 2>/dev/null || true
sudo systemctl stop ai-nodes-reinvest 2>/dev/null || true

# Backup existing installation
if [[ -d "$DEPLOY_PATH" ]]; then
    sudo mv "$DEPLOY_PATH" "${DEPLOY_PATH}.backup.\$(date +%Y%m%d-%H%M%S)" 2>/dev/null || true
fi

# Create deployment directory
sudo mkdir -p "$DEPLOY_PATH"

# Extract package
cd /tmp
sudo tar -xzf "$package_name" -C "$DEPLOY_PATH" --strip-components=1

# Set permissions
sudo chown -R $user:$user "$DEPLOY_PATH"
sudo chmod +x "$DEPLOY_PATH/scripts"/*.sh

# Install Node.js if not present
if ! command -v node >/dev/null 2>&1; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install dependencies
cd "$DEPLOY_PATH"
[[ -f package.json ]] && npm install --production

# Run setup if .env doesn't exist
if [[ ! -f "$DEPLOY_PATH/.env" ]]; then
    echo "Please configure $DEPLOY_PATH/.env before starting services"
else
    # Run setup script
    bash "$DEPLOY_PATH/scripts/setup.sh"
fi

# Install systemd services if requested
if [[ "$AUTO_START" == "true" ]]; then
    if [[ -d "$DEPLOY_PATH/scripts/systemd" ]]; then
        sudo bash "$DEPLOY_PATH/scripts/systemd/install-services.sh"
    fi
fi

echo "Deployment completed successfully"
EOF

    local ssh_exit_code=$?

    if [[ $ssh_exit_code -eq 0 ]]; then
        log "INFO" "VPS deployment completed successfully"
        return 0
    else
        log "ERROR" "VPS deployment failed"
        return 1
    fi
}

# Deploy to AWS EC2
deploy_to_aws() {
    log "INFO" "Deploying to AWS EC2"

    if [[ -z "$AWS_KEY_PAIR" ]]; then
        log "ERROR" "AWS_KEY_PAIR must be set for AWS deployment"
        return 1
    fi

    # Create security group
    local sg_id=$(aws ec2 create-security-group \
        --group-name "ai-nodes-sg-$(date +%s)" \
        --description "AI Nodes Security Group" \
        --region "$AWS_REGION" \
        --query 'GroupId' --output text 2>/dev/null || echo "")

    if [[ -n "$sg_id" ]]; then
        log "INFO" "Created security group: $sg_id"

        # Add SSH rule
        aws ec2 authorize-security-group-ingress \
            --group-id "$sg_id" \
            --protocol tcp \
            --port 22 \
            --cidr 0.0.0.0/0 \
            --region "$AWS_REGION" >/dev/null 2>&1
    fi

    # Launch EC2 instance
    local instance_id=$(aws ec2 run-instances \
        --image-id "ami-0c02fb55956c7d316" \
        --count 1 \
        --instance-type "$AWS_INSTANCE_TYPE" \
        --key-name "$AWS_KEY_PAIR" \
        --security-group-ids "$sg_id" \
        --region "$AWS_REGION" \
        --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=ai-nodes-server}]" \
        --query 'Instances[0].InstanceId' --output text 2>/dev/null || echo "")

    if [[ -z "$instance_id" ]]; then
        log "ERROR" "Failed to launch EC2 instance"
        return 1
    fi

    log "INFO" "Launched EC2 instance: $instance_id"
    log "INFO" "Waiting for instance to be running..."

    # Wait for instance to be running
    aws ec2 wait instance-running --instance-ids "$instance_id" --region "$AWS_REGION"

    # Get instance public IP
    local public_ip=$(aws ec2 describe-instances \
        --instance-ids "$instance_id" \
        --region "$AWS_REGION" \
        --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)

    log "INFO" "Instance running at: $public_ip"

    # Wait a bit more for SSH to be ready
    sleep 30

    # Deploy to the instance
    local package_path=$(create_deployment_package)
    if deploy_to_vps "$public_ip" "ubuntu" "$package_path"; then
        log "INFO" "AWS deployment completed successfully"
        log "INFO" "Instance ID: $instance_id"
        log "INFO" "Public IP: $public_ip"
        echo "$instance_id|$public_ip"
        return 0
    else
        log "ERROR" "AWS deployment failed"
        return 1
    fi
}

# Deploy to Google Cloud Platform
deploy_to_gcp() {
    log "INFO" "Deploying to Google Cloud Platform"

    if [[ -z "$GCP_PROJECT_ID" ]]; then
        log "ERROR" "GCP_PROJECT_ID must be set for GCP deployment"
        return 1
    fi

    # Create firewall rule for SSH
    gcloud compute firewall-rules create ai-nodes-ssh \
        --allow tcp:22 \
        --source-ranges 0.0.0.0/0 \
        --description "Allow SSH for AI Nodes" \
        --project "$GCP_PROJECT_ID" 2>/dev/null || true

    # Create VM instance
    local instance_name="ai-nodes-server-$(date +%s)"

    if ! gcloud compute instances create "$instance_name" \
        --zone "$GCP_ZONE" \
        --machine-type "$GCP_INSTANCE_TYPE" \
        --network-interface=network-tier=PREMIUM,subnet=default \
        --maintenance-policy=MIGRATE \
        --image-family=ubuntu-2004-lts \
        --image-project=ubuntu-os-cloud \
        --boot-disk-size=20GB \
        --boot-disk-type=pd-standard \
        --boot-disk-device-name="$instance_name" \
        --project "$GCP_PROJECT_ID" >/dev/null 2>&1; then
        log "ERROR" "Failed to create GCP instance"
        return 1
    fi

    log "INFO" "Created GCP instance: $instance_name"

    # Get external IP
    local external_ip=$(gcloud compute instances describe "$instance_name" \
        --zone "$GCP_ZONE" \
        --project "$GCP_PROJECT_ID" \
        --format="get(networkInterfaces[0].accessConfigs[0].natIP)")

    log "INFO" "Instance running at: $external_ip"

    # Wait for SSH to be ready
    sleep 60

    # Deploy to the instance
    local package_path=$(create_deployment_package)
    if deploy_to_vps "$external_ip" "ubuntu" "$package_path"; then
        log "INFO" "GCP deployment completed successfully"
        log "INFO" "Instance name: $instance_name"
        log "INFO" "External IP: $external_ip"
        echo "$instance_name|$external_ip"
        return 0
    else
        log "ERROR" "GCP deployment failed"
        return 1
    fi
}

# Deploy to DigitalOcean
deploy_to_digitalocean() {
    log "INFO" "Deploying to DigitalOcean"

    # Create droplet
    local droplet_name="ai-nodes-server-$(date +%s)"

    if ! doctl compute droplet create "$droplet_name" \
        --size "$DO_DROPLET_SIZE" \
        --image ubuntu-20-04-x64 \
        --region "$DO_REGION" \
        --ssh-keys $(doctl compute ssh-key list --format ID --no-header | head -1) \
        --wait >/dev/null 2>&1; then
        log "ERROR" "Failed to create DigitalOcean droplet"
        return 1
    fi

    log "INFO" "Created DigitalOcean droplet: $droplet_name"

    # Get droplet IP
    local droplet_ip=$(doctl compute droplet get "$droplet_name" --format PublicIPv4 --no-header)

    log "INFO" "Droplet running at: $droplet_ip"

    # Wait for SSH to be ready
    sleep 60

    # Deploy to the droplet
    local package_path=$(create_deployment_package)
    if deploy_to_vps "$droplet_ip" "root" "$package_path"; then
        log "INFO" "DigitalOcean deployment completed successfully"
        log "INFO" "Droplet name: $droplet_name"
        log "INFO" "IP address: $droplet_ip"
        echo "$droplet_name|$droplet_ip"
        return 0
    else
        log "ERROR" "DigitalOcean deployment failed"
        return 1
    fi
}

# Deploy using Docker
deploy_docker() {
    log "INFO" "Deploying using Docker"

    # Build Docker image
    log "INFO" "Building Docker image"

    cat > "$PROJECT_ROOT/Dockerfile.deploy" << 'EOF'
FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    sqlite \
    curl \
    bash \
    jq \
    bc \
    openssl \
    tar \
    gzip

# Copy application files
COPY . .

# Install Node.js dependencies
RUN npm install --production

# Create necessary directories
RUN mkdir -p logs data backups db monitoring

# Set permissions
RUN chmod +x scripts/*.sh

# Expose ports (if needed)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD bash scripts/health-checks/basic.sh || exit 1

# Start command
CMD ["bash", "scripts/setup.sh"]
EOF

    if ! docker build -f "$PROJECT_ROOT/Dockerfile.deploy" -t ai-nodes:latest "$PROJECT_ROOT"; then
        log "ERROR" "Failed to build Docker image"
        return 1
    fi

    log "INFO" "Docker image built successfully"

    # Create docker-compose.yml
    cat > "$PROJECT_ROOT/docker-compose.deploy.yml" << 'EOF'
version: '3.8'

services:
  ai-nodes:
    image: ai-nodes:latest
    container_name: ai-nodes-app
    restart: unless-stopped
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
      - ./backups:/app/backups
      - ./db:/app/db
      - ./.env:/app/.env:ro
    environment:
      - NODE_ENV=production
    networks:
      - ai-nodes-network
    healthcheck:
      test: ["CMD", "bash", "scripts/health-checks/basic.sh"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  ai-nodes-network:
    driver: bridge
EOF

    log "INFO" "Docker deployment files created successfully"
    return 0
}

# Print post-deployment instructions
print_post_deployment_instructions() {
    local deployment_type="$1"
    local deployment_info="$2"

    echo
    echo -e "${GREEN}=== Deployment Completed Successfully ===${NC}"
    echo
    echo "Deployment Type: $deployment_type"

    case "$deployment_type" in
        "vps")
            echo "Target Host: $TARGET_HOST"
            echo "Deployment Path: $DEPLOY_PATH"
            echo
            echo "Next steps:"
            echo "1. SSH to your server: ssh -i $SSH_KEY $DEPLOY_USER@$TARGET_HOST"
            echo "2. Configure environment: vim $DEPLOY_PATH/.env"
            echo "3. Start services: sudo systemctl start ai-nodes-monitor"
            ;;
        "aws")
            IFS='|' read -r instance_id public_ip <<< "$deployment_info"
            echo "Instance ID: $instance_id"
            echo "Public IP: $public_ip"
            echo
            echo "Next steps:"
            echo "1. SSH to your instance: ssh -i ~/.ssh/$AWS_KEY_PAIR.pem ubuntu@$public_ip"
            echo "2. Configure environment: sudo vim $DEPLOY_PATH/.env"
            echo "3. Start services: sudo systemctl start ai-nodes-monitor"
            ;;
        "gcp")
            IFS='|' read -r instance_name external_ip <<< "$deployment_info"
            echo "Instance Name: $instance_name"
            echo "External IP: $external_ip"
            echo
            echo "Next steps:"
            echo "1. SSH to your instance: gcloud compute ssh $instance_name --zone=$GCP_ZONE"
            echo "2. Configure environment: sudo vim $DEPLOY_PATH/.env"
            echo "3. Start services: sudo systemctl start ai-nodes-monitor"
            ;;
        "digitalocean")
            IFS='|' read -r droplet_name droplet_ip <<< "$deployment_info"
            echo "Droplet Name: $droplet_name"
            echo "IP Address: $droplet_ip"
            echo
            echo "Next steps:"
            echo "1. SSH to your droplet: ssh root@$droplet_ip"
            echo "2. Configure environment: vim $DEPLOY_PATH/.env"
            echo "3. Start services: systemctl start ai-nodes-monitor"
            ;;
        "docker")
            echo "Docker image: ai-nodes:latest"
            echo
            echo "Next steps:"
            echo "1. Configure environment: cp .env.template .env && vim .env"
            echo "2. Start with Docker Compose: docker-compose -f docker-compose.deploy.yml up -d"
            echo "3. Check logs: docker-compose -f docker-compose.deploy.yml logs -f"
            ;;
    esac

    echo
    echo -e "${YELLOW}Important:${NC} Don't forget to:"
    echo "- Configure your Solana private key and other sensitive information"
    echo "- Set up monitoring alerts (Discord/Email)"
    echo "- Configure backup storage (S3/GCS)"
    echo "- Test the monitoring and reinvestment scripts"
    echo
}

# Main execution
main() {
    log "INFO" "AI Nodes deployment script started"
    log "INFO" "Deployment type: $DEPLOYMENT_TYPE"

    # Ensure log directory exists
    mkdir -p "$PROJECT_ROOT/logs"

    # Check dependencies
    check_dependencies

    # Execute deployment based on type
    case "$DEPLOYMENT_TYPE" in
        "vps")
            if [[ -z "$TARGET_HOST" ]]; then
                log "ERROR" "TARGET_HOST must be provided for VPS deployment"
                echo "Usage: $0 vps <target_host>"
                exit 1
            fi
            local package_path=$(create_deployment_package)
            if deploy_to_vps "$TARGET_HOST" "$DEPLOY_USER" "$package_path"; then
                print_post_deployment_instructions "vps" ""
            else
                exit 1
            fi
            ;;
        "aws")
            local aws_info=$(deploy_to_aws)
            if [[ $? -eq 0 ]]; then
                print_post_deployment_instructions "aws" "$aws_info"
            else
                exit 1
            fi
            ;;
        "gcp")
            local gcp_info=$(deploy_to_gcp)
            if [[ $? -eq 0 ]]; then
                print_post_deployment_instructions "gcp" "$gcp_info"
            else
                exit 1
            fi
            ;;
        "digitalocean")
            local do_info=$(deploy_to_digitalocean)
            if [[ $? -eq 0 ]]; then
                print_post_deployment_instructions "digitalocean" "$do_info"
            else
                exit 1
            fi
            ;;
        "docker")
            if deploy_docker; then
                print_post_deployment_instructions "docker" ""
            else
                exit 1
            fi
            ;;
        *)
            log "ERROR" "Unknown deployment type: $DEPLOYMENT_TYPE"
            echo "Supported types: vps, aws, gcp, digitalocean, docker"
            exit 1
            ;;
    esac

    log "INFO" "Deployment script completed successfully"
}

# Show usage if no arguments provided
if [[ $# -eq 0 ]]; then
    echo "AI Nodes Deployment Script"
    echo
    echo "Usage: $0 <deployment_type> [target_host]"
    echo
    echo "Deployment types:"
    echo "  vps <host>     - Deploy to existing VPS server"
    echo "  aws            - Deploy to new AWS EC2 instance"
    echo "  gcp            - Deploy to new Google Cloud instance"
    echo "  digitalocean   - Deploy to new DigitalOcean droplet"
    echo "  docker         - Create Docker deployment files"
    echo
    echo "Examples:"
    echo "  $0 vps 192.168.1.100"
    echo "  $0 aws"
    echo "  $0 docker"
    echo
    exit 1
fi

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi