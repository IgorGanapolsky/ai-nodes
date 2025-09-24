export let preset: string;
export let testEnvironment: string;
export let roots: string[];
export let testMatch: string[];
export let transform: {
    '^.+\\.ts$': string;
};
export let collectCoverageFrom: string[];
export let coverageDirectory: string;
export let coverageReporters: string[];
export let moduleNameMapper: {
    '^@/(.*)$': string;
    '^@/interfaces/(.*)$': string;
    '^@/connectors/(.*)$': string;
    '^@/utils/(.*)$': string;
    '^@/cache/(.*)$': string;
    '^@/scrapers/(.*)$': string;
    '^@/factories/(.*)$': string;
};
export let transformIgnorePatterns: string[];
export let setupFilesAfterEnv: string[];
export let testTimeout: number;
//# sourceMappingURL=jest.config.d.ts.map