export let preset: string;
export let setupFilesAfterEnv: string[];
export let transformIgnorePatterns: string[];
export let testMatch: string[];
export let moduleFileExtensions: string[];
export let collectCoverageFrom: string[];
export namespace coverageThreshold {
  namespace global {
    let branches: number;
    let functions: number;
    let lines: number;
    let statements: number;
  }
}
//# sourceMappingURL=jest.config.d.ts.map
