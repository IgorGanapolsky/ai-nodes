'use client';

import { useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnFiltersState,
  useReactTable,
} from '@tanstack/react-table';
import {
  Server,
  Activity,
  TrendingUp,
  AlertTriangle,
  Wifi,
  WifiOff,
  Search,
  MoreVertical,
  ExternalLink
} from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatCurrency, formatDate } from '@/lib/utils';

export interface Device {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'offline' | 'maintenance';
  uptime: number;
  earnings: number;
  lastSeen: string;
  location?: string;
  version?: string;
  alerts: number;
  metrics?: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkLatency: number;
  };
}

interface DeviceTableProps {
  devices: Device[];
  isLoading?: boolean;
}

export function DeviceTable({ devices, isLoading }: DeviceTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const columns: ColumnDef<Device>[] = [
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const device = row.original;
        return (
          <div className="flex items-center gap-2">
            {device.status === 'online' ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <Badge
              variant={
                device.status === 'online'
                  ? 'default'
                  : device.status === 'maintenance'
                  ? 'secondary'
                  : 'destructive'
              }
            >
              {device.status}
            </Badge>
            {device.alerts > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {device.alerts}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'name',
      header: 'Device Name',
      cell: ({ row }) => {
        const device = row.getValue('name') as string;
        const type = row.original.type;
        return (
          <div>
            <div className="font-medium">{device}</div>
            <div className="text-sm text-muted-foreground">{type}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'uptime',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-medium"
        >
          Uptime
          <Activity className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const uptime = row.getValue('uptime') as number;
        return (
          <div className="flex items-center gap-2">
            <div className={`font-medium ${uptime > 95 ? 'text-green-600' : uptime > 85 ? 'text-yellow-600' : 'text-red-600'}`}>
              {uptime.toFixed(1)}%
            </div>
            <div className={`w-2 h-2 rounded-full ${uptime > 95 ? 'bg-green-500' : uptime > 85 ? 'bg-yellow-500' : 'bg-red-500'}`} />
          </div>
        );
      },
    },
    {
      accessorKey: 'earnings',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-medium"
        >
          Earnings
          <TrendingUp className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const earnings = row.getValue('earnings') as number;
        return (
          <div className="font-medium">
            {formatCurrency(earnings)}
          </div>
        );
      },
    },
    {
      accessorKey: 'location',
      header: 'Location',
      cell: ({ row }) => {
        const location = row.getValue('location') as string;
        return location ? (
          <div className="text-sm">{location}</div>
        ) : (
          <div className="text-sm text-muted-foreground">Unknown</div>
        );
      },
    },
    {
      accessorKey: 'lastSeen',
      header: 'Last Seen',
      cell: ({ row }) => {
        const lastSeen = row.getValue('lastSeen') as string;
        return (
          <div className="text-sm text-muted-foreground">
            {formatDate(lastSeen)}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const device = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="cursor-pointer">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Activity className="mr-2 h-4 w-4" />
                View Metrics
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-red-600 dark:text-red-400"
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Report Issue
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: devices,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search devices..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} device{table.getFilteredRowModel().rows.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Server className="h-8 w-8 text-muted-foreground" />
                    <div className="text-muted-foreground">No devices found</div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}