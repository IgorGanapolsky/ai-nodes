import fetch from 'node-fetch';
import { Opportunity } from './types';

// Minimal RSS fetcher for Product Hunt homepage feed
export async function prospectProductHunt(
  feedUrl: string = 'https://www.producthunt.com/feed',
): Promise<Opportunity[]> {
  try {
    const res = await fetch(feedUrl, { headers: { 'User-Agent': 'depinautopilot/1.0' } });
    if (!res.ok) return [];
    const xml = await res.text();
    // Very light parsing: capture up to 10 <item><title> and <link>
    const items: Opportunity[] = [];
    const re =
      /<item>[\s\S]*?<title><!\[CDATA\[(.*?)\]\]><\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<\/item>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(xml)) && items.length < 10) {
      const title = m[1];
      const link = m[2];
      items.push({
        source: 'reddit' as any,
        title,
        url: link,
        description: undefined,
        priority: 1,
      });
    }
    return items;
  } catch {
    return [];
  }
}
