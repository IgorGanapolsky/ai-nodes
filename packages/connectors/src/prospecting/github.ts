import fetch from 'node-fetch';
import { Opportunity } from './types';

export async function prospectGitHub(
  search: string = 'label:help-wanted language:TypeScript',
  limit: number = 10,
): Promise<Opportunity[]> {
  const token = process.env.GITHUB_TOKEN;
  const q = encodeURIComponent(search);
  const url = `https://api.github.com/search/issues?q=${q}&per_page=${Math.min(limit, 50)}`;
  const headers: any = { Accept: 'application/vnd.github+json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];
    return items.map((it: any) => ({
      source: 'github',
      title: it.title,
      url: it.html_url,
      description: it.body?.slice(0, 500),
      priority: 1,
    }));
  } catch {
    return [];
  }
}
