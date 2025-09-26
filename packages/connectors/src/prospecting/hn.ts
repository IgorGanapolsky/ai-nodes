import fetch from 'node-fetch';
import { Opportunity } from './types';

// Uses Algolia HN search API
export async function prospectHN(query: string = 'Who is hiring'): Promise<Opportunity[]> {
  try {
    const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=20`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data: any = await res.json();
    const hits = Array.isArray(data?.hits) ? data.hits : [];
    return hits.map((h: any) => ({
      source: 'reddit' as any, // keep Opportunity union small; treat HN similar to reddit source
      title: h.title || h.story_title || 'HN Opportunity',
      url: h.url || (h.objectID ? `https://news.ycombinator.com/item?id=${h.objectID}` : ''),
      description: h._highlightResult?.title?.value || undefined,
      priority: 1,
    }));
  } catch {
    return [];
  }
}
