import { z } from 'zod';
export declare const NodeStatus: z.ZodEnum<{
    online: "online";
    offline: "offline";
    maintenance: "maintenance";
    error: "error";
}>;
export type NodeStatus = z.infer<typeof NodeStatus>;
export declare const NodeType: z.ZodEnum<{
    helium: "helium";
    filecoin: "filecoin";
    storj: "storj";
    theta: "theta";
    akash: "akash";
    render: "render";
    flux: "flux";
    hivemapper: "hivemapper";
    other: "other";
}>;
export type NodeType = z.infer<typeof NodeType>;
export declare const NodeMetrics: z.ZodObject<{
    uptime: z.ZodNumber;
    cpu: z.ZodNumber;
    memory: z.ZodNumber;
    storage: z.ZodNumber;
    earnings: z.ZodNumber;
    networkLatency: z.ZodOptional<z.ZodNumber>;
    lastReward: z.ZodOptional<z.ZodDate>;
    totalRewards: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export type NodeMetrics = z.infer<typeof NodeMetrics>;
export declare const NodeCredentials: z.ZodObject<{
    apiKey: z.ZodOptional<z.ZodString>;
    apiSecret: z.ZodOptional<z.ZodString>;
    wallet: z.ZodOptional<z.ZodString>;
    nodeId: z.ZodOptional<z.ZodString>;
    additionalConfig: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, z.core.$strip>;
export type NodeCredentials = z.infer<typeof NodeCredentials>;
export declare const Node: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<{
        helium: "helium";
        filecoin: "filecoin";
        storj: "storj";
        theta: "theta";
        akash: "akash";
        render: "render";
        flux: "flux";
        hivemapper: "hivemapper";
        other: "other";
    }>;
    status: z.ZodEnum<{
        online: "online";
        offline: "offline";
        maintenance: "maintenance";
        error: "error";
    }>;
    endpoint: z.ZodString;
    region: z.ZodString;
    version: z.ZodString;
    lastSeen: z.ZodDate;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    metrics: z.ZodObject<{
        uptime: z.ZodNumber;
        cpu: z.ZodNumber;
        memory: z.ZodNumber;
        storage: z.ZodNumber;
        earnings: z.ZodNumber;
        networkLatency: z.ZodOptional<z.ZodNumber>;
        lastReward: z.ZodOptional<z.ZodDate>;
        totalRewards: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
    credentials: z.ZodOptional<z.ZodObject<{
        apiKey: z.ZodOptional<z.ZodString>;
        apiSecret: z.ZodOptional<z.ZodString>;
        wallet: z.ZodOptional<z.ZodString>;
        nodeId: z.ZodOptional<z.ZodString>;
        additionalConfig: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.core.$strip>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    description: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type Node = z.infer<typeof Node>;
export declare const CreateNodeInput: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodEnum<{
        helium: "helium";
        filecoin: "filecoin";
        storj: "storj";
        theta: "theta";
        akash: "akash";
        render: "render";
        flux: "flux";
        hivemapper: "hivemapper";
        other: "other";
    }>;
    endpoint: z.ZodString;
    region: z.ZodString;
    credentials: z.ZodOptional<z.ZodObject<{
        apiKey: z.ZodOptional<z.ZodString>;
        apiSecret: z.ZodOptional<z.ZodString>;
        wallet: z.ZodOptional<z.ZodString>;
        nodeId: z.ZodOptional<z.ZodString>;
        additionalConfig: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.core.$strip>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    description: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreateNodeInput = z.infer<typeof CreateNodeInput>;
export declare const UpdateNodeInput: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    endpoint: z.ZodOptional<z.ZodString>;
    region: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        online: "online";
        offline: "offline";
        maintenance: "maintenance";
        error: "error";
    }>>;
    credentials: z.ZodOptional<z.ZodObject<{
        apiKey: z.ZodOptional<z.ZodString>;
        apiSecret: z.ZodOptional<z.ZodString>;
        wallet: z.ZodOptional<z.ZodString>;
        nodeId: z.ZodOptional<z.ZodString>;
        additionalConfig: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.core.$strip>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    description: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type UpdateNodeInput = z.infer<typeof UpdateNodeInput>;
export declare const NodeFilters: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<{
        online: "online";
        offline: "offline";
        maintenance: "maintenance";
        error: "error";
    }>>;
    type: z.ZodOptional<z.ZodEnum<{
        helium: "helium";
        filecoin: "filecoin";
        storj: "storj";
        theta: "theta";
        akash: "akash";
        render: "render";
        flux: "flux";
        hivemapper: "hivemapper";
        other: "other";
    }>>;
    region: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    search: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export type NodeFilters = z.infer<typeof NodeFilters>;
//# sourceMappingURL=node.d.ts.map