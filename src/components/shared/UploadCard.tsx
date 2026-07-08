import { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { ds } from '../../lib/design-tokens';

interface UploadCardProps {
  onFileSelect: (file: File | null) => void;
  previewUrl: string | null;
  className?: string;
}

export default function UploadCard({ onFileSelect, previewUrl, className }: UploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = useCallback(
    (file: File | null) => {
      if (file && file.size > 10 * 1024 * 1024) {
        alert('File is too large. Maximum size is 10MB.');
        return;
      }
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      handleFile(file);
    },
    [handleFile]
  );

  const handleRemove = useCallback(() => {
    onFileSelect(null);
    if (inputRef.current) inputRef.current.value = '';
  }, [onFileSelect]);

  return (
    <motion.div
      animate={{
        borderColor: isDragOver ? 'rgba(37, 99, 235, 0.5)' : 'rgba(255, 255, 255, 0.08)',
        scale: isDragOver ? 1.01 : 1,
      }}
      transition={{ duration: 0.2 }}
      className={cn(
        ds.glassPanel,
        'relative overflow-hidden border-2 border-dashed transition-shadow duration-300',
        isDragOver && 'shadow-[0_0_40px_rgba(37,99,235,0.2)]',
        className
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="absolute inset-0 bg-noise opacity-10" />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />

      <AnimatePresence mode="wait">
        {previewUrl ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative group"
          >
            <img
              src={previewUrl}
              alt="Preview"
              className="relative z-10 h-64 w-full object-cover sm:h-80"
            />
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-full border border-white/[0.08] bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                Change image
              </button>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="absolute right-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-black/60 text-white backdrop-blur-sm transition-all duration-200 hover:bg-black/80"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="upload"
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => inputRef.current?.click()}
            className="relative z-10 flex w-full cursor-pointer flex-col items-center justify-center gap-5 px-6 py-14 sm:py-20"
          >
            <motion.div
              animate={{ scale: isDragOver ? 1.1 : 1 }}
              className={cn(
                'flex h-16 w-16 items-center justify-center rounded-2xl transition-colors duration-300',
                isDragOver
                  ? 'bg-[#2563EB] text-white shadow-[0_0_30px_rgba(37,99,235,0.4)]'
                  : 'border border-white/[0.08] bg-[#2563EB]/15 text-[#3B82F6]'
              )}
            >
              {isDragOver ? (
                <Upload className="h-7 w-7" />
              ) : (
                <ImageIcon className="h-7 w-7" />
              )}
            </motion.div>
            <div className="space-y-1.5 text-center">
              <p className="text-base font-medium text-white">
                {isDragOver ? 'Drop your image here' : 'Upload evidence image'}
              </p>
              <p className="text-sm text-white/50">Drag & drop or click to browse</p>
              <p className="mt-1 text-xs text-white/30">PNG, JPG, JPEG up to 10MB</p>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
