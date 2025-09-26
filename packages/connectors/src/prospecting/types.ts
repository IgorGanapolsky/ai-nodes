export interface Opportunity {
  source: 'github' | 'reddit';
  title: string;
  url: string;
  description?: string;
  priority?: number; // 0-3 aligning with Linear mapping
}
