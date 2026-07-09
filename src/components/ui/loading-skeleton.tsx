import { cn } from '../../lib/utils';

interface LoadingSkeletonProps {
    className?: string;
    variant?: 'text' | 'card' | 'circle' | 'rect';
    lines?: number;
}

function SkeletonBar({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                'animate-pulse rounded-lg bg-white/[0.06]',
                className
            )}
        />
    );
}

export function LoadingSkeleton({
    className,
    variant = 'text',
    lines = 3,
}: LoadingSkeletonProps) {
    if (variant === 'circle') {
        return (
            <SkeletonBar
                className={cn('h-12 w-12 rounded-full', className)}
            />
        );
    }

    if (variant === 'rect') {
        return (
            <SkeletonBar
                className={cn('h-40 w-full rounded-xl', className)}
            />
        );
    }

    if (variant === 'card') {
        return (
            <div
                className={cn(
                    'overflow-hidden rounded-xl border border-white/[0.08] bg-[#111113]/80 p-6 backdrop-blur-xl',
                    className
                )}
            >
                <SkeletonBar className="mb-4 h-9 w-9 rounded-lg" />
                <SkeletonBar className="mb-2 h-4 w-2/3" />
                <SkeletonBar className="h-3 w-full" />
                <SkeletonBar className="mt-1 h-3 w-4/5" />
            </div>
        );
    }

    // variant === 'text'
    return (
        <div className={cn('space-y-3', className)}>
            {Array.from({ length: lines }).map((_, i) => (
                <SkeletonBar
                    key={i}
                    className={cn(
                        'h-3',
                        i === lines - 1 ? 'w-3/5' : 'w-full'
                    )}
                />
            ))}
        </div>
    );
}
