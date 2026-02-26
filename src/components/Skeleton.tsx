import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'rect' | 'circle';
    width?: string | number;
    height?: string | number;
}

export const Skeleton = ({ className = '', variant = 'rect', width, height }: SkeletonProps) => {
    const baseClass = "bg-slate-800/40 relative overflow-hidden";

    const variantClasses = {
        text: "h-3 w-full rounded",
        rect: "rounded-2xl",
        circle: "rounded-full"
    };

    return (
        <motion.div
            animate={{
                opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
            }}
            className={`${baseClass} ${variantClasses[variant]} ${className}`}
            style={{ width, height }}
        >
            {/* Shimmer effect */}
            <motion.div
                animate={{
                    x: ['-100%', '100%'],
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/20 to-transparent shadow-[0_0_20px_rgba(255,255,255,0.05)]"
            />
        </motion.div>
    );
};

export const DashboardSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map(i => (
            <div key={i} className="tech-card p-6 h-32">
                <div className="flex justify-between items-start">
                    <div className="space-y-3 w-full">
                        <Skeleton variant="text" width="60%" />
                        <Skeleton variant="text" width="40%" height={32} className="mt-2" />
                        <Skeleton variant="text" width="30%" className="mt-2" />
                    </div>
                    <Skeleton variant="rect" width={48} height={48} className="rounded-xl flex-shrink-0" />
                </div>
            </div>
        ))}
    </div>
);

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
    <div className="space-y-4">
        {[...Array(rows)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
                <Skeleton variant="rect" width={40} height={40} className="rounded-lg" />
                <div className="flex-1 space-y-2">
                    <Skeleton variant="text" width="40%" />
                    <Skeleton variant="text" width="20%" />
                </div>
                <Skeleton variant="text" width="15%" />
                <Skeleton variant="circle" width={24} height={24} />
            </div>
        ))}
    </div>
);
