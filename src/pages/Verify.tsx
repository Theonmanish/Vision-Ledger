import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Button } from '../components/ui/button';
import { Container } from '../components/ui/container';
import { PageHeader } from '../components/ui/page-header';
import { GlassCard } from '../components/ui/glass-card';
import { BackgroundGlow } from '../components/ui/background-glow';
import UploadCard from '../components/shared/UploadCard';
import { Select } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Progress } from '../components/ui/progress';
import { ds } from '../lib/design-tokens';
import type { ClaimType } from '../types';
import { CLAIM_TYPE_LABELS } from '../types';
import { uploadImage, verifyClaim, ApiError } from '../lib/api';
import { ArrowRight, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

const CLAIM_TYPE_OPTIONS = Object.entries(CLAIM_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const PROGRESS_STEPS = [
  { at: 15, message: 'Uploading evidence...' },
  { at: 40, message: 'Running AI analysis...' },
  { at: 65, message: 'Analyzing detected objects...' },
  { at: 85, message: 'Recording verification...' },
  { at: 100, message: 'Generating certificate...' },
];

export default function Verify() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [claimType, setClaimType] = useState<ClaimType | ''>('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFileSelect = useCallback((selectedFile: File | null) => {
    setFile(selectedFile);
    setError(null);

    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreviewUrl(null);
    }
  }, []);

  const handleVerify = useCallback(async () => {
    setError(null);
    setSuccessMessage(null);

    if (!file) {
      setError('Please upload an evidence image.');
      return;
    }
    if (!claimType) {
      setError('Please select a claim type.');
      return;
    }
    if (!description.trim()) {
      setError('Please provide a description of your claim.');
      return;
    }

    setIsUploading(true);
    setProgress(5);
    setSuccessMessage(PROGRESS_STEPS[0].message);

    let stepIndex = 0;
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(prev + 4, 92);
        if (
          stepIndex < PROGRESS_STEPS.length &&
          next >= PROGRESS_STEPS[stepIndex].at
        ) {
          setSuccessMessage(PROGRESS_STEPS[stepIndex].message);
          stepIndex++;
        }
        return next;
      });
    }, 400);

    try {
      const upload = await uploadImage(file);
      setProgress(35);
      setSuccessMessage(PROGRESS_STEPS[1].message);

      const result = await verifyClaim({
        claimType,
        description: description.trim(),
        imageUrl: upload.imageUrl,
      });

      clearInterval(interval);
      setProgress(100);
      setSuccessMessage('Verification complete!');
      setTimeout(() => {
        navigate(`/results/${result.claimId}`);
      }, 600);
    } catch (err) {
      clearInterval(interval);
      setProgress(0);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Verification failed. Please check your connection and try again.');
      }
    } finally {
      setIsUploading(false);
    }
  }, [file, claimType, description, navigate]);

  const isValid = file && claimType && description.trim();

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-[#09090B]">
      <BackgroundGlow intensity="subtle" />

      <Container size="narrow" className="relative z-10 py-10 sm:py-16">
        <PageHeader
          badge="New Verification"
          title="Verify Evidence"
          description="Upload an image and provide claim details for AI-powered verification."
        />

        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <label className={cnLabel()}>Evidence Image</label>
            <div className="mt-3">
              <UploadCard onFileSelect={handleFileSelect} previewUrl={previewUrl} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <GlassCard padding="md">
              <div className="space-y-6">
                <div>
                  <label htmlFor="claim-type" className={cnLabel()}>
                    Claim Type
                  </label>
                  <Select
                    id="claim-type"
                    options={CLAIM_TYPE_OPTIONS}
                    placeholder="Select claim type"
                    value={claimType}
                    onChange={(e) => setClaimType(e.target.value as ClaimType)}
                    className="mt-2 w-full"
                  />
                </div>

                <div>
                  <label htmlFor="description" className={cnLabel()}>
                    Claim Description
                  </label>
                  <Textarea
                    id="description"
                    placeholder="Describe what you are verifying — e.g., '200 tree saplings planted on March 15, 2026 in the northern section of the Green Valley project.'"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="mt-2 w-full resize-none"
                  />
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {isUploading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <GlassCard padding="md">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-[#3B82F6]" />
                    <span className="text-sm font-medium text-white">Processing verification</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  {successMessage && (
                    <div className="flex items-center gap-2 text-sm text-[#3B82F6]">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{successMessage}</span>
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 backdrop-blur-sm"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Button
              size="lg"
              onClick={handleVerify}
              disabled={!isValid || isUploading}
              className="w-full sm:w-auto"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Run Verification
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </Container>
    </div>
  );
}

function cnLabel() {
  return ds.label;
}
