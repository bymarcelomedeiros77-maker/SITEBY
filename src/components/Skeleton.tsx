import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'rectangular' | 'circular';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'text' }) => {
    const baseClasses = 'animate-pulse bg-slate-800/50';

    const variantClasses = {
        text: 'h-4 rounded',
        rectangular: 'rounded-lg',
        circular: 'rounded-full',
    };

    return (
        <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />
    );
};

export const CardSkeleton = () => (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-16 w-full" variant="rectangular" />
        <div className="flex gap-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
        </div>
    </div>
);

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
    <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex gap-4 items-center p-4 bg-slate-900/30 rounded-lg">
                <Skeleton className="h-10 w-10" variant="circular" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-8 w-20" />
            </div>
        ))}
    </div>
);
