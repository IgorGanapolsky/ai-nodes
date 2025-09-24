'use client';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
export function AppProviders({ children }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 5 * 60 * 1000, // 5 minutes
                retry: (failureCount, error) => {
                    // Don't retry for 4xx errors
                    if (error?.response?.status >= 400 && error?.response?.status < 500) {
                        return false;
                    }
                    return failureCount < 3;
                },
            },
        },
    }));
    return (<QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
      </ThemeProvider>
    </QueryClientProvider>);
}
