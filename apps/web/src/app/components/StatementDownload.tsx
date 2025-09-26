'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { apiClient } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export interface Statement {
  id: string;
  period: string;
  startDate: string;
  endDate: string;
  totalEarnings: number;
  totalDevices: number;
  averageUptime: number;
  status: 'generated' | 'processing' | 'error';
  generatedAt: string;
  downloadUrl?: string;
  fileSize?: number;
  format: 'pdf' | 'csv' | 'json';
}

interface StatementDownloadProps {
  ownerId: string;
  ownerName: string;
  showHistory?: boolean;
}

export function StatementDownload({
  ownerId,
  ownerName,
  showHistory = false,
}: StatementDownloadProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'csv' | 'json'>('pdf');
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch statement history if showHistory is true
  const { data: statements, isLoading: statementsLoading } = useQuery({
    queryKey: ['owner-statements', ownerId],
    queryFn: () => apiClient.getOwnerStatements(ownerId),
    enabled: showHistory,
    refetchInterval: 30000,
  });

  const handleGenerateStatement = async () => {
    setIsGenerating(true);
    try {
      const result = await apiClient.generateStatement({
        ownerId,
        period: selectedPeriod,
        format: selectedFormat,
      });

      if (result.downloadUrl) {
        // Trigger download
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = `${ownerName.replace(/\s+/g, '_')}_statement_${selectedPeriod}.${selectedFormat}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success('Statement generated and downloaded successfully!');
      } else if (result.status === 'processing') {
        toast.success('Statement is being generated. You will be notified when ready.');
      }
    } catch (error) {
      console.error('Error generating statement:', error);
      toast.error('Failed to generate statement. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadExisting = async (statement: Statement) => {
    if (!statement.downloadUrl) {
      toast.error('Download URL not available for this statement.');
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = statement.downloadUrl;
      link.download = `${ownerName.replace(/\s+/g, '_')}_statement_${statement.period}.${statement.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Statement downloaded successfully!');
    } catch (error) {
      console.error('Error downloading statement:', error);
      toast.error('Failed to download statement. Please try again.');
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getStatusBadge = (status: Statement['status']) => {
    switch (status) {
      case 'generated':
        return (
          <Badge className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Ready
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Processing
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Error
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Generate New Statement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Generate Statement
          </CardTitle>
          <CardDescription>Create a new earnings statement for {ownerName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Period Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Period</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current_month">Current Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="current_quarter">Current Quarter</SelectItem>
                  <SelectItem value="last_quarter">Last Quarter</SelectItem>
                  <SelectItem value="current_year">Current Year</SelectItem>
                  <SelectItem value="last_year">Last Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Format Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Format</label>
              <Select
                value={selectedFormat}
                onValueChange={(value: 'pdf' | 'csv' | 'json') => setSelectedFormat(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="csv">CSV Spreadsheet</SelectItem>
                  <SelectItem value="json">JSON Data</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleGenerateStatement}
            disabled={isGenerating}
            className="w-full sm:w-auto"
          >
            {isGenerating ? (
              <>
                <LoadingSpinner size="sm" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Generate & Download
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Statement History */}
      {showHistory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Statement History
            </CardTitle>
            <CardDescription>Previously generated statements for {ownerName}</CardDescription>
          </CardHeader>
          <CardContent>
            {statementsLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : statements?.length ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Date Range</TableHead>
                      <TableHead>Earnings</TableHead>
                      <TableHead>Devices</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Generated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statements.map((statement) => (
                      <TableRow key={statement.id}>
                        <TableCell className="font-medium">
                          {statement.period
                            .replace('_', ' ')
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{formatDate(statement.startDate)}</div>
                            <div className="text-muted-foreground">
                              to {formatDate(statement.endDate)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3 text-muted-foreground" />
                            {formatCurrency(statement.totalEarnings)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline">{statement.totalDevices}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {statement.averageUptime.toFixed(1)}% uptime
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(statement.status)}</TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(statement.generatedAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadExisting(statement)}
                              disabled={statement.status !== 'generated' || !statement.downloadUrl}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            {statement.fileSize && (
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(statement.fileSize)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No statements generated yet</p>
                <p className="text-sm">Generate your first statement above</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
