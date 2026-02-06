import React, { ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string | ReactNode;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    type = 'danger'
}) => {
    const typeStyles = {
        danger: {
            border: 'border-red-500/50',
            bg: 'bg-red-950/30',
            icon: 'text-red-400',
            button: 'bg-red-500 hover:bg-red-600 text-white'
        },
        warning: {
            border: 'border-yellow-500/50',
            bg: 'bg-yellow-950/30',
            icon: 'text-yellow-400',
            button: 'bg-yellow-500 hover:bg-yellow-600 text-black'
        },
        info: {
            border: 'border-brand-cyan/50',
            bg: 'bg-brand-cyan/10',
            icon: 'text-brand-cyan',
            button: 'bg-brand-cyan hover:bg-brand-cyan/90 text-black'
        }
    };

    const currentStyle = typeStyles[type];

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4"
                        onClick={onClose}
                    >
                        {/* Modal */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className={`tech-card w-full max-w-md p-0 shadow-[0_0_50px_rgba(0,0,0,0.5)] border-2 ${currentStyle.border} relative`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Top line */}
                            <div className={`absolute top-0 left-0 w-full h-1 ${currentStyle.bg.replace('/30', '')}`}></div>

                            {/* Header */}
                            <div className={`p-6 ${currentStyle.bg} border-b border-slate-800 flex items-start gap-4`}>
                                <div className="flex-shrink-0">
                                    <div className={`p-3 rounded-full ${currentStyle.bg} border ${currentStyle.border}`}>
                                        <AlertTriangle className={currentStyle.icon} size={24} />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-white uppercase tracking-wider mb-1">
                                        {title}
                                    </h3>
                                    <div className="text-sm text-slate-300 leading-relaxed">
                                        {message}
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="text-slate-500 hover:text-white transition-colors flex-shrink-0"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Actions */}
                            <div className="p-6 bg-slate-900/50 flex justify-end gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800 uppercase text-xs font-bold tracking-wider transition-colors rounded"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className={`px-6 py-2.5 font-bold uppercase tracking-wider text-xs shadow-lg transition-all rounded ${currentStyle.button}`}
                                >
                                    {confirmText}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
