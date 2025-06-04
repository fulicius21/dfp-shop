import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  Check, 
  AlertTriangle,
  Settings,
  Sparkles,
  FileText,
  Eye,
  Play
} from 'lucide-react';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Custom Components
import { ImagePreview } from '@/components/upload/ImagePreview';
import { StyleSelector } from '@/components/upload/StyleSelector';
import { ProcessingOptions } from '@/components/upload/ProcessingOptions';
import { UploadProgress } from '@/components/upload/UploadProgress';

// Hooks
import { useImageUpload } from '@/hooks/useImageUpload';
import { useAIProcessing } from '@/hooks/useAIProcessing';
import { useNotifications } from '@/hooks/useNotifications';

// Types
import { UploadedFile, ProcessingSettings, StylePreset } from '@/types';

// Utils
import { formatFileSize, validateImageFile } from '@/utils/fileUtils';

/**
 * Image Upload Page Component
 * 
 * Ermöglicht das Hochladen und Konfigurieren von Produktbildern für KI-Verarbeitung:
 * - Drag & Drop Upload Interface
 * - Batch Upload Support
 * - Style und Processing Options
 * - Preview und Konfiguration
 * - Content Generation Settings
 */
export const ImageUpload: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<StylePreset>('studio');
  const [processingSettings, setProcessingSettings] = useState<ProcessingSettings>({
    quality: 'high',
    generateVariants: true,
    enhanceColors: true,
    removeBackground: false,
    generateContent: true,
    contentLanguage: 'de',
    targetAudience: 'general'
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const { uploadImages, validateFiles } = useImageUpload();
  const { submitProcessingJob } = useAIProcessing();
  const { showNotification } = useNotifications();

  // Dropzone Configuration
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true);
    
    try {
      // Validate files
      const validationResults = await validateFiles(acceptedFiles);
      const validFiles = validationResults.filter(result => result.isValid);
      
      if (validFiles.length === 0) {
        showNotification({
          type: 'error',
          title: 'Keine gültigen Dateien',
          message: 'Bitte laden Sie gültige Bilddateien hoch (JPG, PNG, WEBP).'
        });
        return;
      }

      // Process uploads
      const newUploadedFiles: UploadedFile[] = [];
      
      for (const fileResult of validFiles) {
        const file = fileResult.file;
        const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Create preview
        const preview = URL.createObjectURL(file);
        
        // Add to uploaded files
        const uploadedFile: UploadedFile = {
          id: fileId,
          file,
          name: file.name,
          size: file.size,
          preview,
          status: 'uploading',
          uploadProgress: 0,
          metadata: {
            dimensions: null,
            format: file.type,
            quality: null
          }
        };
        
        newUploadedFiles.push(uploadedFile);
        setUploadedFiles(prev => [...prev, uploadedFile]);
        
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const currentProgress = prev[fileId] || 0;
            const newProgress = Math.min(currentProgress + Math.random() * 20, 100);
            
            if (newProgress >= 100) {
              clearInterval(progressInterval);
              setUploadedFiles(prevFiles => 
                prevFiles.map(f => 
                  f.id === fileId 
                    ? { ...f, status: 'ready', uploadProgress: 100 }
                    : f
                )
              );
            }
            
            return { ...prev, [fileId]: newProgress };
          });
        }, 500);
      }

      // Show invalid files
      const invalidFiles = validationResults.filter(result => !result.isValid);
      if (invalidFiles.length > 0) {
        showNotification({
          type: 'warning',
          title: `${invalidFiles.length} Datei(en) übersprungen`,
          message: 'Einige Dateien konnten nicht verarbeitet werden.'
        });
      }

    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Upload fehlgeschlagen',
        message: 'Es gab einen Fehler beim Hochladen der Dateien.'
      });
    } finally {
      setIsUploading(false);
    }
  }, [validateFiles, showNotification]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  });

  // Remove uploaded file
  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return updated;
    });
    
    setUploadProgress(prev => {
      const updated = { ...prev };
      delete updated[fileId];
      return updated;
    });
  };

  // Start processing
  const startProcessing = async () => {
    const readyFiles = uploadedFiles.filter(f => f.status === 'ready');
    
    if (readyFiles.length === 0) {
      showNotification({
        type: 'warning',
        title: 'Keine Dateien bereit',
        message: 'Bitte warten Sie, bis alle Uploads abgeschlossen sind.'
      });
      return;
    }

    try {
      // Submit processing jobs
      for (const file of readyFiles) {
        await submitProcessingJob({
          fileId: file.id,
          filename: file.name,
          style: selectedStyle,
          settings: processingSettings
        });
        
        // Update file status
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === file.id 
              ? { ...f, status: 'processing' }
              : f
          )
        );
      }

      showNotification({
        type: 'success',
        title: 'Verarbeitung gestartet',
        message: `${readyFiles.length} Bild(er) wurden zur Verarbeitung gesendet.`
      });

      // Redirect to queue page
      setTimeout(() => {
        window.location.href = '/queue';
      }, 2000);

    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Verarbeitung fehlgeschlagen',
        message: 'Es gab einen Fehler beim Starten der Verarbeitung.'
      });
    }
  };

  const readyFilesCount = uploadedFiles.filter(f => f.status === 'ready').length;
  const totalSize = uploadedFiles.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Produktbilder hochladen
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Laden Sie Produktfotos hoch und lassen Sie sie mit KI in professionelle Fashion-Aufnahmen verwandeln
          </p>
        </div>
        
        {uploadedFiles.length > 0 && (
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {uploadedFiles.length} Datei(en) • {formatFileSize(totalSize)}
            </p>
            <p className="text-sm text-green-600 dark:text-green-400">
              {readyFilesCount} bereit für Verarbeitung
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Upload Area */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Upload Dropzone */}
          <Card>
            <CardContent className="p-6">
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                  ${isDragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-primary'
                  }
                  ${isUploading ? 'pointer-events-none opacity-50' : ''}
                `}
              >
                <input {...getInputProps()} />
                
                <div className="flex flex-col items-center">
                  <Upload className="h-12 w-12 text-gray-400 mb-4" />
                  
                  {isDragActive ? (
                    <p className="text-lg font-medium text-primary">
                      Dateien hier ablegen...
                    </p>
                  ) : (
                    <>
                      <p className="text-lg font-medium mb-2">
                        Produktbilder hier ablegen oder klicken zum Auswählen
                      </p>
                      <p className="text-gray-500 mb-4">
                        Unterstützte Formate: JPG, PNG, WEBP • Max. 10MB pro Datei
                      </p>
                      <Button variant="outline" disabled={isUploading}>
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Dateien auswählen
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Hochgeladene Dateien
                  <Badge variant="secondary">{uploadedFiles.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Überprüfen Sie Ihre Bilder und konfigurieren Sie die Verarbeitung
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {uploadedFiles.map((file) => (
                    <FilePreviewCard 
                      key={file.id}
                      file={file}
                      progress={uploadProgress[file.id] || 0}
                      onRemove={() => removeFile(file.id)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Settings Sidebar */}
        <div className="space-y-6">
          
          {/* Style Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Stil auswählen
              </CardTitle>
              <CardDescription>
                Wählen Sie den gewünschten Verarbeitungsstil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StyleSelector 
                selectedStyle={selectedStyle}
                onStyleChange={setSelectedStyle}
              />
            </CardContent>
          </Card>

          {/* Processing Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Verarbeitungsoptionen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="image" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="image">Bild</TabsTrigger>
                  <TabsTrigger value="content">Content</TabsTrigger>
                </TabsList>
                
                <TabsContent value="image" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="quality">Qualitätsstufe</Label>
                      <Select 
                        value={processingSettings.quality}
                        onValueChange={(value) => 
                          setProcessingSettings(prev => ({ ...prev, quality: value as any }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="high">Hoch</SelectItem>
                          <SelectItem value="ultra">Ultra</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="variants"
                          checked={processingSettings.generateVariants}
                          onCheckedChange={(checked) => 
                            setProcessingSettings(prev => ({ 
                              ...prev, 
                              generateVariants: checked as boolean 
                            }))
                          }
                        />
                        <Label htmlFor="variants">Varianten erstellen</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="colors"
                          checked={processingSettings.enhanceColors}
                          onCheckedChange={(checked) => 
                            setProcessingSettings(prev => ({ 
                              ...prev, 
                              enhanceColors: checked as boolean 
                            }))
                          }
                        />
                        <Label htmlFor="colors">Farben verbessern</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="background"
                          checked={processingSettings.removeBackground}
                          onCheckedChange={(checked) => 
                            setProcessingSettings(prev => ({ 
                              ...prev, 
                              removeBackground: checked as boolean 
                            }))
                          }
                        />
                        <Label htmlFor="background">Hintergrund entfernen</Label>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="content" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="generateContent"
                        checked={processingSettings.generateContent}
                        onCheckedChange={(checked) => 
                          setProcessingSettings(prev => ({ 
                            ...prev, 
                            generateContent: checked as boolean 
                          }))
                        }
                      />
                      <Label htmlFor="generateContent">Content generieren</Label>
                    </div>
                    
                    {processingSettings.generateContent && (
                      <>
                        <div>
                          <Label htmlFor="language">Sprache</Label>
                          <Select 
                            value={processingSettings.contentLanguage}
                            onValueChange={(value) => 
                              setProcessingSettings(prev => ({ 
                                ...prev, 
                                contentLanguage: value 
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="de">Deutsch</SelectItem>
                              <SelectItem value="en">English</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="audience">Zielgruppe</Label>
                          <Select 
                            value={processingSettings.targetAudience}
                            onValueChange={(value) => 
                              setProcessingSettings(prev => ({ 
                                ...prev, 
                                targetAudience: value 
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="general">Allgemein</SelectItem>
                              <SelectItem value="young_professional">Junge Profis</SelectItem>
                              <SelectItem value="creative">Kreative</SelectItem>
                              <SelectItem value="luxury">Luxury</SelectItem>
                              <SelectItem value="urban">Urban</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Start Processing */}
          {readyFilesCount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Verarbeitung starten
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm space-y-1">
                    <p>
                      <span className="font-medium">{readyFilesCount} Bild(er)</span> bereit
                    </p>
                    <p>
                      Stil: <span className="font-medium">{selectedStyle}</span>
                    </p>
                    <p>
                      Geschätzte Zeit: <span className="font-medium">
                        {readyFilesCount * 2} Minuten
                      </span>
                    </p>
                  </div>
                  
                  <Button 
                    onClick={startProcessing}
                    className="w-full gap-2"
                    size="lg"
                  >
                    <Sparkles className="h-4 w-4" />
                    KI-Verarbeitung starten
                  </Button>
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
 * File Preview Card Component
 */
interface FilePreviewCardProps {
  file: UploadedFile;
  progress: number;
  onRemove: () => void;
}

const FilePreviewCard: React.FC<FilePreviewCardProps> = ({ 
  file, 
  progress, 
  onRemove 
}) => {
  const getStatusIcon = () => {
    switch (file.status) {
      case 'uploading':
        return <Upload className="h-4 w-4 text-blue-500" />;
      case 'ready':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Sparkles className="h-4 w-4 text-purple-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <ImageIcon className="h-4 w-4" />;
    }
  };

  const getStatusText = () => {
    switch (file.status) {
      case 'uploading':
        return 'Wird hochgeladen...';
      case 'ready':
        return 'Bereit';
      case 'processing':
        return 'In Verarbeitung';
      case 'error':
        return 'Fehler';
      default:
        return 'Unbekannt';
    }
  };

  return (
    <div className="relative group">
      <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-800">
        {/* Image Preview */}
        <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative">
          {file.preview ? (
            <img 
              src={file.preview} 
              alt={file.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-gray-400" />
            </div>
          )}
          
          {/* Remove Button */}
          <Button
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        
        {/* File Info */}
        <div className="p-3">
          <p className="font-medium text-sm truncate" title={file.name}>
            {file.name}
          </p>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">
              {formatFileSize(file.size)}
            </span>
            
            <div className="flex items-center gap-1">
              {getStatusIcon()}
              <span className="text-xs">
                {getStatusText()}
              </span>
            </div>
          </div>
          
          {/* Upload Progress */}
          {file.status === 'uploading' && (
            <div className="mt-2">
              <Progress value={progress} className="h-1" />
              <p className="text-xs text-gray-500 mt-1">
                {Math.round(progress)}% hochgeladen
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};