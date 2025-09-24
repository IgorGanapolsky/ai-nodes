import { FastifyRequest } from 'fastify';
export interface EnvConfig {
    NODE_ENV: string;
    PORT: number;
    HOST: string;
    DATABASE_URL: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    JWT_REFRESH_EXPIRES_IN: string;
    REDIS_URL?: string;
    LOG_LEVEL: string;
    CORS_ORIGIN: string;
    RATE_LIMIT_MAX: number;
    RATE_LIMIT_WINDOW: number;
    METRICS_FETCH_INTERVAL: number;
    EARNINGS_CALC_INTERVAL: number;
    ALERT_CHECK_INTERVAL: number;
    NODE_PROVIDER_API_KEY?: string;
    ALERT_WEBHOOK_URL?: string;
    BCRYPT_ROUNDS: number;
    API_KEY_HEADER: string;
    WS_HEARTBEAT_INTERVAL: number;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    errors?: Record<string, string[]>;
    meta?: {
        pagination?: PaginationMeta;
        timestamp: string;
        version: string;
    };
}
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export interface PaginationQuery {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface JwtPayload {
    userId: string;
    email: string;
    role: string;
    iat?: number;
    exp?: number;
}
export interface AuthenticatedRequest extends FastifyRequest {
    user: JwtPayload;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface RegisterRequest {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
}
export interface AuthResponse {
    user: {
        id: string;
        email: string;
        username: string;
        firstName?: string;
        lastName?: string;
        role: string;
    };
    tokens: {
        accessToken: string;
        refreshToken: string;
        expiresIn: string;
    };
}
export interface CreateNodeRequest {
    name: string;
    description?: string;
    nodeType: string;
    endpoint: string;
    config?: Record<string, any>;
}
export interface UpdateNodeRequest {
    name?: string;
    description?: string;
    endpoint?: string;
    config?: Record<string, any>;
}
export interface NodeResponse {
    id: string;
    name: string;
    description?: string;
    nodeType: string;
    endpoint: string;
    status: string;
    config?: Record<string, any>;
    lastChecked?: string;
    uptime: number;
    createdAt: string;
    updatedAt: string;
}
export interface NodeMetricsResponse {
    nodeId: string;
    metrics: NodeMetricData[];
    summary: MetricsSummary;
}
export interface NodeMetricData {
    id: string;
    metricType: string;
    value: number;
    unit: string;
    timestamp: string;
    metadata?: Record<string, any>;
}
export interface MetricsSummary {
    avgCpuUsage: number;
    avgMemoryUsage: number;
    avgDiskUsage: number;
    totalRequests: number;
    uptime: number;
    lastUpdate: string;
}
export interface EarningsResponse {
    totalEarnings: number;
    currency: string;
    period: string;
    nodeBreakdown: NodeEarningsBreakdown[];
    chart: EarningsChartData[];
    summary: EarningsSummary;
}
export interface NodeEarningsBreakdown {
    nodeId: string;
    nodeName: string;
    earnings: number;
    percentage: number;
}
export interface EarningsChartData {
    date: string;
    amount: number;
    nodeCount: number;
}
export interface EarningsSummary {
    totalNodes: number;
    activeNodes: number;
    topEarningNode: {
        id: string;
        name: string;
        earnings: number;
    };
    growthRate: number;
}
export interface WebSocketMessage {
    type: 'nodeUpdate' | 'metricUpdate' | 'earningsUpdate' | 'alert' | 'ping' | 'pong';
    data?: any;
    timestamp: string;
    userId?: string;
}
export interface NodeUpdateMessage extends WebSocketMessage {
    type: 'nodeUpdate';
    data: {
        nodeId: string;
        status: string;
        metrics: NodeMetricData[];
    };
}
export interface AlertMessage extends WebSocketMessage {
    type: 'alert';
    data: {
        id: string;
        nodeId?: string;
        alertType: string;
        severity: string;
        title: string;
        message: string;
        timestamp: string;
    };
}
export interface JobContext {
    jobName: string;
    startTime: Date;
    logger: any;
    params?: Record<string, any>;
}
export interface JobResult {
    success: boolean;
    message?: string;
    data?: any;
    error?: string;
    duration: number;
}
export interface HealthCheckResponse {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
    version: string;
    environment: string;
    services: {
        database: ServiceHealth;
        redis?: ServiceHealth;
        externalApis: ServiceHealth[];
    };
    metrics: {
        memoryUsage: number;
        cpuUsage: number;
        activeConnections: number;
    };
}
export interface ServiceHealth {
    name: string;
    status: 'up' | 'down' | 'degraded';
    responseTime?: number;
    lastChecked: string;
    error?: string;
}
export interface ApiError extends Error {
    statusCode: number;
    code?: string;
    details?: Record<string, any>;
}
export interface ValidationError {
    field: string;
    message: string;
    value?: any;
}
export interface RateLimitConfig {
    max: number;
    timeWindow: number;
    message?: string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
}
export interface SwaggerOptions {
    swagger: {
        info: {
            title: string;
            description: string;
            version: string;
        };
        host?: string;
        schemes: string[];
        consumes: string[];
        produces: string[];
        securityDefinitions: Record<string, any>;
    };
}
export interface DatabaseConfig {
    url: string;
    ssl?: boolean;
    pool?: {
        min: number;
        max: number;
    };
}
export interface ExternalApiConfig {
    baseUrl: string;
    apiKey?: string;
    timeout: number;
    retries: number;
}
export interface NodeProviderApiResponse {
    success: boolean;
    data: {
        status: string;
        metrics: Record<string, number>;
        earnings: {
            amount: number;
            currency: string;
            period: string;
        };
    };
    error?: string;
}
//# sourceMappingURL=types_backup.d.ts.map