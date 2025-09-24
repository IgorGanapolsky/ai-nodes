# AI Nodes Docker Image
FROM node:20-alpine

# Metadata
LABEL maintainer="AI Nodes Team"
LABEL description="AI Nodes automation and monitoring system"
LABEL version="1.0.0"

# Install system dependencies
RUN apk add --no-cache \
    bash \
    curl \
    wget \
    git \
    sqlite \
    jq \
    bc \
    openssl \
    tar \
    gzip \
    rsync \
    coreutils \
    findutils \
    procps \
    && rm -rf /var/cache/apk/*

# Create app user and group
RUN addgroup -g 1001 -S ai-nodes \
    && adduser -u 1001 -S ai-nodes -G ai-nodes

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production && npm cache clean --force

# Create necessary directories
RUN mkdir -p \
    logs \
    data \
    backups \
    db \
    monitoring \
    config \
    tmp \
    && chown -R ai-nodes:ai-nodes /app

# Copy application files
COPY --chown=ai-nodes:ai-nodes scripts/ scripts/
COPY --chown=ai-nodes:ai-nodes config/ config/

# Copy environment template
COPY --chown=ai-nodes:ai-nodes .env.template .env.template

# Set executable permissions
RUN chmod +x scripts/*.sh scripts/*/*.sh

# Create entrypoint script
RUN cat > /app/entrypoint.sh << 'EOF'
#!/bin/bash
set -e

# Initialize database if it doesn't exist
if [[ ! -f "/app/db/ai_nodes.db" ]]; then
    echo "Initializing database..."
    bash /app/scripts/setup.sh
fi

# Check if .env exists
if [[ ! -f "/app/.env" ]]; then
    echo "Warning: .env file not found. Using template..."
    cp /app/.env.template /app/.env
fi

# Execute the command
exec "$@"
EOF

RUN chmod +x /app/entrypoint.sh && chown ai-nodes:ai-nodes /app/entrypoint.sh

# Switch to non-root user
USER ai-nodes

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD bash /app/scripts/health-checks/basic.sh || exit 1

# Expose ports (if needed for web interface)
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PATH="/app/scripts:$PATH"

# Default command
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["bash", "/app/scripts/setup.sh"]