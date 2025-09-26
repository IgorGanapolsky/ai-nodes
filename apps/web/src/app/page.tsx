'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Users, Plus } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { OwnerCard } from '@/app/components/OwnerCard';
import { MetricsSummary } from '@/app/components/MetricsSummary';
import { apiClient } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function OwnersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Fetch owners data
  const { data: owners, isLoading: ownersLoading } = useQuery({
    queryKey: ['owners', searchQuery, filterStatus],
    queryFn: () =>
      apiClient.getOwners({
        search: searchQuery,
        status: filterStatus === 'all' ? undefined : filterStatus,
        limit: 50,
      }),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch summary metrics
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['owners-summary'],
    queryFn: () => apiClient.getOwnersSummary(),
    refetchInterval: 60000, // Refresh every minute
  });

  const filteredOwners = owners?.owners || [];

  if (ownersLoading && !owners) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Node Owners</h1>
          <p className="text-muted-foreground">
            Manage and monitor DePIN node owners and their performance
          </p>
        </div>
        <Button asChild>
          <Link href="/owners/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Owner
          </Link>
        </Button>
      </div>

      {/* Summary Metrics */}
      {summary && !summaryLoading && <MetricsSummary data={summary} />}

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Owners Directory
          </CardTitle>
          <CardDescription>Search and filter through all node owners</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search owners by name, email, or wallet address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
                className="whitespace-nowrap"
              >
                All
                {owners && (
                  <Badge variant="secondary" className="ml-2">
                    {owners.total}
                  </Badge>
                )}
              </Button>
              <Button
                variant={filterStatus === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('active')}
                className="whitespace-nowrap"
              >
                Active
                {owners && (
                  <Badge variant="secondary" className="ml-2">
                    {owners.activeCount || 0}
                  </Badge>
                )}
              </Button>
              <Button
                variant={filterStatus === 'inactive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('inactive')}
                className="whitespace-nowrap"
              >
                Inactive
                {owners && (
                  <Badge variant="secondary" className="ml-2">
                    {(owners.total || 0) - (owners.activeCount || 0)}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* Owners Grid */}
          {ownersLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : filteredOwners.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOwners.map((owner) => (
                <OwnerCard key={owner.id} owner={owner} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-foreground">No owners found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchQuery || filterStatus !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by adding your first owner.'}
              </p>
              {!searchQuery && filterStatus === 'all' && (
                <div className="mt-6">
                  <Button asChild>
                    <Link href="/owners/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Owner
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
