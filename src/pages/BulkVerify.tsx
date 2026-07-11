import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/ui/button';
import { Container } from '../components/ui/container';
import { PageHeader } from '../components/ui/page-header';
import { GlassCard } from '../components/ui/glass-card';
import { BackgroundGlow } from '../components/ui/background-glow';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Progress } from '../components/ui/progress';
import { ds } from '../lib/design-tokens';
import { CLAIM_TYPE_LABELS, CLAIM_TYPE_ICONS, type ClaimType, type BatchImageItem } from '../types';
import { uploadImage, createBatch, ApiError } from '../lib/api';
import {
  Upload,
  X,
  Plus,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileImage,
  FolderOpen,
} from 'lucide-react';

interface ImageUpload {
  id: string;
  file: File;
  previewUrl: string;
  claimType: ClaimType | '';
  description: string;
  uploadedUrl?: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'processing' | 'success' | 'failed';
  error?: string;
  claimId?: string;
  confidence?: number;
}

const CLAIM_TYPE_OPTIONS = (Object.entries(CLAIM_TYPE_LABELS) as [ClaimType, string][]).map(
  ([value, label]) => ({
    value,
    label: `${CLAIM_TYPE_ICONS[value]} ${label}`,
  })
);

const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100 MB

export default function BulkVerify() {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState('');
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'upload' | 'processing' | 'results'>('upload');
  const [batchId, setBatchId] = useState<string | null>(null);
  const [processedCount, setProcessedCount] = useState(0);

  const totalSize = images.reduce((sum, img) => sum + img.file.size, 0);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    setError(null);
    const fileArray = Array.from(files);

    // Validate count
    if (images.length + fileArray.length > MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images allowed. You can add ${MAX_IMAGES - images.length} more.`);
      return;
    }

    // Validate sizes
    for (const file of fileArray) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`File "${file.name}" exceeds 10 MB limit.`);
        return;
      }
    }

    if (totalSize + fileArray.reduce((sum, f) => sum + f.size, 0) > MAX_TOTAL_SIZE) {
      setError('Total upload size exceeds 100 MB limit.');
      return;
    }

    // Create upload entries
    const newImages: ImageUpload[] = fileArray.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      claimType: '',
      description: '',
      status: 'pending',
    }));

    setImages((prev) => [...prev, ...newImages]);
  }, [images.length, totalSize]);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) URL.revokeObjectURL(img.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const updateImage = useCallback((id: string, updates: Partial<ImageUpload>) => {
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, ...updates } : img)));
  }, []);

  const handleStartVerification = useCallback(async () => {
    setError(null);

    // Validate all images have claim type and description
    const incomplete = images.find((img) => !img.claimType || !img.description.trim());
    if (incomplete) {
      setError('Please fill in claim type and description for all images.');
      return;
    }

    setIsProcessing(true);
    setCurrentStep('processing');
    setProcessedCount(0);

    try {
      // Upload all images first
      const uploadedImages: BatchImageItem[] = [];

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        updateImage(img.id, { status: 'uploading' });

        try {
          const uploadResult = await uploadImage(img.file);
          updateImage(img.id, {
            status: 'uploaded',
            uploadedUrl: uploadResult.imageUrl,
          });
          uploadedImages.push({
            image_url: uploadResult.imageUrl,
            claim_type: img.claimType as ClaimType,
            description: img.description.trim(),
          });
        } catch (err) {
          updateImage(img.id, {
            status: 'failed',
            error: err instanceof ApiError ? err.message : 'Upload failed',
          });
          uploadedImages.push({
            image_url: '',
            claim_type: img.claimType as ClaimType,
            description: img.description.trim(),
          });
        }
      }

      // Create batch
      const batch = await createBatch({
        project_name: projectName.trim() || undefined,
        images: uploadedImages,
      });

      setBatchId(batch.batch_id);
      setProcessedCount(batch.completed_images + batch.failed_images);

      // Update image statuses based on results
      if (batch.results) {
        batch.results.forEach((result) => {
          const img = images[result.index];
          if (img) {
            updateImage(img.id, {
              status: result.status === 'success' ? 'success' : 'failed',
              claimId: result.claim_id || undefined,
              confidence: result.confidence || undefined,
              error: result.error || undefined,
            });
          }
        });
      }

      setCurrentStep('results');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Batch verification failed');
      setCurrentStep('upload');
    } finally {
      setIsProcessing(false);
    }
  }, [images, projectName, updateImage]);

  const progressPercent = images.length > 0 ? (processedCount / images.length) * 100 : 0;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-[#09090B]">
      <BackgroundGlow intensity="subtle" />

      <Container size="narrow" className="relative z-10 py-10 sm:py-16">
        <PageHeader
          badge="Enterprise Feature"
          title="Bulk Verification"
          description="Verify multiple images in a single batch. Upload up to 10 images and process them sequentially."
        />

        <div className="space-y-6">
          {/* Project Name */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <GlassCard padding="md">
              <label className={ds.label}>Project Name (Optional)</label>
              <Input
                placeholder="e.g., Mangrove Plantation – Phase 2"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="mt-2 w-full"
                disabled={isProcessing}
              />
            </GlassCard>
          </motion.div>

          {/* Image Upload Area */}
          {currentStep === 'upload' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <GlassCard padding="md">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className={ds.label}>
                      Images ({images.length}/{MAX_IMAGES})
                    </label>
                    <span className="text-xs text-white/50">
                      {(totalSize / 1024 / 1024).toFixed(1)} MB / 100 MB
                    </span>
                  </div>

                  {/* Drop Zone */}
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-[#3B82F6]/50 transition-colors bg-white/5">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-10 h-10 mb-3 text-white/40" />
                      <p className="mb-2 text-sm text-white/60">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-white/40">PNG, JPG, WebP (max 10 MB each)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e.target.files)}
                      disabled={isProcessing || images.length >= MAX_IMAGES}
                    />
                  </label>

                  {/* Image List */}
                  <AnimatePresence>
                    {images.map((img, index) => (
                      <motion.div
                        key={img.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border border-white/10 rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-start gap-3">
                          <img
                            src={img.previewUrl}
                            alt={img.file.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{img.file.name}</p>
                            <p className="text-xs text-white/50">
                              {(img.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeImage(img.id)}
                            disabled={isProcessing}
                            className="shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-white/60">Claim Type</label>
                            <Select
                              options={CLAIM_TYPE_OPTIONS}
                              placeholder="Select type"
                              value={img.claimType}
                              onChange={(e) => updateImage(img.id, { claimType: e.target.value as ClaimType })}
                              className="mt-1 w-full"
                              disabled={isProcessing}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-white/60">Description</label>
                            <Textarea
                              placeholder="Describe the claim..."
                              value={img.description}
                              onChange={(e) => updateImage(img.id, { description: e.target.value })}
                              rows={2}
                              className="mt-1 w-full resize-none"
                              disabled={isProcessing}
                            />
                          </div>
                        </div>

                        {/* Status indicator */}
                        {img.status !== 'pending' && (
                          <div className="flex items-center gap-2 text-xs">
                            {img.status === 'uploading' && (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin text-[#3B82F6]" />
                                <span className="text-[#3B82F6]">Uploading...</span>
                              </>
                            )}
                            {img.status === 'uploaded' && (
                              <>
                                <CheckCircle2 className="h-3 w-3 text-[#22C55E]" />
                                <span className="text-[#22C55E]">Uploaded</span>
                              </>
                            )}
                            {img.status === 'success' && (
                              <>
                                <CheckCircle2 className="h-3 w-3 text-[#22C55E]" />
                                <span className="text-[#22C55E]">Verified ({img.confidence?.toFixed(0)}%)</span>
                              </>
                            )}
                            {img.status === 'failed' && (
                              <>
                                <AlertCircle className="h-3 w-3 text-red-400" />
                                <span className="text-red-400">{img.error || 'Failed'}</span>
                              </>
                            )}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {error && (
                    <div className={ds.errorAlert}>
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Processing Progress */}
          {currentStep === 'processing' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <GlassCard padding="md">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-[#3B82F6]" />
                    <span className="text-sm font-medium text-white">Processing Batch</span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                  <p className="text-xs text-white/60">
                    {processedCount} of {images.length} images processed
                  </p>
                </div>
              </GlassCard>

              {/* Image status list */}
              <div className="space-y-2">
                {images.map((img, index) => (
                  <GlassCard key={img.id} padding="sm">
                    <div className="flex items-center gap-3">
                      {img.status === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                      ) : img.status === 'failed' ? (
                        <AlertCircle className="h-4 w-4 text-red-400" />
                      ) : img.status === 'uploading' || img.status === 'processing' ? (
                        <Loader2 className="h-4 w-4 animate-spin text-[#3B82F6]" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-white/20" />
                      )}
                      <span className="text-sm text-white/80 flex-1 truncate">{img.file.name}</span>
                      <span className="text-xs text-white/50">
                        {img.status === 'success'
                          ? `${img.confidence?.toFixed(0)}%`
                          : img.status === 'failed'
                          ? 'Failed'
                          : img.status === 'uploading'
                          ? 'Uploading...'
                          : img.status === 'uploaded'
                          ? 'Queued'
                          : 'Pending'}
                      </span>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </motion.div>
          )}

          {/* Results */}
          {currentStep === 'results' && batchId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <GlassCard padding="md">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#22C55E]" />
                    <span className="text-sm font-medium text-white">Batch Complete</span>
                  </div>
                  <p className="text-xs text-white/60">
                    {images.filter((i) => i.status === 'success').length} verified,{' '}
                    {images.filter((i) => i.status === 'failed').length} failed
                  </p>
                  <div className="flex gap-3">
                    <Button onClick={() => navigate(`/history`)}>View History</Button>
                    <Button variant="secondary" onClick={() => navigate(`/results/${batchId}`)}>
                      View Batch
                    </Button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Start Button */}
          {currentStep === 'upload' && images.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Button
                size="lg"
                onClick={handleStartVerification}
                disabled={isProcessing || images.some((img) => !img.claimType || !img.description.trim())}
                className="w-full sm:w-auto"
              >
                <Play className="mr-2 h-5 w-5" />
                Start Verification ({images.length} images)
              </Button>
            </motion.div>
          )}
        </div>
      </Container>
    </div>
  );
}
