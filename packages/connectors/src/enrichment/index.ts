import type { EnrichedContact } from './types';

export function extractDomainFromUrl(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    return host;
  } catch {
    return undefined;
  }
}

export function guessContactForDomain(domain?: string): EnrichedContact | null {
  if (!domain) return null;
  // Basic heuristics
  const candidates = [`hello@${domain}`, `info@${domain}`, `contact@${domain}`, `team@${domain}`];
  return { email: candidates[0], domain, confidence: 0.2, source: 'guess' };
}

export async function enrichFromUrl(url?: string): Promise<EnrichedContact | null> {
  const domain = extractDomainFromUrl(url);
  // TODO: Integrate Hunter/ZeroBounce/Apollo here (if API keys present)
  return guessContactForDomain(domain);
}

export { EnrichedContact } from './types';

