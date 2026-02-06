import React, { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
    isLoading?: boolean;
    loadingText?: string;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    isLoading = false,
    loadingText,
    disabled,
    className = '',
    ...props
}) => {
    const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
        primary: 'bg-brand-cyan text-slate-950 hover:bg-brand-cyan/90 shadow-lg shadow-brand-cyan/20 hover:shadow-xl hover:shadow-brand-cyan/30',
        secondary: 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700',
        danger: 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30',
        success: 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30',
    };

    return (
        <button
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? loadingText || 'Carregando...' : children}
        </button>
    );
};
