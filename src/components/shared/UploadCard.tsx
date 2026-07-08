import { useRef, useState, useCallback } from 'react';
import { cn } from '../../lib/utils';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

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
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300',
        isDragOver
          ? 'border-primary bg-primary/5 shadow-[0_0_30px] shadow-primary/20'
          : previewUrl
            ? 'border-border bg-card'
            : 'border-border/60 bg-card/50 hover:border-primary/40 hover:bg-accent/30',
        className
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />

      {previewUrl ? (
        <div className="relative group">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-64 sm:h-80 object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <button
              onClick={() => inputRef.current?.click()}
              className="text-white text-sm font-medium underline-offset-2 hover:underline"
            >
              Change image
            </button>
          </div>
          <button
            onClick={handleRemove}
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-all duration-200 cursor-pointer"
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-4 px-6 py-12 sm:py-16 cursor-pointer"
        >
          <div className={cn(
            'flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300',
            isDragOver ? 'bg-primary text-white scale-110' : 'bg-accent text-muted'
          )}>
            {isDragOver ? (
              <Upload className="h-7 w-7" />
            ) : (
              <ImageIcon className="h-7 w-7" />
            )}
          </div>
          <div className="text-center space-y-1">
            <p className="text-base font-medium">
              {isDragOver ? 'Drop your image here' : 'Upload evidence image'}
            </p>
            <p className="text-sm text-muted">
              Drag & drop or click to browse
            </p>
            <p className="text-xs text-muted/60 mt-1">
              PNG, JPG, JPEG up to 10MB
            </p>
          </div>
        </button>
      )}
    </div>
  );
}