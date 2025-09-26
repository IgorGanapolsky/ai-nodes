import { prospectGitHub } from './github';
import { prospectReddit } from './reddit';
import type { Opportunity } from './types';

export async function runProspectors(): Promise<Opportunity[]> {
  const [gh, rd] = await Promise.all([
    prospectGitHub(process.env.GITHUB_SEARCH_QUERY || 'label:help-wanted', 10),
    prospectReddit(process.env.REDDIT_SUBREDDIT || 'Entrepreneur', 10),
  ]);

  // Simple dedupe by URL
  const all = [...gh, ...rd];
  const seen = new Set<string>();
  const deduped: Opportunity[] = [];
  for (const op of all) {
    if (!seen.has(op.url)) {
      seen.add(op.url);
      deduped.push(op);
    }
  }
  return deduped;
}

export * from './types';

