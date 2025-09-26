import fetch from 'node-fetch';
import { Opportunity } from './types';

export async function prospectReddit(subreddit: string = 'Entrepreneur', limit: number = 10): Promise<Opportunity[]> {
  const url = `https://www.reddit.com/r/${encodeURIComponent(subreddit)}/new.json?limit=${Math.min(limit, 50)}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'depinautopilot/1.0' } });
    if (!res.ok) return [];
    const data = await res.json();
    const posts = data?.data?.children || [];
    return posts.map((p: any) => ({
      source: 'reddit',
      title: p.data.title,
      url: `https://www.reddit.com${p.data.permalink}`,
      description: p.data.selftext?.slice(0, 500),
      priority: 0,
    }));
  } catch {
    return [];
  }
}

