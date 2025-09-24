import Link from 'next/link';
import {
  Server,
  TrendingUp,
  Mail,
  Wallet,
  Activity,
  AlertTriangle,
  Clock
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatCurrency, formatDate } from '@/lib/utils';

export interface Owner {
  id: string;
  name: string;
  email: string;
  walletAddress?: string;
  status: 'active' | 'inactive';
  joinedAt: string;
  lastSeen?: string;
  metrics?: {
    totalDevices: number;
    onlineDevices: number;
    offlineDevices: number;
    totalEarnings: number;
    targetEarnings: number;
    averageUptime: number;
    alertsCount: number;
  };
  avatar?: string;
}

interface OwnerCardProps {
  owner: Owner;
}

export function OwnerCard({ owner }: OwnerCardProps) {
  const { metrics } = owner;

  // Calculate on-pace status
  const isOnPace = metrics && metrics.totalEarnings >= metrics.targetEarnings * 0.95;

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={owner.avatar} alt={owner.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {getInitials(owner.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg leading-none">{owner.name}</CardTitle>
              <CardDescription className="mt-1 flex items-center gap-1 text-xs">
                <Mail className="h-3 w-3" />
                {owner.email}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant={owner.status === 'active' ? 'default' : 'secondary'}>
              {owner.status}
            </Badge>
            {isOnPace !== undefined && (
              <Badge
                variant={isOnPace ? 'default' : 'secondary'}
                className="text-xs gap-1"
              >
                <TrendingUp className="h-2 w-2" />
                {isOnPace ? 'On-pace' : 'Behind'}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Wallet Address */}
        {owner.walletAddress && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wallet className="h-3 w-3" />
            <code className="text-xs bg-muted px-2 py-1 rounded">
              {owner.walletAddress.slice(0, 8)}...{owner.walletAddress.slice(-6)}
            </code>
          </div>
        )}

        {/* Metrics */}
        {metrics && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Server className="h-3 w-3" />
                Devices
              </span>
              <div className="text-right">
                <div className="font-medium">{metrics.totalDevices}</div>
                <div className="text-xs text-muted-foreground">
                  {metrics.onlineDevices} online
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Earnings
              </span>
              <div className="text-right">
                <div className="font-medium">
                  {formatCurrency(metrics.totalEarnings)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Target: {formatCurrency(metrics.targetEarnings)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Activity className="h-3 w-3" />
                Uptime
              </span>
              <div className="text-right">
                <div className="font-medium">{metrics.averageUptime.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">Average</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Alerts
              </span>
              <div className="text-right">
                <div className={`font-medium ${metrics.alertsCount > 0 ? 'text-orange-600 dark:text-orange-400' : ''}`}>
                  {metrics.alertsCount}
                </div>
                <div className="text-xs text-muted-foreground">Active</div>
              </div>
            </div>
          </div>
        )}

        {/* Join Date and Last Seen */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Joined {formatDate(owner.joinedAt)}
            </div>
            {owner.lastSeen && (
              <div>
                Last seen {formatDate(owner.lastSeen)}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button asChild size="sm" className="flex-1">
            <Link href={`/owners/${owner.id}`}>
              View Details
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/owners/${owner.id}/devices`}>
              Devices
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}