import React from 'react';
import { 
  Upload, 
  Image, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Sparkles,
  FileText,
  BarChart3,
  AlertCircle,
  Camera
} from 'lucide-react';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

// Custom Components
import { MetricCard } from '@/components/dashboard/MetricCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { ProcessingChart } from '@/components/dashboard/ProcessingChart';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { SystemStatus } from '@/components/dashboard/SystemStatus';

// Hooks
import { useDashboardData } from '@/hooks/useDashboardData';
import { useAIProcessing } from '@/hooks/useAIProcessing';
import { useNotifications } from '@/hooks/useNotifications';

// Types
import { ProcessingJob, DashboardMetrics } from '@/types';

/**
 * Main Dashboard Component
 * 
 * Zentrale Übersicht für das AI Style Creator System mit:
 * - Key Performance Indicators
 * - Verarbeitungs-Queue Status
 * - Kürzliche Aktivitäten
 * - Quick Actions
 * - System Health Status
 */
export const Dashboard: React.FC = () => {
  const { 
    metrics, 
    recentJobs, 
    systemHealth, 
    isLoading, 
    error,
    refetch 
  } = useDashboardData();
  
  const { 
    queueStats, 
    activeJobs, 
    processingSpeed 
  } = useAIProcessing();
  
  const { unreadCount } = useNotifications();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <DashboardError error={error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            AI Style Creator Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Überblick über KI-basierte Fashion Content-Erstellung
          </p>
        </div>
        
        {/* Quick Upload Button */}
        <Button 
          size="lg" 
          className="gap-2"
          onClick={() => window.location.href = '/upload'}
        >
          <Upload className="h-5 w-5" />
          Bilder hochladen
        </Button>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Heute verarbeitet"
          value={metrics?.todayProcessed || 0}
          change={metrics?.todayChange || 0}
          icon={<Image className="h-6 w-6" />}
          color="blue"
        />
        
        <MetricCard
          title="Warteschlange"
          value={queueStats?.pending || 0}
          change={queueStats?.queueChange || 0}
          icon={<Clock className="h-6 w-6" />}
          color="orange"
        />
        
        <MetricCard
          title="Erfolgreich"
          value={metrics?.successRate || 0}
          suffix="%"
          change={metrics?.successRateChange || 0}
          icon={<CheckCircle className="h-6 w-6" />}
          color="green"
        />
        
        <MetricCard
          title="Ø Verarbeitungszeit"
          value={processingSpeed?.averageTime || 0}
          suffix="min"
          change={processingSpeed?.speedChange || 0}
          icon={<TrendingUp className="h-6 w-6" />}
          color="purple"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Processing Overview */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Processing Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Verarbeitungs-Aktivität
              </CardTitle>
              <CardDescription>
                KI-Verarbeitung der letzten 7 Tage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProcessingChart data={metrics?.chartData || []} />
            </CardContent>
          </Card>

          {/* Active Jobs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Aktive Verarbeitung
                {activeJobs?.length > 0 && (
                  <Badge variant="secondary">
                    {activeJobs.length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Aktuell in Bearbeitung befindliche Jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeJobs?.length > 0 ? (
                <div className="space-y-4">
                  {activeJobs.slice(0, 5).map((job: ProcessingJob) => (
                    <ActiveJobItem key={job.id} job={job} />
                  ))}
                  
                  {activeJobs.length > 5 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => window.location.href = '/queue'}
                    >
                      {activeJobs.length - 5} weitere Jobs anzeigen
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Keine aktiven Verarbeitungen</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => window.location.href = '/upload'}
                  >
                    Erstes Bild hochladen
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          
          {/* Quick Actions */}
          <QuickActions />
          
          {/* System Status */}
          <SystemStatus status={systemHealth} />
          
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Kürzliche Aktivität
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="h-5 w-5 p-0 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RecentActivity activities={recentJobs?.slice(0, 5) || []} />
            </CardContent>
          </Card>

          {/* Performance Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Performance Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>KI-Modell Auslastung</span>
                  <span className="font-medium">
                    {metrics?.modelUtilization || 0}%
                  </span>
                </div>
                <Progress 
                  value={metrics?.modelUtilization || 0} 
                  className="h-2"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Queue Effizienz</span>
                  <span className="font-medium">
                    {metrics?.queueEfficiency || 0}%
                  </span>
                </div>
                <Progress 
                  value={metrics?.queueEfficiency || 0} 
                  className="h-2"
                />
              </div>
              
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => window.location.href = '/analytics'}
                >
                  Detaillierte Analyse
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Section - Recent Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Kürzlich abgeschlossen
          </CardTitle>
          <CardDescription>
            Die neuesten erfolgreich verarbeiteten Bilder
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RecentResultsGrid results={metrics?.recentResults || []} />
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Active Job Item Component
 */
interface ActiveJobItemProps {
  job: ProcessingJob;
}

const ActiveJobItem: React.FC<ActiveJobItemProps> = ({ job }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing': return 'blue';
      case 'queued': return 'orange';
      case 'analyzing': return 'purple';
      default: return 'gray';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'processing': return 'Verarbeitung läuft';
      case 'queued': return 'In Warteschlange';
      case 'analyzing': return 'Analyse läuft';
      default: return status;
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex items-center gap-3">
        {job.thumbnail ? (
          <img 
            src={job.thumbnail} 
            alt="Job thumbnail"
            className="w-10 h-10 rounded object-cover"
          />
        ) : (
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
            <Image className="h-5 w-5 text-gray-400" />
          </div>
        )}
        
        <div>
          <p className="font-medium text-sm">{job.filename}</p>
          <p className="text-xs text-gray-500">
            {job.style} • {job.estimatedTime}min verbleibend
          </p>
        </div>
      </div>
      
      <div className="text-right">
        <Badge variant={getStatusColor(job.status) as any} className="mb-1">
          {getStatusText(job.status)}
        </Badge>
        <div className="w-20">
          <Progress value={job.progress} className="h-1" />
        </div>
      </div>
    </div>
  );
};

/**
 * Recent Results Grid Component
 */
interface RecentResultsGridProps {
  results: any[];
}

const RecentResultsGrid: React.FC<RecentResultsGridProps> = ({ results }) => {
  if (!results || results.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Noch keine abgeschlossenen Verarbeitungen</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {results.map((result, index) => (
        <div 
          key={index}
          className="group cursor-pointer"
          onClick={() => window.location.href = `/review/${result.id}`}
        >
          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
            <img 
              src={result.thumbnail} 
              alt={`Result ${index + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 truncate">
            {result.style} • {result.completedAt}
          </p>
        </div>
      ))}
    </div>
  );
};

/**
 * Loading Skeleton Component
 */
const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardContent className="p-6">
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

/**
 * Error State Component
 */
interface DashboardErrorProps {
  error: Error;
  onRetry: () => void;
}

const DashboardError: React.FC<DashboardErrorProps> = ({ error, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center h-64">
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold mb-2">Dashboard konnte nicht geladen werden</h3>
      <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
        {error.message}
      </p>
      <Button onClick={onRetry}>
        Erneut versuchen
      </Button>
    </div>
  );
};