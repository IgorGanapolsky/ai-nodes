export interface TableColumn {
  title: string;
  key: string;
  align?: 'left' | 'center' | 'right';
  color?: (value: string) => string;
}
export interface TableOptions {
  title?: string;
  style?: {
    head?: string[];
    border?: string[];
  };
}
export declare function createTable(
  columns: TableColumn[],
  data: any[],
  options?: TableOptions,
): string;
export declare function createSimpleTable(headers: string[], rows: string[][]): string;
export declare function createKeyValueTable(data: Record<string, any>): string;
export declare const formatters: {
  currency: (value: string | number) => string;
  percentage: (value: string | number) => string;
  status: (value: string) => string;
  date: (value: string | Date) => string;
};
//# sourceMappingURL=table.d.ts.map
