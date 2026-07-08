import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import UploadCard from '../components/shared/UploadCard';
import { Select } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Progress } from '../components/ui/progress';
import type { ClaimType } from '../types';
import { CLAIM_TYPE_LABELS } from '../types';
import { ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

const CLAIM_TYPE_OPTIONS = Object.entries(CLAIM_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const MOCK_UPLOAD_DURATION = 2500;

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
    setProgress(0);

    // Simulate upload and analysis progress
    const steps = [
      { at: 20, message: 'Uploading evidence...' },
      { at: 40, message: 'Running AI analysis...' },
      { at: 60, message: 'Analyzing detected objects...' },
      { at: 80, message: 'Recording to blockchain...' },
      { at: 100, message: 'Generating certificate...' },
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(prev + Math.random() * 15 + 5, 100);
        if (next >= steps[currentStep]?.at && currentStep < steps.length) {
          setSuccessMessage(steps[currentStep].message);
          currentStep++;
        }
        return next;
      });
    }, 300);

    setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      setSuccessMessage('Verification complete!');
      setTimeout(() => {
        const mockId = 'v-' + String(Math.floor(Math.random() * 5) + 1).padStart(3, '0');
        navigate(`/results/${mockId}`);
      }, 800);
    }, MOCK_UPLOAD_DURATION);
  }, [file, claimType, description, navigate]);

  const isValid = file && claimType && description.trim();

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Verify Evidence</h1>
        <p className="mt-3 text-muted text-lg">
          Upload an image and provide claim details for AI-powered verification.
        </p>
      </div>

      {/* Upload */}
      <div className="mb-8">
        <label className="block text-sm font-medium mb-3">Evidence Image</label>
        <UploadCard onFileSelect={handleFileSelect} previewUrl={previewUrl} />
      </div>

      {/* Form */}
      <div className="space-y-6">
        <div>
          <label htmlFor="claim-type" className="block text-sm font-medium mb-2">
            Claim Type
          </label>
          <Select
            id="claim-type"
            options={CLAIM_TYPE_OPTIONS}
            placeholder="Select claim type"
            value={claimType}
            onChange={(e) => setClaimType(e.target.value as ClaimType)}
            className="w-full"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2">
            Claim Description
          </label>
          <Textarea
            id="description"
            placeholder="Describe what you are verifying — e.g., '200 tree saplings planted on March 15, 2026 in the northern section of the Green Valley project.'"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full resize-none"
          />
        </div>
      </div>

      {/* Progress */}
      {isUploading && (
        <div className="mt-8 space-y-4">
          <Progress value={progress} className="h-2" />
          {successMessage && (
            <div className="flex items-center gap-2 text-sm text-primary">
              <CheckCircle2 className="h-4 w-4" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* CTA */}
      <div className="mt-8">
        <Button
          size="lg"
          onClick={handleVerify}
          disabled={!isValid || isUploading}
          className="w-full sm:w-auto"
        >
          {isUploading ? (
            <>Processing...</>
          ) : (
            <>
              Run Verification
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}