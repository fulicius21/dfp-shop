import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  Check, 
  X, 
  RotateCcw, 
  Download, 
  Share2,
  FileText,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Star,
  Edit3,
  Maximize2,
  Filter,
  Search
} from 'lucide-react';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Custom Components
import { ImageComparison } from '@/components/review/ImageComparison';
import { ContentPreview } from '@/components/review/ContentPreview';
import { ReviewActions } from '@/components/review/ReviewActions';
import { QualityScore } from '@/components/review/QualityScore';
import { ReviewHistory } from '@/components/review/ReviewHistory';

// Hooks
import { useReviewData } from '@/hooks/useReviewData';
import { useReviewActions } from '@/hooks/useReviewActions';
import { useNotifications } from '@/hooks/useNotifications';

// Types
import { ReviewItem, ReviewStatus, ReviewFilter } from '@/types';

/**
 * Review Center Page Component
 * 
 * Zentrale Plattform für die Überprüfung und Genehmigung von KI-generierten Inhalten:
 * - Side-by-Side Bildvergleich (Original vs. KI-bearbeitet)
 * - Content-Review (Beschreibungen, SEO-Texte)
 * - Qualitätsbewertung und Feedback
 * - Batch-Approval Funktionen
 * - Historische Reviews
 */
export const ReviewCenter: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<ReviewFilter>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [qualityRating, setQualityRating] = useState<number>(5);

  const { 
    reviewItems, 
    statistics, 
    isLoading, 
    error,
    refetch 
  } = useReviewData(selectedFilter, searchQuery);

  const {
    approveItem,
    rejectItem,
    requestRevision,
    submitBatchApproval,
    isProcessing
  } = useReviewActions();

  const { showNotification } = useNotifications();

  // Filter options
  const filterOptions = [
    { value: 'pending', label: 'Ausstehend', count: statistics?.pending || 0 },
    { value: 'approved', label: 'Genehmigt', count: statistics?.approved || 0 },
    { value: 'rejected', label: 'Abgelehnt', count: statistics?.rejected || 0 },
    { value: 'revision', label: 'Überarbeitung', count: statistics?.revision || 0 },
    { value: 'all', label: 'Alle', count: statistics?.total || 0 }
  ];

  // Handle item selection
  const handleItemSelect = (item: ReviewItem) => {
    setSelectedItem(item);
    setReviewNotes(item.reviewNotes || '');
    setQualityRating(item.qualityScore || 5);
  };

  // Handle approval
  const handleApprove = async (item: ReviewItem) => {
    try {
      await approveItem(item.id, {
        qualityRating,
        reviewNotes,
        publishToWebsite: true
      });
      
      showNotification({
        type: 'success',
        title: 'Genehmigt',
        message: `${item.filename} wurde erfolgreich genehmigt.`
      });
      
      refetch();
      setSelectedItem(null);
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Fehler',
        message: 'Genehmigung fehlgeschlagen.'
      });
    }
  };

  // Handle rejection
  const handleReject = async (item: ReviewItem) => {
    try {
      await rejectItem(item.id, {
        reason: reviewNotes,
        suggestions: 'Bitte überprüfen Sie die Qualität und versuchen Sie es erneut.'
      });
      
      showNotification({
        type: 'success',
        title: 'Abgelehnt',
        message: `${item.filename} wurde abgelehnt.`
      });
      
      refetch();
      setSelectedItem(null);
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Fehler',
        message: 'Ablehnung fehlgeschlagen.'
      });
    }
  };

  // Handle revision request
  const handleRequestRevision = async (item: ReviewItem) => {
    try {
      await requestRevision(item.id, {
        feedback: reviewNotes,
        suggestions: 'Bitte folgende Verbesserungen vornehmen...'
      });
      
      showNotification({
        type: 'success',
        title: 'Überarbeitung angefordert',
        message: `Überarbeitung für ${item.filename} wurde angefordert.`
      });
      
      refetch();
      setSelectedItem(null);
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Fehler',
        message: 'Überarbeitung-Anfrage fehlgeschlagen.'
      });
    }
  };

  const pendingItems = reviewItems?.filter(item => item.status === 'pending') || [];
  const selectedItems = reviewItems?.filter(item => item.selected) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Review Center
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Überprüfen und genehmigen Sie KI-generierte Inhalte vor der Veröffentlichung
          </p>
        </div>
        
        {/* Quick Stats */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">
              {statistics?.pending || 0}
            </p>
            <p className="text-sm text-gray-600">Ausstehend</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {statistics?.approved || 0}
            </p>
            <p className="text-sm text-gray-600">Genehmigt</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {Math.round((statistics?.approved || 0) / Math.max(statistics?.total || 1, 1) * 100)}%
            </p>
            <p className="text-sm text-gray-600">Erfolgsrate</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select value={selectedFilter} onValueChange={(value) => setSelectedFilter(value as ReviewFilter)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center justify-between w-full">
                    <span>{option.label}</span>
                    <Badge variant="secondary" className="ml-2">
                      {option.count}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Nach Dateiname suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Batch Actions */}
        {selectedItems.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {selectedItems.length} ausgewählt
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => submitBatchApproval(selectedItems.map(item => item.id))}
              disabled={isProcessing}
            >
              <Check className="h-4 w-4 mr-1" />
              Alle genehmigen
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Items List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Zu überprüfen
              </CardTitle>
              <CardDescription>
                {reviewItems?.length || 0} Elemente gefunden
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <ReviewItemsSkeleton />
              ) : (
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {reviewItems?.map((item) => (
                    <ReviewItemCard
                      key={item.id}
                      item={item}
                      isSelected={selectedItem?.id === item.id}
                      onSelect={() => handleItemSelect(item)}
                    />
                  ))}
                  
                  {reviewItems?.length === 0 && (
                    <div className="p-6 text-center text-gray-500">
                      <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Keine Elemente für Review</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Review Details */}
        <div className="lg:col-span-3">
          {selectedItem ? (
            <div className="space-y-6">
              
              {/* Image Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Bildvergleich
                    <QualityScore score={selectedItem.aiQualityScore} />
                  </CardTitle>
                  <CardDescription>
                    Original vs. KI-bearbeitete Version
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ImageComparison
                    original={selectedItem.originalImage}
                    processed={selectedItem.processedImages}
                    onImageSelect={(imageUrl) => {
                      // Handle image selection for detailed view
                    }}
                  />
                </CardContent>
              </Card>

              {/* Content Review */}
              {selectedItem.generatedContent && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Generierter Content
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ContentPreview content={selectedItem.generatedContent} />
                  </CardContent>
                </Card>
              )}

              {/* Review Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Review & Bewertung</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="review" className="space-y-4">
                    <TabsList>
                      <TabsTrigger value="review">Bewertung</TabsTrigger>
                      <TabsTrigger value="history">Verlauf</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="review" className="space-y-4">
                      {/* Quality Rating */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Qualitätsbewertung
                        </label>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              onClick={() => setQualityRating(rating)}
                              className={`p-1 rounded ${
                                rating <= qualityRating
                                  ? 'text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            >
                              <Star className="h-6 w-6 fill-current" />
                            </button>
                          ))}
                          <span className="text-sm text-gray-600 ml-2">
                            {qualityRating}/5 Sterne
                          </span>
                        </div>
                      </div>

                      {/* Review Notes */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Anmerkungen
                        </label>
                        <Textarea
                          placeholder="Ihre Bewertung und Anmerkungen..."
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          rows={4}
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-3 pt-4">
                        <Button
                          onClick={() => handleApprove(selectedItem)}
                          disabled={isProcessing}
                          className="gap-2"
                        >
                          <Check className="h-4 w-4" />
                          Genehmigen & Veröffentlichen
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={() => handleRequestRevision(selectedItem)}
                          disabled={isProcessing}
                          className="gap-2"
                        >
                          <Edit3 className="h-4 w-4" />
                          Überarbeitung anfordern
                        </Button>
                        
                        <Button
                          variant="destructive"
                          onClick={() => handleReject(selectedItem)}
                          disabled={isProcessing}
                          className="gap-2"
                        >
                          <X className="h-4 w-4" />
                          Ablehnen
                        </Button>

                        {/* Additional Actions */}
                        <div className="flex items-center gap-2 ml-auto">
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Maximize2 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                              <DialogHeader>
                                <DialogTitle>Detailansicht: {selectedItem.filename}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <ImageComparison
                                  original={selectedItem.originalImage}
                                  processed={selectedItem.processedImages}
                                  fullSize={true}
                                />
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="history">
                      <ReviewHistory itemId={selectedItem.id} />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="h-96">
              <CardContent className="h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Kein Element ausgewählt</p>
                  <p>Wählen Sie ein Element aus der Liste zum Review aus</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Review Item Card Component
 */
interface ReviewItemCardProps {
  item: ReviewItem;
  isSelected: boolean;
  onSelect: () => void;
}

const ReviewItemCard: React.FC<ReviewItemCardProps> = ({ 
  item, 
  isSelected, 
  onSelect 
}) => {
  const getStatusColor = (status: ReviewStatus) => {
    switch (status) {
      case 'pending': return 'orange';
      case 'approved': return 'green';
      case 'rejected': return 'red';
      case 'revision': return 'blue';
      default: return 'gray';
    }
  };

  const getStatusText = (status: ReviewStatus) => {
    switch (status) {
      case 'pending': return 'Ausstehend';
      case 'approved': return 'Genehmigt';
      case 'rejected': return 'Abgelehnt';
      case 'revision': return 'Überarbeitung';
      default: return status;
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`
        p-3 cursor-pointer transition-colors border-l-4
        ${isSelected 
          ? 'bg-primary/5 border-l-primary' 
          : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-l-transparent'
        }
      `}
    >
      <div className="flex items-start gap-3">
        {/* Thumbnail */}
        <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
          {item.thumbnail ? (
            <img 
              src={item.thumbnail} 
              alt={item.filename}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-gray-400" />
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate" title={item.filename}>
            {item.filename}
          </p>
          
          <div className="flex items-center gap-2 mt-1">
            <Badge 
              variant={getStatusColor(item.status) as any} 
              className="text-xs"
            >
              {getStatusText(item.status)}
            </Badge>
            
            {item.aiQualityScore && (
              <div className="text-xs text-gray-500">
                {item.aiQualityScore}/100
              </div>
            )}
          </div>
          
          <p className="text-xs text-gray-500 mt-1">
            {item.processedAt}
          </p>
          
          {item.style && (
            <p className="text-xs text-blue-600 mt-1">
              {item.style}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Loading Skeleton Component
 */
const ReviewItemsSkeleton: React.FC = () => {
  return (
    <div className="space-y-1">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="p-3">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};