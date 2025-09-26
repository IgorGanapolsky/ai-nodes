export interface EnrichedContact {
  email?: string;
  domain?: string;
  confidence?: number; // 0-1
  source?: 'guess' | 'hunter' | 'manual';
}

