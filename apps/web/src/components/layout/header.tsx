import React from 'react';

export function Header(): JSX.Element {
  return (
    <header className="flex h-14 items-center justify-between border-b px-4">
      <div className="font-semibold">DePIN Autopilot</div>
      <div className="text-sm text-muted-foreground">Dashboard</div>
    </header>
  );
}
