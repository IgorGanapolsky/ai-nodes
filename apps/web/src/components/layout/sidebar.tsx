import React from 'react';
import Link from 'next/link';

export function Sidebar(): JSX.Element {
  return (
    <aside className="flex w-64 flex-col border-r p-4">
      <nav className="space-y-2">
        <Link href="/" className="block rounded px-2 py-1 hover:bg-accent">
          Home
        </Link>
        <Link href="/nodes" className="block rounded px-2 py-1 hover:bg-accent">
          Nodes
        </Link>
        <Link href="/alerts" className="block rounded px-2 py-1 hover:bg-accent">
          Alerts
        </Link>
        <Link href="/linear" className="block rounded px-2 py-1 hover:bg-accent">
          Linear
        </Link>
      </nav>
    </aside>
  );
}


